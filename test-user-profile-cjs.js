const requests = require('requests');
const json = require('json');
const time = require('time');

// 由于Node.js不支持直接import，我们需要使用require
// 但requests模块可能需要安装，让我们使用fetch替代

console.log("测试用户画像功能...");
console.log("=".repeat(60));

const BASE_URL = "https://008-virtual-girlfriend.vercel.app";

// 使用fetch替代requests
async function testUserProfile() {
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
            const state = data.state || {};
            console.log(`   ✅ 人格创建成功`);
            console.log(`   名字: ${persona.name || '未知'}`);
            
            // 2. 发送包含职业信息的消息
            console.log("\n2. 发送包含职业信息的消息...");
            const testMessages = [
                "你好，我是调酒师",
                "今天酒吧很忙",
                "调了杯新鸡尾酒"
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
                await new Promise(resolve => setTimeout(resolve, 1000));
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
            
            // 4. 评估结果
            console.log("\n" + "=".repeat(60));
            console.log("评估结果:");
            
            if (userProfile && Object.keys(userProfile).length > 0) {
                if (userProfile.occupation) {
                    console.log("✅ 职业识别成功");
                } else {
                    console.log("❌ 职业识别失败");
                }
                
                if (userProfile.totalMessages > 0) {
                    console.log("✅ 用户画像数据已存储");
                } else {
                    console.log("❌ 用户画像数据未存储");
                }
                
                if (userProfile.activeHours && userProfile.activeHours.length > 0) {
                    console.log("✅ 活跃时段已记录");
                } else {
                    console.log("❌ 活跃时段未记录");
                }
            } else {
                console.log("❌ 用户画像功能未正常工作");
            }
            
        } else {
            console.log(`   ❌ 人格创建失败: ${createResponse.status}`);
        }
        
    } catch (error) {
        console.log(`   ❌ 请求失败: ${error.message}`);
    }
}

// 运行测试
testUserProfile();