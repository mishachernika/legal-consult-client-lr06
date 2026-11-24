import { useEffect, useState, type ReactNode } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/utils/cn';

const STORAGE_KEY = 'dashboard-taskboard';

interface Task {
  id: string;
  title: string;
  done: boolean;
}

// Приклад списку пріоритетів юриста на тиждень (рівень 2, завдання 8):
// порядок змінюється перетягуванням (dnd-kit) і зберігається у localStorage.
function defaultTasks(): Task[] {
  return [
    { id: '1', title: 'Переглянути нові заявки на консультації', done: false },
    { id: '2', title: 'Підготувати проєкт договору оренди', done: false },
    { id: '3', title: 'Відповісти на повідомлення у чатах', done: false },
    { id: '4', title: 'Оновити профіль юриста (сфери права)', done: false },
    { id: '5', title: 'Оформити відгуки клієнтів за тиждень', done: false },
  ];
}

function loadTasks(): Task[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Task[];
  } catch {
    // пошкоджений localStorage — починаємо з дефолтного списку
  }
  return defaultTasks();
}

function SortableItem({ id, children }: { id: string; children: ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn('touch-none', isDragging && 'z-10 opacity-80 shadow-xl')}
    >
      {children}
    </div>
  );
}

// Список що сортується перетягуванням: PointerSensor (миша/дотик) + KeyboardSensor
// (Пробіл — взяти, стрілки — рух, Escape — відміна), тому драг-н-дроп доступний
// і з клавіатури.
export default function TaskBoard() {
  const [tasks, setTasks] = useState<Task[]>(loadTasks);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch {
      // приватний режим браузера: зберігання недоступне, не критично
    }
  }, [tasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    // over === null, якщо елемент відпустили поза списком
    if (over && active.id !== over.id) {
      setTasks((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const toggle = (id: string) =>
    setTasks((items) => items.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));

  return (
    <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-900">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-bold">Мої пріоритети на тиждень</h3>
        <p className="text-xs text-gray-500">
          Перетягніть, щоб змінити порядок (для клавіатури: Tab, Пробіл, стрілки)
        </p>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          <ul className="space-y-2">
            {tasks.map((task) => (
              <SortableItem key={task.id} id={task.id}>
                <div
                  className={cn(
                    'flex cursor-grab items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 shadow-sm active:cursor-grabbing dark:border-gray-700 dark:bg-gray-900',
                    task.done && 'opacity-60'
                  )}
                >
                  <svg
                    aria-hidden="true"
                    className="h-4 w-4 text-gray-400"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                  >
                    <circle cx="5" cy="3" r="1.4" />
                    <circle cx="11" cy="3" r="1.4" />
                    <circle cx="5" cy="8" r="1.4" />
                    <circle cx="11" cy="8" r="1.4" />
                    <circle cx="5" cy="13" r="1.4" />
                    <circle cx="11" cy="13" r="1.4" />
                  </svg>
                  <input
                    type="checkbox"
                    checked={task.done}
                    onChange={() => toggle(task.id)}
                    aria-label={`Позначити «${task.title}»`}
                    className="h-4 w-4 accent-primary-600"
                  />
                  <span
                    className={cn(
                      'flex-1 text-sm',
                      task.done && 'line-through decoration-gray-400'
                    )}
                  >
                    {task.title}
                  </span>
                </div>
              </SortableItem>
            ))}
          </ul>
        </SortableContext>
      </DndContext>
    </div>
  );
}
