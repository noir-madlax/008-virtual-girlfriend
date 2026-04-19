// 测试吵醒机制

console.log("测试吵醒机制...");
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
                
                // 检查是否在睡眠状态
                if (reply.includes('睡') || reply.includes('休息') || reply.includes('💤')) {
                    console.log("   ✅ 女友在睡眠状态");
                } else {
                    console.log("   ❌ 女友不在睡眠状态");
                }
                
                // 更新状态
                state = newState;
            } else {
                console.log(`   ❌ 发送失败: ${sleepResponse.status}`);
            }
            
            // 3. 测试吵醒关键词
            console.log("\n3. 测试吵醒关键词...");
            const wakeUpKeywords = [
                "醒醒！",
                "起床了！",
                "想你了",
                "紧急！"
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
            
            // 4. 评估结果
            console.log("\n" + "=".repeat(60));
            console.log("评估结果:");
            
            // 检查吵醒机制
            console.log("1. 吵醒机制:");
            if (state.mood < 0.2) {
                console.log("   ✅ 女友有起床气");
            } else {
                console.log("   ❌ 女友没有起床气");
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