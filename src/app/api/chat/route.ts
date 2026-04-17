import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import {
  updateState,
  calculateQuality,
  getMoodDescription,
  getInitiativeDescription,
  getConflictDescription,
  getStageBehaviorDescription,
  InteractionInput,
} from '@/lib/state-machine';
import { retrieveMemories, getRecentMessages, formatMemoriesForContext } from '@/lib/memory';
import { buildSystemPrompt, PersonaProfile } from '@/lib/persona';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = 'gemini-3.1-flash-lite-preview';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

// 使用 node-fetch + socks-proxy-agent 绕过代理限制
const fetch = require('node-fetch').default || require('node-fetch');
const { SocksProxyAgent } = require('socks-proxy-agent');
const proxyAgent = new SocksProxyAgent('socks5://127.0.0.1:12345');

// 调用 Gemini REST API
async function callGemini(systemPrompt: string, history: any[], message: string): Promise<string> {
  const contents = [
    ...history,
    { role: 'user', parts: [{ text: message }] },
  ];

  const body = {
    system_instruction: {
      parts: [{ text: systemPrompt }],
    },
    contents,
    generationConfig: {
      maxOutputTokens: 500,
      temperature: 0.8,
    },
  };

  const res = await fetch(GEMINI_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    agent: proxyAgent,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API ${res.status}: ${errText.slice(0, 200)}`);
  }

  const data = await res.json() as any;

  if (data.error) {
    throw new Error(`Gemini error: ${data.error.message}`);
  }

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('Gemini returned empty response');
  }

  return text;
}

// 发送消息
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, message } = body;

    if (!userId || !message) {
      return NextResponse.json({ error: '缺少参数' }, { status: 400 });
    }

    const db = getDb();

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;
    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    }

    const persona: PersonaProfile = JSON.parse(user.persona_json || '{}');

    // === 分析消息质量 ===
    const messageLength = message.length;
    const depth = Math.min(messageLength / 100, 1);
    const care = message.includes('你') || message.includes('怎么样') ? 0.6 : 0.2;
    const quality = calculateQuality({ responseTime: 0.5, depth, care });

    const input: InteractionInput = {
      quality,
      responseTime: 0.5,
      depth,
      care,
      isInitiative: true,
      hasConflict: false,
      hasRepair: false,
    };

    // === 更新情感状态 ===
    const currentState = {
      affinity: user.affinity,
      trust: user.trust,
      conflict: user.conflict,
      mood: user.mood,
      initiative: user.initiative,
      day: user.stage >= 1 ? Math.floor(
        (Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24)
      ) : 0,
      stage: user.stage,
    };

    const stateUpdate = updateState(currentState, input);

    const newAffinity = Math.max(0, Math.min(100, user.affinity + stateUpdate.affinityDelta));
    const newTrust = Math.max(0, Math.min(100, user.trust + stateUpdate.trustDelta));
    const newConflict = Math.max(0, Math.min(100, user.conflict + stateUpdate.conflictDelta));
    const newMood = Math.max(-1, Math.min(1, user.mood + stateUpdate.moodDelta));
    const newInitiative = Math.max(0, Math.min(100, user.initiative + stateUpdate.initiativeDelta));
    const newStage = stateUpdate.newStage ?? user.stage;

    db.prepare(`UPDATE users SET affinity=?, trust=?, conflict=?, mood=?, initiative=?, stage=? WHERE id=?`)
      .run(newAffinity, newTrust, newConflict, newMood, newInitiative, newStage, userId);

    db.prepare(`INSERT INTO messages (user_id, role, content, emotion_score, quality_score) VALUES (?, 'user', ?, 0, ?)`)
      .run(userId, message, quality);

    db.prepare(`INSERT INTO state_log (user_id, affinity, trust, conflict, mood, initiative, trigger_event) VALUES (?, ?, ?, ?, ?, ?, ?)`)
      .run(userId, newAffinity, newTrust, newConflict, newMood, newInitiative, `用户消息: ${message.slice(0, 30)}`);

    // === 构建 Context ===
    const recentMessages = getRecentMessages(userId, 15);
    const memories = retrieveMemories(userId, message, 3);
    const memoryContext = formatMemoriesForContext(memories);

    const stateDesc = `
## 当前关系状态
- 关系天数: 第 ${currentState.day} 天
- 阶段: ${getStageBehaviorDescription(newStage)}
- 亲密度: ${Math.round(newAffinity)}/100
- 信任度: ${Math.round(newTrust)}/100
- 矛盾值: ${Math.round(newConflict)}/100
- 你的情绪: ${getMoodDescription(newMood)}
- 你的主动度: ${getInitiativeDescription(newInitiative)}
- 矛盾状态: ${getConflictDescription(newConflict)}
`;

    const systemPrompt = buildSystemPrompt(persona, newStage) + stateDesc + memoryContext;

    const history = recentMessages.map((m: any) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    // === 调用 Gemini（带重试） ===
    let assistantMessage = '';
    const maxRetries = 3;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        assistantMessage = await callGemini(systemPrompt, history, message);
        break;
      } catch (err: any) {
        console.error(`Gemini attempt ${attempt}/${maxRetries} failed:`, err.message);
        if (attempt === maxRetries) {
          throw new Error(
            err.message?.includes('503') || err.message?.includes('overloaded')
              ? '她现在有点累了，稍后再试试？（模型过载）'
              : `对话出错: ${err.message}`
          );
        }
        await new Promise(r => setTimeout(r, 1000 * attempt));
      }
    }

    db.prepare(`INSERT INTO messages (user_id, role, content) VALUES (?, 'assistant', ?)`)
      .run(userId, assistantMessage);

    if (messageLength > 30) {
      db.prepare(`INSERT INTO episodic_memory (user_id, event, emotion, importance, tags, context) VALUES (?, ?, ?, ?, ?, ?)`)
        .run(userId, `他提到: ${message.slice(0, 100)}`, quality > 0.5 ? 0.3 : -0.1, Math.min(messageLength / 200, 0.8), JSON.stringify(['对话']), `第${currentState.day}天对话`);
    }

    return NextResponse.json({
      message: assistantMessage,
      state: {
        affinity: newAffinity, trust: newTrust, conflict: newConflict,
        mood: newMood, initiative: newInitiative, stage: newStage, day: currentState.day,
      },
      stageTransition: stateUpdate.stageTransition || null,
      quality,
    });
  } catch (error: any) {
    console.error('Chat error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  const limit = parseInt(searchParams.get('limit') || '50');
  if (!userId) return NextResponse.json({ error: '缺少 userId' }, { status: 400 });
  const db = getDb();
  const messages = db.prepare(`SELECT role, content, created_at FROM messages WHERE user_id = ? ORDER BY created_at ASC LIMIT ?`).all(userId, limit);
  return NextResponse.json({ messages });
}
