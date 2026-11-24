import { useEffect, useRef, useState } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Badge from '@/components/common/Badge';
import Breadcrumbs from '@/components/common/Breadcrumbs';
import Button from '@/components/common/Button';
import EmptyState from '@/components/common/EmptyState';
import List from '@/components/common/List';
import { TableSkeleton } from '@/components/common/Skeleton';
import { notificationsService } from '@/services/notifications.service';
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
  const [onlyUnread, setOnlyUnread] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const { data, isPending, isError, error, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ['notifications', { unread: onlyUnread }],
      initialPageParam: 1,
      queryFn: ({ pageParam }) =>
        notificationsService.getAll({ page: pageParam, limit: 10, unread: onlyUnread }),
      getNextPageParam: (lastPage) =>
        lastPage.pagination.hasMore ? lastPage.pagination.page + 1 : undefined,
    });
  const notifications = data?.pages.flatMap((page) => page.data) ?? [];
  const unreadCount = data?.pages[0]?.unreadCount ?? 0;

  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target || !hasNextPage) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) void fetchNextPage();
      },
      { rootMargin: '160px' }
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage]);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['notifications'] });

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
          Сповіщення {unreadCount > 0 && <Badge variant="danger">{unreadCount} непрочитаних</Badge>}
        </h1>
        <div className="flex gap-2">
          <Button
            variant={onlyUnread ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => {
              setOnlyUnread((v) => !v);
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

      {!isPending && notifications.length === 0 && (
        <EmptyState
          title="Сповіщень немає"
          text="Тут з'являться події про ваші консультації, повідомлення та відгуки."
        />
      )}

      {notifications.length > 0 && (
        <>
          <List>
            {notifications.map((n: AppNotification) => (
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
          <div
            ref={loadMoreRef}
            className="py-5 text-center text-sm text-gray-500"
            aria-live="polite"
          >
            {isFetchingNextPage
              ? 'Завантаження наступних сповіщень…'
              : hasNextPage
                ? 'Прокрутіть нижче, щоб завантажити ще'
                : 'Усі сповіщення завантажено'}
          </div>
        </>
      )}
    </div>
  );
}
