// ─── Edit your habits here, then `npm run deploy`. ───────────────────────────
// Rules are applied when data is read, so changing a rule re-scores past taps too.
//
//   id        used in the tap URL:  /tap/<id>
//   No times  → a simple daily yes/no checkbox (any tap that calendar day ticks it).
//   rollover  taps before this time count toward the PREVIOUS day (for night habits)
//   start     earliest time a tap counts
//   deadline  latest on-time tap; later taps are logged but scored "late"
//
//   when      "evening" → weekly summary covers the 7 days ending YESTERDAY (Sun run → Sun–Sat)
//             "morning" → weekly summary covers the 7 days ending TODAY     (Sun run → Mon–Sun)
//
// Times are 24h "HH:MM" UK wall-clock time. TIMEZONE is an IANA zone, so the
// GMT ⇄ BST clock changes are handled automatically — 23:30 always means 23:30 on your clock.

export const TIMEZONE = "Europe/London";

// Private habits: anything you'd rather not publish can go in the EXTRA_HABITS
// Worker secret instead, as a JSON array of the same objects. They're added after these:
//   npx wrangler secret put EXTRA_HABITS < private-habits.json
// (private-habits.json and .dev.vars are git-ignored.)

export const HABITS = [
  { id: "bed",      name: "In bed by 11:30", emoji: "🛏️", when: "evening", rollover: "08:00", start: "18:00", deadline: "23:30" },
  { id: "meditate", name: "Meditation",      emoji: "🧘", when: "morning" },
];
