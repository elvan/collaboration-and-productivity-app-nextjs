import PusherServer from "pusher"
import PusherClient from "pusher-js"

export const pusherServer = new PusherServer({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true,
})

export const pusherClient = new PusherClient(
  process.env.NEXT_PUBLIC_PUSHER_KEY!,
  {
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  }
)

// Helper function to trigger events
export async function triggerPusherEvent(
  channel: string,
  event: string,
  data: any
) {
  try {
    await pusherServer.trigger(channel, event, data)
  } catch (error) {
    console.error("Error triggering Pusher event:", error)
    throw error
  }
}

// Helper function to subscribe to channels
export function subscribeToPusherChannel(
  channelName: string,
  eventName: string,
  callback: (data: any) => void
) {
  const channel = pusherClient.subscribe(channelName)
  channel.bind(eventName, callback)

  return () => {
    channel.unbind(eventName, callback)
    pusherClient.unsubscribe(channelName)
  }
}
