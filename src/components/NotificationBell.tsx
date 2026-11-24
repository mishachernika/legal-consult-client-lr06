import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import toast from 'react-hot-toast';
import { cn } from '@/utils/cn';
import {
  selectUnreadCount,
  useNotificationsStore,
  type LiveNotification,
} from '@/stores/notificationsStore';
import { useSocketEvent } from '@/hooks/useSocketEvent';

// Подія сервера socket/notificationService.js: publishEvent(`user:<id>`, 'notification:new',
// { notification: { id, type, title, body, ... } }) — у персональну кімнату користувача
interface ServerNotificationPayload {
  notification?: {
    id: number | string;
    type?: string;
    title?: string;
    body?: string | null;
  };
}

const VARIANT_LABELS: Record<LiveNotification['type'], string> = {
  info: 'bg-blue-50 dark:bg-blue-950',
  success: 'bg-green-50 dark:bg-green-950',
  warning: 'bg-amber-50 dark:bg-amber-950',
  error: 'bg-red-50 dark:bg-red-950',
};

// Дзвіночок у шапці: живий потік сповіщень через Socket.io + toast про кожну нову подію.
// Отримані події зберігаються в Zustand-сховищі, лічильник непрочитаних — селектор.
export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const notifications = useNotificationsStore((state) => state.notifications);
  const unreadCount = useNotificationsStore(selectUnreadCount);
  const bell = useNotificationsStore.getState();

  // Обробник без useCallback: useSocketEvent сам тримає актуальний обробник
  // через useEffectEvent, тож стабільність посилання не важлива.
  const handleServerEvent = (data: ServerNotificationPayload) => {
    const n = data.notification;
    if (!n) return;
    const type = (['info', 'success', 'warning', 'error'] as const).includes(
      n.type as LiveNotification['type']
    )
      ? (n.type as LiveNotification['type'])
      : 'info';
    const title = n.title ?? 'Сповіщення';
    const message = n.body ?? '';
    bell.add({ type, title, message });
    if (type === 'error') toast.error(`${title}: ${message}`);
    else toast.success(message || title);
  };

  // Персональна кімната user:<id> вже приєднана сервером — слухаємо лише подію
  useSocketEvent<ServerNotificationPayload>('notification:new', handleServerEvent);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-label={`Сповіщення: непрочитаних ${unreadCount}`}
        aria-expanded={isOpen}
        className="relative rounded-full p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
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
            strokeLinejoin="round"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-semibold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* невидиме тло, щоб закривати випадний список кліком поза ним */}
            <button
              type="button"
              aria-hidden="true"
              tabIndex={-1}
              className="fixed inset-0 z-40 cursor-default"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-lg border bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900"
            >
              <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-700">
                <h3 className="font-semibold">Сповіщення в реальному часі</h3>
                <button
                  type="button"
                  onClick={bell.markAllAsRead}
                  className="text-sm text-primary-600 hover:underline"
                >
                  Прочитати всі
                </button>
              </div>
              <ul className="max-h-96 overflow-y-auto">
                {notifications.length === 0 && (
                  <li className="p-4 text-center text-gray-500">
                    Немає сповіщень — вони з&apos;являться, коли сервер надішле подію
                  </li>
                )}
                {notifications.map((n) => (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => bell.markAsRead(n.id)}
                      className={cn(
                        'block w-full border-b border-gray-100 p-4 text-left text-sm hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800',
                        !n.read && VARIANT_LABELS[n.type]
                      )}
                    >
                      <span className="block font-medium">{n.title}</span>
                      {n.message && (
                        <span className="block text-gray-600 dark:text-gray-400">{n.message}</span>
                      )}
                      <span className="text-xs text-gray-400">
                        {new Date(n.timestamp).toLocaleTimeString('uk-UA')}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
