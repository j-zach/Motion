# Motion

Frictionless habit tracking with NFC tags. Stick a tag where the habit happens, tap your iPhone on it, and get a notification back:

> 🧘 Meditation ✓ · 🔥 5 days

No app to open, nothing to type. An iPhone Shortcuts automation sends the tap to a small Cloudflare Worker, which stores it and replies with your streak. A glass-style dashboard shows streaks, a calendar heatmap per habit and a weekly recap.

## How it works

```
NFC tag ──tap──▶ iPhone Shortcuts automation ──POST /tap/<habit>──▶ Cloudflare Worker ──▶ D1 (SQLite)
                         ▲                                                │
                         └──────────── "✓ · 🔥 5 days" notification ◀─────┘
```

- **Nothing is written to the tags.** iOS recognises each tag by its factory serial number, so blank tags work as they come.
- **Only timestamps are stored.** Rules are applied when data is read, so editing a rule re-scores past days too.
- **UK time throughout** (`Europe/London`). GMT ⇄ BST changes are handled automatically, so 23:30 always means 23:30 on the clock.

## Habits

Configured in [`src/config.js`](src/config.js):

| Habit | Type | Rule | Weekly recap slots |
|---|---|---|---|
| 🛏️ In bed by 11:30 | Timed | On time 18:00–23:30. Taps up to 08:00 count as **late** for the previous night. Earlier taps are ignored | Sun–Sat |
| 🧘 Meditation | Yes/no | Any tap that day | Mon–Sun |

Habit options:

| Key | Meaning |
|---|---|
| `id` | Used in the tap URL, `/tap/<id>` |
| `when` | `"evening"`: the recap covers the 7 days ending yesterday. `"morning"`: the 7 days ending today |
| `rollover` | Taps before this time count toward the previous day |
| `start` / `deadline` | Optional on-time window. With neither set, the habit is a simple daily checkbox |

**Private habits:** habits you'd rather not publish can go in the `EXTRA_HABITS` Worker secret (a JSON array of the same objects) instead of `config.js`. They run on your Worker but never appear in the repo. See [SETUP.md](SETUP.md#private-habits).

A late tap is still logged with its time, but it breaks the streak. Repeat taps within 2 minutes are ignored, and tapping a tag never unticks a habit.

## Features

- **Tap confirmation:** plain-text reply shown as an iOS notification.
- **Dashboard** (add it to your home screen): today's checkboxes with a progress bar, current and best streaks, a 15-week heatmap per habit, a rolling weekly recap, and recent taps with delete. Light and dark mode.
- **Undo:** `POST /undo` removes the most recent tap. It works well on Back Tap (double-tap the back of the phone).
- **Weekly recap:** a Shortcuts time automation fetches `/summary` every Sunday at 19:30.

## API

Every request needs the secret token, sent as an `Authorization: Bearer <token>` header (Shortcuts) or as the dashboard cookie, which is set once by opening `/?key=<token>`. `?key=` is accepted only for that sign-in. Requests that change data must be `POST`/`DELETE`, and browser requests from other sites are rejected.

| Method | Path | Returns |
|---|---|---|
| `POST` | `/tap/<habit>` | Logs a tap and returns the notification text (`?format=json` for JSON) |
| `POST` | `/undo` | Deletes the most recent tap |
| `GET` | `/summary` | Plain-text weekly recap |
| `GET` | `/` | Dashboard (`/?key=…` once to set the login cookie) |
| `GET` | `/api/state` | Dashboard data as JSON |
| `POST` | `/api/toggle/<habit>` | Ticks or unticks a habit for the current day |
| `DELETE` | `/api/taps/<id>` | Deletes one tap |

## Project structure

```
src/
  config.js      habits, rules and timezone (the file you edit)
  logic.js       day placement, scoring, streaks, weekly recap
  index.js       Worker routes and auth
  dashboard.js   dashboard page (HTML/CSS/JS, served inline)
schema.sql       D1 table
wrangler.toml    Cloudflare Worker + D1 config
SETUP.md         step-by-step deploy and iPhone Shortcuts guide
```

## Setup

See **[SETUP.md](SETUP.md)** for the full walkthrough: deploying to Cloudflare, generating the token, and creating the NFC, undo and weekly-summary automations on your iPhone.

Run these once:

```bash
npm install
npx wrangler login
npx wrangler d1 create habit-tags
npm run db:remote
openssl rand -hex 16 | tr -d '\n' > .token
npx wrangler secret put TOKEN < .token
npm run deploy
```

- After `wrangler d1 create`, put the `database_id` it prints into `wrangler.toml`.
- `npm run db:remote` creates the table.
- `.token` is git-ignored. Keep it safe, since it unlocks your data.

## Changing habits

1. Edit `src/config.js`.
2. Run `npm run deploy`.
3. For a new habit, create one more NFC automation pointing at `/tap/<id>`.

> The Cloudflare Worker and D1 database are named `habit-tags`. Renaming the Worker would change its URL and break existing Shortcuts.

## Local development

```bash
npm run db:local
npm run dev
```

Then open http://localhost:8787/?key=dev-token. The local token lives in `.dev.vars`, which is git-ignored.
