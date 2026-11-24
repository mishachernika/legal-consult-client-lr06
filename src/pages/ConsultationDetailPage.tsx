import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router';
import toast from 'react-hot-toast';
import Badge from '@/components/common/Badge';
import Breadcrumbs from '@/components/common/Breadcrumbs';
import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import ErrorMessage from '@/components/common/ErrorMessage';
import FormField from '@/components/common/FormField';
import Input from '@/components/common/Input';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import OnlineStatus from '@/components/OnlineStatus';
import Select from '@/components/common/Select';
import { PageSkeleton } from '@/components/common/Skeleton';
import Textarea from '@/components/common/Textarea';
import { CONSULTATION_STATUS_LABELS, CONSULTATION_STATUS_VARIANTS } from '@/constants';
import {
  messageSchema,
  reviewSchema,
  type MessageFormData,
  type ReviewFormData,
  type ReviewFormInput,
} from '@/schemas/consultation.schema';
import { consultationsService } from '@/services/consultations.service';
import { reviewsService } from '@/services/reviews.service';
import { useAuthStore } from '@/stores/authStore';
import { useSocketEvent } from '@/hooks/useSocketEvent';
import type { ConsultationStatus, Message } from '@/types/api.types';
import { getErrorMessage } from '@/utils/errors';
import { formatDateTime, formatPrice } from '@/utils/format';

// Наступні статуси, доступні для зміни роллю (сервер все одно перевіряє правила)
const NEXT_STATUS: Record<ConsultationStatus, ConsultationStatus[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
};

