import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import ConfirmDialog from '@/components/common/ConfirmDialog';

describe('ConfirmDialog', () => {
  it('у закритому стані нічого не рендерить', () => {
    render(
      <ConfirmDialog
        isOpen={false}
        title="T"
        message="M"
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('показує title і message у відкритому стані', () => {
    render(
      <ConfirmDialog
        isOpen
        title="Видалення"
        message="Точно видалити консультацію?"
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Видалення')).toBeInTheDocument();
    expect(screen.getByText('Точно видалити консультацію?')).toBeInTheDocument();
  });

  it('кнопка підтвердження викликає onConfirm', async () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(
      <ConfirmDialog
        isOpen
        title="Видалення"
        message="Видалити запис?"
        confirmText="Видалити"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: 'Видалити' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('кнопка скасування і Escape викликають onCancel', async () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(
      <ConfirmDialog isOpen title="T" message="M" onConfirm={onConfirm} onCancel={onCancel} />
    );

    await userEvent.click(screen.getByRole('button', { name: 'Скасувати' }));
    expect(onCancel).toHaveBeenCalledTimes(1);

    // Headless UI Dialog закривається за Escape — це повторний onCancel
    await userEvent.keyboard('{Escape}');
    expect(onCancel).toHaveBeenCalledTimes(2);
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
