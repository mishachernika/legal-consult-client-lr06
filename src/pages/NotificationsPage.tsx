import { useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Badge from '@/components/common/Badge';
import Breadcrumbs from '@/components/common/Breadcrumbs';
import Button from '@/components/common/Button';
import EmptyState from '@/components/common/EmptyState';
import List from '@/components/common/List';
import Pagination from '@/components/common/Pagination';
import { TableSkeleton } from '@/components/common/Skeleton';
import { notificationsService } from '@/services/notifications.service';
import { useSocketEvent } from '@/hooks/useSocketEvent';
import type { AppNotification } from '@/types/api.types';
import { getErrorMessage } from '@/utils/errors';
import { formatDateTime } from '@/utils/format';

const TYPE_LABELS: Record<string, string> = {
  CONSULTATION_CREATED: 'Нова консультація',
  CONSULTATION_UPDATED: 'Оновлення консультації',
  CONSULTATION_CANCELLED: 'Консультацію скасовано',
  MESSAGE_NEW: 'Нове повідомлення',
  REVIEW_NEW: 'Новий відгук',
  SYSTEM: 'Система',
};

const PRIORITY_VARIANTS: Record<string, 'neutral' | 'info' | 'warning' | 'danger'> = {
  LOW: 'neutral',
  NORMAL: 'info',
  HIGH: 'danger',
};

// Сповіщення поточного користувача: фільтр непрочитаних, прочитати/прочитати всі, видалити
export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [onlyUnread, setOnlyUnread] = useState(false);

  const query = { page, limit: 10, unread: onlyUnread };

  const { data, isPending, isError, error } = useQuery({
    queryKey: ['notifications', query],
    queryFn: () => notificationsService.getAll(query),
    placeholderData: keepPreviousData,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['notifications'] });

  // Реальний час: нова подія на сервері (notificationService.js → notification:new
  // у персональній кімнаті) одразу оновлює список без ручного рефрешу
  useSocketEvent('notification:new', invalidate);

  const readMutation = useMutation({
    mutationFn: (id: number) => notificationsService.markRead(id),
    onSuccess: invalidate,
    onError: (e) => toast.error(getErrorMessage(e, 'Помилка')),
  });

  const readAllMutation = useMutation({
    mutationFn: () => notificationsService.markAllRead(),
    onSuccess: async () => {
      await invalidate();
      toast.success('Усі сповіщення прочитано');
    },
    onError: (e) => toast.error(getErrorMessage(e, 'Помилка')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => notificationsService.remove(id),
    onSuccess: invalidate,
    onError: (e) => toast.error(getErrorMessage(e, 'Помилка')),
  });

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Кабінет', to: '/dashboard' }, { label: 'Сповіщення' }]} />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">
          Сповіщення{' '}
          {data && data.unreadCount > 0 && (
            <Badge variant="danger">{data.unreadCount} непрочитаних</Badge>
          )}
        </h1>
        <div className="flex gap-2">
          <Button
            variant={onlyUnread ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => {
              setOnlyUnread((v) => !v);
              setPage(1);
            }}
          >
            Лише непрочитані
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => readAllMutation.mutate()}
            isLoading={readAllMutation.isPending}
          >
            Прочитати всі
          </Button>
        </div>
      </div>

      {isPending && <TableSkeleton rows={4} />}
      {isError && (
        <p role="alert" className="text-red-500">
          Помилка завантаження: {error.message}
        </p>
      )}

      {data && data.data.length === 0 && !isPending && (
        <EmptyState
          title="Сповіщень немає"
          text="Тут з'являться події про ваші консультації, повідомлення та відгуки."
        />
      )}

      {data && data.data.length > 0 && (
        <>
          <List>
            {data.data.map((n: AppNotification) => (
              <li
                key={n.id}
                className={`flex items-start justify-between gap-4 px-5 py-4 ${n.readAt ? 'opacity-70' : 'bg-primary-50/50 dark:bg-primary-950/30'}`}
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={PRIORITY_VARIANTS[n.priority]}>{n.priority}</Badge>
                    <Badge variant="neutral">{TYPE_LABELS[n.type] ?? n.type}</Badge>
                    {!n.readAt && <Badge variant="info">нове</Badge>}
                  </div>
                  <p className="mt-1 font-semibold">{n.title}</p>
                  {n.body && (
                    <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-300">{n.body}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">{formatDateTime(n.createdAt)}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  {!n.readAt && (
                    <Button size="sm" variant="secondary" onClick={() => readMutation.mutate(n.id)}>
                      Прочитано
                    </Button>
                  )}
                  <Button size="sm" variant="danger" onClick={() => deleteMutation.mutate(n.id)}>
                    Видалити
                  </Button>
                </div>
              </li>
            ))}
          </List>
          <Pagination meta={data.pagination} page={page} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
