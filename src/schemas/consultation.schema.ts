import { z } from 'zod';

// Схема форми консультації; межі довжини збігаються з валідацією сервера (ЛР02/ЛР03)
export const consultationSchema = z.object({
  lawyerId: z.coerce
    .number({ error: 'Оберіть юриста' })
    .int()
    .positive({ error: 'Оберіть юриста' }),
  // clientId обов'язковий лише для ADMIN (для клієнта сервер підставляє req.user.userId)
  clientId: z.preprocess(
    // react-hook-form повертає порожнє поле як ''. Без цього z.coerce.number('')
    // перетворював його на 0 та помилково вимагав клієнта навіть у звичайного користувача.
    (value) => (value === '' || value == null ? undefined : value),
    z.coerce
      .number({ error: 'Оберіть клієнта' })
      .int()
      .positive({ error: 'Оберіть клієнта' })
      .optional()
  ),
  topic: z.string().min(5, { error: 'Тема має містити мінімум 5 символів' }).max(200, {
    error: 'Тема має містити не більше 200 символів',
  }),
  description: z.string().min(10, { error: 'Опис має містити мінімум 10 символів' }).max(5000, {
    error: 'Опис має містити не більше 5000 символів',
  }),
  // datetime-local дає рядок 'YYYY-MM-DDTHH:mm' — валідуємо і перетворюємо в ISO перед відправкою
  scheduledAt: z
    .string()
    .refine((v) => v === '' || !Number.isNaN(Date.parse(v)), { error: 'Невірний формат дати' })
    .transform((v) => (v === '' ? undefined : new Date(v).toISOString()))
    .optional(),
});

export type ConsultationFormInput = z.input<typeof consultationSchema>;
export type ConsultationFormData = z.output<typeof consultationSchema>;

export const messageSchema = z.object({
  text: z.string().min(1, { error: 'Введіть повідомлення' }).max(2000, {
    error: 'Повідомлення має містити не більше 2000 символів',
  }),
});

export type MessageFormData = z.infer<typeof messageSchema>;

export const reviewSchema = z.object({
  rating: z.coerce
    .number({ error: 'Оберіть оцінку' })
    .int({ error: 'Оцінка має бути цілою' })
    .min(1, { error: 'Оцінка від 1 до 5' })
    .max(5, { error: 'Оцінка від 1 до 5' }),
  text: z
    .string()
    .max(1000, { error: 'Відгук має містити не більше 1000 символів' })
    .transform((v) => (v === '' ? undefined : v))
    .optional(),
});

export type ReviewFormInput = z.input<typeof reviewSchema>;
export type ReviewFormData = z.output<typeof reviewSchema>;
