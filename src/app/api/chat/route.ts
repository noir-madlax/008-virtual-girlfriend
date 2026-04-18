import { NextRequest, NextResponse } from 'next/server';
import { generatePersona, UserAnswers, buildSystemPrompt, PersonaProfile } from '@/lib/persona';
import { generatePersonaWithLLM } from '@/lib/enhanced-persona';
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
import { getUserProfile, updateUserProfile, getGirlfriendParams, updateGirlfriendParams, saveEvolutionHistory, saveMessage } from '@/lib/supabase-db';
import { analyzeMessage, updateUserPattern, UserBehaviorPattern } from '@/lib/user-profile-extractor';
import { adjustParametersBasedOnUser, GirlfriendParameters, getDefaultParameters, generateGirlfriendStateDescription, generateReplyStyleGuide } from '@/lib/girlfriend-params';
import { shouldEvolve, performEvolution, EvolutionState, initializeEvolutionState, generateAbsenceMessage, isGirlfriendSleeping } from '@/lib/evolution';

const fetch = require('node-fetch').default || require('node-fetch');
const { SocksProxyAgent } = require('socks-proxy-agent');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = 'gemini-3.1-flash-lite-preview';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

// 代理（仅本地开发用，Vercel 上自动跳过）
let proxyAgent: any = undefined;
try {
  if (process.env.USE_PROXY === 'true') {
    const { SocksProxyAgent } = require('socks-proxy-agent');
    proxyAgent = new SocksProxyAgent('socks5://127.0.0.1:12345');
  }
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

      // 使用增强版人格生成器
      let persona: PersonaProfile;
      try {
        // 尝试使用LLM生成个性化人格
        persona = await generatePersonaWithLLM(answers);
      } catch (error) {
        console.error('LLM人格生成失败，使用备用方案:', error);
        // 如果LLM失败，使用原来的规则引擎
        persona = generatePersona(answers);
      }

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
      const { persona, state, messages, message, userId } = body as {
        persona: PersonaProfile;
        state: EmotionalState;
        messages: Array<{ role: string; content: string }>;
        message: string;
        userId?: number;
      };

      console.log('收到聊天请求:');
      console.log('  userId:', userId);
      console.log('  userId类型:', typeof userId);
      console.log('  userId是否为undefined:', userId === undefined);
      console.log('  message:', message);

      if (!persona || !state || !message) {
        return NextResponse.json({ error: '缺少参数' }, { status: 400 });
      }

      const now = new Date();
      const hour = now.getHours();
      const dayOfWeek = now.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      // 确保userId有值，如果为undefined则使用默认值1
      const effectiveUserId = userId !== undefined ? userId : 1;
      console.log('使用userId:', effectiveUserId);

      // 1. 用户特征提取
      let userProfile: UserBehaviorPattern = {
        activeHours: [],
        sleepHours: null,
        avgResponseTime: 0,
        avgMessageLength: 0,
        initiativeRate: 0,
        moodPattern: {},
        stressKeywords: [],
        occupation: null,
        hobbies: [],
        timezone: null,
        totalMessages: 0,
        lastActive: now.toISOString(),
        daysSinceFirst: 0,
      };

      let girlfriendParams = getDefaultParameters();
      let evolutionState = initializeEvolutionState();

      if (effectiveUserId) {
        // 从Supabase加载用户画像
        try {
          const profileData = await getUserProfile(effectiveUserId);
          if (profileData) {
            userProfile = {
              ...userProfile,
              ...JSON.parse(profileData.behavior_json || '{}'),
              occupation: profileData.occupation,
              activeHours: JSON.parse(profileData.active_hours || '[]'),
              avgMessageLength: profileData.avg_message_length || 0,
              initiativeRate: profileData.initiative_rate || 0,
              moodPattern: JSON.parse(profileData.mood_pattern || '{}'),
              lastUpdated: profileData.last_updated,
            };
          }
        } catch (e) {
          console.error('Failed to load user profile:', e);
        }

        // 从Supabase加载女友参数
        try {
          const paramsData = await getGirlfriendParams(effectiveUserId);
          if (paramsData) {
            girlfriendParams = JSON.parse(paramsData.params_json || '{}');
            evolutionState.evolutionStage = paramsData.evolution_stage || 'learning';
            evolutionState.stabilityScore = paramsData.stability_score || 50;
          }
        } catch (e) {
          console.error('Failed to load girlfriend params:', e);
        }

        // 分析当前消息
        const insight = analyzeMessage(message, now);
        console.log('用户画像分析:', JSON.stringify(insight, null, 2));
        
        userProfile = updateUserPattern(userProfile, insight);
        console.log('更新后的用户画像:', JSON.stringify(userProfile, null, 2));
        
        userProfile.totalMessages += 1;
        userProfile.lastActive = now.toISOString();

        // 更新Supabase中的用户画像
        try {
          console.log('准备更新用户画像到数据库:', effectiveUserId);
          await updateUserProfile(effectiveUserId, {
            behavior_json: JSON.stringify(userProfile),
            occupation: userProfile.occupation,
            active_hours: JSON.stringify(userProfile.activeHours),
            avg_message_length: userProfile.avgMessageLength,
            initiative_rate: userProfile.initiativeRate,
            mood_pattern: JSON.stringify(userProfile.moodPattern),
            total_messages: userProfile.totalMessages,
          });
          console.log('用户画像更新成功');
        } catch (e) {
          console.error('Failed to update user profile:', e);
        }

        // 检查是否需要进化
        if (shouldEvolve(evolutionState, userProfile, girlfriendParams)) {
          const evolutionResult = performEvolution(evolutionState, userProfile, girlfriendParams);
          girlfriendParams = evolutionResult.newParams;
          evolutionState = evolutionResult.newEvolutionState;

          // 保存进化记录
          try {
            for (const change of evolutionResult.changes) {
              await saveEvolutionHistory(effectiveUserId, {
                parameter: change.parameter,
                old_value: JSON.stringify(change.oldValue),
                new_value: JSON.stringify(change.newValue),
                reason: change.reason,
                confidence: change.confidence,
              });
            }

            // 更新女友参数
            await updateGirlfriendParams(effectiveUserId, {
              params_json: JSON.stringify(girlfriendParams),
              evolution_stage: evolutionState.evolutionStage,
              stability_score: evolutionState.stabilityScore,
              next_evolution: evolutionState.nextCheckTime.toISOString(),
            });
          } catch (e) {
            console.error('Failed to save evolution data:', e);
          }
        }

        // 调整女友参数基于用户特征
        girlfriendParams = adjustParametersBasedOnUser(girlfriendParams, userProfile);
      }

      // 2. 检查是否在睡眠时间
      if (isGirlfriendSleeping(girlfriendParams, hour)) {
        const absenceMessage = generateAbsenceMessage(girlfriendParams, hour);
        return NextResponse.json({
          message: absenceMessage,
          state: state,
          stageTransition: null,
          quality: 0,
          isSleeping: true,
        });
      }

      // 3. 分析消息质量
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

      // 4. 构建 context
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

      // 添加女友状态描述
      const girlfriendStateDesc = generateGirlfriendStateDescription(girlfriendParams, hour, isWeekend);
      const replyStyleGuide = generateReplyStyleGuide(girlfriendParams);

      const systemPrompt = buildSystemPrompt(persona, newState.stage) + 
                          stateDesc + 
                          `\n## 你的当前状态\n${girlfriendStateDesc}` +
                          `\n## 你的回复风格\n${replyStyleGuide}`;

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

      // 5. 保存消息到Supabase
      if (userId) {
        try {
          await saveMessage(userId, 'user', message, newState.mood, quality);
          await saveMessage(userId, 'assistant', assistantMessage, newState.mood, quality);
        } catch (e) {
          console.error('Failed to save messages:', e);
        }
      }

      return NextResponse.json({
        message: assistantMessage,
        state: newState,
        stageTransition: stateUpdate.stageTransition || null,
        quality,
        girlfriendParams: girlfriendParams,
        evolutionStage: evolutionState.evolutionStage,
      });
    }

    return NextResponse.json({ error: '未知 action' }, { status: 400 });
  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
