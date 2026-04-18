import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: '缺少 userId 参数' }, { status: 400 });
    }

    const db = getDb();

    // 获取用户画像
    const profileRow = db.prepare('SELECT * FROM user_profiles WHERE user_id = ?').get(userId) as any;
    let userProfile = null;
    if (profileRow) {
      try {
        userProfile = {
          behavior: JSON.parse(profileRow.behavior_json || '{}'),
          occupation: profileRow.occupation,
          activeHours: JSON.parse(profileRow.active_hours || '[]'),
          avgMessageLength: profileRow.avg_message_length,
          initiativeRate: profileRow.initiative_rate,
          moodPattern: JSON.parse(profileRow.mood_pattern || '{}'),
          lastUpdated: profileRow.last_updated,
        };
      } catch (e) {
        console.error('Failed to parse user profile:', e);
      }
    }

    // 获取女友参数
    const paramsRow = db.prepare('SELECT * FROM girlfriend_params WHERE user_id = ?').get(userId) as any;
    let girlfriendParams = null;
    if (paramsRow) {
      try {
        girlfriendParams = {
          params: JSON.parse(paramsRow.params_json || '{}'),
          evolutionStage: paramsRow.evolution_stage,
          stabilityScore: paramsRow.stability_score,
          lastEvolution: paramsRow.last_evolution,
          nextEvolution: paramsRow.next_evolution,
        };
      } catch (e) {
        console.error('Failed to parse girlfriend params:', e);
      }
    }

    // 获取进化历史
    const historyRows = db.prepare(`
      SELECT * FROM evolution_history 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT 10
    `).all(userId) as any[];

    const evolutionHistory = historyRows.map(row => ({
      id: row.id,
      parameter: row.parameter,
      oldValue: JSON.parse(row.old_value || 'null'),
      newValue: JSON.parse(row.new_value || 'null'),
      reason: row.reason,
      confidence: row.confidence,
      createdAt: row.created_at,
    }));

    return NextResponse.json({
      userProfile,
      girlfriendParams,
      evolutionHistory,
    });
  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}