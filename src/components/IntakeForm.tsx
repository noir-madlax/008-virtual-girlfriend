'use client';

import { useState } from 'react';

interface Props {
  onComplete: (result: any) => void;
}

const QUESTIONS = [
  {
    id: 'q1',
    question: '你一天中最想跟她说的第一句话是什么？',
    subtitle: '不是那种客套话——是你真正想倾诉的第一反应',
  },
  {
    id: 'q2',
    question: '你们在一起时，最理想的沉默是什么样的？',
    subtitle: '比如：各做各的事很舒服 / 她会找话 / 一起安静做事……',
  },
  {
    id: 'q3',
    question: '你人生中被谁「看见」过？那种被真正理解的瞬间是什么？',
    subtitle: '如果你从来没被看见过，也可以说"没有"——这本身就是重要信息',
  },
  {
    id: 'q4',
    question: '你最想从她那里听到的一句话是什么？',
    subtitle: '这句话暴露你最深的情感需求',
  },
  {
    id: 'q5',
    question: '你绝对不能接受她做的一件事是什么？',
    subtitle: '排除劈腿这种大是大非——说日常层面的，那种会让你心寒的行为',
  },
];

export default function IntakeForm({ onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [nickname, setNickname] = useState('');
  const [showNickname, setShowNickname] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleNicknameSubmit = () => {
    if (nickname.trim()) {
      setShowNickname(false);
    }
  };

  const handleAnswer = async () => {
    if (!currentAnswer.trim()) return;

    const newAnswers = { ...answers, [QUESTIONS[step].id]: currentAnswer.trim() };
    setAnswers(newAnswers);
    setCurrentAnswer('');

    if (step < QUESTIONS.length - 1) {
      setStep(step + 1);
    } else {
      // 所有问题回答完毕，提交
      setLoading(true);
      try {
        const res = await fetch('/api/user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nickname,
            answers: newAnswers,
          }),
        });
        const data = await res.json();
        onComplete(data);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (showNickname) {
        handleNicknameSubmit();
      } else {
        handleAnswer();
      }
    }
  };

  if (showNickname) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 text-zinc-100 p-6">
        <div className="max-w-md w-full space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-light tracking-wide">入学式</h1>
            <p className="text-zinc-500 text-sm">
              在认识她之前，先告诉我你是谁
            </p>
          </div>
          <div className="space-y-3">
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="你想让她怎么称呼你"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors"
              autoFocus
            />
            <button
              onClick={handleNicknameSubmit}
              disabled={!nickname.trim()}
              className="w-full bg-zinc-800 hover:bg-zinc-700 disabled:bg-zinc-900 disabled:text-zinc-700 text-zinc-200 rounded-lg py-3 transition-colors text-sm"
            >
              开始
            </button>
          </div>
        </div>
      </div>
    );
  }

  const q = QUESTIONS[step];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 text-zinc-100 p-6">
      <div className="max-w-md w-full space-y-6">
        {/* 进度 */}
        <div className="flex justify-center gap-2">
          {QUESTIONS.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-colors ${
                i === step ? 'bg-zinc-100' : i < step ? 'bg-zinc-600' : 'bg-zinc-800'
              }`}
            />
          ))}
        </div>

        {/* 问题 */}
        <div className="space-y-3 text-center">
          <p className="text-zinc-500 text-xs">
            {step + 1} / {QUESTIONS.length}
          </p>
          <h2 className="text-lg font-light leading-relaxed">
            {q.question}
          </h2>
          <p className="text-zinc-600 text-sm">
            {q.subtitle}
          </p>
        </div>

        {/* 输入 */}
        <div className="space-y-3">
          <textarea
            value={currentAnswer}
            onChange={(e) => setCurrentAnswer(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="说你的真实想法……"
            rows={3}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors resize-none"
            autoFocus
          />
          <button
            onClick={handleAnswer}
            disabled={!currentAnswer.trim() || loading}
            className="w-full bg-zinc-800 hover:bg-zinc-700 disabled:bg-zinc-900 disabled:text-zinc-700 text-zinc-200 rounded-lg py-3 transition-colors text-sm"
          >
            {loading ? '她正在了解你……' : step < QUESTIONS.length - 1 ? '下一题' : '认识她'}
          </button>
        </div>
      </div>
    </div>
  );
}
