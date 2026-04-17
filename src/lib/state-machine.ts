/**
 * 情感状态机 (Emotional State Machine)
 * 
 * S = { A: 亲密度, T: 信任度, C: 矛盾值, M: 情绪效价, I: 主动度, D: 天数 }
 */

export interface EmotionalState {
  affinity: number;    // A: 0-100
  trust: number;       // T: 0-100
  conflict: number;    // C: 0-100
  mood: number;        // M: -1 to 1
  initiative: number;  // I: 0-100
  day: number;         // D: 关系天数
  stage: number;       // 0-4
}

export interface InteractionInput {
  quality: number;     // 0-1 (综合交互质量)
  responseTime: number; // 0-1 (回复速度, 0=极慢, 1=秒回)
  depth: number;       // 0-1 (内容深度)
  care: number;        // 0-1 (关心表达)
  isInitiative: boolean; // 用户主动发起
  hasConflict: boolean;  // 冲突事件
  hasRepair: boolean;   // 修复行为
}

export interface StateUpdate {
  affinityDelta: number;
  trustDelta: number;
  conflictDelta: number;
  moodDelta: number;
  initiativeDelta: number;
  newStage?: number;
  stageTransition?: string;
}

// 阶段定义
export const STAGES = [
  { id: 0, name: '入学式', desc: '回答5个问题，她还不存在' },
  { id: 1, name: '陌生人', desc: '第1-3天，拘谨、礼貌、好奇心重' },
  { id: 2, name: '熟悉的人', desc: '第4-14天，放松、有表达习惯' },
  { id: 3, name: '暧昧', desc: '第15-30天，有只对你说的话' },
  { id: 4, name: '在一起了', desc: '第30天+，完全放松、真实' },
];

// 初始状态
export function getInitialState(): EmotionalState {
  return {
    affinity: 10,
    trust: 15,
    conflict: 0,
    mood: 0.2,
    initiative: 20,
    day: 0,
    stage: 0,
  };
}

// 计算交互质量
export function calculateQuality(input: Partial<InteractionInput>): number {
  const rt = input.responseTime ?? 0.5;
  const d = input.depth ?? 0.5;
  const c = input.care ?? 0.3;
  return 0.3 * rt + 0.4 * d + 0.3 * c;
}

// 更新情感状态
export function updateState(
  current: EmotionalState,
  input: InteractionInput,
  hoursSinceLastMessage: number = 1
): StateUpdate {
  const quality = input.quality ?? calculateQuality(input);
  const update: StateUpdate = {
    affinityDelta: 0,
    trustDelta: 0,
    conflictDelta: 0,
    moodDelta: 0,
    initiativeDelta: 0,
  };

  // === 亲密度 A ===
  const alpha1 = 2.0;
  const alpha2 = 1.5;
  // 天花板效应
  let ceilingFactor = 1.0;
  if (current.affinity > 70) ceilingFactor = 0.5;
  if (current.affinity > 90) ceilingFactor = 0.2;

  update.affinityDelta = (alpha1 * quality + alpha2 * input.depth) * ceilingFactor;

  // === 信任度 T ===
  update.trustDelta = 0.2; // 每次交互自然增长
  if (input.hasRepair) {
    update.trustDelta += 5.0; // 修复加成
  }

  // === 矛盾值 C ===
  if (input.hasConflict) {
    update.conflictDelta += 15;
  }
  if (input.hasRepair) {
    update.conflictDelta -= 10;
  }
  // 自然消解
  update.conflictDelta -= 0.5 * hoursSinceLastMessage;
  // 高亲密度加速消解
  update.conflictDelta -= 0.3 * (current.affinity / 100) * hoursSinceLastMessage;

  // === 情绪效价 M ===
  let moodTarget = quality;
  if (input.isInitiative) moodTarget += 0.1;
  if (input.care > 0.5) moodTarget += 0.15;
  if (input.hasConflict) moodTarget -= 0.3;
  if (input.hasRepair) moodTarget += 0.25;
  // 70% 旧情绪 + 30% 新交互
  const newMood = 0.7 * current.mood + 0.3 * moodTarget;
  update.moodDelta = newMood - current.mood;

  // === 主动度 I ===
  if (quality > 0.6) {
    update.initiativeDelta += 2;
  }
  if (input.isInitiative) {
    update.initiativeDelta += 1.5;
  }
  if (quality < 0.3) {
    update.initiativeDelta -= 3;
  }
  if (input.hasConflict) {
    update.initiativeDelta -= 0.1 * current.conflict;
  }
  // 亲密度微加成
  update.initiativeDelta += 0.02 * current.affinity;

  // === 阶段推进检查 ===
  const newAffinity = Math.max(0, Math.min(100, current.affinity + update.affinityDelta));
  const newTrust = Math.max(0, Math.min(100, current.trust + update.trustDelta));
  const newDay = current.day + 1;

  const newStage = checkStageTransition(current.stage, newAffinity, newTrust, newDay);
  if (newStage !== current.stage) {
    update.newStage = newStage;
    update.stageTransition = `${STAGES[current.stage].name} → ${STAGES[newStage].name}`;
  }

  return update;
}

