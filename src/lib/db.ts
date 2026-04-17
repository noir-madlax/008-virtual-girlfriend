import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'girlfriend.db');

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    const fs = require('fs');
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initSchema(db);
  }
  return db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    -- 用户表
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nickname TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      stage INTEGER DEFAULT 0,
      -- 情感状态
      affinity REAL DEFAULT 10,
      trust REAL DEFAULT 15,
      conflict REAL DEFAULT 0,
      mood REAL DEFAULT 0.2,
      initiative REAL DEFAULT 20,
      -- 画像
      profile_json TEXT DEFAULT '{}',
      persona_json TEXT DEFAULT '{}'
    );

    -- 对话消息
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('user', 'assistant', 'system')),
      content TEXT NOT NULL,
      emotion_score REAL DEFAULT 0,
      quality_score REAL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    -- 情景记忆 (L2)
    CREATE TABLE IF NOT EXISTS episodic_memory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      event TEXT NOT NULL,
      emotion REAL DEFAULT 0,
      her_emotion REAL DEFAULT 0,
      importance REAL DEFAULT 0.5,
      accessibility REAL DEFAULT 1.0,
      tags TEXT DEFAULT '[]',
      context TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      last_accessed TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    -- 状态变更日志
    CREATE TABLE IF NOT EXISTS state_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      affinity REAL,
      trust REAL,
      conflict REAL,
      mood REAL,
      initiative REAL,
      trigger_event TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);
}
