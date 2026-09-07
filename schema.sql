-- 広島みらいプロジェクト: 管理画面(admin.html)から追加/編集/削除できるコンテンツ。
-- 活動紹介カードと、今後のスケジュール(カレンダー)の予定を管理する。

CREATE TABLE IF NOT EXISTS activities (
  id TEXT PRIMARY KEY,
  icon TEXT,
  role TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  href TEXT,
  link_label TEXT,
  accent TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- date は YYYY-MM-DD 形式(カレンダーの日付マッチに使用)。
CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  start_time TEXT,
  end_time TEXT,
  title TEXT NOT NULL,
  location TEXT,
  tag TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
