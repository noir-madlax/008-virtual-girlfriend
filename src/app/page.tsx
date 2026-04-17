'use client';

import { useState, useEffect } from 'react';
import IntakeForm from '@/components/IntakeForm';
import Chat from '@/components/Chat';
import { PersonaProfile } from '@/lib/persona';
import { supabase } from '@/lib/supabase';

type Phase = 'loading' | 'login' | 'intake' | 'revelation' | 'chat';

export default function Home() {
  const [phase, setPhase] = useState<Phase>('loading');
  const [persona, setPersona] = useState<PersonaProfile | null>(null);
  const [initialState, setInitialState] = useState<any>(null);
  const [user, setUser] = useState<any>(null);

  // 检查登录状态
  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setUser(session.user);
      await loadProfile(session.user.id);
    } else {
      setPhase('login');
    }
  };

  const loadProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (data?.persona_json?.name) {
      setPersona(data.persona_json);
      setInitialState({
        affinity: data.affinity,
        trust: data.trust,
        conflict: data.conflict,
        mood: data.mood,
        initiative: data.initiative,
        stage: data.stage,
        day: Math.floor((Date.now() - new Date(data.created_at).getTime()) / (1000 * 60 * 60 * 24)),
      });
      setPhase('chat');
    } else {
      setPhase('intake');
    }
  };

  const handleIntakeComplete = async (result: any) => {
    if (!user) return;
    setPersona(result.persona);

    const state = {
      ...result.state,
      createdAt: new Date().toISOString(),
    };
    setInitialState(state);

    // 保存 profile 到 Supabase
    await supabase.from('profiles').upsert({
      user_id: user.id,
      nickname: user.email?.split('@')[0] || 'user',
      persona_json: result.persona,
      affinity: result.state.affinity,
      trust: result.state.trust,
      conflict: result.state.conflict,
      mood: result.state.mood,
      initiative: result.state.initiative,
      stage: result.state.stage,
    });

    setPhase('revelation');
  };

  const handleReset = async () => {
    if (!user) return;
    await supabase.from('profiles').delete().eq('user_id', user.id);
    await supabase.from('messages').delete().eq('user_id', user.id);
    setPersona(null);
    setInitialState(null);
    setPhase('intake');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setPhase('login');
  };

  if (phase === 'loading') return null;
  if (phase === 'login') return <LoginPage onLogin={checkSession} />;
  if (phase === 'intake') return <IntakeForm onComplete={handleIntakeComplete} />;

  if (phase === 'revelation' && persona) {
    return <RevelationPage persona={persona} onStart={() => setPhase('chat')} />;
  }

  if (phase === 'chat' && persona && initialState && user) {
    return (
      <Chat
        persona={persona}
        initialState={initialState}
        userId={user.id}
        onReset={handleReset}
        onLogout={handleLogout}
      />
    );
  }

  return null;
}

// 登录页
function LoginPage({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!email || !password) return;
    setLoading(true);
    setError('');

    const action = isSignup ? 'signup' : 'login';
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, email, password }),
    });
    const data = await res.json();

    if (data.error) {
      setError(data.error);
    } else {
      // 设置 session
      if (data.session) {
        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });
      }
      onLogin();
    }
    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 text-zinc-100 p-6">
      <div className="max-w-sm w-full space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-light tracking-wide">她</h1>
          <p className="text-zinc-500 text-sm">{isSignup ? '创建账号' : '登录'}</p>
        </div>

        <div className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="邮箱"
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors"
            autoFocus
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="密码"
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors"
          />
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <button
            onClick={handleSubmit}
            disabled={loading || !email || !password}
            className="w-full bg-zinc-800 hover:bg-zinc-700 disabled:bg-zinc-900 disabled:text-zinc-700 text-zinc-200 rounded-lg py-3 transition-colors text-sm"
          >
            {loading ? '处理中……' : isSignup ? '注册' : '登录'}
          </button>
        </div>

        <button
          onClick={() => { setIsSignup(!isSignup); setError(''); }}
          className="w-full text-zinc-500 text-xs hover:text-zinc-300 transition-colors"
        >
          {isSignup ? '已有账号？登录' : '没有账号？注册'}
        </button>
      </div>
    </div>
  );
}

// 揭晓页
function RevelationPage({ persona, onStart }: { persona: PersonaProfile; onStart: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 text-zinc-100 p-6">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="w-20 h-20 rounded-full bg-zinc-900 mx-auto flex items-center justify-center text-3xl border border-zinc-800">
          {persona.name[0]}
        </div>
        <div className="space-y-1">
          <p className="text-zinc-500 text-xs tracking-widest uppercase">她叫</p>
          <h1 className="text-3xl font-light tracking-wide">{persona.name}</h1>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {persona.tags.map((tag, i) => (
            <span key={i} className="text-xs text-zinc-500 border border-zinc-800 rounded-full px-3 py-1">
              {tag}
            </span>
          ))}
        </div>
        <div className="space-y-4 text-left">
          <div className="space-y-2">
            <p className="text-xs text-zinc-600 uppercase tracking-widest">她是谁</p>
            <p className="text-sm text-zinc-400 leading-relaxed">{persona.existence}</p>
          </div>
          <div className="space-y-2">
            <p className="text-xs text-zinc-600 uppercase tracking-widest">她怎么看你</p>
            <p className="text-sm text-zinc-400 leading-relaxed">{persona.perception}</p>
          </div>
        </div>
        <div className="border-t border-zinc-900 pt-6">
          <p className="text-zinc-500 text-sm italic">"{persona.summary}"</p>
        </div>
        <button
          onClick={onStart}
          className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg py-3 transition-colors text-sm"
        >
          开始认识她
        </button>
      </div>
    </div>
  );
}
