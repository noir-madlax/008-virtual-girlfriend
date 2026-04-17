'use client';

import { useState, useRef, useEffect } from 'react';
import { PersonaProfile } from '@/lib/persona';
import { STAGES } from '@/lib/state-machine';
import { saveUserData, loadUserData, UserData } from '@/lib/client-store';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface EmotionalState {
  affinity: number;
  trust: number;
  conflict: number;
  mood: number;
  initiative: number;
  stage: number;
  day: number;
}

interface Props {
  persona: PersonaProfile;
  initialState: EmotionalState;
  onReset: () => void;
}

export default function Chat({ persona, initialState, onReset }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [state, setState] = useState<EmotionalState>(initialState);
  const [showState, setShowState] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 加载历史
  useEffect(() => {
    const data = loadUserData();
    if (data?.messages?.length) {
      setMessages(data.messages as Message[]);
      if (data.state) {
        setState({
          affinity: data.state.affinity,
          trust: data.state.trust,
          conflict: data.state.conflict,
          mood: data.state.mood,
          initiative: data.state.initiative,
          stage: data.state.stage,
          day: Math.floor(
            (Date.now() - new Date(data.state.createdAt).getTime()) / (1000 * 60 * 60 * 24)
          ),
        });
      }
    }
  }, []);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    const newMessages: Message[] = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'chat',
          persona,
          state,
          messages: newMessages,
          message: userMessage,
        }),
      });
      const data = await res.json();

      if (data.error) {
        setMessages([...newMessages, { role: 'system', content: `出错了: ${data.error}` }]);
      } else {
        const allMessages = [...newMessages, { role: 'assistant' as const, content: data.message }];
        setMessages(allMessages);
        setState(data.state);

        if (data.stageTransition) {
          setMessages([
            ...allMessages,
            { role: 'system' as const, content: `✨ 关系变化: ${data.stageTransition}` },
          ]);
        }

        // 持久化到 localStorage
        saveUserData({
          userId: Date.now(),
          nickname: '',
          persona,
          state: {
            ...data.state,
            createdAt: loadUserData()?.state?.createdAt || new Date().toISOString(),
          },
          messages: allMessages,
          memories: [],
        });
      }
    } catch (err: any) {
      setMessages([...newMessages, { role: 'system', content: '网络出错了，再试一次？' }]);
    }

    setLoading(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-900">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-sm">
            {persona.name?.[0] || '她'}
          </div>
          <div>
            <p className="text-sm font-medium">{persona.name}</p>
            <p className="text-xs text-zinc-500">
              {STAGES[state.stage]?.name || '陌生人'}
              {state.day !== undefined && ` · 第${state.day}天`}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowState(!showState)}
            className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors px-2 py-1"
          >
            {showState ? '收起' : '状态'}
          </button>
          <button
            onClick={onReset}
            className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors px-2 py-1"
          >
            重来
          </button>
        </div>
      </div>

      {/* 状态面板 */}
      {showState && (
        <div className="px-4 py-3 border-b border-zinc-900">
          <div className="grid grid-cols-5 gap-3 text-center">
            <StateBar label="亲密度" value={state.affinity} color="bg-rose-500" />
            <StateBar label="信任度" value={state.trust} color="bg-blue-500" />
            <StateBar label="矛盾值" value={state.conflict} color="bg-amber-500" />
            <StateBar label="情绪" value={((state.mood + 1) / 2) * 100} color="bg-emerald-500" />
            <StateBar label="主动度" value={state.initiative} color="bg-violet-500" />
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center text-2xl">
              {persona.name?.[0] || '她'}
            </div>
            <div>
              <p className="text-zinc-300">{persona.name} 已就绪</p>
              <p className="text-zinc-600 text-sm mt-1">说点什么吧</p>
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <MessageBubble key={i} message={msg} />
        ))}

        {loading && (
          <div className="flex gap-1.5 px-3 py-2">
            <span className="w-2 h-2 bg-zinc-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-2 h-2 bg-zinc-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-2 h-2 bg-zinc-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-zinc-900">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="说点什么……"
            rows={1}
            className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors resize-none text-sm"
            style={{ minHeight: '40px', maxHeight: '120px' }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            className="bg-zinc-800 hover:bg-zinc-700 disabled:bg-zinc-900 disabled:text-zinc-700 text-zinc-200 rounded-lg px-4 py-2 transition-colors text-sm"
          >
            发送
          </button>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  if (message.role === 'system') {
    return (
      <div className="flex justify-center">
        <p className="text-xs text-zinc-600 bg-zinc-900/50 px-3 py-1 rounded-full">{message.content}</p>
      </div>
    );
  }

  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
          isUser ? 'bg-zinc-800 text-zinc-100 rounded-br-md' : 'bg-zinc-900 text-zinc-200 rounded-bl-md'
        }`}
      >
        {message.content}
      </div>
    </div>
  );
}

function StateBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-zinc-500">{label}</p>
      <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-500`}
          style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        />
      </div>
      <p className="text-xs text-zinc-600">{Math.round(value)}</p>
    </div>
  );
}
