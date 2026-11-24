import { useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import toast from 'react-hot-toast';
import Badge from '@/components/common/Badge';
import Breadcrumbs from '@/components/common/Breadcrumbs';
import Button from '@/components/common/Button';
import ButtonLink from '@/components/common/ButtonLink';
import EmptyState from '@/components/common/EmptyState';
import Input from '@/components/common/Input';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import Pagination from '@/components/common/Pagination';
import Select from '@/components/common/Select';
import { TableSkeleton } from '@/components/common/Skeleton';
import Table, { type TableColumn } from '@/components/common/Table';
import { CONSULTATION_STATUS_LABELS, CONSULTATION_STATUS_VARIANTS } from '@/constants';
import { useDebounce } from '@/hooks/useDebounce';
import { useSocketEvent } from '@/hooks/useSocketEvent';
import { consultationsService, type ConsultationsQuery } from '@/services/consultations.service';
import { useAuthStore } from '@/stores/authStore';
import type { Consultation, ConsultationStatus } from '@/types/api.types';
import { formatDateTime, formatPrice } from '@/utils/format';

const STATUSES: ConsultationStatus[] = [
  'PENDING',
  'CONFIRMED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
];

// Список консультацій: пошук із debounce, фільтр за статусом, пагінація, видалення з модалкою
export default function ConsultationsListPage() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<ConsultationStatus | ''>('');
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const debouncedSearch = useDebounce(search);

  const query: ConsultationsQuery = {
    page,
    limit: 10,
    search: debouncedSearch || undefined,
    status: status || undefined,
  };

  // Ключ запиту містить усі параметри: їх зміна автоматично запускає новий запит
  const { data, isPending, isError, error } = useQuery({
    queryKey: ['consultations', query],
    queryFn: () => consultationsService.getAll(query),
    placeholderData: keepPreviousData, // наступна сторінка вантажиться поверх попередньої
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => consultationsService.remove(id),
    onSuccess: () => {
      toast.success('Консультацію видалено');
      setDeleteId(null);
      // Сервер — джерело істини: інвалідуємо всі списки консультацій
      return queryClient.invalidateQueries({ queryKey: ['consultations'] });
    },
    onError: (e) => toast.error(e.message || 'Не вдалося видалити консультацію'),
  });

  // Оновлення списку в реальному часі: сервер розсилає події після кожної зміни
  // (consultationController.js), а ми лише інвалідуємо кеш — нові дані прибудуть самі.
  useSocketEvent('consultation:created', () =>
    queryClient.invalidateQueries({ queryKey: ['consultations'] })
  );
  useSocketEvent('consultation:updated', () =>
    queryClient.invalidateQueries({ queryKey: ['consultations'] })
  );
  useSocketEvent('consultation:deleted', () =>
    queryClient.invalidateQueries({ queryKey: ['consultations'] })
  );

  // Правила повторюють серверні: адміністратор видаляє будь-яку консультацію,
  // клієнт — лише власну, доки вона очікує підтвердження.
  const canDelete = (consultation: Consultation) =>
    user?.role === 'ADMIN' ||
    (consultation.clientId === user?.id && consultation.status === 'PENDING');

  const columns: TableColumn<Consultation>[] = [
    { key: 'id', header: 'ID', render: (c) => c.id },
    { key: 'topic', header: 'Тема', render: (c) => <span className="font-medium">{c.topic}</span> },
    {
      key: 'party',
      header: user?.role === 'LAWYER' ? 'Клієнт' : 'Юрист',
      render: (c) => (user?.role === 'LAWYER' ? c.client?.name : c.lawyer?.name) ?? '—',
    },
    {
      key: 'status',
      header: 'Статус',
      render: (c) => (
        <Badge variant={CONSULTATION_STATUS_VARIANTS[c.status]}>
          {CONSULTATION_STATUS_LABELS[c.status]}
        </Badge>
      ),
    },
    { key: 'createdAt', header: 'Створено', render: (c) => formatDateTime(c.createdAt) },
    {
      key: 'price',
      header: 'Ціна',
      className: 'text-right',
      render: (c) => (c.price != null ? formatPrice(c.price) : '—'),
    },
    {
      key: 'actions',
      header: 'Дії',
      className: 'text-right',
      render: (c) => (
        <span className="inline-flex gap-2" onClick={(e) => e.stopPropagation()}>
          <Button size="sm" variant="secondary" onClick={() => navigate(`/consultations/${c.id}`)}>
            Деталі
          </Button>
          {canDelete(c) && (
            <Button size="sm" variant="danger" onClick={() => setDeleteId(c.id)}>
              Видалити
            </Button>
          )}
        </span>
      ),
    },
  ];

  const deleting = data?.data.find((c) => c.id === deleteId);

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Кабінет', to: '/dashboard' }, { label: 'Консультації' }]} />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">Консультації</h1>
        <ButtonLink to="/consultations/create">Нова консультація</ButtonLink>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="min-w-64 flex-1">
          <Input
            aria-label="Пошук консультацій"
            placeholder="Пошук за темою або описом..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1); // новий пошук завжди з першої сторінки
            }}
          />
        </div>
        <Select
          aria-label="Фільтр за статусом"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as ConsultationStatus | '');
            setPage(1);
          }}
        >
          <option value="">Усі статуси</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {CONSULTATION_STATUS_LABELS[s]}
            </option>
          ))}
        </Select>
      </div>

      {isPending && <TableSkeleton />}
      {isError && (
        <p role="alert" className="text-red-500">
          Помилка завантаження: {error.message}
        </p>
      )}

      {data && data.data.length === 0 && !isPending && (
        <EmptyState
          title="Консультацій не знайдено"
          text={
            debouncedSearch || status
              ? 'Спробуйте змінити пошук або фільтр.'
              : 'Створіть першу консультацію через юриста.'
          }
          action={<ButtonLink to="/consultations/create">Нова консультація</ButtonLink>}
        />
      )}

      {data && data.data.length > 0 && (
        <>
          <Table
            columns={columns}
            rows={data.data}
            rowKey={(c) => c.id}
            onRowClick={(c) => navigate(`/consultations/${c.id}`)}
          />
          <Pagination meta={data.pagination} page={page} onPageChange={setPage} />
        </>
      )}

      <ConfirmDialog
        isOpen={deleteId !== null}
        title="Видалити консультацію?"
        message={
          deleting
            ? `Консультацію «${deleting.topic}» буде видалено разом із чатом і відгуком. Дію не можна скасувати.`
            : 'Консультацію буде видалено. Дію не можна скасувати.'
        }
        confirmText="Видалити"
        isLoading={deleteMutation.isPending}
        onConfirm={() => deleteId !== null && deleteMutation.mutate(deleteId)}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
