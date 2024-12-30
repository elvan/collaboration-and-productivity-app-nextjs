import Pusher from "pusher-js";
import { useEffect, useState } from "react";

const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY!;
const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER!;

export function useSocket() {
  const [socket, setSocket] = useState<Pusher | null>(null);

  useEffect(() => {
    const pusher = new Pusher(pusherKey, {
      cluster: pusherCluster,
    });

    setSocket(pusher);

    return () => {
      pusher.disconnect();
    };
  }, []);

  return socket;
}
