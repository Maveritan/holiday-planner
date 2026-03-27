import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || window.location.origin;
const IS_PROD = import.meta.env.VITE_APP_ENV === 'production';

export const socket: Socket = io(SOCKET_URL, {
  autoConnect: true,
  rejectUnauthorized: !IS_PROD, // Required for self-signed certificates in dev
  transports: ['websocket', 'polling'], // Try websocket first, fallback to polling
});
