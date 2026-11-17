export const DASHBOARD_HTML = /* html */ `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Motion">
<meta name="theme-color" content="#e8ecf6" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0b0d16" media="(prefers-color-scheme: dark)">
<title>Motion</title>
<link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>✓</text></svg>">
<style>
:root{
  --bg:#e8ecf6;
  --b1:#b3a9ff; --b2:#86ccff; --b3:#ffbfa3; --b4:#9de8cb;
  --ink:#141726; --muted:rgba(20,23,38,.55); --faint:rgba(20,23,38,.08);
  --glass:rgba(255,255,255,.44); --glass-hi:rgba(255,255,255,.62);
  --edge:rgba(255,255,255,.75); --shadow:0 10px 40px rgba(40,50,100,.10);
  --done1:#34c77b; --done2:#2bb3c4; --late:#f0a43a; --missed:rgba(232,98,98,.28);
  --cell:rgba(20,23,38,.07);
}
@media (prefers-color-scheme: dark){
  :root{
    --bg:#0b0d16;
    --b1:#3b2f8f; --b2:#164a7a; --b3:#5a2347; --b4:#0f4a43;
    --ink:#eef0f8; --muted:rgba(238,240,248,.55); --faint:rgba(255,255,255,.08);
    --glass:rgba(255,255,255,.06); --glass-hi:rgba(255,255,255,.10);
    --edge:rgba(255,255,255,.13); --shadow:0 10px 40px rgba(0,0,0,.35);
    --missed:rgba(232,98,98,.30); --cell:rgba(255,255,255,.07);
  }
}
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
html{background:var(--bg)}
body{margin:0;min-height:100vh;color:var(--ink);
  font:15px/1.4 -apple-system,BlinkMacSystemFont,"SF Pro Text",system-ui,sans-serif;-webkit-font-smoothing:antialiased;
  padding:calc(env(safe-area-inset-top) + 28px) 16px calc(env(safe-area-inset-bottom) + 40px)}
body::before{content:"";position:fixed;inset:-20%;z-index:-1;pointer-events:none;filter:blur(40px);
  background:
    radial-gradient(50% 40% at 15% 12%, var(--b1), transparent 72%),
    radial-gradient(50% 40% at 92% 28%, var(--b2), transparent 72%),
    radial-gradient(55% 45% at 78% 88%, var(--b3), transparent 72%),
    radial-gradient(50% 40% at 8% 70%, var(--b4), transparent 72%)}
main{max-width:560px;margin:0 auto}
.glass{background:var(--glass);border:1px solid var(--edge);border-radius:24px;box-shadow:var(--shadow), inset 0 1px 0 var(--glass-hi);
  -webkit-backdrop-filter:blur(28px) saturate(170%);backdrop-filter:blur(28px) saturate(170%)}

header{padding:4px 6px 18px}
.eyebrow{font-size:12.5px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}
h1{font-size:34px;font-weight:700;letter-spacing:-.03em;margin:2px 0 14px}
.progress{display:flex;align-items:center;gap:12px;font-size:13.5px;color:var(--muted)}
.bar{flex:1;height:6px;border-radius:99px;background:var(--faint);overflow:hidden}
.bar i{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,var(--done1),var(--done2));transition:width .5s cubic-bezier(.2,.8,.2,1)}

.habit{padding:16px 16px 14px;margin-bottom:12px}
.top{display:flex;align-items:center;gap:14px}
.check{all:unset;cursor:pointer;flex-shrink:0;width:46px;height:46px;border-radius:50%;display:grid;place-items:center;
  border:1.5px solid var(--edge);background:var(--glass-hi);box-shadow:inset 0 1px 2px rgba(0,0,0,.06);
  transition:transform .15s, background .3s, border-color .3s}
.check:active{transform:scale(.92)}
.check svg{width:22px;height:22px;stroke:#fff;stroke-width:3;fill:none;stroke-linecap:round;stroke-linejoin:round;
  stroke-dasharray:24;stroke-dashoffset:24;transition:stroke-dashoffset .35s .05s ease}
.check.done{background:linear-gradient(135deg,var(--done1),var(--done2));border-color:transparent;box-shadow:0 6px 18px rgba(43,179,140,.35)}
.check.late{background:var(--late);border-color:transparent;box-shadow:0 6px 18px rgba(240,164,58,.3)}
.check.done svg,.check.late svg{stroke-dashoffset:0}
.check.missed{border-color:var(--missed)}
.meta{flex:1;min-width:0}
.name{font-weight:600;font-size:16.5px;letter-spacing:-.01em}
.sub{font-size:13px;color:var(--muted);margin-top:1px}
.streak{flex-shrink:0;font-size:13px;font-weight:600;padding:6px 11px;border-radius:99px;background:var(--glass-hi);border:1px solid var(--edge);
  font-variant-numeric:tabular-nums;white-space:nowrap}
.streak.zero{color:var(--muted);font-weight:500}

.heat{display:grid;grid-auto-flow:column;grid-template-rows:repeat(7,1fr);gap:3px;margin-top:14px}
.heat i{display:block;aspect-ratio:1;border-radius:4px;background:var(--cell)}
.heat i.done{background:linear-gradient(135deg,var(--done1),var(--done2))}
.heat i.late{background:var(--late)}
.heat i.missed{background:var(--missed)}
.heat i.pending{box-shadow:inset 0 0 0 1.5px var(--muted)}
.heat i.pad{visibility:hidden}

.section{padding:16px 18px;margin-top:20px}
.section h2{margin:0 0 10px;font-size:12.5px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}
.week div{display:flex;justify-content:space-between;padding:6px 0;font-size:14.5px}
.week div+div{border-top:1px solid var(--faint)}
.week div{align-items:center;gap:12px}
.week small{display:block;font-size:12px;color:var(--muted)}
.week .val{white-space:nowrap;font-variant-numeric:tabular-nums}
.week .total{font-weight:600}
details summary{list-style:none;cursor:pointer;display:flex;justify-content:space-between;align-items:center}
details summary::-webkit-details-marker{display:none}
details summary::after{content:"›";font-size:20px;color:var(--muted);transition:transform .2s}
details[open] summary::after{transform:rotate(90deg)}
details summary h2{margin:0}
ul{list-style:none;margin:10px 0 0;padding:0}
li{display:flex;align-items:center;gap:12px;padding:10px 0;border-top:1px solid var(--faint)}
li .what{flex:1;min-width:0}
li .tag{font-size:12px;color:var(--muted)}
li .when{font-size:13px;color:var(--muted);white-space:nowrap;font-variant-numeric:tabular-nums}
li .x{all:unset;cursor:pointer;width:28px;height:28px;border-radius:50%;display:grid;place-items:center;color:var(--muted);background:var(--faint);font-size:12px}
.empty{color:var(--muted);font-size:14px;padding:6px 0}

#toast{position:fixed;left:50%;bottom:calc(env(safe-area-inset-bottom) + 22px);transform:translate(-50%,12px);opacity:0;
  padding:11px 18px;border-radius:18px;font-size:14px;font-weight:500;max-width:calc(100vw - 32px);pointer-events:none;
  transition:opacity .25s, transform .25s}
#toast.on{opacity:1;transform:translate(-50%,0)}
</style>
</head>
<body>
<main>
  <header>
    <div class="eyebrow" id="date"></div>
    <h1>Today</h1>
    <div class="progress"><div class="bar"><i id="bar" style="width:0"></i></div><span id="count"></span></div>
  </header>
  <div id="habits"></div>
  <section class="glass section"><h2 id="weektitle">This week</h2><div class="week" id="summary"></div></section>
  <section class="glass section">
    <details><summary><h2>Recent taps</h2></summary><ul id="recent"></ul></details>
  </section>
</main>
<div id="toast" class="glass"></div>
<script>
const $ = (s) => document.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const TICK = '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

function toast(msg) {
  const t = $("#toast"); t.textContent = msg; t.classList.add("on");
  clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove("on"), 3000);
}

function heatmap(days) {
  const keys = Object.keys(days).slice(-7 * 15);
  const dow = (d) => (new Date(d + "T12:00:00Z").getUTCDay() + 6) % 7; // Mon = 0
  const cells = Array(dow(keys[0])).fill('<i class="pad"></i>');
  for (const k of keys) cells.push('<i class="' + days[k] + '" title="' + k + '"></i>');
  return '<div class="heat">' + cells.join("") + "</div>";
}

function subtitle(h) {
  if (h.check) return h.todayStatus === "done" ? "Done today" : "Tap the tag or tick";
  if (h.todayStatus === "done") return "In bed at " + h.todayTime;
  if (h.todayStatus === "late") return "Late · " + h.todayTime;
  if (h.todayStatus === "missed") return "Missed";
  return "Before " + h.deadline;
}

function render(s) {
  $("#date").textContent = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/London" });
  const done = s.habits.filter((h) => h.todayStatus === "done").length;
  $("#bar").style.width = (done / s.habits.length) * 100 + "%";
  $("#count").textContent = done + " of " + s.habits.length;

  $("#habits").innerHTML = s.habits.map((h) =>
    '<section class="glass habit"><div class="top">' +
      '<button class="check ' + h.todayStatus + '" data-toggle="' + h.id + '" aria-label="Toggle ' + esc(h.name) + '">' + TICK + '</button>' +
      '<div class="meta"><div class="name">' + h.emoji + " " + esc(h.name) + '</div><div class="sub">' + esc(subtitle(h)) + '</div></div>' +
      '<div class="streak' + (h.streak ? "" : " zero") + '" title="Best ' + h.best + '">' + (h.streak ? "🔥 " + h.streak : "best " + h.best) + "</div>" +
    "</div>" + heatmap(h.days) + "</section>"
  ).join("");

  const lines = s.summary.split("\\n");
  $("#weektitle").textContent = lines[0];
  $("#summary").innerHTML = lines.slice(1).map((l, i, a) => {
    const m = l.match(/^(.*?)(?: \\((.*?)\\))?: (.*)$/);
    return i === a.length - 1 ? '<div class="total"><span>' + esc(l) + "</span></div>"
      : m ? "<div><span>" + esc(m[1]) + (m[2] ? '<small>' + esc(m[2]) + "</small>" : "") + '</span><span class="val">' + esc(m[3]) + "</span></div>"
      : "<div>" + esc(l) + "</div>";
  }).join("");

  const byId = Object.fromEntries(s.habits.map((h) => [h.id, h]));
  $("#recent").innerHTML = s.recent.length ? s.recent.map((t) => {
    const h = byId[t.habit] || { emoji: "•", name: t.habit };
    const d = new Date(t.ts).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "Europe/London" });
    const flag = t.status === "late" ? " · late" : t.status === "early" ? " · too early" : "";
    return "<li><span>" + h.emoji + '</span><span class="what">' + esc(h.name) + '<br><span class="tag">' + (t.source || "nfc") + flag +
      '</span></span><span class="when">' + d + " · " + t.time + '</span><button class="x" data-del="' + t.id + '" aria-label="Delete tap">✕</button></li>';
  }).join("") : '<li class="empty">No taps yet — tap a tag to start.</li>';
}

async function load() {
  const r = await fetch("/api/state", { credentials: "same-origin" });
  if (r.ok) render(await r.json());
}

document.addEventListener("click", async (e) => {
  const tog = e.target.closest("[data-toggle]"), del = e.target.closest("[data-del]");
  if (tog) {
    tog.classList.toggle("done");
    const r = await fetch("/api/toggle/" + tog.dataset.toggle, { method: "POST" });
    toast((await r.json()).msg || "Updated"); load();
  } else if (del) {
    if (!confirm("Delete this tap?")) return;
    await fetch("/api/taps/" + del.dataset.del, { method: "DELETE" });
    toast("Tap removed"); load();
  }
});
document.addEventListener("visibilitychange", () => document.visibilityState === "visible" && load());
load();
</script>
</body>
</html>`;
