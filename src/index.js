import { HABITS } from "./config.js";
import { setHabits, activeHabits, habitById, computeStats, tapStatus, place, local, minToHHMM, weeklySummary, isCheck } from "./logic.js";
import { DASHBOARD_HTML } from "./dashboard.js";

const text = (body, status = 200) =>
  new Response(body, { status, headers: { "content-type": "text/plain; charset=utf-8" } });
const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

// Auth: `Authorization: Bearer <token>` (Shortcuts) or the dashboard cookie.
// `?key=` is only accepted on the one-time dashboard sign-in (allowQuery), so the
// token never needs to sit in URLs, browser history or logs.
function authed(req, env, url, allowQuery = false) {
  if (!env.TOKEN) return false;
  const h = req.headers.get("authorization") || "";
  const cookie = (req.headers.get("cookie") || "").match(/(?:^|;\s*)key=([^;]+)/);
  const given = h.replace(/^Bearer\s+/i, "") || (allowQuery && url.searchParams.get("key")) || (cookie && decodeURIComponent(cookie[1])) || "";
  if (given.length !== env.TOKEN.length) return false;
  let diff = 0;
  for (let i = 0; i < given.length; i++) diff |= given.charCodeAt(i) ^ env.TOKEN.charCodeAt(i);
  return diff === 0;
}

// Private habits live in the EXTRA_HABITS secret (a JSON array, same shape as HABITS),
// so they run on your Worker without ever appearing in the repo.
function loadHabits(env) {
  let extra = [];
  try { extra = env.EXTRA_HABITS ? JSON.parse(env.EXTRA_HABITS) : []; } catch { extra = []; }
  if (!Array.isArray(extra)) extra = [];
  const ok = extra.filter((h) => h && typeof h.id === "string" && /^[\w-]+$/.test(h.id) && typeof h.name === "string" && !HABITS.some((x) => x.id === h.id));
  setHabits([...HABITS, ...ok]);
}

const allTaps = async (env) => (await env.DB.prepare("SELECT id, habit, ts, source FROM taps ORDER BY ts").all()).results;
const hhmm = (ts) => minToHHMM(local(ts).min);

async function logTap(env, habit, source) {
  const now = Date.now();
  const taps = await allTaps(env);
  const { day } = place(habit, now);
  const recent = taps.find((t) => t.habit === habit.id && now - t.ts < 2 * 60 * 1000);
  if (recent) return { msg: `${habit.emoji} ${habit.name} already logged just now (${hhmm(recent.ts)})`, duplicate: true };
  const already = taps.find((t) => t.habit === habit.id && place(habit, t.ts).day === day && tapStatus(habit, t.ts) === "ok");
  if (already) {
    const s = computeStats(taps, now).find((x) => x.id === habit.id);
    return { msg: `${habit.emoji} ${habit.name} already ticked today ✓ · 🔥 ${s.streak}`, duplicate: true };
  }
  await env.DB.prepare("INSERT INTO taps (habit, ts, source) VALUES (?, ?, ?)").bind(habit.id, now, source).run();
  taps.push({ habit: habit.id, ts: now });
  const s = computeStats(taps, now).find((x) => x.id === habit.id);
  const st = tapStatus(habit, now);
  const t = hhmm(now);
  let msg;
  const days = `🔥 ${s.streak} day${s.streak === 1 ? "" : "s"}`;
  if (isCheck(habit)) msg = `${habit.emoji} ${habit.name} ✓ · ${days}`;
  else if (st === "ok") msg = `${habit.emoji} ${habit.name} ✓ ${t} · ${days}`;
  else if (st === "late") msg = `${habit.emoji} ${habit.name} logged at ${t}, after the ${habit.deadline} cutoff, so it counts as missed. Tomorrow's a fresh start.`;
  else msg = `${habit.emoji} ${habit.name} logged at ${t}, before ${habit.start}, so it won't count. Tap again later.`;
  return { msg, status: st };
}

