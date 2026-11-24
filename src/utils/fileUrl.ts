// Бекенд повертає посилання на файли (наприклад, аватар) у вигляді абсолютного URL
// свого домену: http://localhost:3000/api/files/14. Коли клієнт відкритий на іншому
// origin, браузер блокує такі <img> заголовком Cross-Origin-Resource-Policy (CORP).
// Розв'язок: переписуємо посилання на файли у той самий базовий URL, через який
// застосунок ходить до API (VITE_API_URL). У розробці це "/api" (proxy тієї ж
// origin -> CORP не спрацьовує), у продакшені — абсолютна адреса API з CORS.

export function toAppFileUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  try {
    const parsed = new URL(url, window.location.origin);
    // чіпаємо лише файлові шляхи нашого API (`/api/files/...`)
    if (!parsed.pathname.startsWith('/api/files/')) return url;

    const apiBase = import.meta.env.VITE_API_URL ?? '/api';
    const apiOrigin = /^https?:\/\//.test(apiBase) ? new URL(apiBase).origin : '';
    return `${apiOrigin}${parsed.pathname}${parsed.search}`;
  } catch {
    return url;
  }
}
