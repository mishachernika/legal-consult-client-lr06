import { useMemo, useRef, useState } from 'react';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DayPicker } from 'react-day-picker';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { Consultation } from '@/types/api.types';

function SortableItem({ consultation }: { consultation: Consultation }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: consultation.id,
  });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className="flex cursor-grab items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-sm active:cursor-grabbing dark:border-gray-700 dark:bg-gray-800"
      {...attributes}
      {...listeners}
    >
      <span className="truncate">{consultation.topic}</span>
      <span className="text-xs text-gray-500">{consultation.status}</span>
    </li>
  );
}

// Демонстраційна робоча область ЛБ06: tab-и, dnd-kit, Recharts, календар, редактор та preview зображення.
export default function AdvancedWorkspace({ consultations }: { consultations: Consultation[] }) {
  const [tab, setTab] = useState<'analytics' | 'planner' | 'profile'>('analytics');
  const [items, setItems] = useState(consultations);
  const [date, setDate] = useState<Date>();
  const [query, setQuery] = useState('');
  const [note, setNote] = useState('Підготуйте питання та документи до консультації.');
  const [image, setImage] = useState<string>();
  const [zoom, setZoom] = useState(1);
  const inputRef = useRef<HTMLInputElement>(null);
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
  const chartData = useMemo(
    () =>
      ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].map((status) => ({
        status,
        count: consultations.filter((item) => item.status === status).length,
      })),
    [consultations]
  );
  const matching = items.filter((item) =>
    item.topic.toLocaleLowerCase().includes(query.toLocaleLowerCase())
  );

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label="Інструменти кабінету">
        {(
          [
            ['analytics', 'Аналітика'],
            ['planner', 'Планувальник'],
            ['profile', 'Нотатка й аватар'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`rounded-lg px-3 py-2 text-sm font-medium ${tab === id ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-800'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'analytics' && (
        <div className="h-64" role="tabpanel">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="status" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#2563eb" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab === 'planner' && (
        <div className="grid gap-5 lg:grid-cols-2" role="tabpanel">
          <div>
            <p className="mb-2 font-semibold">Оберіть дату консультації</p>
            <DayPicker
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-lg border p-3"
            />
            <p className="mt-2 text-sm text-gray-500">
              {date ? `Обрано: ${date.toLocaleDateString('uk-UA')}` : 'Дата не обрана'}
            </p>
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold" htmlFor="consultation-search">
              Пошук у пріоритетах
            </label>
            <input
              id="consultation-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Пошук консультації…"
              className="mb-3 w-full rounded border px-3 py-2 dark:bg-gray-800"
            />
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={({ active, over }) => {
                if (over && active.id !== over.id)
                  setItems((current) =>
                    arrayMove(
                      current,
                      current.findIndex((item) => item.id === active.id),
                      current.findIndex((item) => item.id === over.id)
                    )
                  );
              }}
            >
              <SortableContext
                items={matching.map((item) => item.id)}
                strategy={verticalListSortingStrategy}
              >
                <ul className="space-y-2">
                  {matching.slice(0, 5).map((item) => (
                    <SortableItem key={item.id} consultation={item} />
                  ))}
                </ul>
              </SortableContext>
            </DndContext>
          </div>
        </div>
      )}

      {tab === 'profile' && (
        <div className="grid gap-5 md:grid-cols-2" role="tabpanel">
          <div>
            <p className="mb-2 font-semibold">Швидка нотатка</p>
            <div
              contentEditable
              suppressContentEditableWarning
              onInput={(event) => setNote(event.currentTarget.innerHTML)}
              className="min-h-32 rounded border p-3 outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-800"
              dangerouslySetInnerHTML={{ __html: note }}
            />
            <p className="mt-2 text-xs text-gray-500">
              Виділіть текст і скористайтеся стандартними командами браузера для форматування.
            </p>
          </div>
          <div>
            <p className="mb-2 font-semibold">Аватар із попереднім переглядом</p>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) setImage(URL.createObjectURL(file));
              }}
            />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="rounded bg-primary-600 px-3 py-2 text-sm text-white"
            >
              Обрати зображення
            </button>
            {image && (
              <>
                <div className="mt-3 h-32 w-32 overflow-hidden rounded-full bg-gray-100">
                  <img
                    src={image}
                    alt="Попередній перегляд аватара"
                    className="h-full w-full object-cover"
                    style={{ transform: `scale(${zoom})` }}
                  />
                </div>
                <label className="mt-3 block text-sm">
                  Масштаб{' '}
                  <input
                    type="range"
                    min="1"
                    max="2"
                    step="0.05"
                    value={zoom}
                    onChange={(event) => setZoom(Number(event.target.value))}
                  />
                </label>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
