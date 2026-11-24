import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import NotificationBell from '@/components/NotificationBell';
import { useNotificationsStore } from '@/stores/notificationsStore';

// Мок Socket: карта обробників замість справжнього з'єднання.
// Тест перевіряє саме інтеграцію «подія → сховище → лічильник», не мережу.
type Handler = (payload: unknown) => void;
const handlers = new Map<string, Set<Handler>>();

vi.mock('@/services/socket', () => ({
  socket: {
    on: vi.fn((event: string, handler: Handler) => {
      if (!handlers.has(event)) handlers.set(event, new Set());
      handlers.get(event)!.add(handler);
    }),
    off: vi.fn((event: string, handler: Handler) => {
      handlers.get(event)?.delete(handler);
    }),
    connected: true,
  },
  connectSocket: vi.fn(),
  disconnectSocket: vi.fn(),
}));

function emit(event: string, payload: unknown): void {
  for (const handler of handlers.get(event) ?? []) handler(payload);
}

describe('NotificationBell', () => {
  beforeEach(() => {
    handlers.clear();
    vi.clearAllMocks();
    useNotificationsStore.setState({ notifications: [] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('додає подію notification:new до сховища і показує лічильник', async () => {
    render(<NotificationBell />);

    // спочатку дзвіночок без значка
    expect(screen.getByRole('button', { name: /непрочитаних 0/i })).toBeInTheDocument();

    await act(async () => {
      emit('notification:new', {
        notification: { id: 1, type: 'success', title: 'Успішно', body: 'Консультацію створено' },
      });
    });

    const bell = screen.getByRole('button', { name: /непрочитаних 1/i });
    expect(bell).toBeInTheDocument();
    expect(bell).toHaveTextContent('1');

    // у випадному списку — текст сповіщення
    await userEvent.click(bell);
    expect(screen.getByText('Консультацію створено')).toBeInTheDocument();
  });

  it('знімає підписку після unmount — події більше не потрапляють у сховище', async () => {
    const { unmount } = render(<NotificationBell />);

    expect(handlers.get('notification:new')?.size).toBe(1);

    unmount();

    expect(handlers.get('notification:new')?.size ?? 0).toBe(0);

    await act(async () => {
      emit('notification:new', { notification: { id: 2, type: 'info', title: 'T' } });
    });

    expect(useNotificationsStore.getState().notifications).toHaveLength(0);
  });

  it('невідомий тип події трактується як info', async () => {
    render(<NotificationBell />);

    await act(async () => {
      emit('notification:new', { notification: { id: 3, title: 'Без типу' } });
    });

    const first = useNotificationsStore.getState().notifications[0];
    expect(first.type).toBe('info');
    expect(first.title).toBe('Без типу');
  });
});
