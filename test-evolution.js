// 测试进化机制功能

console.log("测试进化机制功能...");
console.log("=".repeat(60));

const BASE_URL = "https://008-virtual-girlfriend.vercel.app";

async function testEvolutionMechanism() {
    try {
        // 1. 创建用户人格
        console.log("1. 创建用户人格...");
        const testData = {
            action: "create",
            nickname: "调酒师小王",
            answers: {
                q1: "你在干嘛？",
                q2: "不需要说话",
                q3: "我老师",
                q4: "你不用那么坚强",
                q5: "太黏人"
            }
        };
        
        const createResponse = await fetch(`${BASE_URL}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testData)
        });
        
        if (createResponse.ok) {
            const data = await createResponse.json();
            const persona = data.persona || {};
            let state = data.state || {};
            console.log(`   ✅ 人格创建成功`);
            console.log(`   名字: ${persona.name || '未知'}`);
            
            // 2. 发送多条消息，触发进化机制
            console.log("\n2. 发送多条消息，触发进化机制...");
            const testMessages = [
                // 第1天：工作日
                "准备去上班了，今天酒吧应该会很忙",
                "连续调了20杯酒，手有点酸",
                "终于打烊了，今天收入不错",
                "到家了，累得不想动",
                
                // 第2天：休息日
                "刚睡醒，今天休息",
                "在家自己调了杯酒喝",
                "看了一部电影",
                "准备睡觉了，明天要上班",
                
                // 第3天：周末工作
                "周末酒吧人特别多",
                "有个客人喝醉了，有点难搞",
                "凌晨2点才下班",
                "周末终于结束了，好累",
                
                // 第4天：深度互动
                "今天心情不好",
                "有个客人很难搞",
                "想你了",
                "晚安",
                
                // 第5天：更多互动
                "今天调了杯新鸡尾酒",
                "客人夸我调的酒好喝",
                "手都调酸了",
                "凌晨1点才下班"
            ];
            
            for (let i = 0; i < testMessages.length; i++) {
                const message = testMessages[i];
                console.log(`   消息${i+1}: ${message}`);
                
                const chatData = {
                    action: "chat",
                    persona: persona,
                    state: state,
                    messages: [],
                    message: message,
                    userId: 1
                };
                
                const chatResponse = await fetch(`${BASE_URL}/api/chat`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(chatData)
                });
                
                if (chatResponse.ok) {
                    const chatData = await chatResponse.json();
                    const reply = chatData.message || '';
                    const newState = chatData.state || {};
                    
                    console.log(`     女友: ${reply.substring(0, 60)}...`);
                    console.log(`     状态: 亲密度=${(newState.affinity || 0).toFixed(2)}, 信任度=${(newState.trust || 0).toFixed(2)}`);
                    
                    // 更新状态
                    state = newState;
                } else {
                    console.log(`     ❌ 发送失败: ${chatResponse.status}`);
                }
                
                // 等待一下
                await new Promise(resolve => setTimeout(resolve, 500));
            }
            
            // 3. 检查用户画像
            console.log("\n3. 检查用户画像...");
            const profileResponse = await fetch(`${BASE_URL}/api/user-profile?userId=1`);
            
            let userProfile = {};
            let girlfriendParams = {};
            let evolutionHistory = [];
            
            if (profileResponse.ok) {
                const profileData = await profileResponse.json();
                userProfile = profileData.userProfile || {};
                girlfriendParams = profileData.girlfriendParams || {};
                evolutionHistory = profileData.evolutionHistory || [];
                
                console.log("   用户画像:");
                if (userProfile && Object.keys(userProfile).length > 0) {
                    console.log(`     职业: ${userProfile.occupation || '未知'}`);
                    console.log(`     活跃时段: ${userProfile.activeHours || []}`);
                    console.log(`     平均消息长度: ${userProfile.avgMessageLength || 0}`);
                    console.log(`     主动程度: ${userProfile.initiativeRate || 0}`);
                    console.log(`     总消息数: ${userProfile.totalMessages || 0}`);
                } else {
                    console.log("     暂无用户画像数据");
                }
                
                console.log("\n   女友参数:");
                if (girlfriendParams && Object.keys(girlfriendParams).length > 0) {
                    const params = girlfriendParams.params || {};
                    const sleepSchedule = params.sleepSchedule || {};
                    console.log(`     作息: 睡觉=${sleepSchedule.start || 0}:00, 起床=${sleepSchedule.end || 0}:00`);
                    
                    const replyStyle = params.replyStyle || {};
                    console.log(`     回复长度: ${replyStyle.avgLength || 0}`);
                    console.log(`     表情频率: ${replyStyle.emojiFrequency || 0}`);
                    
                    const initiative = params.initiative || {};
                    console.log(`     基础主动度: ${initiative.baseLevel || 0}`);
                    
                    console.log(`     进化阶段: ${girlfriendParams.evolutionStage || '未知'}`);
                    console.log(`     稳定性评分: ${girlfriendParams.stabilityScore || 0}`);
                } else {
                    console.log("     暂无女友参数数据");
                }
                
                console.log("\n   进化历史:");
                if (evolutionHistory && evolutionHistory.length > 0) {
                    for (let i = 0; i < Math.min(5, evolutionHistory.length); i++) {
                        const record = evolutionHistory[i];
                        console.log(`     ${i+1}. ${record.parameter || ''}: ${record.oldValue || ''} → ${record.newValue || ''}`);
                        console.log(`        原因: ${record.reason || ''}`);
                    }
                } else {
                    console.log("     暂无进化记录");
                }
            } else {
                console.log(`   ❌ 获取用户画像失败: ${profileResponse.status}`);
            }
            
            // 4. 评估进化机制
            console.log("\n" + "=".repeat(60));
            console.log("进化机制评估:");
            
            // 检查用户特征提取
            console.log("1. 用户特征提取:");
            if (userProfile.occupation) {
                console.log("   ✅ 职业识别成功");
            } else {
                console.log("   ❌ 职业识别失败");
            }
            
            if (userProfile.activeHours && userProfile.activeHours.length > 0) {
                console.log("   ✅ 活跃时段已记录");
            } else {
                console.log("   ❌ 活跃时段未记录");
            }
            
            if (userProfile.totalMessages > 0) {
                console.log("   ✅ 消息计数正常");
            } else {
                console.log("   ❌ 消息计数异常");
            }
            
            // 检查女友参数调整
            console.log("\n2. 女友参数调整:");
            if (girlfriendParams && Object.keys(girlfriendParams).length > 0) {
                console.log("   ✅ 女友参数已生成");
                
                const params = girlfriendParams.params || {};
                if (params.sleepSchedule) {
                    console.log("   ✅ 作息参数已调整");
                } else {
                    console.log("   ❌ 作息参数未调整");
                }
                
                if (params.replyStyle) {
                    console.log("   ✅ 回复风格已调整");
                } else {
                    console.log("   ❌ 回复风格未调整");
                }
                
                if (params.initiative) {
                    console.log("   ✅ 主动度已调整");
                } else {
                    console.log("   ❌ 主动度未调整");
                }
            } else {
                console.log("   ❌ 女友参数未生成");
            }
            
            // 检查进化机制
            console.log("\n3. 进化机制:");
            if (evolutionHistory && evolutionHistory.length > 0) {
                console.log(`   ✅ 有${evolutionHistory.length}条进化记录`);
            } else {
                console.log("   ❌ 无进化记录");
            }
            
            if (girlfriendParams.evolutionStage) {
                console.log(`   ✅ 进化阶段: ${girlfriendParams.evolutionStage}`);
            } else {
                console.log("   ❌ 进化阶段未设置");
            }
            
            if (girlfriendParams.stabilityScore) {
                console.log(`   ✅ 稳定性评分: ${girlfriendParams.stabilityScore}`);
            } else {
                console.log("   ❌ 稳定性评分未设置");
            }
            
        } else {
            console.log(`   ❌ 人格创建失败: ${createResponse.status}`);
        }
        
    } catch (error) {
        console.log(`   ❌ 请求失败: ${error.message}`);
    }
}

// 运行测试
testEvolutionMechanism();