export default function ConsultationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const consultationId = Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const {
    data: consultation,
    isPending,
    isError,
    error,
  } = useQuery({
    queryKey: ['consultations', consultationId],
    queryFn: () => consultationsService.getById(consultationId),
  });

  const { data: messages, isPending: messagesLoading } = useQuery({
    queryKey: ['consultations', consultationId, 'messages'],
    queryFn: () => consultationsService.listMessages(consultationId),
  });

  const invalidate = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['consultations'] }),
      queryClient.invalidateQueries({ queryKey: ['consultations', consultationId, 'messages'] }),
    ]);

  // Реальний час (рівень 1): сервер шле message:new у кімнату consultation:<id>
  // і consultation:updated учасникам (user:<id>). Ми лише інвалідуємо кеш —
  // чат і статус оновлюються без перезавантаження і без другого вікна.
  useSocketEvent<{ message: Message }>('message:new', ({ message }) => {
    if (message.consultationId !== consultationId) return;
    if (message.senderId !== user?.id) toast.success(`Нове повідомлення: ${message.text}`);
    void invalidate();
  });
  useSocketEvent('consultation:updated', () => void invalidate());

  const statusMutation = useMutation({
    mutationFn: (status: ConsultationStatus) =>
      consultationsService.update(consultationId, { status }),
    onSuccess: async () => {
      await invalidate();
      toast.success('Статус оновлено');
    },
    onError: (e) => toast.error(e.message || 'Не вдалося змінити статус'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => consultationsService.remove(consultationId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['consultations'] });
      toast.success('Консультацію видалено');
      navigate('/consultations');
    },
    onError: (e) => toast.error(e.message || 'Не вдалося видалити'),
  });

  const messageForm = useForm<MessageFormData>({ resolver: zodResolver(messageSchema) });
  const sendMessage = useMutation({
    mutationFn: (data: MessageFormData) =>
      consultationsService.sendMessage(consultationId, data.text),
    onSuccess: async () => {
      messageForm.reset({ text: '' });
      await invalidate();
    },
    onError: (e) => toast.error(getErrorMessage(e, 'Не вдалося надіслати повідомлення')),
  });

  const reviewForm = useForm<ReviewFormInput, unknown, ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { rating: '5', text: '' },
  });
  const sendReview = useMutation({
    mutationFn: (data: ReviewFormData) =>
      reviewsService.create({ consultationId, rating: data.rating, text: data.text }),
    onSuccess: async () => {
      toast.success('Дякуємо за відгук!');
      await invalidate();
    },
    onError: (e) => toast.error(getErrorMessage(e, 'Не вдалося надіслати відгук')),
  });

  if (isPending) return <PageSkeleton />;
  if (isError || !consultation)
    return <ErrorMessage message={error?.message ?? 'Консультацію не знайдено'} />;

  const isClient = user?.id === consultation.clientId;
  const isLawyer = user?.id === consultation.lawyerId;
  const canChangeStatus =
    user?.role === 'ADMIN' || isLawyer || (isClient && consultation.status === 'PENDING');
  const canEdit = user?.role === 'ADMIN' || (isClient && consultation.status === 'PENDING');
  const canDelete = user?.role === 'ADMIN' || (isClient && consultation.status === 'PENDING');
  const availableStatuses = NEXT_STATUS[consultation.status].filter(
    (s) => user?.role === 'ADMIN' || user?.role === 'LAWYER' || s === 'CANCELLED'
  );

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumbs
        items={[
          { label: 'Кабінет', to: '/dashboard' },
          { label: 'Консультації', to: '/consultations' },
          { label: `#${consultation.id}` },
        ]}
      />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{consultation.topic}</h1>
          <p className="mt-2">
            <Badge variant={CONSULTATION_STATUS_VARIANTS[consultation.status]}>
              {CONSULTATION_STATUS_LABELS[consultation.status]}
            </Badge>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canEdit && (
            <Button
              variant="secondary"
              onClick={() => navigate(`/consultations/${consultation.id}/edit`)}
            >
              Редагувати
            </Button>
          )}
          {canDelete && (
            <Button variant="danger" onClick={() => setDeleteOpen(true)}>
              Видалити
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card title="Деталі" className="lg:col-span-1">
          <dl className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-gray-500">Клієнт</dt>
              <dd className="font-medium">
                {consultation.client?.name}{' '}
                {consultation.client && (
                  <OnlineStatus userId={consultation.client.id} className="ml-1 align-middle" />
                )}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-gray-500">Юрист</dt>
              <dd className="font-medium">
                {consultation.lawyer?.name}{' '}
                {consultation.lawyer && (
                  <OnlineStatus userId={consultation.lawyer.id} className="ml-1 align-middle" />
                )}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-gray-500">Ціна</dt>
              <dd className="font-medium">
                {consultation.price != null ? formatPrice(consultation.price) : '—'}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-gray-500">Заплановано</dt>
              <dd className="font-medium">
                {consultation.scheduledAt ? formatDateTime(consultation.scheduledAt) : '—'}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-gray-500">Створено</dt>
              <dd className="font-medium">{formatDateTime(consultation.createdAt)}</dd>
            </div>
          </dl>
          <p className="mt-4 whitespace-pre-wrap text-sm">{consultation.description}</p>

          {canChangeStatus && availableStatuses.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2 border-t border-gray-100 pt-4 dark:border-gray-700">
              {availableStatuses.map((s) => (
                <Button
                  key={s}
                  size="sm"
                  variant={s === 'CANCELLED' ? 'danger' : 'primary'}
                  isLoading={statusMutation.isPending}
                  onClick={() => statusMutation.mutate(s)}
                >
                  {CONSULTATION_STATUS_LABELS[s]}
                </Button>
              ))}
            </div>
          )}
        </Card>

        <Card title="Чат" className="lg:col-span-2">
          <div className="flex max-h-96 flex-col gap-3 overflow-y-auto pr-1" aria-live="polite">
            {messagesLoading && (
              <p className="text-sm text-gray-500">Завантаження повідомлень...</p>
            )}
            {messages?.length === 0 && (
              <p className="text-sm text-gray-500">Повідомлень ще немає — напишіть першим.</p>
            )}
            {messages?.map((m) => {
              const mine = m.senderId === user?.id;
              return (
                <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                      mine ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-800'
                    }`}
                  >
                    <p className="text-xs opacity-70">
                      {m.sender?.name ?? `Користувач #${m.senderId}`} ·{' '}
                      {formatDateTime(m.createdAt)}
                    </p>
                    <p className="whitespace-pre-wrap">{m.text}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <form
            className="mt-4 flex gap-2"
            onSubmit={messageForm.handleSubmit((data) => sendMessage.mutate(data))}
            noValidate
          >
            <Input
              placeholder="Ваше повідомлення..."
              aria-label="Нове повідомлення"
              {...messageForm.register('text')}
            />
            <Button type="submit" isLoading={sendMessage.isPending}>
              Надіслати
            </Button>
          </form>
          {messageForm.formState.errors.text && (
            <p role="alert" className="mt-1 text-sm text-red-500">
              {messageForm.formState.errors.text.message}
            </p>
          )}
        </Card>
      </div>

      {/* Відгук: лише клієнт після завершення і лише якщо відгук ще не лишав */}
      {consultation.status === 'COMPLETED' && isClient && !consultation.review && (
        <Card title="Залишити відгук про консультацію">
          <form
            className="flex flex-col gap-4"
            onSubmit={reviewForm.handleSubmit((data) => sendReview.mutate(data))}
            noValidate
          >
            <FormField label="Оцінка" error={reviewForm.formState.errors.rating?.message}>
              <Select {...reviewForm.register('rating')}>
                {[5, 4, 3, 2, 1].map((r) => (
                  <option key={r} value={r}>
                    {r} / 5
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField
              label="Коментар (необов'язково)"
              error={reviewForm.formState.errors.text?.message}
            >
              <Textarea
                rows={3}
                placeholder="Що сподобалося або що варто покращити..."
                {...reviewForm.register('text')}
              />
            </FormField>
            <div>
              <Button type="submit" isLoading={sendReview.isPending}>
                Надіслати відгук
              </Button>
            </div>
          </form>
        </Card>
      )}

      {consultation.review && (
        <Card title="Відгук клієнта">
          <p className="font-semibold">Оцінка: {consultation.review.rating} / 5</p>
          {consultation.review.text && <p className="mt-1 text-sm">{consultation.review.text}</p>}
          <p className="mt-1 text-xs text-gray-500">
            {formatDateTime(consultation.review.createdAt)}
          </p>
        </Card>
      )}

      <ConfirmDialog
        isOpen={deleteOpen}
        title="Видалити консультацію?"
        message={`Консультацію «${consultation.topic}» буде видалено разом із чатом і відгуком. Дію не можна скасувати.`}
        confirmText="Видалити"
        isLoading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate()}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  );
}
