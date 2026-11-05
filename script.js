/* ============================================================
   Raja Sodani: Portfolio v2 interactions
   ============================================================ */

document.documentElement.classList.add("js");

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = window.matchMedia("(pointer: fine)").matches;

/* ---------- light / dark mode ---------- */
const modeToggle = document.getElementById("modeToggle");
const darkQuery = window.matchMedia("(prefers-color-scheme: dark)");
const systemMode = () => (darkQuery.matches ? "dark" : "light");

const applyMode = (mode) => {
  if (mode === "light") {
    document.documentElement.setAttribute("data-mode", "light");
    modeToggle.textContent = "☾"; // click to go dark
  } else {
    document.documentElement.removeAttribute("data-mode");
    modeToggle.textContent = "☀"; // click to go light
  }
};
const toggleMode = () => {
  const next = document.documentElement.getAttribute("data-mode") === "light" ? "dark" : "light";
  try { localStorage.setItem("mode-v2", next); } catch {} // explicit choice persists
  if (!document.startViewTransition || reducedMotion) return applyMode(next);
  // circular reveal growing out of the toggle button
  const r = modeToggle.getBoundingClientRect();
  const x = r.left + r.width / 2, y = r.top + r.height / 2;
  const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
  document.startViewTransition(() => applyMode(next)).ready.then(() => {
    document.documentElement.animate(
      { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
      { duration: 550, easing: "cubic-bezier(0.4, 0, 0.2, 1)", pseudoElement: "::view-transition-new(root)" }
    );
  });
};
modeToggle.addEventListener("click", toggleMode);
applyMode(localStorage.getItem("mode-v2") || systemMode());
// follow the OS if the visitor never chose manually
darkQuery.addEventListener("change", () => {
  if (!localStorage.getItem("mode-v2")) applyMode(systemMode());
});

/* ---------- platform-aware shortcut label ---------- */
const isMac = /Mac|iPhone|iPad/i.test(navigator.platform || navigator.userAgent);
if (!isMac) {
  document.getElementById("paletteOpen").textContent = "Ctrl K";
  document.querySelectorAll("[data-palette]").forEach((btn) => (btn.textContent = "Ctrl K"));
}

/* ---------- rotating hero word ---------- */
const WORDS = ["measures", "ships", "scales", "fixes", "owns"];
const heroWord = document.getElementById("heroWord");
if (!reducedMotion) {
  let wi = 0, ci = WORDS[0].length, deleting = false;
  const tick = () => {
    const word = WORDS[wi];
    if (!deleting) {
      ci += 1;
      heroWord.textContent = word.slice(0, ci);
      if (ci >= word.length) { deleting = true; return setTimeout(tick, 2400); }
      return setTimeout(tick, 70);
    }
    ci -= 1;
    heroWord.textContent = word.slice(0, ci) || " ";
    if (ci <= 0) { deleting = false; wi = (wi + 1) % WORDS.length; return setTimeout(tick, 300); }
    setTimeout(tick, 35);
  };
  setTimeout(tick, 2200);
}

/* ---------- command palette ---------- */
const paletteBackdrop = document.getElementById("paletteBackdrop");
const paletteInput = document.getElementById("paletteInput");
const paletteList = document.getElementById("paletteList");

const COMMANDS = [
  { icon: "→", label: "Go to Demos", run: () => (location.hash = "#demos") },
  { icon: "→", label: "Go to Work", run: () => (location.hash = "#work") },
  { icon: "→", label: "Go to Projects", run: () => (location.hash = "#projects") },
  { icon: "→", label: "Go to Contact", run: () => (location.hash = "#contact") },
  { icon: "↗", label: "Open GitHub", run: () => window.open("https://github.com/RajaSodani", "_blank") },
  { icon: "↗", label: "Open LinkedIn", run: () => window.open("https://linkedin.com/in/raja-sodani11", "_blank") },
  { icon: "✉", label: "Email me", run: () => (location.href = "mailto:sodani.raja11@gmail.com") },
  { icon: "✦", label: "Ask AI about Raja", run: () => setTimeout(openChat) },
  { icon: "↗", label: "Open resume", run: () => window.open("resume.pdf", "_blank") },
  { icon: "↗", label: "Open PromptPipe on GitHub", run: () => window.open("https://github.com/RajaSodani/promptpipe", "_blank") },
  { icon: "◑", label: "Toggle light / dark mode", run: () => toggleMode() },
];

let palSel = 0;
let palFiltered = COMMANDS;

const renderPalette = () => {
  const q = paletteInput.value.trim().toLowerCase();
  palFiltered = COMMANDS.filter((c) => c.label.toLowerCase().includes(q));
  palSel = Math.min(palSel, Math.max(palFiltered.length - 1, 0));
  paletteList.innerHTML = "";
  palFiltered.forEach((c, i) => {
    const li = document.createElement("li");
    li.className = i === palSel ? "sel" : "";
    const icon = document.createElement("span");
    icon.className = "p-icon";
    icon.textContent = c.icon;
    li.appendChild(icon);
    li.appendChild(document.createTextNode(c.label));
    li.addEventListener("click", () => { c.run(); closePalette(); });
    li.addEventListener("mousemove", () => { palSel = i; renderSel(); });
    paletteList.appendChild(li);
  });
};
const renderSel = () => {
  [...paletteList.children].forEach((li, i) => li.classList.toggle("sel", i === palSel));
};

const openPalette = () => {
  paletteBackdrop.hidden = false;
  paletteInput.value = "";
  palSel = 0;
  renderPalette();
  paletteInput.focus();
};
const closePalette = () => { paletteBackdrop.hidden = true; };

document.getElementById("paletteOpen").addEventListener("click", openPalette);
document.querySelectorAll("[data-palette]").forEach((b) => b.addEventListener("click", openPalette));
paletteBackdrop.addEventListener("click", (e) => { if (e.target === paletteBackdrop) closePalette(); });

document.addEventListener("keydown", (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
    e.preventDefault();
    paletteBackdrop.hidden ? openPalette() : closePalette();
    return;
  }
  if (e.key === "Escape" && !chatPanel.hidden && paletteBackdrop.hidden) return closeChat();
  if (paletteBackdrop.hidden) return;
  if (e.key === "Escape") return closePalette();
  if (e.key === "ArrowDown") { e.preventDefault(); palSel = Math.min(palSel + 1, palFiltered.length - 1); renderSel(); }
  if (e.key === "ArrowUp") { e.preventDefault(); palSel = Math.max(palSel - 1, 0); renderSel(); }
  if (e.key === "Enter" && palFiltered[palSel]) { palFiltered[palSel].run(); closePalette(); }
});
paletteInput.addEventListener("input", () => { palSel = 0; renderPalette(); });

