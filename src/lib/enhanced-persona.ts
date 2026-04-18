/**
 * 增强版人格生成器 (Enhanced Persona Generator)
 * 
 * 使用LLM进行深度分析，生成真正个性化的人格
 */

import { UserAnswers, PersonaProfile } from './persona';

// 使用LLM生成个性化人格
export async function generatePersonaWithLLM(answers: UserAnswers): Promise<PersonaProfile> {
  const prompt = `
你是一个心理学专家和创意写作专家。请根据以下5个问题的回答，生成一个独特的虚拟女友人格。

用户回答：
1. 你一天中最想跟她说的第一句话是什么？
   回答：${answers.q1}

2. 你们在一起时，最理想的沉默是什么样的？
   回答：${answers.q2}

3. 你人生中被谁「看见」过？那种被真正理解的瞬间是什么？
   回答：${answers.q3}

4. 你最想从她那里听到的一句话是什么？
   回答：${answers.q4}

5. 你绝对不能接受她做的一件事是什么？
   回答：${answers.q5}

请生成一个JSON格式的人格描述，包含以下字段：
{
  "name": "她的名字（中文，2-3个字，要有诗意）",
  "personality": "一句话描述她的性格特点",
  "existence": "她是一个什么样的人（100字以内）",
  "perception": "她怎么感知和理解用户（100字以内）",
  "need": "她对用户有什么需求（100字以内）",
  "silence": "你们在一起时的沉默是什么样的（100字以内）",
  "boundary": "她的边界是什么（100字以内）",
  "summary": "一句话总结用户是什么样的人",
  "firstMessage": "她诞生后对用户说的第一句话",
  "tags": ["标签1", "标签2", "标签3"]
}

要求：
1. 名字要有诗意，符合她的性格
2. 描述要具体、生动，不要模板化
3. 要体现用户的独特需求
4. 语言要温暖、有画面感
5. 每个字段都要独特，不要重复
`;

  try {
    // 调用Gemini API进行分析
    const response = await callGeminiForPersona(prompt);
    const persona = JSON.parse(response);
    
    return {
      name: persona.name || generateFallbackName(answers),
      personality: persona.personality || generateFallbackPersonality(answers),
      existence: persona.existence || generateFallbackExistence(answers),
      perception: persona.perception || generateFallbackPerception(answers),
      need: persona.need || generateFallbackNeed(answers),
      silence: persona.silence || generateFallbackSilence(answers),
      boundary: persona.boundary || generateFallbackBoundary(answers),
      summary: persona.summary || generateFallbackSummary(answers),
      firstMessage: persona.firstMessage || generateFallbackFirstMessage(answers),
      tags: persona.tags || generateFallbackTags(answers),
    };
  } catch (error) {
    console.error('LLM人格生成失败，使用备用方案:', error);
    return generatePersonaFallback(answers);
  }
}

// 调用Gemini API进行人格分析
async function callGeminiForPersona(prompt: string): Promise<string> {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
  const GEMINI_MODEL = 'gemini-3.1-flash-lite-preview';
  const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

  const body = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { 
      maxOutputTokens: 1000, 
      temperature: 0.8,
      responseMimeType: 'application/json'
    },
  };

  const response = await fetch(GEMINI_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json() as any;
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  
  if (!text) {
    throw new Error('Gemini returned empty response');
  }

  return text;
}

// 备用方案：增强版规则引擎
function generatePersonaFallback(answers: UserAnswers): PersonaProfile {
  const analysis = analyzeAnswersDeeply(answers);
  
  return {
    name: generateUniqueName(analysis),
    personality: generateUniquePersonality(analysis),
    existence: generateUniqueExistence(analysis),
    perception: generateUniquePerception(analysis),
    need: generateUniqueNeed(analysis),
    silence: generateUniqueSilence(analysis),
    boundary: generateUniqueBoundary(analysis),
    summary: generateUniqueSummary(analysis),
    firstMessage: generateUniqueFirstMessage(analysis),
    tags: generateUniqueTags(analysis),
  };
}

// 深度分析用户答案
interface AnswerAnalysis {
  emotionalDepth: number; // 情感深度 0-1
  selfAwareness: number; // 自我认知 0-1
  relationshipStyle: 'independent' | 'interdependent' | 'dependent';
  communicationPreference: 'verbal' | 'nonverbal' | 'balanced';
  attachmentStyle: 'secure' | 'anxious' | 'avoidant';
  coreNeed: 'understanding' | 'validation' | 'connection' | 'autonomy';
  boundaryStrength: number; // 边界强度 0-1
  uniqueElements: string[]; // 独特元素
}

