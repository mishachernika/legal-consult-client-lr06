import api from './api';
import type { AppFile } from '@/types/api.types';

// Файловий сервіс ЛР02: POST /api/files/upload (multipart, поле 'file') → { file }
// Файл потім віддається через GET /api/files/:id — звідси й URL для <img src>.
export function fileUrl(file: Pick<AppFile, 'id'>): string {
  const base = api.defaults.baseURL ?? '';
  return `${base}/files/${file.id}`;
}

export const filesService = {
  upload: async (blob: Blob, filename: string, consultationId?: number) => {
    const form = new FormData();
    form.append('file', blob, filename);
    if (consultationId) form.append('consultationId', String(consultationId));
    const { data } = await api.post<{ message: string; file: AppFile }>('/files/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' }, // boundary ставить браузер
    });
    return data.file;
  },
};
