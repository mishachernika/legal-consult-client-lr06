import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router';
import AvatarUpload from '@/components/AvatarUpload';
import StatsChart from '@/components/StatsChart';
import TaskBoard from '@/components/TaskBoard';
import Badge from '@/components/common/Badge';
import Card from '@/components/common/Card';
import Tabs from '@/components/common/Tabs';
import {
  CONSULTATION_STATUS_LABELS,
  CONSULTATION_STATUS_VARIANTS,
  DASHBOARD_NAV,
} from '@/constants';
import { consultationsService } from '@/services/consultations.service';
import { notificationsService } from '@/services/notifications.service';
import { useAuthStore } from '@/stores/authStore';
import { formatDateTime, formatPrice } from '@/utils/format';

const CHART_LIMIT = 100;

// Головна панель керування: привітання + аватар, таби з оглядом,
// графіком статусів (Recharts) і планувальником (dnd-kit)
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

  // Для графіка беремо до 100 останніх консультацій (сторінкою — один запит)
  const { data: forChart } = useQuery({
    queryKey: ['consultations', { chart: true, limit: CHART_LIMIT }],
    queryFn: () => consultationsService.getAll({ page: 1, limit: CHART_LIMIT }),
  });

  const overview = (
    <div className="flex flex-col gap-8">
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
    </div>
  );

  const tabs = [
    { label: 'Огляд', content: overview },
    {
      label: 'Аналітика',
      content: (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <StatsChart consultations={forChart?.data ?? []} title="Консультації за статусами" />
          <Card title="Як читати графік">
            <div className="flex flex-col gap-2 text-sm text-gray-600 dark:text-gray-300">
              <p>
                <Badge variant="warning">Очікує</Badge> — нові заявки, які ще не підтверджено.
              </p>
              <p>
                <Badge variant="neutral">Підтверджено</Badge> — заплановані консультації.
              </p>
              <p>
                <Badge variant="info">Триває</Badge> — консультації в роботі прямо зараз.
              </p>
              <p>
                <Badge variant="success">Завершено</Badge> — успішно проведені сесії.
              </p>
              <p>
                <Badge variant="danger">Скасовано</Badge> — відмінені або прострочені запити.
              </p>
            </div>
          </Card>
        </div>
      ),
    },
    {
      label: 'Планувальник',
      content: (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <TaskBoard />
          <Card title="Як користуватися">
            <div className="flex flex-col gap-2 text-sm text-gray-600 dark:text-gray-300">
              <p>Перетягуйте завдання, щоб змінити порядок пріоритетів на тиждень.</p>
              <p>Клік по назві позначає завдання виконаним, повторний — повертає назад.</p>
              <p>
                Порядок зберігається у браузері (localStorage) і не губиться після перезавантаження.
              </p>
            </div>
          </Card>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Вітаємо, {user?.name}!</h1>
          <p className="mt-1 flex items-center gap-2 text-gray-600 dark:text-gray-300">
            Роль: <Badge variant="info">{user?.role}</Badge>
            {unreadData && unreadData.unreadCount > 0 && (
              <span className="ml-2">
                Непрочитаних сповіщень: <Badge variant="danger">{unreadData.unreadCount}</Badge>
              </span>
            )}
          </p>
        </div>
        <AvatarUpload />
      </div>

      <Tabs tabs={tabs} />
    </div>
  );
}
