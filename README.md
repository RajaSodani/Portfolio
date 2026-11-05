# Raja Sodani — Portfolio v2

A more modern take on the portfolio: bento grid, command palette, and **live interactive
demos of the systems I run in production**. Pure HTML/CSS/JS — no frameworks, no build step.

## What's different from v1

- **Bento grid** "at a glance" section instead of classic about/skills blocks
- **⌘K command palette** — navigate sections, switch themes, open links from the keyboard
- **SearchLab** — one query races two engines over a simulated 500K-doc legal index:
  a naive full scan (~3s, animated doc counter) vs an inverted index (~5ms), ending
  with a "~600× faster" verdict. Typo-tolerant via Damerau-Levenshtein ("bnak" finds bank).
- **QueueViz** — animated RabbitMQ pipeline; "Kill a consumer" routes messages through
  retries into a DLQ, then the consumer heals and the DLQ drains. Nothing is lost.
- **ExtractLab** — LLM document pipeline with three sample docs (one garbled OCR scan).
  Stages animate, schema validation rejects the bad first attempt, retries with feedback,
  then streams syntax-highlighted JSON with a token/cost/attempts footer.
- **RateLimit Arena** — token bucket (10 tokens, 2/s refill) you can spam by hand or
  with "Unleash bot traffic". 200s while tokens last, 429s after, live request log.
- **Light/dark toggle** (sun/moon in nav); light mode swaps to cream backgrounds with higher-contrast accents; persisted.
- **Work section** — each role is a card with a scannable impact grid: metric pill
  (min → <1s, 2wk → 6h, −90%…) + one-line description, instead of paragraphs.
- Space Grotesk display type, noise texture, gradient mesh background

## v3 additions

- **AI chat** ("Ask AI about me"): a Vercel function at `api/chat.js` streams answers about Raja,
  grounded only in `api/_knowledge.js`. It runs on [PromptPipe](https://github.com/RajaSodani/promptpipe):
  Gemini first, Groq as fallback, retries with backoff. Per-IP token bucket and an origin check.
- **One signature theme** (sunset) with light/dark; the switch is a circular View Transition.
- **Hero canvas**: drifting nodes that link up near the cursor. Paused off screen, off for reduced motion.
- **Mobile fixes**: work impact rows no longer overflow; ⌘K hint hidden on touch screens; chat is a full-screen sheet.

## Chat setup (Vercel)

1. Get a free Gemini API key at https://aistudio.google.com/apikey
2. Vercel → Project → Settings → Environment Variables → add `GEMINI_API_KEY`
3. Optional fallback: a free Groq key at https://console.groq.com/keys as `GROQ_API_KEY`
4. Redeploy. Without keys the chat politely shows your email instead.

Optional: `GEMINI_MODEL`, `GROQ_MODEL` to change models, `ALLOWED_ORIGINS` (comma separated) for extra domains.
To change what the bot knows, edit `api/_knowledge.js`.

## Run locally

```bash
npm install
npm run dev                        # mock chat replies, no keys needed
GEMINI_API_KEY=... node dev-server.mjs   # real replies
# open http://localhost:4175
```

## Deploy

Push to GitHub; Vercel serves the static files and builds `api/chat.js` as a function.
