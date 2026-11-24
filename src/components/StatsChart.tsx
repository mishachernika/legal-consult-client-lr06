import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { CONSULTATION_STATUS_LABELS } from '@/constants';
import type { Consultation } from '@/types/api.types';
import { cn } from '@/utils/cn';

interface StatsChartProps {
  consultations: Consultation[];
  title: string;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: '#f59e0b',
  CONFIRMED: '#3b82f6',
  IN_PROGRESS: '#0ea5e9',
  COMPLETED: '#22c55e',
  CANCELLED: '#ef4444',
};

// Візуалізація даних (рівень 2, завдання 9): Recharts BarChart кількості консультацій
// за статусами. Список консультацій приходить із батьківського компонента через useQuery —
// цей компонент лише агрегує й рендерить графік. Recharts потрапляє тільки в chunk Dashboard
// (code splitting, рівень 3), тому початкове завантаження він не обтяжує.
export default function StatsChart({ consultations, title }: StatsChartProps) {
  const data = useMemo(() => {
    const counts = new Map<string, number>();
    for (const c of consultations) counts.set(c.status, (counts.get(c.status) ?? 0) + 1);
    return ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].map((status) => ({
      status,
      label: CONSULTATION_STATUS_LABELS[status] ?? status,
      value: counts.get(status) ?? 0,
    }));
  }, [consultations]);

  const total = consultations.length;
  const empty = total === 0;

  return (
    <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-900">
      <h3 className="mb-1 text-lg font-bold">{title}</h3>
      <p className="mb-4 text-sm text-gray-500">
        Показано за {total} останніми консультаціями (ліміт запиту — 100)
      </p>

      <div className={cn('h-72', empty && 'flex items-center justify-center')}>
        {empty ? (
          <p className="text-sm text-gray-500">Ще немає даних для графіка.</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.3} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11 }}
                interval={0}
                height={50}
                angle={-15}
                dy={12}
              />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ borderRadius: 8, fontSize: 12 }}
                formatter={(value) => [value, 'Консультацій']}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="value" name="Консультацій" radius={[4, 4, 0, 0]}>
                {/* колір стовпця узгоджений з кольорами статусів у Badge */}
                {data.map((entry) => (
                  <Cell key={entry.status} fill={STATUS_COLORS[entry.status]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