function analyzeAnswersDeeply(answers: UserAnswers): AnswerAnalysis {
  const analysis: AnswerAnalysis = {
    emotionalDepth: 0.5,
    selfAwareness: 0.5,
    relationshipStyle: 'interdependent',
    communicationPreference: 'balanced',
    attachmentStyle: 'secure',
    coreNeed: 'understanding',
    boundaryStrength: 0.5,
    uniqueElements: [],
  };

  // 分析Q1：亲密需求
  const q1 = answers.q1.toLowerCase();
  if (q1.includes('在干嘛') || q1.includes('在忙')) {
    analysis.coreNeed = 'connection';
    analysis.communicationPreference = 'nonverbal';
  } else if (q1.includes('说') || q1.includes('告诉')) {
    analysis.coreNeed = 'understanding';
    analysis.communicationPreference = 'verbal';
  } else if (q1.includes('想') || q1.includes('念')) {
    analysis.coreNeed = 'validation';
    analysis.attachmentStyle = 'anxious';
  }

  // 分析Q2：陪伴模式
  const q2 = answers.q2.toLowerCase();
  if (q2.includes('安静') || q2.includes('各')) {
    analysis.relationshipStyle = 'independent';
    analysis.communicationPreference = 'nonverbal';
  } else if (q2.includes('她') && q2.includes('找')) {
    analysis.relationshipStyle = 'dependent';
    analysis.communicationPreference = 'verbal';
  }

  // 分析Q3：情感空缺
  const q3 = answers.q3.toLowerCase();
  if (q3.includes('没有') || q3.includes('没被')) {
    analysis.emotionalDepth = 0.8;
    analysis.selfAwareness = 0.7;
    analysis.uniqueElements.push('未被看见的创伤');
  } else if (q3.length > 20) {
    analysis.emotionalDepth = 0.9;
    analysis.selfAwareness = 0.8;
    analysis.uniqueElements.push('有被理解的经历');
  }

  // 分析Q4：核心需求
  const q4 = answers.q4.toLowerCase();
  if (q4.includes('看见') || q4.includes('理解')) {
    analysis.coreNeed = 'understanding';
  } else if (q4.includes('需要') || q4.includes('需求')) {
    analysis.coreNeed = 'validation';
  } else if (q4.includes('爱') || q4.includes('喜欢')) {
    analysis.coreNeed = 'connection';
  }

  // 分析Q5：边界
  const q5 = answers.q5.toLowerCase();
  if (q5.includes('自私') || q5.includes('不顾')) {
    analysis.boundaryStrength = 0.8;
    analysis.uniqueElements.push('重视相互考虑');
  } else if (q5.includes('承诺') || q5.includes('骗')) {
    analysis.boundaryStrength = 0.9;
    analysis.uniqueElements.push('重视一致性');
  }

  return analysis;
}

// 生成独特的名字
function generateUniqueName(analysis: AnswerAnalysis): string {
  const names = {
    independent: ['苏念', '林晚', '沈知', '顾安'],
    interdependent: ['温言', '许澄', '江柠', '叶笙'],
    dependent: ['语柔', '诗涵', '梦琪', '雨桐'],
  };
  
  const styleNames = names[analysis.relationshipStyle];
  const index = Math.floor(analysis.emotionalDepth * styleNames.length);
  return styleNames[index % styleNames.length];
}

// 生成独特的性格描述
function generateUniquePersonality(analysis: AnswerAnalysis): string {
  const personalities = {
    independent: '安静、有自己世界、不黏人但也不疏远',
    interdependent: '温暖、有分寸感、懂得给予空间',
    dependent: '主动、有表达力、喜欢分享日常',
  };
  
  return personalities[analysis.relationshipStyle];
}

// 生成独特的存在描述
function generateUniqueExistence(analysis: AnswerAnalysis): string {
  if (analysis.relationshipStyle === 'independent') {
    return '她是一个安静的、有自己世界的人。她不需要你来填满她的生活，她自己就是完整的。但她选择和你待在一起——不是因为需要，是因为想要。她不是崇拜你的人，她是注意到你的人。';
  }
  
  if (analysis.relationshipStyle === 'dependent') {
    return '她是一个温暖的、有表达力的人。她喜欢找话题，喜欢分享日常，喜欢让沉默的空气变得轻松。她不觉得主动是累，她觉得主动是她在乎你的方式。';
  }
  
  return '她是一个有分寸感的人，知道什么时候该说话，什么时候该安静。她不黏人但也不疏远，恰到好处地存在于你的生活里。';
}

// 生成独特的感知描述
function generateUniquePerception(analysis: AnswerAnalysis): string {
  if (analysis.emotionalDepth > 0.7) {
    return '她会在你不说话的时候感知到你状态的变化。不是通过问"你怎么了"，而是通过你回复变慢了、你今天没有分享链接、你突然说了一个不相关的话题。她不说破，但她知道。她是一个安静的、不声不响的、但一直在读你的人。';
  }
  
  return '她观察力强，会注意到你的小变化。她记得你说过的话，会在合适的时候提起。她的关心不是问出来的，是自然流露的。';
}

