import api from './api';
import type { PaginatedResponse, Role, User } from '@/types/api.types';

export interface UsersQuery {
  page?: number;
  limit?: number;
  search?: string;
  role?: Role;
}

// GET /api/users — лише для ADMIN (ЛР02: список усіх користувачів із email/телефонами бачить лише адмін)
export const usersService = {
  getAll: async (params: UsersQuery = {}) => {
    const { data } = await api.get<PaginatedResponse<User>>('/users', { params });
    return data;
  },

  // PUT /api/users/:id — власник або адмін (ЛР03). Використовується, наприклад,
  // щоб прив'язати URL завантаженого аватара до профілю.
  update: async (
    id: number,
    payload: { name?: string; phone?: string; avatar?: string | null }
  ) => {
    const { data } = await api.put<{ data: User }>(`/users/${id}`, payload);
    return data.data;
  },
};