/* ---------- marquee: duplicate track for seamless loop ---------- */
const marqueeTrack = document.getElementById("marqueeTrack");
marqueeTrack.innerHTML += marqueeTrack.innerHTML;

/* ---------- scroll: progress + nav ---------- */
const nav = document.getElementById("nav");
const progress = document.getElementById("progress");
const onScroll = () => {
  nav.classList.toggle("scrolled", window.scrollY > 10);
  const max = document.documentElement.scrollHeight - window.innerHeight;
  progress.style.width = `${max > 0 ? (window.scrollY / max) * 100 : 0}%`;
};
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

/* ---------- mobile menu ---------- */
const navBurger = document.getElementById("navBurger");
const navLinksEl = document.querySelector(".nav-links");
navBurger.addEventListener("click", () => {
  const open = navLinksEl.classList.toggle("open");
  nav.classList.toggle("menu-open", open);
  navBurger.setAttribute("aria-expanded", String(open));
});
navLinksEl.addEventListener("click", (e) => {
  if (e.target.tagName === "A") {
    navLinksEl.classList.remove("open");
    nav.classList.remove("menu-open");
    navBurger.setAttribute("aria-expanded", "false");
  }
});

/* ---------- reveal ---------- */
const revealObserver = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        revealObserver.unobserve(entry.target);
      }
    }
  },
  { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
);
document.querySelectorAll(".reveal").forEach((el, i) => {
  el.style.transitionDelay = `${(i % 4) * 60}ms`;
  revealObserver.observe(el);
});

