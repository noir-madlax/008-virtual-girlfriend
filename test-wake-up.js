// 测试吵醒机制和起床气功能

console.log("测试吵醒机制和起床气功能...");
console.log("=".repeat(60));

const BASE_URL = "https://008-virtual-girlfriend.vercel.app";

async function testWakeUpMechanism() {
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
            
            // 2. 测试睡眠状态
            console.log("\n2. 测试睡眠状态...");
            const sleepMessage = "你好，我是调酒师";
            console.log(`   消息: ${sleepMessage}`);
            
            const sleepData = {
                action: "chat",
                persona: persona,
                state: state,
                messages: [],
                message: sleepMessage,
                userId: 1
            };
            
            const sleepResponse = await fetch(`${BASE_URL}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(sleepData)
            });
            
            if (sleepResponse.ok) {
                const sleepData = await sleepResponse.json();
                const reply = sleepData.message || '';
                const newState = sleepData.state || {};
                
                console.log(`     女友: ${reply.substring(0, 60)}...`);
                console.log(`     状态: 亲密度=${(newState.affinity || 0).toFixed(2)}, 信任度=${(newState.trust || 0).toFixed(2)}`);
                console.log(`     情绪: ${(newState.mood || 0).toFixed(2)}, 主动度=${(newState.initiative || 0).toFixed(2)}`);
                
                // 检查是否在睡眠状态
                if (reply.includes('睡') || reply.includes('休息')) {
                    console.log("   ✅ 女友在睡眠状态");
                } else {
                    console.log("   ❌ 女友不在睡眠状态");
                }
            } else {
                console.log(`   ❌ 发送失败: ${sleepResponse.status}`);
            }
            
            // 3. 测试吵醒机制
            console.log("\n3. 测试吵醒机制...");
            const wakeUpMessages = [
                "醒醒！",
                "起床了！",
                "紧急！",
                "重要！"
            ];
            
            for (let i = 0; i < wakeUpMessages.length; i++) {
                const message = wakeUpMessages[i];
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
                    console.log(`     情绪: ${(newState.mood || 0).toFixed(2)}, 主动度=${(newState.initiative || 0).toFixed(2)}`);
                    
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
                await new Promise(resolve => setTimeout(resolve, 500));
            }
            
            // 4. 检查用户画像
            console.log("\n4. 检查用户画像...");
            const profileResponse = await fetch(`${BASE_URL}/api/user-profile?userId=1`);
            
            if (profileResponse.ok) {
                const profileData = await profileResponse.json();
                const userProfile = profileData.userProfile || {};
                const girlfriendParams = profileData.girlfriendParams || {};
                const evolutionHistory = profileData.evolutionHistory || [];
                
                console.log("   用户画像:");
                if (userProfile && Object.keys(userProfile).length > 0) {
                    console.log(`     职业: ${userProfile.occupation || '未知'}`);
                    console.log(`     总消息数: ${userProfile.totalMessages || 0}`);
                } else {
                    console.log("     暂无用户画像数据");
                }
                
                console.log("\n   女友参数:");
                if (girlfriendParams && Object.keys(girlfriendParams).length > 0) {
                    const params = girlfriendParams.params || {};
                    const sleepSchedule = params.sleepSchedule || {};
                    console.log(`     作息: 睡觉=${sleepSchedule.start || 0}:00, 起床=${sleepSchedule.end || 0}:00`);
                    
                    console.log(`     进化阶段: ${girlfriendParams.evolutionStage || '未知'}`);
                    console.log(`     稳定性评分: ${girlfriendParams.stabilityScore || 0}`);
                } else {
                    console.log("     暂无女友参数数据");
                }
                
                console.log("\n   进化历史:");
                if (evolutionHistory && evolutionHistory.length > 0) {
                    for (let i = 0; i < Math.min(3, evolutionHistory.length); i++) {
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
            
            // 5. 评估结果
            console.log("\n" + "=".repeat(60));
            console.log("评估结果:");
            
            // 检查吵醒机制
            console.log("1. 吵醒机制:");
            if (state.mood < 0) {
                console.log("   ✅ 女友有起床气");
            } else {
                console.log("   ❌ 女友没有起床气");
            }
            
            // 检查状态更新
            console.log("\n2. 状态更新:");
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
            
            // 检查用户画像
            console.log("\n3. 用户画像:");
            if (userProfile && userProfile.totalMessages > 0) {
                console.log("   ✅ 用户画像已更新");
            } else {
                console.log("   ❌ 用户画像未更新");
            }
            
        } else {
            console.log(`   ❌ 人格创建失败: ${createResponse.status}`);
        }
        
    } catch (error) {
        console.log(`   ❌ 请求失败: ${error.message}`);
    }
}

// 运行测试
testWakeUpMechanism();