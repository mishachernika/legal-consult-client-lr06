import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router';
import toast from 'react-hot-toast';
import Breadcrumbs from '@/components/common/Breadcrumbs';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { TableSkeleton } from '@/components/common/Skeleton';
import Table, { type TableColumn } from '@/components/common/Table';
import { useDebounce } from '@/hooks/useDebounce';
import { specializationsService } from '@/services/specializations.service';
import { useAuthStore } from '@/stores/authStore';
import type { Specialization } from '@/types/api.types';

// Сфери права: публічний список із пошуком; адмін додатково редагує та видаляє
export default function SpecializationsListPage() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'ADMIN';
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const debouncedSearch = useDebounce(search);

  const {
    data: specializations = [],
    isPending,
    isError,
    error,
  } = useQuery({
    queryKey: ['specializations'],
    queryFn: specializationsService.getAll,
  });

  // У серверному API ЛР03 довідник не пагінується, тому фільтруємо невеликий набір на клієнті.
  const filteredSpecializations = useMemo(() => {
    const needle = debouncedSearch.trim().toLocaleLowerCase();
    if (!needle) return specializations;
    return specializations.filter((item) =>
      `${item.name} ${item.description ?? ''}`.toLocaleLowerCase().includes(needle)
    );
  }, [debouncedSearch, specializations]);

  const deleteMutation = useMutation({
    mutationFn: (id: number) => specializationsService.remove(id),
    onSuccess: () => {
      toast.success('Сферу права видалено');
      setDeleteId(null);
      return queryClient.invalidateQueries({ queryKey: ['specializations'] });
    },
    onError: (e) => toast.error(e.message || 'Не вдалося видалити'),
  });

  const columns: TableColumn<Specialization>[] = [
    { key: 'id', header: 'ID', render: (s) => s.id },
    { key: 'name', header: 'Назва', render: (s) => <span className="font-medium">{s.name}</span> },
    { key: 'description', header: 'Опис', render: (s) => s.description ?? '—' },
    ...(isAdmin
      ? [
          {
            key: 'actions',
            header: 'Дії',
            className: 'text-right',
            render: (s: Specialization) => (
              <span className="inline-flex gap-2" onClick={(e) => e.stopPropagation()}>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => navigate(`/specializations/${s.id}/edit`)}
                >
                  Редагувати
                </Button>
                <Button size="sm" variant="danger" onClick={() => setDeleteId(s.id)}>
                  Видалити
                </Button>
              </span>
            ),
          } as TableColumn<Specialization>,
        ]
      : []),
  ];

  const deleting = specializations.find((s) => s.id === deleteId);

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Кабінет', to: '/dashboard' }, { label: 'Сфери права' }]} />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">Сфери права</h1>
        {isAdmin && (
          <Link to="/specializations/create">
            <Button>Додати сферу</Button>
          </Link>
        )}
      </div>

      <div className="mb-4">
        <Input
          aria-label="Пошук сфер права"
          placeholder="Пошук за назвою..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
          }}
        />
      </div>

      {isPending && <TableSkeleton />}
      {isError && (
        <p role="alert" className="text-red-500">
          Помилка завантаження: {error.message}
        </p>
      )}

      {!isPending && !isError && (
        <>
          <Table
            columns={columns}
            rows={filteredSpecializations}
            rowKey={(s) => s.id}
            emptyMessage="Сфери права не знайдено"
          />
        </>
      )}

      <ConfirmDialog
        isOpen={deleteId !== null}
        title="Видалити сферу права?"
        message={
          deleting
            ? `Сферу «${deleting.name}» буде видалено з каталогу.`
            : 'Сферу права буде видалено з каталогу.'
        }
        confirmText="Видалити"
        isLoading={deleteMutation.isPending}
        onConfirm={() => deleteId !== null && deleteMutation.mutate(deleteId)}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
