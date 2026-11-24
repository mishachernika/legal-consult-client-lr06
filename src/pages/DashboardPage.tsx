import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router';
import Badge from '@/components/common/Badge';
import Card from '@/components/common/Card';
import AdvancedWorkspace from '@/components/dashboard/AdvancedWorkspace';
import {
  CONSULTATION_STATUS_LABELS,
  CONSULTATION_STATUS_VARIANTS,
  DASHBOARD_NAV,
} from '@/constants';
import { consultationsService } from '@/services/consultations.service';
import { notificationsService } from '@/services/notifications.service';
import { useAuthStore } from '@/stores/authStore';
import { formatDateTime, formatPrice } from '@/utils/format';

// Головна панель керування: картки розділів + лічильник сповіщень + останні консультації
export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);

  const sections = DASHBOARD_NAV.filter(
    (item) => !('adminOnly' in item && item.adminOnly) || user?.role === 'ADMIN'
  ).filter((item) => item.to !== '/dashboard');

  const { data: unreadData } = useQuery({
    queryKey: ['notifications', { unread: true, limit: 1 }],
    queryFn: () => notificationsService.getAll({ unread: true, limit: 1 }),
  });

  const { data: recent } = useQuery({
    queryKey: ['consultations', { page: 1, limit: 5 }],
    queryFn: () => consultationsService.getAll({ page: 1, limit: 5 }),
  });

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold">Вітаємо, {user?.name}!</h1>
        <p className="mt-1 text-gray-600 dark:text-gray-300">
          Роль: <Badge variant="info">{user?.role}</Badge>
          {unreadData && unreadData.unreadCount > 0 && (
            <span className="ml-2">
              Непрочитаних сповіщень: <Badge variant="danger">{unreadData.unreadCount}</Badge>
            </span>
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {sections.map((s) => (
          <Link key={s.to} to={s.to}>
            <Card className="h-full transition-shadow hover:shadow-lg" title={s.label}>
              Перейти до розділу «{s.label}»
            </Card>
          </Link>
        ))}
      </div>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Останні консультації</h2>
          <Link to="/consultations" className="text-sm text-primary-600 hover:underline">
            Усі консультації →
          </Link>
        </div>
        {!recent ? (
          <Card>Завантаження...</Card>
        ) : recent.data.length === 0 ? (
          <Card>
            У вас ще немає консультацій.{' '}
            <Link to="/lawyers" className="text-primary-600 hover:underline">
              Знайдіть юриста
            </Link>{' '}
            і створіть першу.
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {recent.data.map((c) => (
              <Link key={c.id} to={`/consultations/${c.id}`}>
                <Card
                  className="h-full transition-shadow hover:shadow-lg"
                  title={
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate">{c.topic}</span>
                      <Badge variant={CONSULTATION_STATUS_VARIANTS[c.status]}>
                        {CONSULTATION_STATUS_LABELS[c.status]}
                      </Badge>
                    </span>
                  }
                >
                  <p className="line-clamp-2 text-sm">{c.description}</p>
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    {formatDateTime(c.createdAt)}
                    {c.price != null && ` · ${formatPrice(c.price)}`}
                  </p>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
      <AdvancedWorkspace consultations={recent?.data ?? []} />
    </div>
  );
}
