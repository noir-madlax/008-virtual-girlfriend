import requests
import json
import time

print("重新测试用户画像功能...")
print("=" * 60)

BASE_URL = "https://008-virtual-girlfriend.vercel.app"

# 1. 创建用户人格
print("1. 创建用户人格...")
try:
    test_data = {
        "action": "create",
        "nickname": "调酒师小王",
        "answers": {
            "q1": "你在干嘛？",
            "q2": "不需要说话",
            "q3": "我老师",
            "q4": "你不用那么坚强",
            "q5": "太黏人"
        }
    }
    
    response = requests.post(f"{BASE_URL}/api/chat", json=test_data, timeout=30)
    if response.status_code == 200:
        data = response.json()
        persona = data.get('persona', {})
        state = data.get('state', {})
        print(f"   ✅ 人格创建成功")
        print(f"   名字: {persona.get('name', '未知')}")
    else:
        print(f"   ❌ 人格创建失败: {response.status_code}")
        exit(1)
except Exception as e:
    print(f"   ❌ 人格创建失败: {e}")
    exit(1)

# 2. 发送包含职业信息的消息
print("\n2. 发送包含职业信息的消息...")
test_messages = [
    "你好，我是调酒师",
    "今天酒吧很忙",
    "调了杯新鸡尾酒",
    "客人夸我调的酒好喝",
    "手都调酸了",
    "凌晨2点才下班",
    "周末酒吧人特别多"
]

for i, message in enumerate(test_messages, 1):
    print(f"   消息{i}: {message}")
    
    try:
        chat_data = {
            "action": "chat",
            "persona": persona,
            "state": state,
            "messages": [],
            "message": message,
            "userId": 1
        }
        
        response = requests.post(f"{BASE_URL}/api/chat", json=chat_data, timeout=60)
        if response.status_code == 200:
            data = response.json()
            reply = data.get('message', '')
            new_state = data.get('state', {})
            
            print(f"     女友: {reply[:60]}...")
            print(f"     状态: 亲密度={new_state.get('affinity', 0):.2f}, 信任度={new_state.get('trust', 0):.2f}")
            
            # 更新状态
            state = new_state
            
        else:
            print(f"     ❌ 发送失败: {response.status_code}")
    except Exception as e:
        print(f"     ❌ 请求失败: {e}")
    
    time.sleep(1)

# 3. 检查用户画像
print("\n3. 检查用户画像...")
try:
    response = requests.get(f"{BASE_URL}/api/user-profile?userId=1", timeout=15)
    if response.status_code == 200:
        data = response.json()
        user_profile = data.get('userProfile', {})
        girlfriend_params = data.get('girlfriendParams', {})
        evolution_history = data.get('evolutionHistory', [])
        
        print("   用户画像:")
        if user_profile:
            print(f"     职业: {user_profile.get('occupation', '未知')}")
            print(f"     活跃时段: {user_profile.get('activeHours', [])}")
            print(f"     平均消息长度: {user_profile.get('avgMessageLength', 0)}")
            print(f"     主动程度: {user_profile.get('initiativeRate', 0)}")
            print(f"     总消息数: {user_profile.get('totalMessages', 0)}")
        else:
            print("     暂无用户画像数据")
        
        print("\n   女友参数:")
        if girlfriend_params:
            params = girlfriend_params.get('params', {})
            sleep_schedule = params.get('sleepSchedule', {})
            print(f"     作息: 睡觉={sleep_schedule.get('start', 0)}:00, 起床={sleep_schedule.get('end', 0)}:00")
            
            reply_style = params.get('replyStyle', {})
            print(f"     回复长度: {reply_style.get('avgLength', 0)}")
            print(f"     表情频率: {reply_style.get('emojiFrequency', 0)}")
            
            initiative = params.get('initiative', {})
            print(f"     基础主动度: {initiative.get('baseLevel', 0)}")
            
            print(f"     进化阶段: {girlfriend_params.get('evolutionStage', '未知')}")
            print(f"     稳定性评分: {girlfriend_params.get('stabilityScore', 0)}")
        else:
            print("     暂无女友参数数据")
        
        print("\n   进化历史:")
        if evolution_history:
            for i, record in enumerate(evolution_history[:3]):  # 只显示前3条
                print(f"     {i+1}. {record.get('parameter', '')}: {record.get('oldValue', '')} → {record.get('newValue', '')}")
                print(f"        原因: {record.get('reason', '')}")
        else:
            print("     暂无进化记录")
    else:
        print(f"   ❌ 获取用户画像失败: {response.status_code}")
        print(f"   错误: {response.text[:200]}")
except Exception as e:
    print(f"   ❌ 获取用户画像失败: {e}")

# 4. 评估结果
print("\n" + "=" * 60)
print("评估结果:")

if user_profile:
    if user_profile.get('occupation'):
        print("✅ 职业识别成功")
    else:
        print("❌ 职业识别失败")
    
    if user_profile.get('totalMessages', 0) > 0:
        print("✅ 用户画像数据已存储")
    else:
        print("❌ 用户画像数据未存储")
    
    if user_profile.get('activeHours'):
        print("✅ 活跃时段已记录")
    else:
        print("❌ 活跃时段未记录")
else:
    print("❌ 用户画像功能未正常工作")

print("\n下一步:")
print("1. 如果用户画像仍然为空，请检查Supabase数据库表是否创建")
print("2. 如果职业识别失败，请检查用户特征提取逻辑")
print("3. 如果数据未存储，请检查用户画像存储逻辑")