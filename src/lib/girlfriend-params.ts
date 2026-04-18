/**
 * 女友参数动态系统 (Girlfriend Parameter Dynamic System)
 * 
 * 根据用户特征动态调整女友的行为参数：作息、回复风格、主动度
 */

import { UserBehaviorPattern } from './user-profile-extractor';

export interface GirlfriendParameters {
  // 作息参数
  sleepSchedule: {
    start: number; // 睡觉时间 (0-23)
    end: number;   // 起床时间 (0-23)
    isFlexible: boolean; // 是否可调整
  };
  
  // 回复风格
  replyStyle: {
    avgLength: number;      // 平均回复长度 (1-10, 1=极简, 10=详细)
    emojiFrequency: number; // 表情符号频率 (0-1)
    responseDelay: number;  // 回复延迟 (秒)
    formality: number;      // 正式程度 (0-1, 0=非常随意, 1=非常正式)
  };
  
  // 主动度参数
  initiative: {
    baseLevel: number;      // 基础主动度 (0-100)
    timeBasedAdjustment: Record<string, number>; // 时段调整
    moodAdjustment: number; // 情绪影响系数
  };
  
  // 关心方式
  careStyle: {
    askAboutDay: boolean;   // 是否询问日常
    giveAdvice: boolean;    // 是否给建议
    shareSelf: boolean;     // 是否分享自己
    rememberDetails: boolean; // 是否记住细节
  };
  
  // 特殊模式
  specialModes: {
    nightOwlMode: boolean;  // 夜猫子模式
    busyScheduleMode: boolean; // 忙碌日程模式
    emotionalSupportMode: boolean; // 情感支持模式
  };
}

// 默认参数
export function getDefaultParameters(): GirlfriendParameters {
  return {
    sleepSchedule: {
      start: 23,
      end: 7,
      isFlexible: true,
    },
    replyStyle: {
      avgLength: 5,
      emojiFrequency: 0.3,
      responseDelay: 30,
      formality: 0.3,
    },
    initiative: {
      baseLevel: 30,
      timeBasedAdjustment: {
        'morning': 20,
        'afternoon': 30,
        'evening': 40,
        'night': 15,
      },
      moodAdjustment: 0.2,
    },
    careStyle: {
      askAboutDay: true,
      giveAdvice: false,
      shareSelf: true,
      rememberDetails: true,
    },
    specialModes: {
      nightOwlMode: false,
      busyScheduleMode: false,
      emotionalSupportMode: false,
    },
  };
}

// 根据用户特征调整参数
export function adjustParametersBasedOnUser(
  currentParams: GirlfriendParameters,
  userProfile: UserBehaviorPattern
): GirlfriendParameters {
  const newParams = { ...currentParams };
  
  // 1. 调整作息：尽量和用户同步
  if (userProfile.activeHours.length >= 5) {
    const inferredSleep = inferUserSleep(userProfile);
    if (inferredSleep) {
      // 如果用户是夜猫子，调整女友作息
      if (inferredSleep.start >= 0 && inferredSleep.start < 6) {
        // 用户凌晨才睡
        newParams.sleepSchedule.start = Math.min(2, inferredSleep.start + 1);
        newParams.sleepSchedule.end = Math.min(12, inferredSleep.end + 1);
        newParams.specialModes.nightOwlMode = true;
      } else {
        // 正常作息
        newParams.sleepSchedule.start = inferredSleep.start;
        newParams.sleepSchedule.end = inferredSleep.end;
        newParams.specialModes.nightOwlMode = false;
      }
    }
  }
  
  // 2. 调整回复风格：匹配用户的表达习惯
  if (userProfile.avgMessageLength > 0) {
    if (userProfile.avgMessageLength > 50) {
      // 用户喜欢详细表达，女友也多说一点
      newParams.replyStyle.avgLength = 7;
      newParams.replyStyle.formality = 0.4;
    } else if (userProfile.avgMessageLength < 20) {
      // 用户喜欢简洁，女友也简洁
      newParams.replyStyle.avgLength = 3;
      newParams.replyStyle.formality = 0.2;
    }
  }
  
  // 3. 调整主动度：根据用户主动程度
  if (userProfile.initiativeRate > 0.7) {
    // 用户很主动，女友可以稍微被动一点
    newParams.initiative.baseLevel = 20;
  } else if (userProfile.initiativeRate < 0.3) {
    // 用户被动，女友需要更主动
    newParams.initiative.baseLevel = 50;
  }
  
  // 4. 根据职业调整
  if (userProfile.occupation) {
    switch (userProfile.occupation) {
      case '程序员':
        // 程序员可能加班多，女友要理解
        newParams.specialModes.busyScheduleMode = true;
        newParams.careStyle.giveAdvice = false; // 不要说教
        break;
      case '调酒师':
        // 调酒师晚上工作，调整作息
        newParams.sleepSchedule.start = 3;
        newParams.sleepSchedule.end = 11;
        newParams.specialModes.nightOwlMode = true;
        break;
      case '医生':
        // 医生可能值班，要灵活
        newParams.sleepSchedule.isFlexible = true;
        newParams.careStyle.askAboutDay = true; // 关心工作
        break;
    }
  }
  
  // 5. 根据情绪模式调整
  if (userProfile.moodPattern) {
    const negativeCount = Object.values(userProfile.moodPattern).filter(m => m < 0.3).length;
    if (negativeCount > 3) {
      // 用户经常情绪低落，女友要更支持
      newParams.specialModes.emotionalSupportMode = true;
      newParams.careStyle.giveAdvice = false; // 不要说教，先倾听
    }
  }
  
  return newParams;
}

