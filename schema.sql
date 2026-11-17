CREATE TABLE IF NOT EXISTS taps (
  id     INTEGER PRIMARY KEY AUTOINCREMENT,
  habit  TEXT    NOT NULL,
  ts     INTEGER NOT NULL,   -- unix ms (UTC); day/status computed from config at read time
  source TEXT                -- 'nfc' | 'dashboard'
);
CREATE INDEX IF NOT EXISTS taps_ts ON taps (ts);