/* ---------- spotlight ---------- */
if (finePointer && !reducedMotion) {
  document.querySelectorAll(".spot").forEach((card) => {
    card.addEventListener("mousemove", (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${e.clientX - r.left}px`);
      card.style.setProperty("--my", `${e.clientY - r.top}px`);
    });
  });
}

/* ---------- hero canvas: drifting nodes that link up near the cursor ---------- */
// Reads like an index graph. Paused off screen and in background tabs; skipped for reduced motion.
const heroCanvas = document.getElementById("heroCanvas");
if (heroCanvas && !reducedMotion) {
  const ctx = heroCanvas.getContext("2d");
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let w = 0, h = 0, nodes = [], running = false, raf = 0;
  const pointer = { x: -1e4, y: -1e4 };
  const LINK = 130;

  const accent = () => getComputedStyle(document.documentElement).getPropertyValue("--accent-rgb").trim();
  let rgb = accent();
  new MutationObserver(() => (rgb = accent())).observe(document.documentElement, { attributes: true, attributeFilter: ["data-mode"] });

  const resize = () => {
    const r = heroCanvas.getBoundingClientRect();
    w = r.width; h = r.height;
    heroCanvas.width = w * dpr; heroCanvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.round(Math.min(90, (w * h) / 16000));
    nodes = Array.from({ length: count }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.25,
      r: 1 + Math.random() * 1.4,
    }));
  };

  const frame = () => {
    ctx.clearRect(0, 0, w, h);
    for (const n of nodes) {
      n.x += n.vx; n.y += n.vy;
      if (n.x < 0 || n.x > w) n.vx *= -1;
      if (n.y < 0 || n.y > h) n.vy *= -1;
    }
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      const pd = Math.hypot(a.x - pointer.x, a.y - pointer.y);
      const near = Math.max(0, 1 - pd / 220);
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d > LINK) continue;
        ctx.strokeStyle = `rgba(${rgb}, ${(1 - d / LINK) * (0.08 + near * 0.45)})`;
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
      ctx.fillStyle = `rgba(${rgb}, ${0.25 + near * 0.6})`;
      ctx.beginPath(); ctx.arc(a.x, a.y, a.r + near * 1.5, 0, Math.PI * 2); ctx.fill();
    }
    raf = requestAnimationFrame(frame);
  };

  const setRunning = (on) => {
    if (on === running) return;
    running = on;
    if (on) raf = requestAnimationFrame(frame);
    else cancelAnimationFrame(raf);
  };

  let visible = true;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; setRunning(visible && !document.hidden); }).observe(heroCanvas);
  document.addEventListener("visibilitychange", () => setRunning(visible && !document.hidden));
  window.addEventListener("pointermove", (e) => {
    const r = heroCanvas.getBoundingClientRect();
    pointer.x = e.clientX - r.left; pointer.y = e.clientY - r.top;
  }, { passive: true });
  let resizeTimer;
  window.addEventListener("resize", () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(resize, 150); });

  resize();
  setRunning(true);
  requestAnimationFrame(() => heroCanvas.classList.add("ready"));
}

/* ---------- AI chat ---------- */
// Streams NDJSON from /api/chat (see api/chat.js). All text goes in via textContent.
const chatPanel = document.getElementById("chatPanel");
const chatLauncher = document.getElementById("chatLauncher");
const chatLog = document.getElementById("chatLog");
const chatForm = document.getElementById("chatForm");
const chatInput = document.getElementById("chatInput");
const chatChips = document.getElementById("chatChips");
const chatSend = chatForm.querySelector(".chat-send");
const CHAT_KEY = "chat-v1";
const CHAT_GREETING = "Hi! I'm an AI assistant that answers questions about Raja's work, projects and experience. What would you like to know?";
const CHAT_OFFLINE = "The AI is offline right now. You can reach Raja directly at sodani.raja11@gmail.com.";

let chatHistory = [];
let chatBusy = false;
try { chatHistory = JSON.parse(sessionStorage.getItem(CHAT_KEY)) || []; } catch {}
const saveChat = () => { try { sessionStorage.setItem(CHAT_KEY, JSON.stringify(chatHistory.slice(-20))); } catch {} };

const addMsg = (role, text, meta) => {
  const el = document.createElement("div");
  el.className = `cmsg cmsg-${role === "user" ? "user" : "bot"}`;
  el.textContent = text;
  if (meta) {
    const m = document.createElement("span");
    m.className = "cmsg-meta";
    m.textContent = meta;
    el.appendChild(m);
  }
  chatLog.appendChild(el);
  chatLog.scrollTop = chatLog.scrollHeight;
  return el;
};

const renderChat = () => {
  chatLog.innerHTML = "";
  addMsg("assistant", CHAT_GREETING);
  for (const m of chatHistory) addMsg(m.role, m.content, m.meta);
  chatChips.hidden = chatHistory.length > 0;
};

function openChat() {
  if (!chatPanel.hidden) return chatInput.focus();
  renderChat();
  chatPanel.hidden = false;
  chatLauncher.classList.add("hidden");
  chatLauncher.setAttribute("aria-expanded", "true");
  chatInput.focus({ preventScroll: true });
}
function closeChat() {
  chatPanel.hidden = true;
  chatLauncher.classList.remove("hidden");
  chatLauncher.setAttribute("aria-expanded", "false");
  chatLauncher.focus({ preventScroll: true });
}

document.querySelectorAll("[data-chat-open]").forEach((b) => b.addEventListener("click", openChat));
document.getElementById("chatClose").addEventListener("click", closeChat);
document.getElementById("chatReset").addEventListener("click", () => {
  if (chatBusy) return;
  chatHistory = [];
  saveChat();
  renderChat();
  chatInput.focus();
});
chatChips.addEventListener("click", (e) => {
  if (e.target.matches(".try-chip")) askChat(e.target.textContent);
});
chatForm.addEventListener("submit", (e) => {
  e.preventDefault();
  askChat(chatInput.value);
});

async function askChat(raw) {
  const question = raw.trim();
  if (!question || chatBusy) return;
  chatBusy = true;
  chatSend.disabled = true;
  chatInput.value = "";
  chatChips.hidden = true;

  chatHistory.push({ role: "user", content: question });
  addMsg("user", question);
  const bubble = addMsg("assistant", "");
  bubble.innerHTML = '<span class="cmsg-dots"><i></i><i></i><i></i></span>';

  let answer = "";
  let meta = "";
  let failed = "";
  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ messages: chatHistory.map(({ role, content }) => ({ role, content })) }),
    });
    if (!res.ok || !res.body) {
      const body = await res.json().catch(() => ({}));
      throw new Error(res.status === 429 ? body.error : CHAT_OFFLINE);
    }
    const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
    let buffer = "";
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += value;
      let nl;
      while ((nl = buffer.indexOf("\n")) !== -1) {
        const line = buffer.slice(0, nl).trim();
        buffer = buffer.slice(nl + 1);
        if (!line) continue;
        const evt = JSON.parse(line);
        if (evt.t) {
          answer += evt.t;
          bubble.textContent = answer;
          bubble.classList.add("cmsg-typing");
          chatLog.scrollTop = chatLog.scrollHeight;
        } else if (evt.done) {
          meta = `${evt.done.provider} · ${(evt.done.ms / 1000).toFixed(1)}s`;
        } else if (evt.error) {
          failed = CHAT_OFFLINE;
        }
      }
    }
    if (!answer && !failed) failed = CHAT_OFFLINE;
  } catch (err) {
    failed = err.message && err.message !== "Failed to fetch" ? err.message : CHAT_OFFLINE;
  }

  bubble.classList.remove("cmsg-typing");
  if (failed && !answer) {
    chatHistory.pop(); // let the visitor retry the same question
    bubble.textContent = failed;
    bubble.classList.add("cmsg-error");
  } else {
    chatHistory.push({ role: "assistant", content: answer, meta });
    bubble.textContent = answer;
    if (meta) {
      const m = document.createElement("span");
      m.className = "cmsg-meta";
      m.textContent = meta;
      bubble.appendChild(m);
    }
  }
  saveChat();
  chatLog.scrollTop = chatLog.scrollHeight;
  chatBusy = false;
  chatSend.disabled = false;
  if (!matchMedia("(max-width: 700px)").matches) chatInput.focus();
}

/* ============================================================
   DEMO 1: SearchLab: engine race + fuzzy matching
   ============================================================ */
const CASES = [
  ["State Bank of India v. Mehta Holdings", "Supreme Court · 2023 · banking"],
  ["ICICI Bank Ltd. v. Sharma Textiles", "Bombay HC · 2022 · loan recovery"],
  ["Commissioner of Income Tax v. Rane Industries", "Delhi HC · 2021 · tax"],
  ["Union of India v. Deshpande Property Trust", "Supreme Court · 2020 · property"],
  ["HDFC Bank v. Kulkarni Agro Exports", "NCLT Mumbai · 2023 · insolvency"],
  ["Patel Infrastructure v. State of Gujarat", "Gujarat HC · 2022 · contracts"],
  ["Bajaj Finserv Ltd. v. Nair Automobiles", "Pune District · 2024 · recovery"],
  ["Reserve Bank of India v. Apex Cooperative Bank", "Supreme Court · 2021 · banking"],
  ["Emcure Pharma v. Drug Controller of India", "Delhi HC · 2023 · pharma"],
  ["Tax Officer, Pune v. Wadia Property Developers", "ITAT · 2022 · tax"],
  ["Mehra v. Mehra Family Property Dispute", "Rajasthan HC · 2020 · property"],
  ["Axis Bank v. Chordia Jewellers", "DRT Pune · 2023 · loan recovery"],
  ["State of Maharashtra v. Kale Land Holdings", "Bombay HC · 2021 · land"],
  ["GST Council v. Rathi Steel Traders", "CESTAT · 2024 · tax"],
  ["LIC of India v. Bhandari Estate", "Supreme Court · 2019 · insurance"],
  ["Kotak Mahindra Bank v. Puri Hotels", "NCLT Delhi · 2022 · insolvency"],
  ["Sharma v. Municipal Corporation of Pune", "Bombay HC · 2023 · civic"],
  ["Central Bank of India v. Joshi Textiles", "DRT Mumbai · 2021 · recovery"],
  ["Income Tax Dept. v. Agarwal Property Group", "Delhi HC · 2024 · tax"],
  ["Punjab National Bank v. Verma Cold Storage", "Allahabad HC · 2020 · banking"],
];

const searchInput = document.getElementById("searchInput");
const searchResults = document.getElementById("searchResults");
const esLatency = document.getElementById("esLatency");
const esFill = document.getElementById("esFill");
const esNote = document.getElementById("esNote");
const scanLatency = document.getElementById("scanLatency");
const scanFill = document.getElementById("scanFill");
const scanNote = document.getElementById("scanNote");
const raceVerdict = document.getElementById("raceVerdict");
const psteps = [...document.querySelectorAll(".pstep")];

// Damerau-Levenshtein: adjacent swaps ("bnak" → "bank") count as one edit
const editDistance = (a, b) => {
  if (Math.abs(a.length - b.length) > 2) return 99;
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        dp[i][j] = Math.min(dp[i][j], dp[i - 2][j - 2] + 1);
      }
    }
  }
  return dp[a.length][b.length];
};

const queryIndex = (query) => {
  const qWords = query.split(/\s+/).filter(Boolean);
  return CASES.map(([title, meta]) => {
    const t = title.toLowerCase();
    let score = 0;
    let fuzzy = false;
    if (t.includes(query)) {
      score = 3 + query.length / t.length;
    } else if (qWords.length) {
      const tWords = t.split(/[^a-z0-9]+/).filter(Boolean);
      let matched = 0;
      for (const qw of qWords) {
        const maxDist = qw.length > 4 ? 2 : 1;
        if (tWords.some((tw) => tw.includes(qw) || editDistance(qw, tw) <= maxDist)) matched += 1;
      }
      if (matched === qWords.length) { score = 1 + matched * 0.4; fuzzy = true; }
    }
    return { title, meta, score, fuzzy };
  })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);
};

const TRY_WORDS = ["bank", "tax", "property", "pune", "insolvency", "bnak"];
const tryChipsEl = document.getElementById("tryChips");
const makeChip = (w) => {
  const b = document.createElement("button");
  b.type = "button";
  b.className = "try-chip mono";
  b.textContent = w;
  b.addEventListener("click", () => {
    searchInput.value = w;
    runRace(w);
  });
  return b;
};
TRY_WORDS.forEach((w) => tryChipsEl.appendChild(makeChip(w)));

const esToggleBtn = document.getElementById("esToggleBtn");
const esQueryEl = document.getElementById("esQuery");
let lastQuery = "";
const renderEsQuery = () => {
  const dsl = {
    query: {
      multi_match: {
        query: lastQuery || "your query",
        fields: ["title^3", "court", "parties"],
        fuzziness: "AUTO",
      },
    },
    highlight: { fields: { title: {} } },
    size: 6,
  };
  esQueryEl.innerHTML = JSON.stringify(dsl, null, 2).split("\n").map(colorJsonLine).join("\n");
};
esToggleBtn.addEventListener("click", () => {
  const open = esQueryEl.classList.toggle("open");
  if (open) renderEsQuery();
});

let raceToken = 0;
let scanRaf = null;

const resetRace = () => {
  cancelAnimationFrame(scanRaf);
  psteps.forEach((p) => p.classList.remove("on"));
  esFill.style.width = "0%";
  scanFill.style.width = "0%";
  esLatency.textContent = "";
  scanLatency.textContent = "";
  esNote.textContent = "Idle";
  scanNote.textContent = "Idle";
  raceVerdict.textContent = "";
  searchResults.innerHTML = "";
};

const renderResults = (hits, query) => {
  searchResults.innerHTML = "";
  const maxScore = hits.length ? hits[0].score : 1;
  hits.forEach((hit, i) => {
    const li = document.createElement("li");
    li.style.animationDelay = `${i * 40}ms`;
    const t = document.createElement("span");
    t.className = "r-title";
    const idx = hit.title.toLowerCase().indexOf(query);
    if (idx >= 0) {
      t.appendChild(document.createTextNode(hit.title.slice(0, idx)));
      const m = document.createElement("mark");
      m.textContent = hit.title.slice(idx, idx + query.length);
      t.appendChild(m);
      t.appendChild(document.createTextNode(hit.title.slice(idx + query.length)));
    } else {
      t.textContent = hit.title;
    }
    const meta = document.createElement("span");
    meta.className = "r-meta mono";
    const scorePct = Math.round((hit.score / maxScore) * 100);
    meta.textContent = `${hit.fuzzy ? "~fuzzy · " : ""}score ${scorePct} · ${hit.meta}`;
    li.appendChild(t);
    li.appendChild(meta);
    searchResults.appendChild(li);
  });
  if (!hits.length) {
    const li = document.createElement("li");
    li.className = "r-empty";
    const chips = document.createElement("span");
    chips.className = "try-chips inline";
    TRY_WORDS.forEach((w) => chips.appendChild(makeChip(w)));
    const t = document.createElement("span");
    t.className = "r-title";
    t.textContent = 'No matches in the demo index. Try:';
    li.appendChild(t);
    li.appendChild(chips);
    searchResults.appendChild(li);
  }
};

const runRace = (rawQuery) => {
  const query = rawQuery.trim().toLowerCase();
  raceToken += 1;
  const token = raceToken;
  resetRace();
  if (!query) return;

  const hits = queryIndex(query);
  lastQuery = query;
  if (esQueryEl.classList.contains("open")) renderEsQuery();
  const esMs = 3 + Math.random() * 6;
  const scanMs = 2600 + Math.random() * 900; // simulated full-scan wall time

  // pipeline chips light up in sequence
  const stepDelay = reducedMotion ? 0 : 110;
  psteps.forEach((p, i) => {
    setTimeout(() => { if (token === raceToken) p.classList.add("on"); }, i * stepDelay);
  });

  // fast lane: instant
  const esDone = () => {
    if (token !== raceToken) return;
    esFill.style.width = "100%";
    esLatency.textContent = `${esMs.toFixed(1)}ms`;
    esNote.textContent = `Inverted index lookup · ${hits.length} hit${hits.length === 1 ? "" : "s"} ranked`;
    renderResults(hits, query);
  };
  reducedMotion ? esDone() : setTimeout(esDone, psteps.length * stepDelay + 80);

  // slow lane: grind through 500K docs
  scanNote.textContent = "Scanning 0 / 500,000 docs";
  if (reducedMotion) {
    scanFill.style.width = "100%";
    scanLatency.textContent = `${(scanMs / 1000).toFixed(1)}s`;
    scanNote.textContent = "Scanned 500,000 / 500,000 docs";
    raceVerdict.textContent = `⚡ Inverted index ~${Math.round(scanMs / esMs).toLocaleString()}× faster`;
    return;
  }
  const t0 = performance.now();
  const scanStep = (now) => {
    if (token !== raceToken) return;
    const p = Math.min((now - t0) / scanMs, 1);
    const docs = Math.floor(p * 500000);
    scanFill.style.width = `${p * 100}%`;
    scanNote.textContent = `Scanning ${docs.toLocaleString()} / 500,000 docs`;
    if (p < 1) {
      scanRaf = requestAnimationFrame(scanStep);
    } else {
      scanLatency.textContent = `${(scanMs / 1000).toFixed(1)}s`;
      scanNote.textContent = `Scanned 500,000 / 500,000 docs · same ${hits.length} result${hits.length === 1 ? "" : "s"}… eventually`;
      raceVerdict.textContent = `⚡ Inverted index ~${Math.round(scanMs / esMs).toLocaleString()}× faster. This is why search went from minutes to <1s`;
    }
  };
  scanRaf = requestAnimationFrame(scanStep);
};

let searchDebounce = null;
searchInput.addEventListener("input", () => {
  clearTimeout(searchDebounce);
  searchDebounce = setTimeout(() => runRace(searchInput.value), 260);
});

/* ============================================================
   DEMO 2: QueueViz
   ============================================================ */
const lanes = [...document.querySelectorAll(".pipe-lane")];
const consumers = [...document.querySelectorAll(".pipe-consumer")];
const statDone = document.getElementById("statDone");
const statRetry = document.getElementById("statRetry");
const statDlq = document.getElementById("statDlq");
const statHealth = document.getElementById("statHealth");

const qState = { done: 0, retry: 0, dlq: 0, dead: -1 };
consumers.forEach((c) => c.classList.add("ok"));

const setStat = (el, v) => {
  const s = String(v);
  if (el.textContent === s) return;
  el.textContent = s;
  el.classList.remove("pop");
  void el.offsetWidth;
  el.classList.add("pop");
};

const renderStats = () => {
  setStat(statDone, qState.done);
  setStat(statRetry, qState.retry);
  setStat(statDlq, qState.dlq);
  if (qState.dead >= 0) {
    statHealth.textContent = `● Worker-${qState.dead + 1} down, retrying → DLQ`;
    statHealth.className = "stat-bad";
  } else if (qState.dlq > 0) {
    statHealth.textContent = "● Consumers healthy, draining DLQ";
    statHealth.className = "stat-ok";
  } else {
    statHealth.textContent = "● All consumers healthy";
    statHealth.className = "stat-ok";
  }
};

const spawnMsg = (laneIdx, opts = {}) => {
  const lane = lanes[laneIdx];
  const track = lane.querySelector(".lane-track");
  const msg = document.createElement("div");
  msg.className = "msg";
  const travel = reducedMotion ? 0 : 900 + Math.random() * 400;
  msg.style.transitionDuration = `${travel}ms`;
  track.appendChild(msg);

  requestAnimationFrame(() =>
    requestAnimationFrame(() => { msg.style.left = "calc(100% - 10px)"; })
  );

  setTimeout(() => {
    const deadLane = qState.dead === laneIdx;
    if (deadLane && !opts.redelivery) {
      msg.classList.add("dead");
      qState.retry += 1;
      renderStats();
      setTimeout(() => {
        msg.remove();
        if (qState.dead === laneIdx) {
          qState.dlq += 1;
        } else {
          qState.done += 1;
        }
        renderStats();
      }, reducedMotion ? 0 : 500);
    } else {
      qState.done += 1;
      renderStats();
      msg.remove();
    }
  }, travel + 30);
};

setInterval(() => {
  if (document.hidden) return;
  spawnMsg(Math.floor(Math.random() * lanes.length));
}, reducedMotion ? 2000 : 800);

document.getElementById("burstBtn").addEventListener("click", () => {
  for (let i = 0; i < 12; i++) {
    setTimeout(() => spawnMsg(Math.floor(Math.random() * lanes.length)), i * (reducedMotion ? 0 : 120));
  }
});

document.getElementById("chaosBtn").addEventListener("click", () => {
  if (qState.dead >= 0) return;
  const victim = Math.floor(Math.random() * consumers.length);
  qState.dead = victim;
  consumers[victim].classList.remove("ok");
  consumers[victim].classList.add("dead");
  renderStats();

  setTimeout(() => {
    qState.dead = -1;
    consumers[victim].classList.remove("dead");
    consumers[victim].classList.add("ok");
    renderStats();
    const drain = setInterval(() => {
      if (qState.dlq <= 0) { clearInterval(drain); renderStats(); return; }
      qState.dlq -= 1;
      spawnMsg(victim, { redelivery: true });
      renderStats();
    }, reducedMotion ? 300 : 450);
  }, 6000);
});

renderStats();

/* ============================================================
   DEMO 3: ExtractLab: LLM pipeline with validation retry
   ============================================================ */
const DOCS = [
  {
    src: `IN THE COURT OF SMALL CAUSES, PUNE
Notice No. 4821/2025

To: Sharma Textiles Pvt. Ltd.
In the matter of ICICI Bank Ltd. vs Sharma Textiles,
Case CC/812/2024, next hearing is scheduled on
14 August 2025 at 11:00 AM before Hon'ble Judge R. Kale.`,
    json: {
      case_no: "CC/812/2024",
      court: "Court of Small Causes, Pune",
      parties: { plaintiff: "ICICI Bank Ltd.", defendant: "Sharma Textiles Pvt. Ltd." },
      hearing: { date: "2025-08-14", time: "11:00", judge: "R. Kale" },
      confidence: 0.98,
    },
    messy: false,
    foot: "1,182 tokens · 1.6s · attempt <b>1/1</b> · schema valid ✓",
  },
  {
    src: `[OCR quality: 71%]
...judgm3nt del1vered on 32/13/2024 (?) in the matt-
er of Bajaj F1nserv Ltd v/s Nair Autom0biles, DRT
Pune. Recovery of Rs. 42,00,000 all0wed with 9% int.
Next c0mpliance date 05-o9-2025.`,
    json: {
      case_type: "debt recovery",
      court: "DRT Pune",
      parties: { plaintiff: "Bajaj Finserv Ltd", defendant: "Nair Automobiles" },
      order: { amount_inr: 4200000, interest: "9%" },
      compliance_date: "2025-09-05",
      ocr_quality: 0.71,
      confidence: 0.87,
    },
    messy: true,
    error: '✗ hearing.date "32/13/2024" failed schema (invalid date), retrying with validation feedback',
    foot: "2,431 tokens · 3.9s · attempt <b>2/2</b> · recovered via validation loop ✓",
  },
  {
    src: `<<CLIENT_FMT_EMCURE-v3>>
MATTER::Emcure Pharma vs Drug Controller|WRIT|DEL-HC
FILED::2023.11.02||STATUS::pending
COUNSEL::A. Deshpande;R. Iyer
TAGS::regulatory,pharma,writ-petition`,
    json: {
      matter: "Emcure Pharma vs Drug Controller of India",
      type: "writ petition",
      court: "Delhi High Court",
      filed: "2023-11-02",
      status: "pending",
      counsel: ["A. Deshpande", "R. Iyer"],
      tags: ["regulatory", "pharma"],
      confidence: 0.95,
    },
    messy: false,
    foot: "1,024 tokens · 1.4s · attempt <b>1/1</b> · unseen format, zero parsing code ✓",
  },
];

const extractSrc = document.getElementById("extractSrc");
const extractJson = document.getElementById("extractJson");
const extractFoot = document.getElementById("extractFoot");
const stages = [...document.querySelectorAll(".stage")];
const stagesWrap = document.getElementById("stages");
const docTabs = [...document.querySelectorAll(".doc-tab")];
const runExtractBtn = document.getElementById("runExtract");

let currentDoc = 0;
let extractToken = 0;

const colorJsonLine = (line) =>
  line
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/"([^"]+)":/g, '<span class="j-key">"$1"</span>:')
    .replace(/: "([^"]*)"/g, ': <span class="j-str">"$1"</span>')
    .replace(/: ([0-9][0-9.]*)/g, ': <span class="j-num">$1</span>');

