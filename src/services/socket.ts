import { io, type Socket } from 'socket.io-client';

// Адреса сервера Socket.io — БЕЗ префікса /api: він належить лише REST-маршрутам.
// Інакше Socket.io сприйме "/api" як назву простору імен (namespace).
// Якщо VITE_SOCKET_URL не задано — ідемо на origin сторінки: в розробці це Vite-проксі
// (vite.config.ts), на хостингу — власний домен за реверс-проксі.
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || window.location.origin;

// Єдиний екземпляр на весь застосунок. autoConnect: false — з'єднання встановлюється
// лише після входу (connectSocket(token)), але підписуватися socket.on(...) компоненти
// можуть у будь-який момент, ще до підключення.
export const socket: Socket = io(SOCKET_URL, { autoConnect: false });

// Підключення з JWT: сервер перевіряє auth.token в io.use(...) і віддає
// connect_error 'unauthorized' для недійсного токена.
export function connectSocket(token: string) {
  if (socket.active) socket.disconnect(); // токен змінився (refresh): перепідключаємося
  socket.auth = { token };
  socket.connect();
}

export function disconnectSocket() {
  socket.disconnect();
}
