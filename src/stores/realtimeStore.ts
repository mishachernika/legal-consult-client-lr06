import { create } from 'zustand';

interface RealtimeState {
  connected: boolean;
  onlineUserIds: number[];
  setConnected: (connected: boolean) => void;
  setPresence: (userId: number, online: boolean) => void;
}

export const useRealtimeStore = create<RealtimeState>((set) => ({
  connected: false,
  onlineUserIds: [],
  setConnected: (connected) => set({ connected }),
  setPresence: (userId, online) =>
    set((state) => ({
      onlineUserIds: online
        ? [...new Set([...state.onlineUserIds, userId])]
        : state.onlineUserIds.filter((id) => id !== userId),
    })),
}));
