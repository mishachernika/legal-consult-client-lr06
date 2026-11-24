import { useEffect, useRef, useState } from 'react';
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useSearchParams } from 'react-router';
import Badge from '@/components/common/Badge';
import Breadcrumbs from '@/components/common/Breadcrumbs';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import Grid from '@/components/common/Grid';
import Input from '@/components/common/Input';
import Select from '@/components/common/Select';
import { CardGridSkeleton } from '@/components/common/Skeleton';
import { useDebounce } from '@/hooks/useDebounce';
import { useSocketEvent } from '@/hooks/useSocketEvent';
import { lawyersService, type LawyersQuery } from '@/services/lawyers.service';
import { specializationsService } from '@/services/specializations.service';
import { formatPrice } from '@/utils/format';
import { toAppFileUrl } from '@/utils/fileUrl';

const SORT_OPTIONS = [
  { value: 'rating:desc', label: 'За рейтингом (спочатку найвищий)' },
  { value: 'rating:asc', label: 'За рейтингом (спочатку найнижчий)' },
  { value: 'pricePerHour:asc', label: 'За ціною (спочатку дешевші)' },
  { value: 'pricePerHour:desc', label: 'За ціною (спочатку дорожчі)' },
  { value: 'experienceYears:desc', label: 'За досвідом (спочатку досвідченіші)' },
] as const;

function LawyerAvatar({ name, avatar }: { name: string; avatar?: string | null }) {
  if (avatar) {
    return (
      <img
        src={toAppFileUrl(avatar)}
        alt={`Аватар ${name}`}
        className="h-11 w-11 shrink-0 rounded-full object-cover ring-2 ring-primary-100 dark:ring-primary-900"
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-700 dark:bg-primary-900 dark:text-primary-200"
    >
      {name
        .split(' ')
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toUpperCase()}
    </span>
  );
}

// Каталог юристів із нескінченним прокручуванням (рівень 2): useInfiniteQuery
// накопичує сторінки, а IntersectionObserver на «сторожі» в кінці списку підвантажує
// наступну сторінку, коли користувач доскролив (fallback — кнопка «Показати ще»).
export default function LawyersListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput);
  const specializationId = searchParams.get('specializationId') ?? '';
  const sort = searchParams.get('sort') ?? 'rating:desc';
  const [sortBy, order] = sort.split(':') as [LawyersQuery['sortBy'], LawyersQuery['order']];

  const { data: specializations } = useQuery({
    queryKey: ['specializations'],
    queryFn: specializationsService.getAll,
  });

  const query: Omit<LawyersQuery, 'page'> = {
    limit: 9,
    search: debouncedSearch || undefined,
    specializationId: specializationId === '' ? undefined : Number(specializationId),
    sortBy,
    order,
  };

  const { data, isPending, isError, error, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ['lawyers', 'infinite', query],
      // getNextPageParam повертає номер наступної сторінки або undefined (кінець списку)
      queryFn: ({ pageParam }) => lawyersService.getAll({ ...query, page: pageParam }),
      initialPageParam: 1,
      getNextPageParam: (lastPage) =>
        lastPage.pagination.hasMore ? lastPage.pagination.page + 1 : undefined,
    });

  // Сторож нескінченного прокручування: коли видно останню картку — підвантажуємо ще
  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return;
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => entries[0]?.isIntersecting && void fetchNextPage(),
      { rootMargin: '200px' } // почати підвантаження трохи заздалегідь
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  // Живий каталог: сервер розсилає lawyer:updated/deleted на зміну профілю юриста
  useSocketEvent('lawyer:updated', () => queryClient.invalidateQueries({ queryKey: ['lawyers'] }));
  useSocketEvent('lawyer:deleted', () => queryClient.invalidateQueries({ queryKey: ['lawyers'] }));

  const lawyers = data?.pages.flatMap((p) => p.data) ?? [];

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Кабінет', to: '/dashboard' }, { label: 'Юристи' }]} />
      <h1 className="mb-6 text-3xl font-bold">Каталог юристів</h1>

      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        <Input
          aria-label="Пошук юристів"
          placeholder="Пошук за ім'ям або описом..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <Select
          aria-label="Фільтр за сферою права"
          value={specializationId}
          onChange={(e) =>
            setSearchParams({ specializationId: e.target.value, sort }, { replace: false })
          }
        >
          <option value="">Усі сфери права</option>
          {specializations?.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </Select>
        <Select
          aria-label="Сортування"
          value={sort}
          onChange={(e) =>
            setSearchParams({ specializationId, sort: e.target.value }, { replace: false })
          }
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      </div>

      {isPending && <CardGridSkeleton />}
      {isError && (
        <p role="alert" className="text-red-500">
          Помилка завантаження: {error.message}
        </p>
      )}

      {!isPending && lawyers.length === 0 && (
        <p className="py-10 text-center text-gray-500">За вашим запитом юристів не знайдено.</p>
      )}

      <Grid>
        {lawyers.map((l) => (
          <Card
            key={l.id}
            className="flex h-full cursor-pointer flex-col transition-shadow hover:shadow-lg"
            title={
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-3">
                  <LawyerAvatar
                    name={l.user?.name ?? `Юрист ${l.userId}`}
                    avatar={l.user?.avatar}
                  />
                  <span className="truncate">{l.user?.name ?? `Юрист #${l.userId}`}</span>
                </div>
                {l.isVerified && <Badge variant="success">перевірений</Badge>}
              </div>
            }
            footer={
              <Button
                size="sm"
                onClick={() => navigate(`/consultations/create?lawyerId=${l.userId}`)}
              >
                Замовити консультацію
              </Button>
            }
          >
            <div className="flex flex-wrap gap-1">
              {l.specializations?.map((s) => (
                <Badge key={s.id} variant="info">
                  {s.name}
                </Badge>
              ))}
            </div>
            <p className="mt-2 line-clamp-2 text-sm">{l.bio ?? 'Опис відсутній.'}</p>
            <p className="mt-2 text-sm">
              Рейтинг: <span className="font-semibold">{l.rating ? `${l.rating}/5` : 'новий'}</span> · Досвід:{' '}
              {l.experienceYears || '—'} р. ·{' '}
              <span className="font-semibold text-primary-600">
                {formatPrice(l.pricePerHour)}/год
              </span>
            </p>
            <Link to={`/lawyers/${l.id}`} className="mt-2 text-sm text-primary-600 hover:underline">
              Деталі профілю →
            </Link>
          </Card>
        ))}
      </Grid>

      {/* Сторож: коли він з'являється у вʼюпорті, підвантажується наступна сторінка */}
      <div ref={sentinelRef} aria-hidden="true" className="h-px" />

      <div className="mt-6 flex justify-center gap-4 pb-2">
        {isFetchingNextPage && <p className="text-sm text-gray-500">Завантаження...</p>}
        {hasNextPage && !isFetchingNextPage && (
          <Button variant="secondary" onClick={() => void fetchNextPage()}>
            Показати ще
          </Button>
        )}
        {!hasNextPage && lawyers.length > 0 && (
          <p className="text-sm text-gray-500">
            Усього показано {data?.pages[0]?.pagination.total ?? lawyers.length} юристів.
          </p>
        )}
      </div>
    </div>
  );
}
