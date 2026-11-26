-- 聖經大地圖・牧區多人線上版 (Cloudflare D1 / SQLite Schema)

CREATE TABLE IF NOT EXISTS groups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  weekly_target_per_member INTEGER NOT NULL DEFAULT 350,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  phone TEXT NOT NULL UNIQUE,
  pin_salt TEXT NOT NULL,
  pin_hash TEXT NOT NULL,
  nickname TEXT NOT NULL,
  group_id INTEGER NOT NULL REFERENCES groups(id),
  role TEXT NOT NULL DEFAULT 'member',
  start_date TEXT NOT NULL,
  church_name TEXT NOT NULL DEFAULT '安平靈糧堂',
  read_chapters_json TEXT NOT NULL DEFAULT '{}',
  grace_days_json TEXT NOT NULL DEFAULT '{}',
  garden_items_json TEXT NOT NULL DEFAULT '[]',
  plucked_count INTEGER NOT NULL DEFAULT 0,
  water_energy INTEGER NOT NULL DEFAULT 0,
  verses_read INTEGER NOT NULL DEFAULT 0,
  chapters_read INTEGER NOT NULL DEFAULT 0,
  books_completed INTEGER NOT NULL DEFAULT 0,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_read_date TEXT,
  last_active_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS garden_interactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  from_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  group_id INTEGER NOT NULL REFERENCES groups(id),
  kind TEXT NOT NULL,
  message TEXT NOT NULL DEFAULT '',
  day_iso TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS reflections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  group_id INTEGER NOT NULL REFERENCES groups(id),
  date_iso TEXT NOT NULL,
  mood TEXT NOT NULL DEFAULT '✨',
  verse TEXT NOT NULL DEFAULT '',
  note TEXT NOT NULL DEFAULT '',
  is_shared INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS reflection_reactions (
  reflection_id INTEGER NOT NULL REFERENCES reflections(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reaction TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (reflection_id, user_id, reaction)
);

CREATE TABLE IF NOT EXISTS weekly_reading_log (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  group_id INTEGER NOT NULL REFERENCES groups(id),
  week_key TEXT NOT NULL,
  verses_delta INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, week_key)
);

CREATE TABLE IF NOT EXISTS weekly_goal_claims (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  group_id INTEGER NOT NULL REFERENCES groups(id),
  week_key TEXT NOT NULL,
  claimed_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, week_key)
);

-- Indexes for fast group & pastoral dashboard queries
CREATE INDEX IF NOT EXISTS idx_users_group ON users(group_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_gi_to_user ON garden_interactions(to_user_id, id DESC);
CREATE INDEX IF NOT EXISTS idx_gi_from_day ON garden_interactions(from_user_id, kind, day_iso);
CREATE INDEX IF NOT EXISTS idx_reflections_group ON reflections(group_id, is_shared, id DESC);
CREATE INDEX IF NOT EXISTS idx_reflections_user ON reflections(user_id, id DESC);
CREATE INDEX IF NOT EXISTS idx_weekly_group ON weekly_reading_log(group_id, week_key);

-- Seed initial 7 pastoral zone small groups (idempotent; Zone Leader can add/rename anytime in Admin UI)
INSERT OR IGNORE INTO groups (name, sort_order) VALUES
  ('迦南', 1),
  ('讚美', 2),
  ('宇光', 3),
  ('何其美', 4),
  ('橄欖樹', 5),
  ('跨越', 6),
  ('五餅二魚', 7);
