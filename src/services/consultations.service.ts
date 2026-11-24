import api from './api';
import type {
  Consultation,
  ConsultationDetail,
  ConsultationStatus,
  Message,
  PaginatedResponse,
  SingleResponse,
} from '@/types/api.types';

export interface ConsultationsQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: ConsultationStatus | '';
  clientId?: number;
  lawyerId?: number;
}

export interface ConsultationPayload {
  lawyerId: number;
  topic: string;
  description: string;
  scheduledAt?: string;
  /** клієнт консультації; для звичайного користувача це його власний профіль */
  clientId?: number;
}

export interface ConsultationUpdatePayload {
  /** Змінити юриста може лише ADMIN; сервер перевіряє роль. */
  lawyerId?: number;
  topic?: string;
  description?: string;
  scheduledAt?: string | null;
  status?: ConsultationStatus;
  price?: number;
}

// Сервіс консультацій: лише HTTP-запити, стан і кеш — у TanStack Query
export const consultationsService = {
  getAll: async (params: ConsultationsQuery = {}) => {
    const { data } = await api.get<PaginatedResponse<Consultation>>('/consultations', { params });
    return data;
  },
  getById: async (id: number) => {
    const { data } = await api.get<SingleResponse<ConsultationDetail>>(`/consultations/${id}`);
    return data.data;
  },
  create: async (payload: ConsultationPayload) => {
    const { data } = await api.post<SingleResponse<Consultation>>('/consultations', payload);
    return data.data;
  },
  update: async (id: number, payload: ConsultationUpdatePayload) => {
    const { data } = await api.put<SingleResponse<Consultation>>(`/consultations/${id}`, payload);
    return data.data;
  },
  remove: async (id: number) => {
    await api.delete(`/consultations/${id}`);
  },
  listMessages: async (id: number) => {
    const { data } = await api.get<SingleResponse<Message[]>>(`/consultations/${id}/messages`);
    return data.data;
  },
  sendMessage: async (id: number, text: string) => {
    const { data } = await api.post<SingleResponse<Message>>(`/consultations/${id}/messages`, {
      text,
    });
    return data.data;
  },
};
