import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router';
import ConsultationsListPage from '@/pages/ConsultationsListPage';
import { consultationsService } from '@/services/consultations.service';
import { useAuthStore } from '@/stores/authStore';
import type { Consultation } from '@/types/api.types';

vi.mock('@/services/consultations.service', () => ({
  consultationsService: {
    getAll: vi.fn(),
    remove: vi.fn(),
  },
}));

// Список підписується на живі події — даємо мок-socket із простою картою обробників
vi.mock('@/services/socket', () => ({
  socket: {
    on: vi.fn(),
    off: vi.fn(),
    connected: false,
  },
  connectSocket: vi.fn(),
  disconnectSocket: vi.fn(),
}));

const consultation: Consultation = {
  id: 42,
  topic: 'Розірвання договору оренди',
  description: 'Клієнт просить розібрати звільнення від відповідальності.',
  status: 'PENDING',
  price: '500.00',
  clientId: 3,
  lawyerId: 7,
  scheduledAt: '2025-01-20T12:00:00.000Z',
  createdAt: '2025-01-15T10:00:00.000Z',
  updatedAt: '2025-01-15T10:00:00.000Z',
  lawyer: { id: 7, name: 'Олена Ковальчук', email: 'olena@legal.ua' },
  client: { id: 3, name: 'Іван Петренко', email: 'ivan@example.com' },
};

function renderPage(): void {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <ConsultationsListPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('ConsultationsListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      user: {
        id: 1,
        name: 'Адмін',
        email: 'a@b.c',
        role: 'ADMIN',
        phone: null,
        avatar: null,
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      },
      accessToken: 'token',
      refreshToken: 'refresh',
    });
    vi.mocked(consultationsService.getAll).mockResolvedValue({
      data: [consultation],
      pagination: { page: 1, limit: 10, total: 1, totalPages: 1, hasMore: false },
    });
  });

  it('завантажує і показує список консультацій', async () => {
    renderPage();

    await waitFor(() => {
      expect(consultationsService.getAll).toHaveBeenCalled();
    });
    expect(await screen.findByText('Розірвання договору оренди')).toBeInTheDocument();
  });

  it('видаляє консультацію після підтвердження через ConfirmDialog', async () => {
    vi.mocked(consultationsService.remove).mockResolvedValue(undefined);

    renderPage();
    await screen.findByText('Розірвання договору оренди');

    await userEvent.click(screen.getByRole('button', { name: 'Видалити' }));

    // відкривається діалог підтвердження — саме він, а не window.confirm
    const dialog = await screen.findByRole('dialog');
    expect(screen.getByText(/Видалити консультацію?/)).toBeInTheDocument();

    await userEvent.click(within(dialog).getByRole('button', { name: 'Видалити' }));

    await waitFor(() => {
      expect(consultationsService.remove).toHaveBeenCalledWith(42);
    });
  });

  it('помилка завантаження показується користувачу', async () => {
    vi.mocked(consultationsService.getAll).mockRejectedValue(new Error('мережа недоступна'));

    renderPage();

    expect(await screen.findByRole('alert')).toHaveTextContent(/мережа недоступна/);
  });
});
