import type { ReactNode } from 'react';
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import Button from './Button';
import { cn } from '@/utils/cn';

type ModalSize = 'sm' | 'md' | 'lg';

interface ModalProps {
  open: boolean;
  title: string;
  children: ReactNode;
  confirmText?: string;
  cancelText?: string;
  /** danger — червона кнопка підтвердження (видалення), primary — звичайна дія */
  tone?: 'danger' | 'primary';
  isLoading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
  size?: ModalSize;
}

const sizeClasses: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-2xl',
};

// Модальне вікно на Headless UI 2 (рівень 1, завдання 5): поведінку й доступність
// дає бібліотека — фокус-трап, закриття по Escape, блокування прокрутки, portal,
// role="dialog" + aria-modal. Анімація — атрибут transition і класи data-closed:*.
export default function Modal({
  open,
  title,
  children,
  confirmText = 'Підтвердити',
  cancelText = 'Скасувати',
  tone = 'danger',
  isLoading = false,
  onConfirm,
  onClose,
  size = 'md',
}: ModalProps) {
  return (
    <Dialog open={open} onClose={onClose} transition className="relative z-50">
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-black/50 duration-200 ease-out data-closed:opacity-0"
      />
      <div className="fixed inset-0 flex items-center justify-center overflow-y-auto p-4">
        <DialogPanel
          transition
          className={cn(
            'w-full rounded-xl bg-white p-6 shadow-xl duration-200 ease-out data-closed:scale-95 data-closed:opacity-0 dark:bg-gray-900',
            sizeClasses[size]
          )}
        >
          <DialogTitle className="mb-3 text-xl font-semibold">{title}</DialogTitle>
          <div className="mb-5 text-gray-600 dark:text-gray-300">{children}</div>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={onClose} disabled={isLoading}>
              {cancelText}
            </Button>
            <Button
              variant={tone === 'danger' ? 'danger' : 'primary'}
              onClick={onConfirm}
              isLoading={isLoading}
            >
              {confirmText}
            </Button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
