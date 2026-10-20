// Local preview with the chat API, no Vercel CLI needed.
//   npm install
//   CHAT_MOCK=1 node dev-server.mjs                 # fake replies
//   GEMINI_API_KEY=... node dev-server.mjs          # real replies
// then open http://localhost:4175

import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { Readable } from "node:stream";
import { POST } from "./api/chat.js";

const root = new URL(".", import.meta.url).pathname;
const port = Number(process.env.PORT) || 4175;
const types = {
  ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript",
  ".png": "image/png", ".pdf": "application/pdf", ".svg": "image/svg+xml", ".json": "application/json",
};

createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${port}`);

  if (url.pathname === "/api/chat" && req.method === "POST") {
    const chunks = [];
    for await (const c of req) chunks.push(c);
    const request = new Request(url, {
      method: "POST",
      headers: { ...req.headers, origin: req.headers.origin ?? `http://localhost:${port}` },
      body: Buffer.concat(chunks),
    });
    const response = await POST(request);
    res.writeHead(response.status, Object.fromEntries(response.headers));
    if (response.body) Readable.fromWeb(response.body).pipe(res);
    else res.end();
    return;
  }

  let path = normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, "");
  if (path.endsWith("/")) path += "index.html";
  if (!extname(path)) path += ".html"; // mirrors Vercel cleanUrls
  try {
    const file = await readFile(join(root, path));
    res.writeHead(200, { "content-type": types[extname(path)] ?? "application/octet-stream" });
    res.end(file);
  } catch {
    res.writeHead(404).end("Not found");
  }
}).listen(port, () => console.log(`http://localhost:${port}`));
