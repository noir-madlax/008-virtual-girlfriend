-- 修复Supabase RLS策略
-- 在Supabase SQL编辑器中执行此脚本

-- 1. 为user_profiles表创建RLS策略
CREATE POLICY "允许所有操作" ON user_profiles
FOR ALL USING (true) WITH CHECK (true);

-- 2. 为girlfriend_params表创建RLS策略
CREATE POLICY "允许所有操作" ON girlfriend_params
FOR ALL USING (true) WITH CHECK (true);

-- 3. 为evolution_history表创建RLS策略
CREATE POLICY "允许所有操作" ON evolution_history
FOR ALL USING (true) WITH CHECK (true);

-- 4. 为messages表创建RLS策略
CREATE POLICY "允许所有操作" ON messages
FOR ALL USING (true) WITH CHECK (true);

-- 5. 为episodic_memory表创建RLS策略
CREATE POLICY "允许所有操作" ON episodic_memory
FOR ALL USING (true) WITH CHECK (true);

-- 注意：这些策略允许所有操作，适合开发环境
-- 生产环境应该创建更严格的策略