/**
 * 记忆系统 (Memory System)
 * 
 * L1: 工作记忆 - 最近N条消息（在 context 中）
 * L2: 情景记忆 - Supabase 存储，带遗忘曲线
 */

import { supabase, getMessages } from './supabase-db';

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
export async function storeMemory(
  userId: number,
  event: string,
  emotion: number = 0,
  herEmotion: number = 0,
  importance: number = 0.5,
  tags: string[] = [],
  context: string = ''
): Promise<void> {
  const { error } = await supabase
    .from('episodic_memory')
    .insert({
      user_id: userId,
      event,
      emotion,
      her_emotion: herEmotion,
      importance,
      tags: JSON.stringify(tags),
      context,
      created_at: new Date().toISOString(),
      last_accessed: new Date().toISOString(),
    });
  
  if (error) {
    console.error('Error storing memory:', error);
    throw error;
  }
}

// 检索相关记忆（L2）
export async function retrieveMemories(
  userId: number,
  currentTopic: string,
  limit: number = 3
): Promise<EpisodicMemory[]> {
  const { data, error } = await supabase
    .from('episodic_memory')
    .select('*')
    .eq('user_id', userId)
    .gt('accessibility', 0.3)
    .order('importance', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error) {
    console.error('Error retrieving memories:', error);
    throw error;
  }
  
  return data.map(row => ({
    ...row,
    tags: JSON.parse(row.tags || '[]'),
  }));
}

// 获取最近的对话历史（L1 工作记忆）
export async function getRecentMessages(userId: number, limit: number = 20): Promise<any[]> {
  try {
    const messages = await getMessages(userId, limit);
    return messages.reverse();
  } catch (error) {
    console.error('Error getting recent messages:', error);
    return [];
  }
}

// 更新遗忘曲线（定时任务调用）
export async function updateDecay(): Promise<void> {
  // Ebbinghaus 遗忘: a(t) = S × e^(-t/τ)
  // 简化版：每天衰减一定比例
  const { error: updateError } = await supabase
    .from('episodic_memory')
    .update({ 
      accessibility: supabase.rpc('multiply', { 
        x: 'accessibility', 
        y: 0.95 
      }),
      last_accessed: new Date().toISOString(),
    })
    .gt('accessibility', 0.05);
  
  if (updateError) {
    console.error('Error updating decay:', updateError);
  }
  
  // 彻底遗忘
  const { error: deleteError } = await supabase
    .from('episodic_memory')
    .delete()
    .lt('accessibility', 0.05);
  
  if (deleteError) {
    console.error('Error deleting forgotten memories:', deleteError);
  }
}

// 提取用户画像（L3 语义记忆 - 简化版）
export async function getUserProfile(userId: number): Promise<Record<string, any>> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('profile_json')
    .eq('user_id', userId)
    .single();
  
  if (error && error.code !== 'PGRST116') {
    console.error('Error getting user profile:', error);
    return {};
  }
  
  if (!data) return {};
  
  try {
    return JSON.parse(data.profile_json || '{}');
  } catch {
    return {};
  }
}

// 更新用户画像
export async function updateUserProfile(userId: number, updates: Record<string, any>): Promise<void> {
  const current = await getUserProfile(userId);
  const merged = { ...current, ...updates };
  
  const { error } = await supabase
    .from('user_profiles')
    .upsert({
      user_id: userId,
      profile_json: JSON.stringify(merged),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });
  
  if (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
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
