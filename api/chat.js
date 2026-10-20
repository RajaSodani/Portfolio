// POST /api/chat: streams an answer about Raja as NDJSON lines.
//   {"t":"text"}                         a chunk of the answer
//   {"done":{"provider","model","ms"}}   final line on success
//   {"error":"message"}                  final line on failure
//
// Providers come from environment variables (set them in Vercel → Settings → Environment Variables):
//   GEMINI_API_KEY   primary  (free tier at aistudio.google.com)
//   GROQ_API_KEY     fallback (free tier at console.groq.com), optional
//   CHAT_MOCK=1      local development without any keys

import { createPipe, gemini, groq, mock } from "promptpipe";
import { SYSTEM_PROMPT } from "./_knowledge.js";

const MAX_TURNS = 8;
const MAX_CHARS = 600;

// Per-instance token bucket, the same algorithm as the RateLimit Arena demo.
// Serverless instances don't share memory, so this is a speed bump, not a wall;
// the providers' own free-tier quotas are the hard ceiling on spend.
const BUCKET_SIZE = 6;
const REFILL_PER_SEC = 1 / 20;
const buckets = new Map();

function allow(ip) {
  const now = Date.now() / 1000;
  const b = buckets.get(ip) ?? { tokens: BUCKET_SIZE, at: now };
  b.tokens = Math.min(BUCKET_SIZE, b.tokens + (now - b.at) * REFILL_PER_SEC);
  b.at = now;
  buckets.set(ip, b);
  if (buckets.size > 5000) buckets.delete(buckets.keys().next().value);
  if (b.tokens < 1) return false;
  b.tokens -= 1;
  return true;
}

const DEFAULT_ORIGINS = [
  /^https:\/\/(www\.)?rajasodani\.com$/,
  /^https:\/\/[\w-]+\.vercel\.app$/,
  /^http:\/\/localhost(:\d+)?$/,
];

function originAllowed(origin) {
  if (!origin) return false;
  const extra = (process.env.ALLOWED_ORIGINS ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  return extra.includes(origin) || DEFAULT_ORIGINS.some((re) => re.test(origin));
}

function buildPipe() {
  const providers = [];
  if (process.env.GEMINI_API_KEY) {
    providers.push(gemini({ apiKey: process.env.GEMINI_API_KEY, model: process.env.GEMINI_MODEL || "gemini-2.5-flash" }));
  }
  if (process.env.GROQ_API_KEY) {
    providers.push(groq({ apiKey: process.env.GROQ_API_KEY, model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile" }));
  }
  if (providers.length === 0 && process.env.CHAT_MOCK === "1") {
    providers.push(
      mock({
        name: "mock",
        delayMs: 300,
        script: [
          "Raja is a software developer at Provakil Technologies in Pune. He built an Elasticsearch service that took legal search from minutes to under 1 second across 500K+ documents. (This is a local mock reply.)",
        ],
      }),
    );
  }
  if (providers.length === 0) return null;
  return createPipe({ providers, timeoutMs: 20_000, retry: { attempts: 2, maxDelayMs: 2000 } });
}

const pipe = buildPipe();

function cleanMessages(body) {
  if (!body || !Array.isArray(body.messages)) return null;
  const messages = body.messages
    .slice(-MAX_TURNS)
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_CHARS) }));
  // providers expect the conversation to start with the user
  while (messages[0]?.role === "assistant") messages.shift();
  if (messages.length === 0 || messages.at(-1).role !== "user") return null;
  return messages;
}

const json = (status, body, headers = {}) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", ...headers } });

export async function POST(request) {
  if (!originAllowed(request.headers.get("origin"))) return json(403, { error: "Forbidden" });
  if (!pipe) return json(503, { error: "Chat is not configured yet." });

  const ip = (request.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
  if (!allow(ip)) {
    return json(429, { error: "You're asking faster than my token bucket refills. Try again in a few seconds." }, { "retry-after": "20" });
  }

  let messages;
  try {
    messages = cleanMessages(await request.json());
  } catch {
    messages = null;
  }
  if (!messages) return json(400, { error: "Send { messages: [{ role, content }] } ending with a user message." });

  const started = Date.now();
  const stream = pipe.stream({ system: SYSTEM_PROMPT, messages, maxTokens: 400, temperature: 0.4, signal: request.signal });
  const encoder = new TextEncoder();
  const line = (obj) => encoder.encode(JSON.stringify(obj) + "\n");

  const body = new ReadableStream({
    async start(controller) {
      try {
        for await (const text of stream) controller.enqueue(line({ t: text }));
        const res = await stream.result;
        controller.enqueue(line({ done: { provider: res.provider, model: res.model, ms: Date.now() - started } }));
      } catch (err) {
        console.error("chat failed", err?.attempts ?? err);
        controller.enqueue(line({ error: "All AI providers are unavailable right now." }));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(body, {
    headers: { "content-type": "application/x-ndjson; charset=utf-8", "cache-control": "no-store" },
  });
}
