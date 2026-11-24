import { describe, expect, it } from 'vitest';
import { consultationSchema } from '@/schemas/consultation.schema';

describe('consultationSchema', () => {
  it('дозволяє клієнту створити консультацію з порожнім технічним clientId', () => {
    const result = consultationSchema.safeParse({
      lawyerId: '18',
      clientId: '',
      topic: 'Оскарження штрафу',
      description: 'Потрібна допомога з оскарженням постанови про штраф.',
      scheduledAt: '',
    });

    expect(result.success).toBe(true);
    if (result.success) expect(result.data.clientId).toBeUndefined();
  });

  it('не приймає некоректно обраного клієнта для адміністратора', () => {
    const result = consultationSchema.safeParse({
      lawyerId: '18',
      clientId: '0',
      topic: 'Оскарження штрафу',
      description: 'Потрібна допомога з оскарженням постанови про штраф.',
      scheduledAt: '',
    });

    expect(result.success).toBe(false);
  });
});
