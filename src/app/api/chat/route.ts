import { NextRequest, NextResponse } from 'next/server';
import { generatePersona, UserAnswers, buildSystemPrompt, PersonaProfile } from '@/lib/persona';
import {
  updateState,
  calculateQuality,
  getMoodDescription,
  getInitiativeDescription,
  getConflictDescription,
  getStageBehaviorDescription,
  EmotionalState,
  InteractionInput,
} from '@/lib/state-machine';

const fetch = require('node-fetch').default || require('node-fetch');
const { SocksProxyAgent } = require('socks-proxy-agent');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = 'gemini-3.1-flash-lite-preview';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

// 代理（Vercel 上不需要，本地需要）
let proxyAgent: any = undefined;
try {
  proxyAgent = new SocksProxyAgent('socks5://127.0.0.1:12345');
} catch {}

async function callGemini(systemPrompt: string, history: any[], message: string): Promise<string> {
  const contents = [
    ...history,
    { role: 'user', parts: [{ text: message }] },
  ];

  const body = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents,
    generationConfig: { maxOutputTokens: 500, temperature: 0.8 },
  };

  const fetchOpts: any = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
  if (proxyAgent) fetchOpts.agent = proxyAgent;

  const res = await fetch(GEMINI_API_URL, fetchOpts);

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API ${res.status}: ${errText.slice(0, 200)}`);
  }

  const data = await res.json() as any;

  if (data.error) throw new Error(`Gemini error: ${data.error.message}`);

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini returned empty response');

  return text;
}

// POST /api/chat — 统一入口：生成人格 + 聊天
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === 'create') {
      // 创建人格（入学式）
      const { nickname, answers } = body as { nickname: string; answers: UserAnswers };
      if (!nickname || !answers) {
        return NextResponse.json({ error: '缺少参数' }, { status: 400 });
      }

      const persona = generatePersona(answers);
      const state: EmotionalState = {
        affinity: 10,
        trust: 15,
        conflict: 0,
        mood: 0.2,
        initiative: 20,
        day: 0,
        stage: 1,
      };

      return NextResponse.json({ persona, state });
    }

    if (action === 'chat') {
      // 聊天
      const { persona, state, messages, message } = body as {
        persona: PersonaProfile;
        state: EmotionalState;
        messages: Array<{ role: string; content: string }>;
        message: string;
      };

      if (!persona || !state || !message) {
        return NextResponse.json({ error: '缺少参数' }, { status: 400 });
      }

      // 分析消息质量
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

      // 更新状态
      const stateUpdate = updateState(state, input);

      const newState: EmotionalState = {
        affinity: Math.max(0, Math.min(100, state.affinity + stateUpdate.affinityDelta)),
        trust: Math.max(0, Math.min(100, state.trust + stateUpdate.trustDelta)),
        conflict: Math.max(0, Math.min(100, state.conflict + stateUpdate.conflictDelta)),
        mood: Math.max(-1, Math.min(1, state.mood + stateUpdate.moodDelta)),
        initiative: Math.max(0, Math.min(100, state.initiative + stateUpdate.initiativeDelta)),
        day: state.day,
        stage: stateUpdate.newStage ?? state.stage,
      };

      // 构建 context
      const stateDesc = `
## 当前关系状态
- 关系天数: 第 ${newState.day} 天
- 阶段: ${getStageBehaviorDescription(newState.stage)}
- 亲密度: ${Math.round(newState.affinity)}/100
- 信任度: ${Math.round(newState.trust)}/100
- 矛盾值: ${Math.round(newState.conflict)}/100
- 你的情绪: ${getMoodDescription(newState.mood)}
- 你的主动度: ${getInitiativeDescription(newState.initiative)}
- 矛盾状态: ${getConflictDescription(newState.conflict)}
`;

      const systemPrompt = buildSystemPrompt(persona, newState.stage) + stateDesc;

      // Gemini 消息历史
      const history = messages.slice(-15).map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

      // 调用 Gemini
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
          await new Promise((r) => setTimeout(r, 1000 * attempt));
        }
      }

      return NextResponse.json({
        message: assistantMessage,
        state: newState,
        stageTransition: stateUpdate.stageTransition || null,
        quality,
      });
    }

    return NextResponse.json({ error: '未知 action' }, { status: 400 });
  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
