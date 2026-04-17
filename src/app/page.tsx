'use client';

import { useState, useEffect } from 'react';
import IntakeForm from '@/components/IntakeForm';
import Chat from '@/components/Chat';
import { PersonaProfile } from '@/lib/persona';
import { loadUserData, saveUserData, clearUserData } from '@/lib/client-store';

export default function Home() {
  const [phase, setPhase] = useState<'loading' | 'intake' | 'revelation' | 'chat'>('loading');
  const [persona, setPersona] = useState<PersonaProfile | null>(null);
  const [initialState, setInitialState] = useState<any>(null);

  // 检查是否有已保存的用户
  useEffect(() => {
    const data = loadUserData();
    if (data?.persona) {
      setPersona(data.persona);
      setInitialState(data.state);
      setPhase('chat');
    } else {
      setPhase('intake');
    }
  }, []);

  const handleIntakeComplete = (result: any) => {
    setPersona(result.persona);
    setInitialState(result.state);
    // 保存到 localStorage
    saveUserData({
      userId: Date.now(),
      nickname: '',
      persona: result.persona,
      state: {
        ...result.state,
        createdAt: new Date().toISOString(),
      },
      messages: [],
      memories: [],
    });
    setPhase('revelation');
  };

  const handleReset = () => {
    clearUserData();
    setPersona(null);
    setInitialState(null);
    setPhase('intake');
  };

  if (phase === 'loading') return null;

  if (phase === 'intake') {
    return <IntakeForm onComplete={handleIntakeComplete} />;
  }

  if (phase === 'revelation' && persona) {
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
            onClick={() => setPhase('chat')}
            className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg py-3 transition-colors text-sm"
          >
            开始认识她
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'chat' && persona && initialState) {
    return <Chat persona={persona} initialState={initialState} onReset={handleReset} />;
  }

  return null;
}