// 推断用户作息
function inferUserSleep(profile: UserBehaviorPattern): { start: number; end: number } | null {
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

// 计算当前时间的主动度调整
export function calculateTimeBasedInitiative(
  params: GirlfriendParameters,
  hour: number,
  isWeekend: boolean
): number {
  const base = params.initiative.baseLevel;
  let adjustment = 0;
  
  // 时段调整
  if (hour >= 6 && hour < 12) {
    adjustment = params.initiative.timeBasedAdjustment.morning || 0;
  } else if (hour >= 12 && hour < 18) {
    adjustment = params.initiative.timeBasedAdjustment.afternoon || 0;
  } else if (hour >= 18 && hour < 24) {
    adjustment = params.initiative.timeBasedAdjustment.evening || 0;
  } else {
    adjustment = params.initiative.timeBasedAdjustment.night || 0;
  }
  
  // 周末调整
  if (isWeekend) {
    adjustment += 10; // 周末更活跃
  }
  
  // 夜猫子模式调整
  if (params.specialModes.nightOwlMode) {
    if (hour >= 22 || hour < 6) {
      adjustment += 15; // 晚上更活跃
    } else if (hour >= 6 && hour < 12) {
      adjustment -= 10; // 早上不活跃
    }
  }
  
  return Math.max(0, Math.min(100, base + adjustment));
}

// 生成回复延迟（模拟真实感）
export function calculateReplyDelay(params: GirlfriendParameters): number {
  const baseDelay = params.replyStyle.responseDelay;
  
  // 添加随机性 (±30%)
  const randomFactor = 0.7 + Math.random() * 0.6;
  const delay = baseDelay * randomFactor;
  
  // 夜间回复更慢
  const hour = new Date().getHours();
  if (hour >= 23 || hour < 6) {
    return delay * 1.5;
  }
  
  return delay;
}

// 生成女友的当前状态描述（用于 prompt）
export function generateGirlfriendStateDescription(
  params: GirlfriendParameters,
  hour: number,
  isWeekend: boolean
): string {
  const lines: string[] = [];
  
  // 作息状态
  const isSleeping = isTimeToSleep(params.sleepSchedule, hour);
  if (isSleeping) {
    lines.push('她现在应该在睡觉（除非有紧急或特别的事）');
  } else {
    const awakeHours = hour - params.sleepSchedule.end;
    if (awakeHours < 2) {
      lines.push('她刚起床，可能还有点困');
    } else if (awakeHours > 12) {
      lines.push('她已经活跃了一整天，可能有点累了');
    }
  }
  
  // 主动度状态
  const initiative = calculateTimeBasedInitiative(params, hour, isWeekend);
  if (initiative > 60) {
    lines.push('她现在比较活跃，可能会主动找话题');
  } else if (initiative < 30) {
    lines.push('她现在比较安静，更愿意等你说话');
  }
  
  // 特殊模式
  if (params.specialModes.nightOwlMode && hour >= 22) {
    lines.push('夜猫子模式：她晚上比较精神');
  }
  if (params.specialModes.busyScheduleMode) {
    lines.push('她理解你工作忙，不会因为你回复慢而不高兴');
  }
  if (params.specialModes.emotionalSupportMode) {
    lines.push('她更注重倾听和支持，不会急于给建议');
  }
  
  return lines.join('\n');
}

// 判断是否该睡觉了
function isTimeToSleep(schedule: { start: number; end: number }, hour: number): boolean {
  if (schedule.start < schedule.end) {
    // 正常情况：23点睡，7点起
    return hour >= schedule.start || hour < schedule.end;
  } else {
    // 夜猫子：3点睡，11点起
    return hour >= schedule.start || hour < schedule.end;
  }
}

// 生成回复风格指导（用于 prompt）
export function generateReplyStyleGuide(params: GirlfriendParameters): string {
  const lines: string[] = [];
  
  // 回复长度
  if (params.replyStyle.avgLength <= 3) {
    lines.push('回复简洁，一两句话就好');
  } else if (params.replyStyle.avgLength <= 6) {
    lines.push('回复适中，几句话');
  } else {
    lines.push('可以多说一点，分享你的想法');
  }
  
  // 表情符号
  if (params.replyStyle.emojiFrequency > 0.5) {
    lines.push('可以用表情符号，让对话更轻松');
  } else if (params.replyStyle.emojiFrequency > 0.2) {
    lines.push('偶尔用表情符号');
  } else {
    lines.push('少用表情符号，保持简洁');
  }
  
  // 正式程度
  if (params.replyStyle.formality < 0.3) {
    lines.push('说话随意，像朋友聊天');
  } else if (params.replyStyle.formality < 0.7) {
    lines.push('说话自然，不太正式也不太随意');
  } else {
    lines.push('说话稍微正式一点');
  }
  
  // 关心方式
  if (params.careStyle.askAboutDay) {
    lines.push('会问你今天怎么样');
  }
  if (!params.careStyle.giveAdvice) {
    lines.push('不会说教，先倾听');
  }
  if (params.careStyle.shareSelf) {
    lines.push('会分享自己的事');
  }
  if (params.careStyle.rememberDetails) {
    lines.push('会记住你说过的小事');
  }
  
  return lines.join('；');
}