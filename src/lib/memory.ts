/**
 * 记忆系统 (Memory System)
 * 
 * L1: 工作记忆 - 最近N条消息（在 context 中）
 * L2: 情景记忆 - SQLite 存储，带遗忘曲线
 */

import { getDb } from './db';

export interface EpisodicMemory {
  id: number;
  userId: number;
  event: string;
  emotion: number;
  herEmotion: number;
  importance: number;
  accessibility: number;
  tags: string[];
  context: string;
  createdAt: string;
  lastAccessed: string;
}

// 从对话中提取关键事件并存储
export function storeMemory(
  userId: number,
  event: string,
  emotion: number = 0,
  herEmotion: number = 0,
  importance: number = 0.5,
  tags: string[] = [],
  context: string = ''
): void {
  const db = getDb();
  db.prepare(`
    INSERT INTO episodic_memory (user_id, event, emotion, her_emotion, importance, tags, context)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(userId, event, emotion, herEmotion, importance, JSON.stringify(tags), context);
}

// 检索相关记忆（L2）
export function retrieveMemories(
  userId: number,
  currentTopic: string,
  limit: number = 3
): EpisodicMemory[] {
  const db = getDb();

  // 简单实现：按重要性和可访问性排序，取最近的
  // 后续可以用向量检索
  const rows = db.prepare(`
    SELECT * FROM episodic_memory
    WHERE user_id = ? AND accessibility > 0.3
    ORDER BY importance DESC, created_at DESC
    LIMIT ?
  `).all(userId, limit) as any[];

  return rows.map(row => ({
    ...row,
    tags: JSON.parse(row.tags || '[]'),
  }));
}

// 获取最近的对话历史（L1 工作记忆）
export function getRecentMessages(userId: number, limit: number = 20): any[] {
  const db = getDb();
  return db.prepare(`
    SELECT role, content, created_at
    FROM messages
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT ?
  `).all(userId, limit).reverse();
}

// 更新遗忘曲线（定时任务调用）
export function updateDecay(): void {
  const db = getDb();

  // Ebbinghaus 遗忘: a(t) = S × e^(-t/τ)
  // 简化版：每天衰减一定比例
  db.prepare(`
    UPDATE episodic_memory
    SET accessibility = accessibility * 0.95,
        last_accessed = datetime('now')
    WHERE accessibility > 0.05
  `).run();

  // 彻底遗忘
  db.prepare(`
    DELETE FROM episodic_memory
    WHERE accessibility < 0.05
  `).run();
}

// 提取用户画像（L3 语义记忆 - 简化版）
export function getUserProfile(userId: number): Record<string, any> {
  const db = getDb();
  const user = db.prepare(`SELECT profile_json FROM users WHERE id = ?`).get(userId) as any;
  if (!user) return {};
  try {
    return JSON.parse(user.profile_json || '{}');
  } catch {
    return {};
  }
}

// 更新用户画像
export function updateUserProfile(userId: number, updates: Record<string, any>): void {
  const db = getDb();
  const current = getUserProfile(userId);
  const merged = { ...current, ...updates };
  db.prepare(`UPDATE users SET profile_json = ? WHERE id = ?`).run(
    JSON.stringify(merged),
    userId
  );
}

// 格式化记忆注入 context
export function formatMemoriesForContext(memories: EpisodicMemory[]): string {
  if (memories.length === 0) return '';

  const lines = memories.map(m => {
    const date = new Date(m.createdAt).toLocaleDateString('zh-CN');
    return `- ${m.event}（${date}）`;
  });

  return `\n## 你记得的事\n${lines.join('\n')}\n`;
}
