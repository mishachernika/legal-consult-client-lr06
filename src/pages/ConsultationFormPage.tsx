import { lazy, Suspense, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router';
import toast from 'react-hot-toast';
import Breadcrumbs from '@/components/common/Breadcrumbs';
import Button from '@/components/common/Button';
import DateTimePicker from '@/components/common/DateTimePicker';
import ErrorMessage from '@/components/common/ErrorMessage';
import FormField from '@/components/common/FormField';
import Input from '@/components/common/Input';
import { PageSkeleton } from '@/components/common/Skeleton';
import SearchCombobox, { type ComboboxOptionItem } from '@/components/common/SearchCombobox';
import {
  consultationSchema,
  type ConsultationFormData,
  type ConsultationFormInput,
} from '@/schemas/consultation.schema';
import { consultationsService } from '@/services/consultations.service';
import { lawyersService } from '@/services/lawyers.service';
import { usersService } from '@/services/users.service';
import { useAuthStore } from '@/stores/authStore';
import { getErrorMessage } from '@/utils/errors';
import Loading from '@/components/common/Loading';

// Tiptap важкий — приєднуємо його окремим chunk-ом і завантажуємо лише на цій сторінці
const RichTextEditor = lazy(() => import('@/components/common/RichTextEditor'));

// Одна форма для створення (/consultations/create) і редагування (/consultations/:id/edit):
//律师 вибирається комбобоксом з пошуком, опис — rich text редактором Tiptap,
// дата — календарем react-day-picker.
export default function ConsultationFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = id !== undefined;
  const consultationId = Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'ADMIN';
  // /consultations/create?lawyerId=26 — prefill вибраного юриста з каталогу
  const [searchParams] = useSearchParams();
  const preselectedLawyerId = searchParams.get('lawyerId') ?? '';

  const { data: lawyers, isPending: lawyersLoading } = useQuery({
    queryKey: ['lawyers', { limit: 100, sortBy: 'rating', order: 'desc' }],
    queryFn: () => lawyersService.getAll({ limit: 100, sortBy: 'rating', order: 'desc' }),
  });

  const { data: existing, isPending: existingLoading } = useQuery({
    queryKey: ['consultations', consultationId],
    queryFn: () => consultationsService.getById(consultationId),
    enabled: isEdit,
  });
  const isClientEditing = isEdit && existing?.clientId === user?.id;
  const isLawyerEditing = isEdit && existing?.lawyerId === user?.id;
  const canChooseLawyer = !isEdit || isAdmin;
  const canEditRequestDetails = !isEdit || isAdmin || isClientEditing;

  // Список клієнтів потрібен лише адміну (він вибирає, від імені кого створити консультацію)
  const { data: clients } = useQuery({
    queryKey: ['users', { role: 'CLIENT', limit: 100 }],
    queryFn: () => usersService.getAll({ role: 'CLIENT', limit: 100 }),
    enabled: isAdmin && !isEdit,
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    setError,
    watch,
    formState: { errors },
  } = useForm<ConsultationFormInput, unknown, ConsultationFormData>({
    resolver: zodResolver(consultationSchema),
    defaultValues: {
      lawyerId: preselectedLawyerId,
      clientId: '',
      topic: '',
      description: '',
      scheduledAt: '',
    },
  });

  // Коли запис завантажився — заповнюємо форму його значеннями
  useEffect(() => {
    if (existing) {
      reset({
        lawyerId: String(existing.lawyerId), // у відповіді lawyerId — це userId
        clientId: String(existing.clientId),
        topic: existing.topic,
        description: existing.description,
        scheduledAt: existing.scheduledAt ? existing.scheduledAt.slice(0, 16) : '',
      } as ConsultationFormInput);
    }
  }, [existing, reset]);

  // Опції комбобоксів формуються з довідників юристів і клієнтів
  const lawyerOptions: ComboboxOptionItem[] = useMemo(
    () =>
      (lawyers?.data ?? []).map((l) => ({
        value: String(l.userId),
        label: l.user?.name ?? `Юрист #${l.userId}`,
        description: [
          l.specializations?.map((s) => s.name).join(', ') || 'сфери не вказано',
          `рейтинг ${l.rating ?? '—'}`,
        ].join(' · '),
      })),
    [lawyers]
  );

  const clientOptions: ComboboxOptionItem[] = useMemo(
    () =>
      (clients?.data ?? []).map((c) => ({
        value: String(c.id),
        label: c.name,
        description: c.email,
      })),
    [clients]
  );

  const watchedLawyerId = watch('lawyerId');
  const watchedClientId = watch('clientId');
  const watchedScheduledAt = watch('scheduledAt');
  const watchedDescription = watch('description') ?? '';
  const descriptionLength = watchedDescription
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .trim().length;

  const selectedLawyer = lawyerOptions.find((o) => o.value === String(watchedLawyerId)) ?? null;
  const selectedClient = clientOptions.find((o) => o.value === String(watchedClientId)) ?? null;

  const mutation = useMutation({
    mutationFn: (data: ConsultationFormData) => {
      if (isEdit) {
        // Сервер дозволяє клієнту редагувати заявку, юристу — лише час/статус,
        // а адміністратору — усі поля. Не надсилаємо поля, які сервер ігноруватиме.
        if (isLawyerEditing && !isAdmin) {
          return consultationsService.update(consultationId, { scheduledAt: data.scheduledAt });
        }
        if (isClientEditing && !isAdmin) {
          return consultationsService.update(consultationId, {
            topic: data.topic,
            description: data.description,
            scheduledAt: data.scheduledAt,
          });
        }
        return consultationsService.update(consultationId, {
          lawyerId: data.lawyerId,
          topic: data.topic,
          description: data.description,
          scheduledAt: data.scheduledAt,
        });
      }

      const payload = {
        lawyerId: data.lawyerId,
        topic: data.topic,
        description: data.description,
        scheduledAt: data.scheduledAt,
        ...(isAdmin && data.clientId ? { clientId: data.clientId } : {}),
      };
      return consultationsService.create(payload);
    },
    onSuccess: async (created) => {
      await queryClient.invalidateQueries({ queryKey: ['consultations'] });
      toast.success(isEdit ? 'Консультацію оновлено' : 'Консультацію створено');
      navigate(`/consultations/${created.id}`);
    },
    onError: (error) => {
      setError('root', { message: getErrorMessage(error, 'Помилка збереження') });
    },
  });

  if (isEdit && existingLoading) return <PageSkeleton />;

  return (
    <div className="mx-auto max-w-2xl">
      <Breadcrumbs
        items={[
          { label: 'Кабінет', to: '/dashboard' },
          { label: 'Консультації', to: '/consultations' },
          { label: isEdit ? `Редагування #${consultationId}` : 'Нова консультація' },
        ]}
      />

      <h1 className="mb-6 text-3xl font-bold">
        {isEdit ? `Редагування консультації #${consultationId}` : 'Нова консультація'}
      </h1>

      {!isEdit && (
        <p className="mb-4 rounded-lg border border-primary-200 bg-primary-50 px-4 py-3 text-sm text-primary-900 dark:border-primary-900 dark:bg-primary-950/40 dark:text-primary-100">
          Після створення відкриється сторінка консультації. У блоці «Чат» можна одразу написати
          юристу — повідомлення надходитимуть без перезавантаження сторінки.
        </p>
      )}

      <form
        onSubmit={handleSubmit(
          (data) => {
            // адмін має явно обрати клієнта (сам сервер для ролі CLIENT підставляє req.user.userId)
            if (isAdmin && !isEdit && !data.clientId) {
              setError('clientId', { message: 'Оберіть клієнта' });
              return;
            }
            mutation.mutate(data);
          },
          (formErrors) => {
            const firstError =
              formErrors.clientId ??
              formErrors.lawyerId ??
              formErrors.topic ??
              formErrors.description ??
              formErrors.scheduledAt;
            toast.error(firstError?.message ?? 'Перевірте, чи всі поля заповнені правильно');
          }
        )}
        className="space-y-4 rounded-lg bg-white p-6 shadow dark:bg-gray-900"
        noValidate
      >
        {isAdmin && !isEdit && (
          <FormField label="Клієнт (від імені кого створюємо)" error={errors.clientId?.message}>
            {clientOptions.length === 0 ? (
              <p className="text-sm text-gray-500">Список клієнтів завантажується...</p>
            ) : (
              <input type="hidden" {...register('clientId')} />
            )}
            <SearchCombobox
              items={clientOptions}
              value={selectedClient}
              ariaLabel="Пошук клієнта"
              placeholder="Почніть вводити ім'я або email..."
              error={Boolean(errors.clientId)}
              onChange={(item) =>
                setValue('clientId', item ? item.value : '', {
                  shouldValidate: true,
                  shouldDirty: true,
                })
              }
            />
          </FormField>
        )}

        <FormField label="Юрист" error={errors.lawyerId?.message}>
          {canChooseLawyer ? (
            <>
              {lawyersLoading ? (
                <p className="text-sm text-gray-500">Завантаження списку юристів...</p>
              ) : (
                <input type="hidden" {...register('lawyerId')} />
              )}
              <SearchCombobox
                items={lawyerOptions}
                value={selectedLawyer}
                ariaLabel="Пошук юриста"
                placeholder="Пошук юриста за ім'ям або сферою права..."
                error={Boolean(errors.lawyerId)}
                onChange={(item) =>
                  setValue('lawyerId', item ? item.value : '', {
                    shouldValidate: true,
                    shouldDirty: true,
                  })
                }
              />
            </>
          ) : (
            <>
              <input type="hidden" {...register('lawyerId')} />
              <Input value={existing?.lawyer?.name ?? 'Обраний юрист'} disabled readOnly />
            </>
          )}
        </FormField>

        {canEditRequestDetails ? (
          <>
            <FormField label="Тема" error={errors.topic?.message} hint="5–200 символів">
              <Input placeholder="Наприклад: оскарження штрафу поліції" {...register('topic')} />
            </FormField>

            <FormField
              label="Опис ситуації"
              error={errors.description?.message}
              hint={
                descriptionLength < 10
                  ? `Опишіть ситуацію щонайменше 10 символами — зараз ${descriptionLength}/10`
                  : `Опис достатній (${descriptionLength} символів). Форматування також збережеться.`
              }
            >
              <Suspense fallback={<Loading />}>
                <RichTextEditor
                  content={watchedDescription}
                  error={Boolean(errors.description)}
                  onChange={(html: string) =>
                    setValue('description', html, { shouldValidate: true, shouldDirty: true })
                  }
                />
              </Suspense>
            </FormField>
          </>
        ) : (
          <p className="rounded-lg bg-gray-50 p-3 text-sm text-gray-600 dark:bg-gray-800 dark:text-gray-300">
            Як юрист ви можете змінити запланований час; тему й опис змінює клієнт до підтвердження
            заявки.
          </p>
        )}

        <FormField label="Запланований час (необов'язково)" error={errors.scheduledAt?.message}>
          <input type="hidden" {...register('scheduledAt')} />
          <DateTimePicker
            value={watchedScheduledAt ?? ''}
            ariaLabel="Вибрати дату консультації"
            error={Boolean(errors.scheduledAt)}
            onChange={(v) =>
              setValue('scheduledAt', v, { shouldValidate: true, shouldDirty: true })
            }
          />
        </FormField>

        {errors.root && <ErrorMessage message={errors.root.message ?? 'Помилка збереження'} />}

        <div className="flex gap-4">
          <Button type="submit" isLoading={mutation.isPending}>
            {isEdit ? 'Зберегти' : 'Створити'}
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
            Скасувати
          </Button>
          {!isEdit && (
            <Link
              to="/lawyers"
              className="ml-auto self-center text-sm text-primary-600 hover:underline"
            >
              Спочатку обрати юриста в каталозі →
            </Link>
          )}
        </div>
      </form>
    </div>
  );
}
