import { Server as NetServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { NextApiResponse } from "next";
import { Server } from "socket.io";

export type NextApiResponseServerIO = NextApiResponse & {
  socket: any & {
    server: NetServer & {
      io: Server;
    };
  };
};

export const initSocketServer = (res: NextApiResponseServerIO) => {
  if (!res.socket.server.io) {
    const io = new SocketIOServer(res.socket.server, {
      path: "/api/socketio",
      addTrailingSlash: false,
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL,
        methods: ["GET", "POST"],
      },
    });

    io.on("connection", (socket) => {
      console.log("Socket connected:", socket.id);

      socket.on("join-project", (projectId: string) => {
        socket.join(`project:${projectId}`);
      });

      socket.on("leave-project", (projectId: string) => {
        socket.leave(`project:${projectId}`);
      });

      socket.on("disconnect", () => {
        console.log("Socket disconnected:", socket.id);
      });
    });

    res.socket.server.io = io;
  }
  return res.socket.server.io;
};
