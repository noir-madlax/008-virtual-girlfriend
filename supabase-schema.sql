-- 008虚拟女友项目数据库表创建脚本
-- 在Supabase SQL编辑器中执行此脚本

-- 1. 用户画像表
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id BIGINT PRIMARY KEY,
  behavior_json TEXT DEFAULT '{}',
  occupation TEXT,
  active_hours TEXT DEFAULT '[]',
  avg_message_length REAL DEFAULT 0,
  initiative_rate REAL DEFAULT 0,
  mood_pattern TEXT DEFAULT '{}',
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 女友参数表
CREATE TABLE IF NOT EXISTS girlfriend_params (
  user_id BIGINT PRIMARY KEY,
  params_json TEXT DEFAULT '{}',
  evolution_stage TEXT DEFAULT 'learning',
  stability_score REAL DEFAULT 50,
  last_evolution TIMESTAMPTZ DEFAULT NOW(),
  next_evolution TIMESTAMPTZ DEFAULT NOW() + INTERVAL '1 day'
);

-- 3. 进化历史表
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

-- 4. 情景记忆表
CREATE TABLE IF NOT EXISTS episodic_memory (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  event TEXT NOT NULL,
  emotion REAL DEFAULT 0,
  her_emotion REAL DEFAULT 0,
  importance REAL DEFAULT 0.5,
  accessibility REAL DEFAULT 1.0,
  tags TEXT DEFAULT '[]',
  context TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_accessed TIMESTAMPTZ DEFAULT NOW()
);

-- 5. 消息表
CREATE TABLE IF NOT EXISTS messages (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  emotion_score REAL DEFAULT 0,
  quality_score REAL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_girlfriend_params_user_id ON girlfriend_params(user_id);
CREATE INDEX IF NOT EXISTS idx_evolution_history_user_id ON evolution_history(user_id);
CREATE INDEX IF NOT EXISTS idx_episodic_memory_user_id ON episodic_memory(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- 插入测试数据（可选）
INSERT INTO user_profiles (user_id, behavior_json, occupation, active_hours, avg_message_length, initiative_rate, mood_pattern)
VALUES (1, '{}', '测试用户', '[]', 0, 0, '{}')
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO girlfriend_params (user_id, params_json, evolution_stage, stability_score)
VALUES (1, '{}', 'learning', 50)
ON CONFLICT (user_id) DO NOTHING;