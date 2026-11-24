import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import type { ReactNode } from 'react';
import Button from './Button';

interface ModalProps {
  open: boolean;
  title: string;
  children: ReactNode;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

// Headless UI Dialog дає focus trap, Escape, aria-modal і блокування взаємодії з фоном.
export default function Modal({
  open,
  title,
  children,
  confirmText = 'Підтвердити',
  cancelText = 'Скасувати',
  isLoading = false,
  onConfirm,
  onClose,
}: ModalProps) {
  return (
    <Dialog open={open} onClose={isLoading ? () => {} : onClose} className="relative z-50">
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-black/50 duration-200 data-closed:opacity-0"
      />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel
          transition
          className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl duration-200 data-closed:scale-95 data-closed:opacity-0 dark:bg-gray-900"
        >
          <DialogTitle className="mb-3 text-xl font-semibold">{title}</DialogTitle>
          <div className="mb-5 text-gray-600 dark:text-gray-300">{children}</div>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={onClose} disabled={isLoading}>
              {cancelText}
            </Button>
            <Button variant="danger" onClick={onConfirm} isLoading={isLoading}>
              {confirmText}
            </Button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