const resetExtract = () => {
  extractToken += 1;
  stages.forEach((s) => s.classList.remove("on", "fail", "checking"));
  stagesWrap.querySelector(".retry-badge")?.remove();
  extractJson.innerHTML = '<span class="j-idle">// structured output appears here. Hit “Run pipeline”</span>';
  extractFoot.textContent = "";
};

const selectDoc = (i) => {
  currentDoc = i;
  docTabs.forEach((t, j) => t.classList.toggle("active", j === i));
  extractSrc.textContent = DOCS[i].src;
  resetExtract();
};
docTabs.forEach((tab, i) => tab.addEventListener("click", () => selectDoc(i)));
selectDoc(0);

const wait = (ms) => new Promise((r) => setTimeout(r, reducedMotion ? 0 : ms));

const streamJson = async (token, obj) => {
  const lines = JSON.stringify(obj, null, 2).split("\n");
  extractJson.innerHTML = "";
  for (const line of lines) {
    if (token !== extractToken) return;
    const div = document.createElement("div");
    div.innerHTML = colorJsonLine(line);
    extractJson.appendChild(div);
    await wait(70);
  }
};

const runExtract = async () => {
  const doc = DOCS[currentDoc];
  resetExtract();
  const token = extractToken;
  runExtractBtn.disabled = true;
  runExtractBtn.textContent = "Running…";

  const light = async (i, ms, label) => {
    if (token !== extractToken) return false;
    stages[i].classList.add("on");
    if (label) extractJson.innerHTML = `<span class="j-idle">${label}</span>`;
    await wait(ms);
    return token === extractToken;
  };

  try {
    if (!(await light(0, 350, "// chunking document…"))) return;
    if (!(await light(1, 400, "// building extraction prompt…"))) return;
    if (!(await light(2, 1100, "// claude is reading the document…"))) return;

    if (doc.messy) {
      // attempt 1 fails validation: hold long enough to register
      stages[3].classList.add("fail");
      extractJson.innerHTML = `<span class="j-err">${doc.error}</span>`;
      extractFoot.textContent = "✗ attempt 1 rejected by zod schema";
      await wait(3000);
      if (token !== extractToken) return;

      // visible retry intimation: spinning badge in the stage row
      const badge = document.createElement("span");
      badge.className = "retry-badge mono";
      badge.innerHTML = '<i class="spin">↻</i> retrying with feedback';
      stagesWrap.appendChild(badge);
      extractFoot.textContent = "validation error appended to the prompt · attempt 2 of 2";
      stages[3].classList.remove("fail");
      stages[2].classList.remove("on");
      await wait(700);
      if (token !== extractToken) return;
      if (!(await light(2, 1300, "// retry: claude re-extracting with validation feedback…"))) return;

      // re-validation, visibly checking before it passes
      stages[3].classList.add("checking");
      extractJson.innerHTML = '<span class="j-idle">// validating against schema…</span>';
      await wait(1100);
      if (token !== extractToken) return;
      stages[3].classList.remove("checking");
      badge.remove();
    } else {
      // clean docs get a brief visible validation too
      stages[3].classList.add("checking");
      extractJson.innerHTML = '<span class="j-idle">// validating against schema…</span>';
      await wait(600);
      if (token !== extractToken) return;
      stages[3].classList.remove("checking");
    }

    stages[3].classList.add("on");
    await wait(250);
    if (token !== extractToken) return;
    await streamJson(token, doc.json);
    if (token !== extractToken) return;
    extractFoot.innerHTML = doc.foot;
  } finally {
    runExtractBtn.disabled = false;
    runExtractBtn.textContent = "Run pipeline ▸";
  }
};

