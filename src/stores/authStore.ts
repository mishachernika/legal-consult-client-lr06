import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types/api.types';
import type { TokenPair } from '@/types/auth.types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  login: (user: User, tokens: TokenPair) => void;
  setUser: (user: User) => void;
  setTokens: (tokens: TokenPair) => void;
  logout: () => void;
}

// Єдине джерело правди про сесію: middleware persist сам зберігає стан у localStorage
// (ключ auth-storage) і відновлює його після перезавантаження сторінки.
// Примітка: localStorage доступний будь-якому JS на сторінці (XSS-ризик) — у навчальному
// проєкті це свідомий вибір; у проді refresh мав би бути в httpOnly-кукі, а access — в пам'яті.
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      login: (user, tokens) =>
        set({ user, accessToken: tokens.accessToken, refreshToken: tokens.refreshToken }),
      setUser: (user) => set({ user }),
      setTokens: (tokens) =>
        set({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken }),
      logout: () => set({ user: null, accessToken: null, refreshToken: null }),
    }),
    { name: 'auth-storage' }
  )
);
