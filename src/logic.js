import { TIMEZONE, HABITS } from "./config.js";

// Active habit list = public HABITS + any private ones from the EXTRA_HABITS secret (see index.js).
let ACTIVE = HABITS;
export const setHabits = (list) => { ACTIVE = list; };
export const activeHabits = () => ACTIVE;

const fmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIMEZONE, year: "numeric", month: "2-digit", day: "2-digit",
  hour: "2-digit", minute: "2-digit", hourCycle: "h23",
});

const toMin = (hhmm) => { const [h, m] = hhmm.split(":").map(Number); return h * 60 + m; };
export const minToHHMM = (m) => `${String(Math.floor(m / 60) % 24).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

export function addDays(day, n) {
  const d = new Date(day + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Local date + minute-of-day for a timestamp. */
export function local(ts) {
  const p = Object.fromEntries(fmt.formatToParts(new Date(ts)).map((x) => [x.type, x.value]));
  return { day: `${p.year}-${p.month}-${p.day}`, min: Number(p.hour) * 60 + Number(p.minute) };
}

export const habitById = (id) => ACTIVE.find((h) => h.id === id);

/**
 * Which habit-day a timestamp belongs to, and its "extended" minute
 * (taps before rollover become 24:00+ of the previous day, e.g. 00:40 → 24:40).
 */
export function place(habit, ts) {
  let { day, min } = local(ts);
  if (habit.rollover && min < toMin(habit.rollover)) { day = addDays(day, -1); min += 1440; }
  return { day, min };
}

/** 'ok' | 'late' | 'early' for a single tap. */
export function tapStatus(habit, ts) {
  const { min } = place(habit, ts);
  const roll = habit.rollover ? toMin(habit.rollover) : 0;
  if (habit.start && min < toMin(habit.start) && min >= roll) return "early";
  if (habit.deadline) {
    let dl = toMin(habit.deadline);
    if (habit.rollover && dl < roll) dl += 1440;
    if (min > dl) return "late";
  }
  return "ok";
}

export const isCheck = (h) => !h.start && !h.deadline; // yes/no checkbox (may still have a rollover)
const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const dow = (day) => DOW[new Date(day + "T12:00:00Z").getUTCDay()];

export function ruleText(h) {
  if (isCheck(h)) return h.rollover ? `Daily · before ${h.rollover} counts for the night before` : "Daily · any time";
  const parts = [];
  if (h.start && h.deadline) parts.push(`between ${h.start} and ${h.deadline}`);
  else if (h.start) parts.push(`after ${h.start}`);
  else if (h.deadline) parts.push(`by ${h.deadline}`);
  else parts.push("any time");
  if (h.rollover) parts.push(`taps before ${h.rollover} count for the night before`);
  return parts.join(" · ");
}

/** Is the current habit-day's window already over (so no tap = missed)? */
function windowClosed(habit, nowMin) {
  if (!habit.deadline) return false;
  let dl = toMin(habit.deadline);
  if (habit.rollover && dl < toMin(habit.rollover)) dl += 1440;
  return nowMin > dl;
}

/**
 * Build per-habit stats from all taps.
 * Day status: done | late (tapped, but outside window) | missed | pending (today, still open) | none (before tracking began)
 */
export function computeStats(taps, now = Date.now(), daysBack = 140) {
  return ACTIVE.map((h) => {
    const mine = taps.filter((t) => t.habit === h.id);
    const byDay = {};
    for (const t of mine) {
      const { day } = place(h, t.ts);
      const s = tapStatus(h, t.ts);
      if (s === "early") continue; // logged, but neither counts nor penalises; window may still be open
      const cur = byDay[day];
      if (cur !== "done") byDay[day] = s === "ok" ? "done" : "late";
    }
    const { day: today, min: nowMin } = place(h, now);
    const first = mine.length ? place(h, Math.min(...mine.map((t) => t.ts))).day : addDays(today, 1); // no taps → nothing tracked yet

    const statusOf = (day) => {
      if (byDay[day]) return byDay[day];
      if (day < first) return "none";
      if (day === today) return windowClosed(h, nowMin) ? "missed" : "pending";
      return "missed";
    };

    // current streak: today counts if done; if today is still open, start from yesterday
    let streak = 0, d = today;
    if (statusOf(d) === "pending") d = addDays(d, -1);
    while (d >= first && statusOf(d) === "done") { streak++; d = addDays(d, -1); }

    // best streak
    let best = 0, run = 0;
    for (let x = first; x <= today; x = addDays(x, 1)) {
      if (statusOf(x) === "done") { run++; best = Math.max(best, run); } else if (statusOf(x) !== "pending") run = 0;
    }

    const days = {};
    for (let i = daysBack - 1; i >= 0; i--) { const x = addDays(today, -i); days[x] = statusOf(x); }

    return { ...h, rule: ruleText(h), today, todayStatus: statusOf(today), streak, best, days, statusOf };
  });
}

/**
 * Plain-text weekly recap: 7 slots per habit.
 *   evening habits → the 7 days ending yesterday (run on Sunday → previous Sun … Sat)
 *   morning habits → the 7 days ending today     (run on Sunday → Mon … Sun)
 * A slot that is still open (e.g. today's meditation not done yet) is shown as not done.
 */
export function weeklySummary(taps, now = Date.now()) {
  const stats = computeStats(taps, now);
  const today = local(now).day;
  const pretty = (d) => new Date(d + "T12:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
  const lines = [`Weekly recap · ${dow(today)} ${pretty(today)}`];
  let total = 0, possible = 0;
  for (const s of stats) {
    const end = s.when === "evening" ? addDays(today, -1) : today;
    const start = addDays(end, -6);
    let done = 0, late = 0, tracked = 0;
    for (let d = start; d <= end; d = addDays(d, 1)) {
      const st = s.statusOf(d);
      if (st !== "none") tracked++;
      if (st === "done") done++; else if (st === "late") late++;
    }
    const label = `${s.emoji} ${s.name} (${dow(start)}–${dow(end)})`;
    total += done; possible += tracked;
    if (!tracked) { lines.push(`${label}: not started yet`); continue; }
    lines.push(`${label}: ${done}/${tracked}${late ? ` (+${late} late)` : ""}${s.streak ? ` · 🔥${s.streak}` : ""}`);
  }
  if (!possible) { lines.push("No data yet — tap a tag to start."); return lines.join("\n"); }
  const pct = Math.round((total / possible) * 100);
  lines.push(pct >= 85 ? `${pct}% overall — great week.` : pct >= 60 ? `${pct}% overall.` : `${pct}% overall — fresh start this week.`);
  return lines.join("\n");
}
