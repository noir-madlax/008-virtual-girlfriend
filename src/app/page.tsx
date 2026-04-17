'use client';

import { useState } from 'react';
import IntakeForm from '@/components/IntakeForm';
import Chat from '@/components/Chat';
import { PersonaProfile } from '@/lib/persona';

export default function Home() {
  const [phase, setPhase] = useState<'intake' | 'revelation' | 'chat'>('intake');
  const [userId, setUserId] = useState<number | null>(null);
  const [persona, setPersona] = useState<PersonaProfile | null>(null);

  const handleIntakeComplete = (result: any) => {
    setUserId(result.userId);
    setPersona(result.persona);
    setPhase('revelation');
  };

  if (phase === 'intake') {
    return <IntakeForm onComplete={handleIntakeComplete} />;
  }

  if (phase === 'revelation' && persona) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 text-zinc-100 p-6">
        <div className="max-w-md w-full space-y-8 text-center">
          {/* 她的形象占位 */}
          <div className="w-20 h-20 rounded-full bg-zinc-900 mx-auto flex items-center justify-center text-3xl border border-zinc-800">
            {persona.name[0]}
          </div>

          {/* 她的名字 */}
          <div className="space-y-1">
            <p className="text-zinc-500 text-xs tracking-widest uppercase">她叫</p>
            <h1 className="text-3xl font-light tracking-wide">{persona.name}</h1>
          </div>

          {/* 她的人格标签 */}
          <div className="flex flex-wrap justify-center gap-2">
            {persona.tags.map((tag, i) => (
              <span
                key={i}
                className="text-xs text-zinc-500 border border-zinc-800 rounded-full px-3 py-1"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* 她的本体论 */}
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

          {/* 一句话总结 */}
          <div className="border-t border-zinc-900 pt-6">
            <p className="text-zinc-500 text-sm italic">
              "{persona.summary}"
            </p>
          </div>

          {/* 开始按钮 */}
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

  if (phase === 'chat' && userId && persona) {
    return <Chat userId={userId} persona={persona} />;
  }

  return null;
}
