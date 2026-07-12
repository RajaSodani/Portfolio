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
- **Light/dark toggle** (sun/moon in nav) on top of the 4 accent themes — light mode
  swaps the palette to cream backgrounds with higher-contrast accents; persisted.
- **Work section** — each role is a card with a scannable impact grid: metric pill
  (min → <1s, 2wk → 6h, −90%…) + one-line description, instead of paragraphs.
- Space Grotesk display type, noise texture, gradient mesh background
- Same 4-theme switcher as v1 (sunset default, persisted in localStorage)

## ⚠️ Before publishing

Three of the five projects are **placeholders I have not actually built**
(QueueScope, PromptPipe, CaseGraph). Either build/rename them to real repos or
remove those cards — interviewers will click the links.

All project GitHub links currently point at the profile, not real repos.

## Run locally

```bash
python3 -m http.server 4175
# open http://localhost:4175
```

## Deploy

Static folder — drop into Vercel / Netlify / GitHub Pages as-is.
