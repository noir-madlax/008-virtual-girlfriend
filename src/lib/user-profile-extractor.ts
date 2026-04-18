/**
 * 用户特征提取器 (User Profile Extractor)
 * 
 * 从对话中提取用户特征：作息、职业、习惯、情绪模式
 */

export interface UserBehaviorPattern {
  // 活跃时段
  activeHours: number[]; // 0-23，用户常在线的小时
  sleepHours: { start: number; end: number } | null; // 推测的睡眠时间
  
  // 回复模式
  avgResponseTime: number; // 平均回复时间（分钟）
  avgMessageLength: number; // 平均消息长度
  initiativeRate: number; // 主动发起对话比例
  
  // 情绪模式
  moodPattern: Record<string, number>; // 时段→情绪值
  stressKeywords: string[]; // 压力关键词
  
  // 生活信息（从对话中提取）
  occupation: string | null;
  hobbies: string[];
  timezone: string | null;
  
  // 统计数据
  totalMessages: number;
  lastActive: string;
  daysSinceFirst: number;
}

export interface ConversationInsight {
  timestamp: Date;
  content: string;
  extractedInfo: {
    timeReference?: string; // "刚下班"、"凌晨3点"
    occupation?: string;
    mood?: string;
    activity?: string;
    location?: string;
  };
}

// 从消息中提取时间相关信息
export function extractTimeReferences(message: string): string[] {
  const timePatterns = [
    /凌晨|深夜|半夜|通宵/,
    /早上|上午|早晨/,
    /中午|午休/,
    /下午|傍晚/,
    /晚上|夜晚/,
    /下班后|下班了/,
    /周末|休息日|放假/,
    /加班|值班/,
  ];
  
  const references: string[] = [];
  for (const pattern of timePatterns) {
    if (pattern.test(message)) {
      references.push(pattern.source.replace(/[\/\\]/g, ''));
    }
  }
  return references;
}

// 从消息中提取职业信息
export function extractOccupation(message: string): string | null {
  const occupationPatterns = [
    { pattern: /程序员|开发|码农|写代码/, occupation: '程序员' },
    { pattern: /设计师|UI|UX|美工/, occupation: '设计师' },
    { pattern: /医生|护士|医院/, occupation: '医疗工作者' },
    { pattern: /老师|教授|讲师/, occupation: '教育工作者' },
    { pattern: /销售|业务|客户经理/, occupation: '销售' },
    { pattern: /调酒师|酒吧|调酒/, occupation: '调酒师' },
    { pattern: /厨师|餐饮|做饭/, occupation: '餐饮工作者' },
    { pattern: /司机|开车|滴滴/, occupation: '司机' },
    { pattern: /记者|编辑|媒体/, occupation: '媒体工作者' },
    { pattern: /金融|银行|证券/, occupation: '金融从业者' },
    { pattern: /律师|法务/, occupation: '法律工作者' },
    { pattern: /创业|老板|CEO/, occupation: '创业者' },
    { pattern: /学生|大学|研究生/, occupation: '学生' },
  ];
  
  for (const { pattern, occupation } of occupationPatterns) {
    if (pattern.test(message)) {
      return occupation;
    }
  }
  return null;
}

// 从消息中提取情绪关键词
export function extractMoodKeywords(message: string): { mood: string; intensity: number } | null {
  const moodPatterns = [
    { pattern: /开心|高兴|快乐|兴奋|爽/, mood: 'positive', intensity: 0.8 },
    { pattern: /还行|不错|挺好|一般/, mood: 'neutral', intensity: 0.5 },
    { pattern: /累|疲惫|困|乏/, mood: 'tired', intensity: 0.3 },
    { pattern: /烦|烦躁|郁闷|不爽/, mood: 'negative', intensity: 0.2 },
    { pattern: /难过|伤心|哭|痛苦/, mood: 'sad', intensity: 0.1 },
    { pattern: /生气|愤怒|气死|火大/, mood: 'angry', intensity: 0.1 },
    { pattern: /焦虑|担心|紧张|压力/, mood: 'anxious', intensity: 0.2 },
  ];
  
  for (const { pattern, mood, intensity } of moodPatterns) {
    if (pattern.test(message)) {
      return { mood, intensity };
    }
  }
  return null;
}

// 从消息中提取活动信息
export function extractActivity(message: string): string | null {
  const activityPatterns = [
    { pattern: /吃饭|用餐|午餐|晚餐|宵夜/, activity: 'eating' },
    { pattern: /工作|上班|加班|开会/, activity: 'working' },
    { pattern: /睡觉|休息|躺|床/, activity: 'resting' },
    { pattern: /运动|健身|跑步|游泳/, activity: 'exercising' },
    { pattern: /看书|阅读|学习|读书/, activity: 'reading' },
    { pattern: /游戏|打游戏|玩/, activity: 'gaming' },
    { pattern: /电影|电视|剧|综艺/, activity: 'watching' },
    { pattern: /出门|逛街|购物|超市/, activity: 'goingOut' },
    { pattern: /通勤|地铁|公交|路上/, activity: 'commuting' },
    { pattern: /洗澡|洗漱|护肤/, activity: 'selfCare' },
  ];
  
  for (const { pattern, activity } of activityPatterns) {
    if (pattern.test(message)) {
      return activity;
    }
  }
  return null;
}

