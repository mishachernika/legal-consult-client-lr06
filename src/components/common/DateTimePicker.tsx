import { useMemo, useState } from 'react';
import { DayPicker } from 'react-day-picker';
import { uk } from 'react-day-picker/locale';
import 'react-day-picker/style.css';
import { cn } from '@/utils/cn';

interface DateTimePickerProps {
  /** Значення форми: 'YYYY-MM-DDTHH:mm' або '' */
  value: string;
  onChange: (value: string) => void;
  ariaLabel?: string;
  error?: boolean;
}

function parseValue(value: string): { date: Date | undefined; time: string } {
  if (!value) return { date: undefined, time: '' };
  const [datePart, timePart = ''] = value.split('T');
  const [y, m, d] = datePart.split('-').map(Number);
  return {
    date:
      Number.isFinite(y) && Number.isFinite(m) && Number.isFinite(d)
        ? new Date(y, m - 1, d)
        : undefined,
    time: timePart,
  };
}

function toLocalIso(date: Date, time: string): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return time ? `${y}-${m}-${d}T${time}` : `${y}-${m}-${d}`;
}

// Календар із вибором дати і часу (рівень 2, завдання 12) на react-day-picker.
// Працює як спільний компонент форми консультації (поле «Запланований час»):
// клік по дню обирає дату, окреме поле — час, вибір відображається у локальному ISO,
// який схема валідації перетворює в UTC для сервера.
export default function DateTimePicker({ value, onChange, ariaLabel, error }: DateTimePickerProps) {
  const [open, setOpen] = useState(false);
  const { date, time } = useMemo(() => parseValue(value), [value]);

  const setTime = (nextTime: string) => {
    if (!date) {
      // час без дати — беремо сьогодні, щоб значення залишалося валідним
      const today = new Date();
      onChange(`${toLocalIso(today, '')}T${nextTime}`);
      return;
    }
    onChange(`${toLocalIso(date, '')}T${nextTime}`);
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="relative">
      <div
        className={cn(
          'flex items-center justify-between gap-2 rounded-lg border bg-white px-3 py-2 shadow-sm transition-colors dark:bg-gray-900',
          error ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'
        )}
      >
        <span className={cn('text-sm', !date && 'text-gray-400')} aria-live="polite">
          {date ? `${value.replace('T', ' ')}` : 'Дата не обрана'}
        </span>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={ariaLabel ?? 'Вибрати дату з календаря'}
          aria-expanded={open}
          className="rounded p-1 text-primary-600 hover:bg-primary-50 dark:hover:bg-gray-800"
        >
          <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <rect x="3" y="5" width="18" height="16" rx="2" />
            <path d="M8 3v4M16 3v4M3 10h18" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {open && (
        <>
          <button
            type="button"
            aria-hidden="true"
            tabIndex={-1}
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div className="absolute z-50 mt-2 rounded-lg border border-gray-200 bg-white p-3 shadow-lg dark:border-gray-700 dark:bg-gray-900">
            <DayPicker
              mode="single"
              selected={date}
              locale={uk}
              disabled={{ before: today }} // консультацію не можна запланувати в минулому
              onSelect={(day) => {
                // У режимі single DayPicker дозволяє зняти вибір повторним кліком.
                // Порожню дату тут не відправляємо, щоб не викликати toLocalIso(undefined, ...).
                if (!day) return;
                onChange(`${toLocalIso(day as Date, '')}T${time || '10:00'}`);
              }}
              footer={
                <label className="mt-2 flex items-center justify-center gap-2 text-sm">
                  Час:
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="rounded border border-gray-300 bg-white px-2 py-1 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                    aria-label="Час консультації"
                  />
                </label>
              }
            />
          </div>
        </>
      )}
    </div>
  );
}
