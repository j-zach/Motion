# Motion: setup

Tap an NFC tag with your iPhone. A Shortcuts automation silently logs it to your Cloudflare app and shows a notification like **"🧘 Morning meditation ✓ 07:42 · 🔥 5 days"**.

## Your habits (edit in `src/config.js`)

| Tag URL path      | Habit              | Rule                                                |
|-------------------|--------------------|-----------------------------------------------------|
| `/tap/bed`        | 🛏️ In bed by 11:30  | On time 18:00–23:30. Taps after 23:30, up to 08:00 next morning, are logged as **late** for that night |
| `/tap/meditate`   | 🧘 Meditation       | Yes/no checkbox: any tap that day ticks it |

- All times are UK clock time and follow GMT ⇄ BST automatically. 23:30 always means 23:30 on your clock, including on the nights the clocks change.
- A late bedtime tap is still logged, so you keep the timestamp, but it breaks the streak. Bed taps before 18:00 are ignored.
- On the dashboard you can tick or untick any habit by tapping its circle. Tapping a tag never unticks.
- Repeat taps within 2 minutes are ignored.
- Rules are applied when your data is read, so if you change a rule, past days are re-scored too.

---

## 1. Deploy (one time, ~5 min)

All commands run in the project folder.

1. Log in to Cloudflare. This opens a browser, where you can sign up for a free account if needed:
   ```bash
   npx wrangler login
   ```
2. Create the database, then paste the printed `database_id` into `wrangler.toml`:
   ```bash
   npx wrangler d1 create habit-tags
   ```
3. Create the table:
   ```bash
   npm run db:remote
   ```
4. Generate a secret token. Save it in your password manager:
   ```bash
   openssl rand -hex 16
   ```
5. Store the token on Cloudflare, pasting it when prompted:
   ```bash
   npx wrangler secret put TOKEN
   ```
6. Deploy. Note the URL it prints, e.g. `https://habit-tags.<you>.workers.dev`:
   ```bash
   npm run deploy
   ```

Below, `APP` = the URL `npm run deploy` printed (e.g. `https://habit-tags.<you>.workers.dev`) and `TOKEN` = the contents of `.token`. Keep both private.

## 2. Dashboard on your home screen

Open `APP/?key=TOKEN` once in Safari. It sets a cookie and redirects to a clean URL. Then tap **Share → Add to Home Screen**.

## 3. One automation per tag

You **don't need to write anything onto the tags**, and you don't need NFC Tools. Every NFC tag has a permanent, factory-set serial number. When you scan a tag while creating the automation, iOS remembers that serial number and runs your shortcut whenever it sees that exact tag again. What the shortcut does lives on your phone; the tag is just a physical "button".

- Blank tags work as they come. If a tag was pre-written with a link, iOS may also show an "open link" banner. If that's annoying, that is the one case where you'd erase it (NFC Tools → Other → Erase tag).
- Tags stuck directly onto metal often won't read. Use on-metal tags, or put something non-metal in between.
- If you replace a tag, edit that automation and scan the new tag. The old tag stops working.

For each habit, in the **Shortcuts** app:

1. **Automation** tab → **+** → **NFC** → **Scan**, and hold the phone to the tag. Name it (e.g. "Bed tag").
2. Choose **Run Immediately**, and turn **off** "Notify When Run".
3. **New Blank Automation** → add the action **Get Contents of URL**:
   - URL: `APP/tap/bed` (or `/tap/meditate`)
   - Tap **Show More**: Method **POST**, then add a header with key `Authorization` and value `Bearer TOKEN`.
4. Add the action **Show Notification**, and set its text to the **Contents of URL** variable.

Tip: build the first automation, then for the others duplicate the actions and change only the URL.

> The phone has to be **unlocked** (Face ID awake) for NFC automations to run.

## 4. Undo a mistaken tap

Make a regular shortcut (not an automation) called **Undo habit tap**:
**Get Contents of URL** `APP/undo` (same `Authorization` header, method **POST**) → **Show Notification** (Contents of URL).

For the least friction, attach it to **Settings → Accessibility → Touch → Back Tap → Double Tap**, so a double-tap on the back of the phone undoes the last tap. You can also delete any tap with ✕ on the dashboard.

## 5. Weekly summary notification

**Automation → + → Time of Day** → **19:30**, **Weekly**, **Sunday** → Run Immediately →
**Get Contents of URL** `APP/summary` (method GET, with the header) → **Show Notification** (Contents of URL).

Shortcuts time automations follow your iPhone's clock, so 19:30 stays 19:30 London time across GMT/BST.

Each habit gets 7 slots (set with `when` in `src/config.js`):
- **Evening habits** (bedtime): the previous Sunday through yesterday, Saturday. Tonight's slots go into next week's recap.
- **Morning habits** (meditation): Monday through today, Sunday.

```
Weekly recap · Sun 22 Nov
🛏️ In bed by 11:30 (Sun–Sat): 6/7 (+1 late) · 🔥2
🧘 Meditation (Mon–Sun): 6/7 · 🔥5
86% overall — great week.
```

## Private habits

To track a habit without it appearing in this repo, put it in a git-ignored `private-habits.json`, using the same fields as `HABITS` in `src/config.js`:

```json
[{ "id": "example", "name": "Example habit", "emoji": "✨", "when": "evening" }]
```

Upload it as a Worker secret. It runs live like any other habit, at `APP/tap/<id>`:

```bash
npx wrangler secret put EXTRA_HABITS < private-habits.json
```

For local testing, add the same JSON to `.dev.vars` as `EXTRA_HABITS='[...]'`.

## Adding a habit later

Add a line to `HABITS` in `src/config.js`, run `npm run deploy`, and create one more NFC automation pointing at `/tap/<id>`.

## Local development

```bash
npm install
```
```bash
npm run db:local
```
```bash
npm run dev
```
Then open http://localhost:8787/?key=dev-token. The local token is set in `.dev.vars`.
