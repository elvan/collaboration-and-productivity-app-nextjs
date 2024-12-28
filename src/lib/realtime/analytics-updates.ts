import { Socket } from 'socket.io-client';
import { useEffect } from 'react';
import { io } from 'socket.io-client';

let socket: Socket | null = null;

export const initializeAnalyticsSocket = () => {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_WEBSOCKET_URL || '', {
      path: '/api/socketio',
    });
  }

  return socket;
};

export const useAnalyticsUpdates = (
  onUpdate: (data: {
    type: 'activity' | 'user' | 'performance';
    data: any;
  }) => void
) => {
  useEffect(() => {
    const socket = initializeAnalyticsSocket();

    // Listen for activity updates
    socket.on('activity-created', (data) => {
      onUpdate({ type: 'activity', data });
    });

    socket.on('activity-updated', (data) => {
      onUpdate({ type: 'activity', data });
    });

    // Listen for user activity updates
    socket.on('user-activity-updated', (data) => {
      onUpdate({ type: 'user', data });
    });

    // Listen for performance metric updates
    socket.on('performance-updated', (data) => {
      onUpdate({ type: 'performance', data });
    });

    return () => {
      socket.off('activity-created');
      socket.off('activity-updated');
      socket.off('user-activity-updated');
      socket.off('performance-updated');
    };
  }, [onUpdate]);
};

export const emitAnalyticsUpdate = (type: string, data: any) => {
  if (socket) {
    socket.emit('analytics-update', { type, data });
  }
};
