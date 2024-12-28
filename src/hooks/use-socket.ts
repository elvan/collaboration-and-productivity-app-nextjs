import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";

export const useSocket = () => {
  const socket = useRef<Socket>();

  useEffect(() => {
    if (!socket.current) {
      socket.current = io(process.env.NEXT_PUBLIC_APP_URL!, {
        path: "/api/socketio",
        addTrailingSlash: false,
      });

      socket.current.on("connect", () => {
        console.log("Socket connected");
      });

      socket.current.on("disconnect", () => {
        console.log("Socket disconnected");
      });
    }

    return () => {
      if (socket.current) {
        socket.current.disconnect();
      }
    };
  }, []);

  const joinProject = (projectId: string) => {
    socket.current?.emit("join-project", projectId);
  };

  const leaveProject = (projectId: string) => {
    socket.current?.emit("leave-project", projectId);
  };

  const subscribeToEvent = (event: string, callback: (data: any) => void) => {
    socket.current?.on(event, callback);
    return () => {
      socket.current?.off(event, callback);
    };
  };

  return {
    socket: socket.current,
    joinProject,
    leaveProject,
    subscribeToEvent,
  };
};
