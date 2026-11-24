import { useOnlineStore } from '@/stores/onlineStore';
import { useSocketEvent } from '@/hooks/useSocketEvent';

interface PresencePayload {
  userId: number;
  online: boolean;
}

// Подія presence:update розсилається всім (io.emit) — тримаємо множину id онлайнових
// користувачів свіжою після кожного connect/disconnect сервера. setOnline зі сховища
// Zustand стабільний, тож обробник можна пасувати напряму (useSocketEvent сам
// обертає його в useEffectEvent).
export function usePresenceEvents() {
  const setOnline = useOnlineStore((s) => s.setOnline);
  useSocketEvent<PresencePayload>('presence:update', (p) => setOnline(p.userId, Boolean(p.online)));
}