// 分析单条消息，提取洞察
export function analyzeMessage(message: string, timestamp: Date): ConversationInsight {
  const hour = timestamp.getHours();
  const timeReferences = extractTimeReferences(message);
  const occupation = extractOccupation(message);
  const moodResult = extractMoodKeywords(message);
  const activity = extractActivity(message);
  
  // 推断时间参考
  let timeRef = timeReferences[0];
  if (!timeRef && hour >= 0 && hour < 6) timeRef = '深夜';
  else if (!timeRef && hour >= 6 && hour < 12) timeRef = '上午';
  else if (!timeRef && hour >= 12 && hour < 14) timeRef = '中午';
  else if (!timeRef && hour >= 14 && hour < 18) timeRef = '下午';
  else if (!timeRef && hour >= 18 && hour < 24) timeRef = '晚上';
  
  return {
    timestamp,
    content: message,
    extractedInfo: {
      timeReference: timeRef,
      occupation: occupation || undefined,
      mood: moodResult?.mood,
      activity: activity || undefined,
    },
  };
}

// 更新用户行为模式
export function updateUserPattern(
  currentPattern: UserBehaviorPattern,
  insight: ConversationInsight
): UserBehaviorPattern {
  const hour = insight.timestamp.getHours();
  const dayOfWeek = insight.timestamp.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  
  // 更新活跃时段
  const newActiveHours = [...currentPattern.activeHours];
  if (!newActiveHours.includes(hour)) {
    newActiveHours.push(hour);
  }
  
  // 更新职业信息
  let occupation = currentPattern.occupation;
  if (insight.extractedInfo.occupation && !occupation) {
    occupation = insight.extractedInfo.occupation;
  }
  
  // 更新情绪模式
  const moodPattern = { ...currentPattern.moodPattern };
  if (insight.extractedInfo.mood) {
    const timeKey = isWeekend ? `weekend_${hour}` : `weekday_${hour}`;
    moodPattern[timeKey] = insight.extractedInfo.mood === 'positive' ? 0.8 :
                          insight.extractedInfo.mood === 'negative' ? 0.2 : 0.5;
  }
  
  // 更新统计
  const totalMessages = currentPattern.totalMessages + 1;
  const lastActive = insight.timestamp.toISOString();
  
  // 计算消息长度
  const avgMessageLength = (currentPattern.avgMessageLength * currentPattern.totalMessages + insight.content.length) / totalMessages;
  
  return {
    ...currentPattern,
    activeHours: newActiveHours,
    occupation,
    moodPattern,
    totalMessages,
    lastActive,
    avgMessageLength,
  };
}

// 推断用户作息
export function inferSleepSchedule(pattern: UserBehaviorPattern): { start: number; end: number } | null {
  const activeHours = pattern.activeHours;
  if (activeHours.length < 5) return null; // 数据不足
  
  // 找出最不活跃的时段作为睡眠时间
  const hourCounts = new Array(24).fill(0);
  for (const hour of activeHours) {
    hourCounts[hour]++;
  }
  
  // 找出连续6小时最不活跃的时段
  let minActivity = Infinity;
  let sleepStart = 23; // 默认23点睡
  
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

// 生成用户画像摘要
export function generateProfileSummary(pattern: UserBehaviorPattern): string {
  const lines: string[] = [];
  
  if (pattern.occupation) {
    lines.push(`职业: ${pattern.occupation}`);
  }
  
  if (pattern.activeHours.length > 0) {
    const sortedHours = [...pattern.activeHours].sort((a, b) => a - b);
    const peakHour = sortedHours[Math.floor(sortedHours.length / 2)];
    let timeDesc = '';
    if (peakHour >= 0 && peakHour < 6) timeDesc = '夜猫子';
    else if (peakHour >= 6 && peakHour < 12) timeDesc = '早鸟';
    else if (peakHour >= 12 && peakHour < 18) timeDesc = '下午活跃';
    else timeDesc = '晚间活跃';
    lines.push(`活跃模式: ${timeDesc} (峰值 ${peakHour}:00)`);
  }
  
  if (pattern.avgMessageLength > 0) {
    const lengthDesc = pattern.avgMessageLength > 50 ? '详细型' : 
                      pattern.avgMessageLength > 20 ? '适中型' : '简洁型';
    lines.push(`表达风格: ${lengthDesc} (平均${Math.round(pattern.avgMessageLength)}字)`);
  }
  
  if (pattern.hobbies.length > 0) {
    lines.push(`兴趣: ${pattern.hobbies.join(', ')}`);
  }
  
  return lines.join('\n');
}