runExtractBtn.addEventListener("click", runExtract);

/* ============================================================
   DEMO 4: RateLimit Arena: token bucket
   ============================================================ */
const BUCKET_CAP = 10;
const bucketEl = document.getElementById("bucket");
const rlTokensEl = document.getElementById("rlTokens");
const rl200El = document.getElementById("rl200");
const rl429El = document.getElementById("rl429");
const rlMsgEl = document.getElementById("rlMsg");
const rlLog = document.getElementById("rlLog");

const tokenEls = Array.from({ length: BUCKET_CAP }, () => {
  const t = document.createElement("div");
  t.className = "token";
  bucketEl.appendChild(t);
  return t;
});

const rl = { tokens: BUCKET_CAP, ok: 0, rejected: 0, streak429: 0 };
const RL_ENDPOINTS = ["/api/cases/search", "/api/notify/whatsapp", "/api/templates/parse", "/api/analytics/live"];

const renderBucket = () => {
  tokenEls.forEach((t, i) => t.classList.toggle("spent", i >= rl.tokens));
  setStat(rlTokensEl, rl.tokens);
  setStat(rl200El, rl.ok);
  setStat(rl429El, rl.rejected);
  if (rl.streak429 >= 6) rlMsgEl.textContent = "The bucket holds. It always holds.";
  else if (rl.tokens === 0) rlMsgEl.textContent = "Drained. Refilling 2/s, backend untouched";
  else if (rl.tokens === BUCKET_CAP) rlMsgEl.textContent = "Bucket full. Every API I ship is rate limited.";
  else rlMsgEl.textContent = "Refilling…";
};

