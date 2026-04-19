// 测试状态更新和进化机制

console.log("测试状态更新和进化机制...");
console.log("=".repeat(60));

const BASE_URL = "https://008-virtual-girlfriend.vercel.app";

async function testStateUpdate() {
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
            
            // 2. 发送10条消息，测试状态更新
            console.log("\n2. 发送10条消息，测试状态更新...");
            for (let i = 1; i <= 10; i++) {
                const message = `消息${i}: 测试状态更新`;
                console.log(`   ${message}`);
                
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
            
            // 3. 检查用户画像
            console.log("\n3. 检查用户画像...");
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
            
            // 4. 评估结果
            console.log("\n" + "=".repeat(60));
            console.log("评估结果:");
            
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
            
            // 检查进化机制
            console.log("\n2. 进化机制:");
            if (evolutionHistory && evolutionHistory.length > 0) {
                console.log("   ✅ 进化机制正常工作");
            } else {
                console.log("   ❌ 进化机制未触发");
            }
            
        } else {
            console.log(`   ❌ 人格创建失败: ${createResponse.status}`);
        }
        
    } catch (error) {
        console.log(`   ❌ 请求失败: ${error.message}`);
    }
}

// 运行测试
testStateUpdate();