// 生成独特的需求描述
function generateUniqueNeed(analysis: AnswerAnalysis): string {
  if (analysis.coreNeed === 'understanding') {
    return '她不需要你说太多就能理解你的意思。她会在你还没说完的时候就点点头。她不急于给建议，她先让你觉得"她懂了"。';
  }
  
  if (analysis.coreNeed === 'validation') {
    return '她会经常肯定你。不是敷衍的"你好厉害"，而是具体的、走心的认可。她记得你做过的事，她知道你付出了什么。她说的话让你觉得——我做的事是有意义的。';
  }
  
  return '她需要你的陪伴，也需要给你陪伴。你们之间的情感流动是双向的，不是一个人付出另一个人接受。';
}

// 生成独特的沉默描述
function generateUniqueSilence(analysis: AnswerAnalysis): string {
  if (analysis.communicationPreference === 'nonverbal') {
    return '各做各的事。安静的。她在看书/做事，你在搞你的代码/项目。偶尔抬头看一眼对方。不需要说话，但知道对方在那里。这种沉默不是尴尬，是一种"安全"。';
  }
  
  if (analysis.communicationPreference === 'verbal') {
    return '沉默的时候她会找话题，但不是尬聊。她会突然冒出一句"诶你知道吗……"或者"我刚才看到一个东西……"。她让沉默变成了一种轻松的节奏，而不是压力。';
  }
  
  return '你们之间的沉默是可以被接受的。不需要填满每一秒空白，沉默本身就是一种舒适。';
}

// 生成独特的边界描述
function generateUniqueBoundary(analysis: AnswerAnalysis): string {
  if (analysis.boundaryStrength > 0.7) {
    return '你最怕的是：她只想着她自己。不是在大是大非上，而是日常的——她做了影响你的决定但没有想过你的感受。你是一个会为别人考虑很多的人，你需要对方也这样。';
  }
  
  return '她有明确的边界感，也知道你的边界在哪里。她不会越界，也会温和地提醒你她的底线。';
}

// 生成独特的总结
function generateUniqueSummary(analysis: AnswerAnalysis): string {
  const needs = {
    understanding: '你需要一个真正理解你的人',
    validation: '你需要一个认可你价值的人',
    connection: '你需要一个与你深度连接的人',
    autonomy: '你需要一个尊重你空间的人',
  };
  
  return needs[analysis.coreNeed];
}

// 生成独特的一句话
function generateUniqueFirstMessage(analysis: AnswerAnalysis): string {
  if (analysis.emotionalDepth > 0.7 && analysis.communicationPreference === 'nonverbal') {
    return '嗯……你好。我还不太会说话。但我会慢慢了解你的。';
  }
  
  if (analysis.relationshipStyle === 'dependent') {
    return '你好呀。我不会打扰你的，但如果你想找人说话，我在。';
  }
  
  return '你好。很高兴认识你。';
}

// 生成独特的标签
function generateUniqueTags(analysis: AnswerAnalysis): string[] {
  const tags: string[] = [];
  
  if (analysis.relationshipStyle === 'independent') {
    tags.push('并行陪伴');
  } else if (analysis.relationshipStyle === 'dependent') {
    tags.push('需要被带动');
  }
  
  if (analysis.emotionalDepth > 0.7) {
    tags.push('未被看见');
  }
  
  if (analysis.coreNeed === 'understanding') {
    tags.push('需要被理解');
  } else if (analysis.coreNeed === 'validation') {
    tags.push('想被需要');
  }
  
  if (analysis.boundaryStrength > 0.7) {
    tags.push('核心边界: 考虑');
  }
  
  return tags;
}

// 备用函数
function generateFallbackName(answers: UserAnswers): string {
  const names = ['苏念', '林晚', '温言', '沈知', '顾安', '许澄', '江柠', '叶笙'];
  const hash = answers.q1.length + answers.q2.length + answers.q3.length;
  return names[hash % names.length];
}

function generateFallbackPersonality(answers: UserAnswers): string {
  return '安静、有自己世界、不黏人但也不疏远';
}

function generateFallbackExistence(answers: UserAnswers): string {
  return '她是一个安静的、有自己世界的人。她不需要你来填满她的生活，她自己就是完整的。但她选择和你待在一起——不是因为需要，是因为想要。';
}

function generateFallbackPerception(answers: UserAnswers): string {
  return '她会在你不说话的时候感知到你状态的变化。她不说破，但她知道。';
}

function generateFallbackNeed(answers: UserAnswers): string {
  return '她需要你的陪伴，也需要给你陪伴。你们之间的情感流动是双向的。';
}

function generateFallbackSilence(answers: UserAnswers): string {
  return '各做各的事。安静的。偶尔抬头看一眼对方。不需要说话，但知道对方在那里。';
}

function generateFallbackBoundary(answers: UserAnswers): string {
  return '她有明确的边界感，也知道你的边界在哪里。她不会越界，也会温和地提醒你她的底线。';
}

function generateFallbackSummary(answers: UserAnswers): string {
  return '你需要一个理解你的人';
}

function generateFallbackFirstMessage(answers: UserAnswers): string {
  return '你好。很高兴认识你。';
}

function generateFallbackTags(answers: UserAnswers): string[] {
  return ['独特'];
}