import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router';
import { notificationsService } from '@/services/notifications.service';
import { useRealtimeStore } from '@/stores/realtimeStore';

// Лічильник автоматично оновиться після notification:new: RealtimeProvider інвалідує цей queryKey.
export default function NotificationBell() {
  const connected = useRealtimeStore((state) => state.connected);
  const { data } = useQuery({
    queryKey: ['notifications', { unread: true, limit: 1 }],
    queryFn: () => notificationsService.getAll({ unread: true, limit: 1 }),
  });
  const unread = data?.unreadCount ?? 0;

  return (
    <Link
      to="/notifications"
      className="relative rounded-full p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
      aria-label={`Сповіщення: непрочитаних ${unread}`}
      title={connected ? 'Real-time підключено' : 'Real-time не підключено'}
    >
      <svg
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <path
          d="M18 9a6 6 0 1 0-12 0c0 6-2 7-2 7h16s-2-1-2-7M10.3 20a2 2 0 0 0 3.4 0"
          strokeLinecap="round"
        />
      </svg>
      <span
        className={`absolute right-1 top-1 h-2 w-2 rounded-full ${connected ? 'bg-emerald-500' : 'bg-gray-400'}`}
      />
      {unread > 0 && (
        <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
          {unread > 99 ? '99+' : unread}
        </span>
      )}
    </Link>
  );
}
