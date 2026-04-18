-- 用户画像表
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id BIGINT PRIMARY KEY,
  behavior_json TEXT DEFAULT '{}',
  occupation TEXT,
  active_hours TEXT DEFAULT '[]',
  avg_message_length REAL DEFAULT 0,
  initiative_rate REAL DEFAULT 0,
  mood_pattern TEXT DEFAULT '{}',
  total_messages INTEGER DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- 女友参数表
CREATE TABLE IF NOT EXISTS girlfriend_params (
  user_id BIGINT PRIMARY KEY,
  params_json TEXT DEFAULT '{}',
  evolution_stage TEXT DEFAULT 'learning',
  stability_score REAL DEFAULT 50,
  last_evolution TIMESTAMPTZ DEFAULT NOW(),
  next_evolution TIMESTAMPTZ DEFAULT NOW() + INTERVAL '1 day'
);

-- 进化历史表
CREATE TABLE IF NOT EXISTS evolution_history (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  parameter TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  reason TEXT,
  confidence REAL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_girlfriend_params_user_id ON girlfriend_params(user_id);
CREATE INDEX IF NOT EXISTS idx_evolution_history_user_id ON evolution_history(user_id);
