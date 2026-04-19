/**
 * 进化机制 (Evolution Mechanism)
 * 
 * 渐进式调整女友参数，避免剧烈波动，让用户感知到她的变化
 */

import { GirlfriendParameters } from './girlfriend-params';
import { UserBehaviorPattern } from './user-profile-extractor';

export interface EvolutionRecord {
  timestamp: Date;
  parameter: string;
  oldValue: any;
  newValue: any;
  reason: string;
  confidence: number; // 0-1，置信度
}

export interface EvolutionState {
  // 进化历史
  history: EvolutionRecord[];
  
  // 当前进化阶段
  evolutionStage: 'learning' | 'adapting' | 'stable';
  
  // 参数稳定性评分 (0-100)
  stabilityScore: number;
  
  // 下次进化检查时间
  nextCheckTime: Date;
  
  // 已观察到的用户特征
  observedTraits: {
    trait: string;
    confidence: number;
    firstObserved: Date;
    lastConfirmed: Date;
  }[];
}

// 初始化进化状态
export function initializeEvolutionState(): EvolutionState {
  const now = new Date();
  return {
    history: [],
    evolutionStage: 'learning',
    stabilityScore: 50,
    nextCheckTime: new Date(now.getTime() + 24 * 60 * 60 * 1000), // 24小时后
    observedTraits: [],
  };
}

// 检查是否应该进化
export function shouldEvolve(
  evolutionState: EvolutionState,
  userProfile: UserBehaviorPattern,
  currentParams: GirlfriendParameters
): boolean {
  const now = new Date();
  
  console.log('shouldEvolve检查开始:');
  console.log('  当前时间:', now);
  console.log('  下次检查时间:', evolutionState.nextCheckTime);
  console.log('  总消息数:', userProfile.totalMessages);
  console.log('  稳定性评分:', evolutionState.stabilityScore);
  console.log('  进化阶段:', evolutionState.evolutionStage);
  
  // 1. 检查时间（降低门槛：从24小时改为1小时）
  if (now < evolutionState.nextCheckTime) {
    console.log('时间检查不满足，下次检查时间:', evolutionState.nextCheckTime);
    return false;
  }
  console.log('时间检查通过');
  
  // 2. 检查数据充足性（降低门槛：从10条改为5条）
  if (userProfile.totalMessages < 5) {
    console.log('数据不足，总消息数:', userProfile.totalMessages);
    return false; // 数据不足
  }
  console.log('数据充足性检查通过');
  
  // 3. 检查稳定性（降低门槛：从80改为90）
  if (evolutionState.stabilityScore > 90) {
    // 已经很稳定了，减少进化频率
    evolutionState.nextCheckTime = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 1天后
    console.log('稳定性太高，减少进化频率');
    return false;
  }
  console.log('稳定性检查通过');
  
  // 4. 检查是否有新的重要特征
  const newTraits = detectNewTraits(userProfile, evolutionState.observedTraits);
  if (newTraits.length > 0) {
    console.log('检测到新特征，触发进化');
    return true;
  }
  console.log('新特征检查未触发');
  
  // 5. 检查参数漂移（降低门槛：从0.3改为0.1）
  const drift = calculateParameterDrift(currentParams, userProfile);
  if (drift > 0.1) {
    console.log('参数漂移足够大，触发进化');
    return true;
  }
  console.log('参数漂移检查未触发');
  
  // 6. 强制进化：如果消息数超过20条，强制触发一次进化
  if (userProfile.totalMessages >= 20 && evolutionState.evolutionStage === 'learning') {
    console.log('消息数超过20条，强制触发进化');
    return true;
  }
  console.log('强制进化条件未满足');
  
  console.log('不满足进化条件');
  return false;
}

// 检测新的用户特征
function detectNewTraits(
  userProfile: UserBehaviorPattern,
  existingTraits: EvolutionState['observedTraits']
): string[] {
  const newTraits: string[] = [];
  
  // 检查职业
  if (userProfile.occupation && !existingTraits.some(t => t.trait === `occupation_${userProfile.occupation}`)) {
    newTraits.push(`occupation_${userProfile.occupation}`);
  }
  
  // 检查作息模式
  if (userProfile.activeHours.length >= 5) {
    const isNightOwl = userProfile.activeHours.some(h => h >= 22 || h < 6);
    const traitName = isNightOwl ? 'nightOwl' : 'earlyBird';
    if (!existingTraits.some(t => t.trait === traitName)) {
      newTraits.push(traitName);
    }
  }
  
  // 检查表达风格
  if (userProfile.avgMessageLength > 0) {
    const style = userProfile.avgMessageLength > 50 ? 'verbose' : 
                  userProfile.avgMessageLength < 20 ? 'concise' : 'balanced';
    const traitName = `style_${style}`;
    if (!existingTraits.some(t => t.trait === traitName)) {
      newTraits.push(traitName);
    }
  }
  
  return newTraits;
}