const rlLogLine = (okStatus) => {
  const li = document.createElement("li");
  const ep = RL_ENDPOINTS[Math.floor(Math.random() * RL_ENDPOINTS.length)];
  if (okStatus) {
    li.className = "ok";
    li.textContent = `GET ${ep} → 200 OK (${(4 + Math.random() * 22).toFixed(0)}ms)`;
  } else {
    li.className = "bad";
    li.textContent = `GET ${ep} → 429 Too Many Requests · Retry-After: 1`;
  }
  rlLog.prepend(li);
  while (rlLog.children.length > 6) rlLog.lastChild.remove();
};

const rlRequest = () => {
  if (rl.tokens > 0) {
    rl.tokens -= 1;
    rl.ok += 1;
    rl.streak429 = 0;
    rlLogLine(true);
  } else {
    rl.rejected += 1;
    rl.streak429 += 1;
    rlLogLine(false);
  }
  renderBucket();
};

document.getElementById("rlSend").addEventListener("click", rlRequest);
document.getElementById("rlBot").addEventListener("click", () => {
  for (let i = 0; i < 25; i++) {
    setTimeout(rlRequest, i * (reducedMotion ? 0 : 90));
  }
});

// refill: 2 tokens per second
setInterval(() => {
  if (document.hidden || rl.tokens >= BUCKET_CAP) return;
  rl.tokens += 1;
  renderBucket();
}, 500);

renderBucket();