export default {
  async fetch(req, env) {
    loadHabits(env);
    const url = new URL(req.url);
    const path = url.pathname.replace(/\/+$/, "") || "/";

    // Secret-link login: /?key=XXX sets a long-lived cookie, then redirects to a clean URL.
    if (path === "/" && url.searchParams.get("key") && authed(req, env, url, true)) {
      return new Response(null, {
        status: 302,
        headers: {
          location: "/",
          "set-cookie": `key=${encodeURIComponent(url.searchParams.get("key"))}; Path=/; Max-Age=31536000; HttpOnly; Secure; SameSite=Lax`,
        },
      });
    }
    if (!authed(req, env, url)) {
      return path === "/"
        ? new Response("Open your secret link (…/?key=YOUR_TOKEN) to view the dashboard.", { status: 401 })
        : text("Unauthorized", 401);
    }

    // Anything that changes data must be POST/DELETE, and browser requests must come from this site.
    const mutating = /^\/(tap\/|undo$|api\/toggle\/|api\/taps\/)/.test(path);
    if (mutating) {
      if (req.method !== "POST" && req.method !== "DELETE") {
        return new Response("Use POST", { status: 405, headers: { allow: "POST" } });
      }
      const origin = req.headers.get("origin");
      if (origin && origin !== url.origin) return text("Forbidden", 403);
    }

    if (path === "/") return new Response(DASHBOARD_HTML, { headers: { "content-type": "text/html; charset=utf-8" } });

    // NFC tap: GET or POST /tap/<habit>  → plain text for a Shortcuts notification
    const tap = path.match(/^\/tap\/([\w-]+)$/);
    if (tap) {
      const habit = habitById(tap[1]);
      if (!habit) return text(`Unknown habit "${tap[1]}". Known: ${activeHabits().map((h) => h.id).join(", ")}`, 404);
      const r = await logTap(env, habit, url.searchParams.get("src") || "nfc");
      return url.searchParams.get("format") === "json" ? json(r) : text(r.msg);
    }

    // Undo the most recent tap (for an "Undo last tap" shortcut)
    if (path === "/undo") {
      const last = await env.DB.prepare("SELECT id, habit, ts FROM taps ORDER BY ts DESC LIMIT 1").first();
      if (!last) return text("Nothing to undo.");
      await env.DB.prepare("DELETE FROM taps WHERE id = ?").bind(last.id).run();
      const h = habitById(last.habit);
      return text(`↩︎ Removed ${h ? h.emoji + " " + h.name : last.habit} (${hhmm(last.ts)})`);
    }

    if (path === "/summary") return text(weeklySummary(await allTaps(env)));

    // Dashboard checkbox: tick → log now; untick → remove that habit's taps for its current day
    const tog = path.match(/^\/api\/toggle\/([\w-]+)$/);
    if (tog && req.method === "POST") {
      const habit = habitById(tog[1]);
      if (!habit) return json({ error: "unknown habit" }, 404);
      const now = Date.now(), { day } = place(habit, now);
      const todays = (await allTaps(env)).filter((t) => t.habit === habit.id && place(habit, t.ts).day === day);
      if (todays.length) {
        await env.DB.batch(todays.map((t) => env.DB.prepare("DELETE FROM taps WHERE id = ?").bind(t.id)));
        return json({ msg: `${habit.emoji} ${habit.name} unticked` });
      }
      return json(await logTap(env, habit, "dashboard"));
    }

    if (path === "/api/state") {
      const taps = await allTaps(env);
      const stats = computeStats(taps).map(({ statusOf, ...rest }) => {
        const todays = taps.filter((t) => t.habit === rest.id && place(rest, t.ts).day === rest.today);
        const pick = todays.find((t) => tapStatus(rest, t.ts) === "ok") || todays[todays.length - 1];
        return { ...rest, check: isCheck(rest), todayTime: pick ? hhmm(pick.ts) : null, todayTap: pick ? tapStatus(rest, pick.ts) : null };
      });
      const recent = taps.slice(-25).reverse().map((t) => {
        const h = habitById(t.habit);
        return {
          id: t.id, habit: t.habit, ts: t.ts, source: t.source,
          day: h ? place(h, t.ts).day : local(t.ts).day,
          time: hhmm(t.ts), status: h ? tapStatus(h, t.ts) : "ok",
        };
      });
      return json({ habits: stats, recent, summary: weeklySummary(taps) });
    }

    const del = path.match(/^\/api\/taps\/(\d+)$/);
    if (del && req.method === "DELETE") {
      await env.DB.prepare("DELETE FROM taps WHERE id = ?").bind(Number(del[1])).run();
      return json({ ok: true });
    }

    return text("Not found", 404);
  },
};
