import { NextRequest, NextResponse } from 'next/server';
import { getUserProfile, getGirlfriendParams, getEvolutionHistory } from '@/lib/supabase-db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: '缺少 userId 参数' }, { status: 400 });
    }

    const userIdNum = parseInt(userId);
    if (isNaN(userIdNum)) {
      return NextResponse.json({ error: 'userId 必须是数字' }, { status: 400 });
    }

    // 获取用户画像
    let userProfile = null;
    try {
      const profileData = await getUserProfile(userIdNum);
      if (profileData) {
        userProfile = {
          behavior: JSON.parse(profileData.behavior_json || '{}'),
          occupation: profileData.occupation,
          activeHours: JSON.parse(profileData.active_hours || '[]'),
          avgMessageLength: profileData.avg_message_length,
          initiativeRate: profileData.initiative_rate,
          moodPattern: JSON.parse(profileData.mood_pattern || '{}'),
          totalMessages: profileData.total_messages,
          lastUpdated: profileData.last_updated,
        };
      }
    } catch (e) {
      console.error('Failed to get user profile:', e);
    }

    // 获取女友参数
    let girlfriendParams = null;
    try {
      const paramsData = await getGirlfriendParams(userIdNum);
      if (paramsData) {
        girlfriendParams = {
          params: JSON.parse(paramsData.params_json || '{}'),
          evolutionStage: paramsData.evolution_stage,
          stabilityScore: paramsData.stability_score,
          lastEvolution: paramsData.last_evolution,
          nextEvolution: paramsData.next_evolution,
        };
      }
    } catch (e) {
      console.error('Failed to get girlfriend params:', e);
    }

    // 获取进化历史
    let evolutionHistory: any[] = [];
    try {
      const historyData = await getEvolutionHistory(userIdNum, 10);
      evolutionHistory = historyData.map((row: any) => ({
        id: row.id,
        parameter: row.parameter,
        oldValue: JSON.parse(row.old_value || 'null'),
        newValue: JSON.parse(row.new_value || 'null'),
        reason: row.reason,
        confidence: row.confidence,
        createdAt: row.created_at,
      }));
    } catch (e) {
      console.error('Failed to get evolution history:', e);
    }

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