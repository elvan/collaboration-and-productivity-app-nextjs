import { useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const initializeTeamSocket = (teamId: string) => {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_WEBSOCKET_URL || '', {
      path: '/api/socketio',
    });
  }

  socket.emit('join-team', teamId);
  return socket;
};

export const useTeamUpdates = (teamId: string, onUpdate: (data: any) => void) => {
  useEffect(() => {
    const socket = initializeTeamSocket(teamId);

    // Listen for member updates
    socket.on('team-member-added', (data) => {
      onUpdate({ type: 'member-added', data });
    });

    socket.on('team-member-updated', (data) => {
      onUpdate({ type: 'member-updated', data });
    });

    socket.on('team-member-removed', (data) => {
      onUpdate({ type: 'member-removed', data });
    });

    socket.on('team-settings-updated', (data) => {
      onUpdate({ type: 'settings-updated', data });
    });

    return () => {
      socket.emit('leave-team', teamId);
      socket.off('team-member-added');
      socket.off('team-member-updated');
      socket.off('team-member-removed');
      socket.off('team-settings-updated');
    };
  }, [teamId, onUpdate]);
};

export const emitTeamUpdate = (teamId: string, type: string, data: any) => {
  if (socket) {
    socket.emit('team-update', { teamId, type, data });
  }
};
