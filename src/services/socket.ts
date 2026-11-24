import { io } from 'socket.io-client';

// Socket.io використовує origin сервера, без REST-префікса /api.
export const socket = io(import.meta.env.VITE_SOCKET_URL ?? 'http://localhost:3000', {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 8,
});
