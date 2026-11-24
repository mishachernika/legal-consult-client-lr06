import { useMemo, useState } from 'react';
import { Combobox, ComboboxInput, ComboboxOption, ComboboxOptions } from '@headlessui/react';
import { cn } from '@/utils/cn';

export interface ComboboxOptionItem {
  value: string;
  label: string;
  description?: string;
}

interface SearchComboboxProps {
  items: ComboboxOptionItem[];
  value: ComboboxOptionItem | null;
  onChange: (item: ComboboxOptionItem | null) => void;
  placeholder?: string;
  ariaLabel?: string;
  error?: boolean;
}

// Випадне меню з пошуком на Headless UI Combobox (рівень 1, завдання 7):
// фільтрація вводом, клавіатурна навігація (стрілки/Enter), ARIA-роль combobox.
// Використовується у формі консультації для вибору юриста/клієнта з довгих списків.
export default function SearchCombobox({
  items,
  value,
  onChange,
  placeholder,
  ariaLabel,
  error,
}: SearchComboboxProps) {
  const [query, setQuery] = useState('');

  // Фільтр без врахування регістру за підписом і описом
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (item) => item.label.toLowerCase().includes(q) || item.description?.toLowerCase().includes(q)
    );
  }, [items, query]);

  return (
    <Combobox
      value={value}
      onChange={(item) => {
        onChange(item);
        setQuery('');
      }}
    >
      <div
        className={cn(
          'rounded-lg border bg-white shadow-sm transition-colors focus-within:border-primary-500 dark:bg-gray-900',
          error ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'
        )}
      >
        <ComboboxInput
          className="w-full rounded-lg bg-transparent px-3 py-2 outline-none dark:text-gray-100"
          displayValue={(item: ComboboxOptionItem | null) => item?.label ?? ''}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={placeholder}
          aria-label={ariaLabel}
          autoComplete="off"
        />
      </div>
      <ComboboxOptions
        anchor="bottom start"
        className="z-50 mt-1 max-h-64 max-w-[500px] overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg empty:invisible dark:border-gray-700 dark:bg-gray-900"
      >
        {filtered.length === 0 && (
          <div className="px-3 py-2 text-sm text-gray-500">Нічого не знайдено</div>
        )}
        {filtered.map((item) => (
          <ComboboxOption
            key={item.value}
            value={item}
            className="flex cursor-pointer flex-col gap-0.5 px-3 py-2 text-sm data-focus:bg-primary-50 dark:data-focus:bg-gray-800"
          >
            <span className="font-medium dark:text-gray-100">{item.label}</span>
            {item.description && (
              <span className="text-xs text-gray-500 dark:text-gray-400">{item.description}</span>
            )}
          </ComboboxOption>
        ))}
      </ComboboxOptions>
    </Combobox>
  );
}
