import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { generatePersona, UserAnswers } from '@/lib/persona';

// 创建用户（入学式）
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { nickname, answers } = body as {
      nickname: string;
      answers: UserAnswers;
    };

    if (!nickname || !answers) {
      return NextResponse.json({ error: '缺少参数' }, { status: 400 });
    }

    // 生成人格
    const persona = generatePersona(answers);

    // 创建用户
    const db = getDb();
    const result = db.prepare(`
      INSERT INTO users (nickname, stage, profile_json, persona_json)
      VALUES (?, 1, ?, ?)
    `).run(
      nickname,
      JSON.stringify(answers),
      JSON.stringify(persona)
    );

    const userId = result.lastInsertRowid;

    // 记录入学事件
    db.prepare(`
      INSERT INTO state_log (user_id, affinity, trust, conflict, mood, initiative, trigger_event)
      VALUES (?, 10, 15, 0, 0.2, 20, '入学式完成')
    `).run(userId);

    return NextResponse.json({
      userId,
      persona,
      message: `${persona.name}已经准备好认识你了。`,
    });
  } catch (error: any) {
    console.error('Create user error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 获取用户信息
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: '缺少 userId' }, { status: 400 });
  }

  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;

  if (!user) {
    return NextResponse.json({ error: '用户不存在' }, { status: 404 });
  }

  return NextResponse.json({
    id: user.id,
    nickname: user.nickname,
    stage: user.stage,
    state: {
      affinity: user.affinity,
      trust: user.trust,
      conflict: user.conflict,
      mood: user.mood,
      initiative: user.initiative,
    },
    persona: JSON.parse(user.persona_json || '{}'),
    createdAt: user.created_at,
  });
}
