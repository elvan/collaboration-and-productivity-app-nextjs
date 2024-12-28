import { Server } from 'socket.io';
import { NextApiRequest } from 'next';
import { NextApiResponseServerIO } from '@/types/next';
import { getServerSession } from 'next-auth';

const ioHandler = (req: NextApiRequest, res: NextApiResponseServerIO) => {
  if (!res.socket.server.io) {
    const io = new Server(res.socket.server, {
      path: '/api/socketio',
      addTrailingSlash: false,
    });

    io.on('connection', (socket) => {
      socket.on('join-team', (teamId: string) => {
        socket.join(`team:${teamId}`);
      });

      socket.on('leave-team', (teamId: string) => {
        socket.leave(`team:${teamId}`);
      });

      socket.on('team-update', ({ teamId, type, data }) => {
        socket.to(`team:${teamId}`).emit(`team-${type}`, data);
      });
    });

    res.socket.server.io = io;
  }

  res.end();
};

export const GET = async (req: NextApiRequest, res: NextApiResponseServerIO) => {
  const session = await getServerSession();
  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    ioHandler(req, res);
    return new Response('WebSocket server is running');
  } catch (error) {
    console.error('[SOCKET_SERVER_ERROR]', error);
    return new Response('Internal server error', { status: 500 });
  }
};
