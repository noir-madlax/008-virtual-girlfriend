// 全面测试所有功能

console.log("全面测试所有功能...");
console.log("=".repeat(60));

const BASE_URL = "https://008-virtual-girlfriend.vercel.app";

async function testAllFeatures() {
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
            console.log(`   初始状态: 亲密度=${state.affinity || 0}, 信任度=${state.trust || 0}`);
            
            // 2. 测试状态更新
            console.log("\n2. 测试状态更新...");
            const stateMessages = [
                "你好，我是调酒师",
                "今天酒吧很忙",
                "调了杯新鸡尾酒"
            ];
            
            for (let i = 0; i < stateMessages.length; i++) {
                const message = stateMessages[i];
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
                    const newState = chatData.state || {};
                    
                    console.log(`     状态: 亲密度=${(newState.affinity || 0).toFixed(2)}, 信任度=${(newState.trust || 0).toFixed(2)}`);
                    
                    // 更新状态
                    state = newState;
                } else {
                    console.log(`     ❌ 发送失败: ${chatResponse.status}`);
                }
                
                // 等待一下
                await new Promise(resolve => setTimeout(resolve, 200));
            }
            
            // 3. 测试吵醒机制
            console.log("\n3. 测试吵醒机制...");
            const wakeUpKeywords = [
                "醒醒！",
                "起床了！",
                "想你了"
            ];
            
            for (let i = 0; i < wakeUpKeywords.length; i++) {
                const message = wakeUpKeywords[i];
                console.log(`   消息${i+1}: ${message}`);
                
                const wakeUpData = {
                    action: "chat",
                    persona: persona,
                    state: state,
                    messages: [],
                    message: message,
                    userId: 1
                };
                
                const wakeUpResponse = await fetch(`${BASE_URL}/api/chat`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(wakeUpData)
                });
                
                if (wakeUpResponse.ok) {
                    const wakeUpData = await wakeUpResponse.json();
                    const reply = wakeUpData.message || '';
                    const newState = wakeUpData.state || {};
                    
                    console.log(`     女友: ${reply.substring(0, 60)}...`);
                    console.log(`     状态: 亲密度=${(newState.affinity || 0).toFixed(2)}, 信任度=${(newState.trust || 0).toFixed(2)}`);
                    
                    // 检查是否被吵醒
                    if (!reply.includes('睡') && !reply.includes('休息')) {
                        console.log("   ✅ 女友被吵醒了");
                        
                        // 检查是否有起床气
                        if (newState.mood < state.mood) {
                            console.log("   ✅ 女友有起床气（情绪下降）");
                        } else {
                            console.log("   ❌ 女友没有起床气");
                        }
                    } else {
                        console.log("   ❌ 女友没有被吵醒");
                    }
                    
                    // 更新状态
                    state = newState;
                } else {
                    console.log(`   ❌ 发送失败: ${wakeUpResponse.status}`);
                }
                
                // 等待一下
                await new Promise(resolve => setTimeout(resolve, 200));
            }
            
            // 4. 测试进化机制
            console.log("\n4. 测试进化机制...");
            const evolutionMessages = [
                "今天调了杯新鸡尾酒",
                "客人夸我调的酒好喝",
                "手都调酸了"
            ];
            
            for (let i = 0; i < evolutionMessages.length; i++) {
                const message = evolutionMessages[i];
                console.log(`   消息${i+1}: ${message}`);
                
                const evolutionData = {
                    action: "chat",
                    persona: persona,
                    state: state,
                    messages: [],
                    message: message,
                    userId: 1
                };
                
                const evolutionResponse = await fetch(`${BASE_URL}/api/chat`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(evolutionData)
                });
                
                if (evolutionResponse.ok) {
                    const evolutionData = await evolutionResponse.json();
                    const newState = evolutionData.state || {};
                    
                    console.log(`     状态: 亲密度=${(newState.affinity || 0).toFixed(2)}, 信任度=${(newState.trust || 0).toFixed(2)}`);
                    
                    // 更新状态
                    state = newState;
                } else {
                    console.log(`   ❌ 发送失败: ${evolutionResponse.status}`);
                }
                
                // 等待一下
                await new Promise(resolve => setTimeout(resolve, 200));
            }
            
            // 5. 检查用户画像
            console.log("\n5. 检查用户画像...");
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
                    console.log(`     作息: ${sleepSchedule.start || 0}:00 - ${sleepSchedule.end || 0}:00`);
                    
                    console.log(`     进化阶段: ${girlfriendParams.evolutionStage || '未知'}`);
                    console.log(`     稳定性评分: ${girlfriendParams.stabilityScore || 0}`);
                } else {
                    console.log("     暂无女友参数数据");
                }
                
                console.log("\n   进化历史:");
                if (evolutionHistory && evolutionHistory.length > 0) {
                    console.log(`     ✅ 有${evolutionHistory.length}条进化记录`);
                    for (let i = 0; i < Math.min(3, evolutionHistory.length); i++) {
                        const record = evolutionHistory[i];
                        console.log(`       ${i+1}. ${record.parameter || ''}: ${record.oldValue || ''} → ${record.newValue || ''}`);
                    }
                } else {
                    console.log("     ❌ 暂无进化记录");
                }
            } else {
                console.log(`   ❌ 获取用户画像失败: ${profileResponse.status}`);
            }
            
            // 6. 评估所有功能
            console.log("\n" + "=".repeat(60));
            console.log("功能评估:");
            
            // 检查状态更新
            console.log("1. 状态更新:");
            if (state.affinity > 10) {
                console.log("   ✅ 亲密度已更新");
            } else {
                console.log("   ❌ 亲密度未更新");
            }
            
            if (state.trust > 15) {
                console.log("   ✅ 信任度已更新");
            } else {
                console.log("   ❌ 信任度未更新");
            }
            
            // 检查吵醒机制
            console.log("\n2. 吵醒机制:");
            if (state.mood < 0.2) {
                console.log("   ✅ 女友有起床气");
            } else {
                console.log("   ❌ 女友没有起床气");
            }
            
            // 检查进化机制
            console.log("\n3. 进化机制:");
            if (evolutionHistory && evolutionHistory.length > 0) {
                console.log(`   ✅ 有${evolutionHistory.length}条进化记录`);
            } else {
                console.log("   ❌ 无进化记录");
            }
            
            // 检查用户画像
            console.log("\n4. 用户画像:");
            if (userProfile && Object.keys(userProfile).length > 0) {
                console.log("   ✅ 用户画像已生成");
                
                if (userProfile.occupation) {
                    console.log("   ✅ 职业识别成功");
                } else {
                    console.log("   ❌ 职业识别失败");
                }
                
                if (userProfile.totalMessages > 0) {
                    console.log("   ✅ 消息计数正常");
                } else {
                    console.log("   ❌ 消息计数异常");
                }
            } else {
                console.log("   ❌ 用户画像未生成");
            }
            
            // 检查女友参数
            console.log("\n5. 女友参数:");
            if (girlfriendParams && Object.keys(girlfriendParams).length > 0) {
                console.log("   ✅ 女友参数已生成");
                
                const params = girlfriendParams.params || {};
                if (params.sleepSchedule) {
                    console.log("   ✅ 作息参数已调整");
                } else {
                    console.log("   ❌ 作息参数未调整");
                }
            } else {
                console.log("   ❌ 女友参数未生成");
            }
            
        } else {
            console.log(`   ❌ 人格创建失败: ${createResponse.status}`);
        }
        
    } catch (error) {
        console.log(`   ❌ 请求失败: ${error.message}`);
    }
}

// 运行测试
testAllFeatures();