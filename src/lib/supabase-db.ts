import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 数据库操作封装
export async function query(table: string, options: {
  select?: string;
  where?: Record<string, any>;
  orderBy?: { column: string; ascending?: boolean };
  limit?: number;
  offset?: number;
} = {}) {
  let query = supabase.from(table).select(options.select || '*');
  
  if (options.where) {
    for (const [key, value] of Object.entries(options.where)) {
      query = query.eq(key, value);
    }
  }
  
  if (options.orderBy) {
    query = query.order(options.orderBy.column, { 
      ascending: options.orderBy.ascending ?? true 
    });
  }
  
  if (options.limit) {
    query = query.limit(options.limit);
  }
  
  if (options.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error(`Query error on ${table}:`, error);
    throw error;
  }
  
  return data;
}

export async function insert(table: string, data: Record<string, any>) {
  const { data: result, error } = await supabase
    .from(table)
    .insert(data)
    .select();
  
  if (error) {
    console.error(`Insert error on ${table}:`, error);
    throw error;
  }
  
  return result?.[0];
}

export async function update(table: string, data: Record<string, any>, where: Record<string, any>) {
  let query = supabase.from(table).update(data);
  
  for (const [key, value] of Object.entries(where)) {
    query = query.eq(key, value);
  }
  
  const { data: result, error } = await query.select();
  
  if (error) {
    console.error(`Update error on ${table}:`, error);
    throw error;
  }
  
  return result?.[0];
}

export async function upsert(table: string, data: Record<string, any>, onConflict?: string) {
  const { data: result, error } = await supabase
    .from(table)
    .upsert(data, { onConflict })
    .select();
  
  if (error) {
    console.error(`Upsert error on ${table}:`, error);
    throw error;
  }
  
  return result?.[0];
}

export async function remove(table: string, where: Record<string, any>) {
  let query = supabase.from(table).delete();
  
  for (const [key, value] of Object.entries(where)) {
    query = query.eq(key, value);
  }
  
  const { error } = await query;
  
  if (error) {
    console.error(`Delete error on ${table}:`, error);
    throw error;
  }
  
  return true;
}

// 具体的数据操作函数
export async function getUserProfile(userId: number) {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
    console.error('Error getting user profile:', error);
    throw error;
  }
  
  return data;
}

export async function updateUserProfile(userId: number, profileData: any) {
  const { data, error } = await supabase
    .from('user_profiles')
    .upsert({
      user_id: userId,
      ...profileData,
      last_updated: new Date().toISOString(),
    }, { onConflict: 'user_id' })
    .select()
    .single();
  
  if (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
  
  return data;
}

export async function getGirlfriendParams(userId: number) {
  const { data, error } = await supabase
    .from('girlfriend_params')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  if (error && error.code !== 'PGRST116') {
    console.error('Error getting girlfriend params:', error);
    throw error;
  }
  
  return data;
}

export async function updateGirlfriendParams(userId: number, paramsData: any) {
  const { data, error } = await supabase
    .from('girlfriend_params')
    .upsert({
      user_id: userId,
      ...paramsData,
      last_evolution: new Date().toISOString(),
    }, { onConflict: 'user_id' })
    .select()
    .single();
  
  if (error) {
    console.error('Error updating girlfriend params:', error);
    throw error;
  }
  
  return data;
}

export async function saveEvolutionHistory(userId: number, evolutionData: any) {
  const { data, error } = await supabase
    .from('evolution_history')
    .insert({
      user_id: userId,
      ...evolutionData,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error saving evolution history:', error);
    throw error;
  }
  
  return data;
}

export async function getEvolutionHistory(userId: number, limit = 10) {
  const { data, error } = await supabase
    .from('evolution_history')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error) {
    console.error('Error getting evolution history:', error);
    throw error;
  }
  
  return data;
}

export async function saveMessage(userId: number, role: string, content: string, emotionScore = 0, qualityScore = 0) {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      user_id: userId,
      role,
      content,
      emotion_score: emotionScore,
      quality_score: qualityScore,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error saving message:', error);
    throw error;
  }
  
  return data;
}

export async function getMessages(userId: number, limit = 50) {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(limit);
  
  if (error) {
    console.error('Error getting messages:', error);
    throw error;
  }
  
  return data;
}