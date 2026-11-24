import { useEffect, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { socket } from '@/services/socket';
import { useAuthStore } from '@/stores/authStore';
import { useRealtimeStore } from '@/stores/realtimeStore';
import type { AppNotification } from '@/types/api.types';

interface EventEnvelope<T> {
  id?: number;
  payload?: T;
}

interface ReplayEvent {
  id: number;
  event: string;
  payload: unknown;
}

const LAST_EVENT_KEY = 'legal-consult:last-event-id';

// Одне з'єднання на застосунок: події лише інвалідують кеш TanStack Query,
// тому REST лишається єдиним джерелом повних даних.
export default function RealtimeProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((state) => state.accessToken);
  const setConnected = useRealtimeStore((state) => state.setConnected);
  const setPresence = useRealtimeStore((state) => state.setPresence);

  useEffect(() => {
    if (!accessToken) {
      socket.disconnect();
      setConnected(false);
      return;
    }

    socket.auth = {
      token: accessToken,
      lastEventId: Number(localStorage.getItem(LAST_EVENT_KEY) ?? '0'),
    };

    const remember = (id?: number) => {
      if (id) localStorage.setItem(LAST_EVENT_KEY, String(id));
    };
    const refreshConsultations = (event: EventEnvelope<unknown>) => {
      remember(event.id);
      void queryClient.invalidateQueries({ queryKey: ['consultations'] });
    };
    const refreshLawyers = (event: EventEnvelope<unknown>) => {
      remember(event.id);
      void queryClient.invalidateQueries({ queryKey: ['lawyers'] });
    };
    const notification = (event: { id?: number; notification?: AppNotification }) => {
      remember(event.id);
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
      const item = event.notification;
      if (item) toast(item.title, { icon: '🔔' });
    };
    const message = (event: { id?: number; message?: { consultationId: number } }) => {
      remember(event.id);
      const id = event.message?.consultationId;
      if (id) void queryClient.invalidateQueries({ queryKey: ['consultations', id, 'messages'] });
    };
    const presence = (payload: { userId: number; online: boolean }) =>
      setPresence(payload.userId, payload.online);
    const replay = (events: ReplayEvent[]) => {
      for (const event of events) {
        remember(event.id);
        if (event.event.startsWith('consultation:'))
          void queryClient.invalidateQueries({ queryKey: ['consultations'] });
        if (event.event.startsWith('lawyer:'))
          void queryClient.invalidateQueries({ queryKey: ['lawyers'] });
        if (event.event === 'notification:new')
          void queryClient.invalidateQueries({ queryKey: ['notifications'] });
      }
    };

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('connect_error', () => setConnected(false));
    socket.on('consultation:created', refreshConsultations);
    socket.on('consultation:updated', refreshConsultations);
    socket.on('consultation:deleted', refreshConsultations);
    socket.on('lawyer:updated', refreshLawyers);
    socket.on('lawyer:deleted', refreshLawyers);
    socket.on('notification:new', notification);
    socket.on('message:new', message);
    socket.on('presence:update', presence);
    socket.on('events:replay', replay);
    socket.connect();

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.off('consultation:created', refreshConsultations);
      socket.off('consultation:updated', refreshConsultations);
      socket.off('consultation:deleted', refreshConsultations);
      socket.off('lawyer:updated', refreshLawyers);
      socket.off('lawyer:deleted', refreshLawyers);
      socket.off('notification:new', notification);
      socket.off('message:new', message);
      socket.off('presence:update', presence);
      socket.off('events:replay', replay);
      socket.disconnect();
      setConnected(false);
    };
  }, [accessToken, queryClient, setConnected, setPresence]);

  return <>{children}</>;
}
