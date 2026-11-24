import Modal from './Modal';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  /** danger (видалення) або primary (звичайне підтвердження) */
  tone?: 'danger' | 'primary';
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

// Семантична обгортка над Modal для підтвердження дій: заміняє window.confirm() —
// доступна з клавіатури (Escape), у стилі застосунку й не блокує потік виконання.
// Використовується у списку консультацій (видалення) і покрито тестами ConfirmDialog.test.tsx.
export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'Підтвердити',
  tone = 'danger',
  isLoading,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={isOpen}
      onClose={onCancel}
      onConfirm={onConfirm}
      title={title}
      tone={tone}
      isLoading={isLoading}
      confirmText={confirmText}
      size="sm"
    >
      <p>{message}</p>
    </Modal>
  );
}
