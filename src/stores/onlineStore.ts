import { create } from 'zustand';

// Онлайн-присутність: сервер розсилає presence:update { userId, online } на кожне
// підключення/відключення WebSocket (лабораторна 3, presence.js).
interface OnlineState {
  onlineIds: Set<number>;
  setOnline: (userId: number, online: boolean) => void;
}

export const useOnlineStore = create<OnlineState>((set) => ({
  onlineIds: new Set<number>(),

  setOnline: (userId, online) =>
    set((state) => {
      const next = new Set(state.onlineIds);
      if (online) next.add(userId);
      else next.delete(userId);
      return { onlineIds: next };
    }),
}));
