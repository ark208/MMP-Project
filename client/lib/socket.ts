import io from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';
export const isMockMode = process.env.NEXT_PUBLIC_USE_MOCKS === 'true';

export type Socket = ReturnType<typeof io>;

let socket: Socket | null = null;

export function getSocket(token?: string): Socket | null {
  if (isMockMode || typeof window === 'undefined') {
    return null;
  }

  if (!socket) {
    const effectiveToken = token || localStorage.getItem('token') || '';
    socket = io(SOCKET_URL, {
      autoConnect: true,
      auth: {
        token: effectiveToken,
      },
    });

    socket.on('connect_error', (err: any) => {
      console.warn('[Socket.io] Connection error, using polling fallback:', err.message);
    });
  }

  return socket;
}