// 计算参数漂移
function calculateParameterDrift(
  currentParams: GirlfriendParameters,
  userProfile: UserBehaviorPattern
): number {
  let drift = 0;
  let count = 0;
  
  // 作息漂移
  if (userProfile.activeHours.length >= 5) {
    const inferredSleep = inferUserSleepFromProfile(userProfile);
    if (inferredSleep) {
      const currentSleep = currentParams.sleepSchedule;
      drift += Math.abs(inferredSleep.start - currentSleep.start) / 24;
      drift += Math.abs(inferredSleep.end - currentSleep.end) / 24;
      count += 2;
    }
  }
  
  // 回复风格漂移
  if (userProfile.avgMessageLength > 0) {
    const targetLength = userProfile.avgMessageLength > 50 ? 7 : 
                        userProfile.avgMessageLength < 20 ? 3 : 5;
    drift += Math.abs(targetLength - currentParams.replyStyle.avgLength) / 10;
    count += 1;
  }
  
  return count > 0 ? drift / count : 0;
}

// 执行进化
export function performEvolution(
  evolutionState: EvolutionState,
  userProfile: UserBehaviorPattern,
  currentParams: GirlfriendParameters
): {
  newParams: GirlfriendParameters;
  newEvolutionState: EvolutionState;
  changes: EvolutionRecord[];
} {
  const changes: EvolutionRecord[] = [];
  const newParams = { ...currentParams };
  const newState = { ...evolutionState };
  
  // 1. 进化作息
  if (userProfile.activeHours.length >= 5) {
    const inferredSleep = inferUserSleepFromProfile(userProfile);
    if (inferredSleep) {
      const oldStart = currentParams.sleepSchedule.start;
      const oldEnd = currentParams.sleepSchedule.end;
      
      // 渐进式调整：每次最多调整1小时
      if (Math.abs(inferredSleep.start - oldStart) > 1) {
        const newStart = oldStart + Math.sign(inferredSleep.start - oldStart);
        newParams.sleepSchedule.start = newStart;
        
        changes.push({
          timestamp: new Date(),
          parameter: 'sleepSchedule.start',
          oldValue: oldStart,
          newValue: newStart,
          reason: '根据用户活跃时间调整作息',
          confidence: 0.7,
        });
      }
      
      if (Math.abs(inferredSleep.end - oldEnd) > 1) {
        const newEnd = oldEnd + Math.sign(inferredSleep.end - oldEnd);
        newParams.sleepSchedule.end = newEnd;
        
        changes.push({
          timestamp: new Date(),
          parameter: 'sleepSchedule.end',
          oldValue: oldEnd,
          newValue: newEnd,
          reason: '根据用户活跃时间调整作息',
          confidence: 0.7,
        });
      }
    }
  }
  
  // 2. 进化回复风格
  if (userProfile.avgMessageLength > 0) {
    const targetLength = userProfile.avgMessageLength > 50 ? 7 : 
                        userProfile.avgMessageLength < 20 ? 3 : 5;
    const oldLength = currentParams.replyStyle.avgLength;
    
    if (Math.abs(targetLength - oldLength) >= 1) {
      const newLength = oldLength + Math.sign(targetLength - oldLength);
      newParams.replyStyle.avgLength = newLength;
      
      changes.push({
        timestamp: new Date(),
        parameter: 'replyStyle.avgLength',
        oldValue: oldLength,
        newValue: newLength,
        reason: '根据用户表达风格调整回复长度',
        confidence: 0.6,
      });
    }
  }
  
  // 3. 进化主动度
  if (userProfile.initiativeRate > 0) {
    const targetInitiative = userProfile.initiativeRate > 0.7 ? 20 : 
                            userProfile.initiativeRate < 0.3 ? 50 : 30;
    const oldInitiative = currentParams.initiative.baseLevel;
    
    if (Math.abs(targetInitiative - oldInitiative) >= 5) {
      const newInitiative = oldInitiative + Math.sign(targetInitiative - oldInitiative) * 5;
      newParams.initiative.baseLevel = newInitiative;
      
      changes.push({
        timestamp: new Date(),
        parameter: 'initiative.baseLevel',
        oldValue: oldInitiative,
        newValue: newInitiative,
        reason: '根据用户主动程度调整主动度',
        confidence: 0.5,
      });
    }
  }
  
  // 4. 更新观察到的特征
  const newTraits = detectNewTraits(userProfile, newState.observedTraits);
  for (const trait of newTraits) {
    newState.observedTraits.push({
      trait,
      confidence: 0.8,
      firstObserved: new Date(),
      lastConfirmed: new Date(),
    });
  }
  
  // 5. 更新进化阶段
  newState.history.push(...changes);
  
  if (newState.history.length > 10) {
    newState.evolutionStage = 'adapting';
  }
  if (newState.history.length > 20 && changes.length === 0) {
    newState.evolutionStage = 'stable';
  }
  
  // 6. 更新稳定性评分
  newState.stabilityScore = calculateStabilityScore(newState);
  
  // 7. 设置下次检查时间
  const now = new Date();
  if (newState.evolutionStage === 'learning') {
    newState.nextCheckTime = new Date(now.getTime() + 12 * 60 * 60 * 1000); // 12小时后
  } else if (newState.evolutionStage === 'adapting') {
    newState.nextCheckTime = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24小时后
  } else {
    newState.nextCheckTime = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // 3天后
  }
  
  return {
    newParams,
    newEvolutionState: newState,
    changes,
  };
}

