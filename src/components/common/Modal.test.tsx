import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import Modal from './Modal';

describe('Modal', () => {
  test('закривається клавішею Escape', () => {
    const onClose = vi.fn();
    render(
      <Modal open title="Видалити?" onClose={onClose} onConfirm={vi.fn()}>
        Вміст
      </Modal>
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();
  });

  test('викликає підтвердження', () => {
    const onConfirm = vi.fn();
    render(
      <Modal open title="Видалити?" onClose={vi.fn()} onConfirm={onConfirm}>
        Вміст
      </Modal>
    );
    fireEvent.click(screen.getByRole('button', { name: 'Підтвердити' }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });
});