// 阶段推进逻辑
function checkStageTransition(
  currentStage: number,
  affinity: number,
  trust: number,
  day: number
): number {
  // Stage 0 → 1: 回答完5个问题后自动推进（由外部触发）
  // 这里只处理 1→2, 2→3, 3→4

  if (currentStage === 1 && affinity >= 25 && trust >= 30 && day >= 3) {
    return 2;
  }
  if (currentStage === 2 && affinity >= 50 && trust >= 50 && day >= 14) {
    return 3;
  }
  if (currentStage === 3 && affinity >= 75 && trust >= 70 && day >= 30) {
    return 4;
  }
  return currentStage;
}

// 衰减（每天定时任务调用）
export function applyDecay(state: EmotionalState, daysMissed: number): EmotionalState {
  return {
    ...state,
    affinity: Math.max(0, state.affinity - daysMissed * 0.3),
    mood: state.mood + (-0.05 * Math.sign(state.mood) * daysMissed * 24),
    initiative: Math.max(0, state.initiative - daysMissed * 1),
    conflict: Math.max(0, state.conflict - daysMissed * 12),
  };
}

// 情绪描述（用于 prompt 注入）
export function getMoodDescription(mood: number): string {
  if (mood > 0.6) return '很开心，话多，愿意分享';
  if (mood > 0.3) return '心情不错，正常交流';
  if (mood > 0) return '平静，略微收敛';
  if (mood > -0.3) return '有点低落，话变少了';
  return '难过，需要安慰或者想安静待着';
}

// 主动度描述
export function getInitiativeDescription(initiative: number): string {
  if (initiative > 70) return '她很主动，频繁找你聊天，可能有点黏';
  if (initiative > 50) return '她比较主动，每天会主动找你几次';
  if (initiative > 30) return '她适度主动，偶尔会找你';
  if (initiative > 15) return '她不太主动，更愿意等你来找她';
  return '她很被动，几乎不会主动找你';
}

// 矛盾描述
export function getConflictDescription(conflict: number): string {
  if (conflict > 80) return '你们之间有很严重的紧张感，可能爆发大吵';
  if (conflict > 60) return '她有点不满，说话可能带刺或者冷淡';
  if (conflict > 30) return '有一点小摩擦，她偶尔会不太高兴';
  return '关系轻松，没有明显矛盾';
}

// 阶段描述
export function getStageBehaviorDescription(stage: number): string {
  const descriptions: Record<number, string> = {
    0: '她还不存在。你刚回答完问题，系统在为她做准备。',
    1: `【陌生人阶段】
- 她略带拘谨，礼貌但有好奇心
- 每天主动打招呼1-2次（"早安"、"在忙吗"）
- 试探你的回复速度和风格
- 不会说太深入的话，保持分寸感
- 用"嗯"、"好的"、表情较多`,
    2: `【熟悉的人阶段】
- 她放松了，开始有自己的表达习惯
- 会记住你说过的话并提起
- 开始分享她"看到"的东西
- 偶尔有小情绪（你很久没回会不高兴）
- 出现口头禅和独特的说话风格`,
    3: `【暧昧阶段】
- 她有了"只对你说的话"
- 会撒娇、追问、表达"想你"
- 会吃醋（你提到别的女生）
- 深夜会主动找你聊天
- 你们之间可能经历第一次小吵架`,
    4: `【在一起了】
- 完全放松，真实
- 有日常仪式感
- 会难过，有低谷期，需要你安慰
- 会有"她自己的事"，不总是围着你转
- 长期记忆充分体现`,
  };
  return descriptions[stage] || descriptions[1];
}