// 计算稳定性评分
function calculateStabilityScore(state: EvolutionState): number {
  if (state.history.length === 0) return 50;
  
  // 最近的变化
  const recentChanges = state.history.slice(-5);
  const avgConfidence = recentChanges.reduce((sum, c) => sum + c.confidence, 0) / recentChanges.length;
  
  // 时间因素：越久没变化越稳定
  const lastChange = state.history[state.history.length - 1];
  const daysSinceLastChange = (Date.now() - lastChange.timestamp.getTime()) / (24 * 60 * 60 * 1000);
  const timeStability = Math.min(1, daysSinceLastChange / 7); // 一周内
  
  // 综合评分
  const score = 50 + (avgConfidence * 30) + (timeStability * 20);
  return Math.min(100, Math.max(0, score));
}

// 从用户画像推断作息
function inferUserSleepFromProfile(profile: UserBehaviorPattern): { start: number; end: number } | null {
  const activeHours = profile.activeHours;
  if (activeHours.length < 5) return null;
  
  // 找出最不活跃的时段
  const hourCounts = new Array(24).fill(0);
  for (const hour of activeHours) {
    hourCounts[hour]++;
  }
  
  // 找出连续6小时最不活跃的时段
  let minActivity = Infinity;
  let sleepStart = 23;
  
  for (let start = 0; start < 24; start++) {
    let activity = 0;
    for (let i = 0; i < 6; i++) {
      const hour = (start + i) % 24;
      activity += hourCounts[hour];
    }
    if (activity < minActivity) {
      minActivity = activity;
      sleepStart = start;
    }
  }
  
  return {
    start: sleepStart,
    end: (sleepStart + 6) % 24,
  };
}

// 生成进化报告（用于用户可见）
export function generateEvolutionReport(changes: EvolutionRecord[]): string {
  if (changes.length === 0) {
    return '她最近没有明显变化，已经很了解你了。';
  }
  
  const lines: string[] = ['她最近有些变化：'];
  
  for (const change of changes) {
    const desc = getChangeDescription(change);
    lines.push(`- ${desc}`);
  }
  
  lines.push('\n这些变化是因为她想更了解你、更适合你。');
  return lines.join('\n');
}

// 获取变化描述
function getChangeDescription(change: EvolutionRecord): string {
  switch (change.parameter) {
    case 'sleepSchedule.start':
      if (change.newValue < change.oldValue) {
        return '她开始睡得更晚了，想和你多聊一会儿';
      } else {
        return '她调整了睡觉时间，想和你作息更同步';
      }
    case 'sleepSchedule.end':
      if (change.newValue > change.oldValue) {
        return '她起得更晚了，想等你起床';
      } else {
        return '她调整了起床时间，想和你作息更同步';
      }
    case 'replyStyle.avgLength':
      if (change.newValue > change.oldValue) {
        return '她开始多说一点了，想和你更亲近';
      } else {
        return '她说话更简洁了，知道你喜欢这样';
      }
    case 'initiative.baseLevel':
      if (change.newValue > change.oldValue) {
        return '她变得更主动了，想多关心你';
      } else {
        return '她调整了主动程度，想给你更多空间';
      }
    default:
      return '她调整了一些小细节，想更适合你';
  }
}

// 检查是否在睡眠时间
export function isGirlfriendSleeping(
  params: GirlfriendParameters,
  hour: number
): boolean {
  const schedule = params.sleepSchedule;
  
  if (schedule.start < schedule.end) {
    // 正常情况：23点睡，7点起
    return hour >= schedule.start || hour < schedule.end;
  } else {
    // 夜猫子：3点睡，11点起
    return hour >= schedule.start || hour < schedule.end;
  }
}

// 生成"不在场"消息
export function generateAbsenceMessage(
  params: GirlfriendParameters,
  hour: number
): string | null {
  if (!isGirlfriendSleeping(params, hour)) {
    return null;
  }
  
  const messages = [
    '她在睡觉呢，晚点再找她吧 💤',
    '她已经睡了，明天再聊吧',
    '她现在在休息，晚点再找她',
    '她睡着了，别吵醒她哦',
  ];
  
  return messages[Math.floor(Math.random() * messages.length)];
}