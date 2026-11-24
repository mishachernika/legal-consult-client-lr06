import type { ReactNode } from 'react';
import { TabGroup, TabList, Tab, TabPanels, TabPanel } from '@headlessui/react';
import { cn } from '@/utils/cn';

export interface TabItem {
  label: string;
  content: ReactNode;
}

interface TabsProps {
  tabs: TabItem[];
  className?: string;
}

// Таби на Headless UI (рівень 1, завдання 6): доступна організація контенту
// (role=tablist/tab/tabpanel, керування стрілками клавіатури — з коробки)
export default function Tabs({ tabs, className }: TabsProps) {
  return (
    <TabGroup className={className}>
      <TabList className="flex gap-2 rounded-lg bg-white p-1.5 shadow dark:bg-gray-900">
        {tabs.map(({ label }) => (
          <Tab
            key={label}
            className={cn(
              'flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors',
              'focus:outline-none data-selected:bg-primary-600 data-selected:text-white',
              'hover:bg-gray-100 data-selected:hover:bg-primary-600 dark:hover:bg-gray-800',
              'text-gray-600 dark:text-gray-300 data-selected:hover:text-white'
            )}
          >
            {label}
          </Tab>
        ))}
      </TabList>
      <TabPanels className="mt-4">
        {tabs.map(({ label, content }) => (
          <TabPanel key={label}>{content}</TabPanel>
        ))}
      </TabPanels>
    </TabGroup>
  );
}
