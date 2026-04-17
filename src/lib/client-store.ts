/**
 * 浏览器端存储（localStorage）
 * 替代 SQLite，适配 Vercel serverless
 */

const STORAGE_KEY = '008_girlfriend';

export interface UserData {
  userId: number;
  nickname: string;
  persona: any;
  state: {
    affinity: number;
    trust: number;
    conflict: number;
    mood: number;
    initiative: number;
    stage: number;
    createdAt: string;
  };
  messages: Array<{ role: string; content: string; created_at?: string }>;
  memories: Array<any>;
}

export function saveUserData(data: UserData): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function loadUserData(): UserData | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearUserData(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

export function hasUser(): boolean {
  return loadUserData() !== null;
}
