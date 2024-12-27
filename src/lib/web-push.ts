import webPush from "web-push"
import { prisma } from "./prisma"
import { shouldSendNotification } from "./notification-preferences"

// Initialize web-push with VAPID keys
const vapidKeys = {
  publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  privateKey: process.env.VAPID_PRIVATE_KEY!,
}

webPush.setVapidDetails(
  `mailto:${process.env.SUPPORT_EMAIL!}`,
  vapidKeys.publicKey,
  vapidKeys.privateKey
)

export interface PushSubscription {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

export async function saveSubscription(
  userId: string,
  subscription: PushSubscription
) {
  return prisma.pushSubscription.create({
    data: {
      userId,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
  })
}

export async function removeSubscription(endpoint: string) {
  return prisma.pushSubscription.delete({
    where: { endpoint },
  })
}

export async function sendPushNotification(
  userId: string,
  notification: {
    id: string
    type: string
    title: string
    message: string
    url?: string
    metadata?: any
  }
) {
  // Check if user has enabled push notifications for this type
  const shouldSend = await shouldSendNotification(userId, notification.type, "push")
  if (!shouldSend) return

  // Get all push subscriptions for the user
  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId },
  })

  const notifications = subscriptions.map(async (subscription) => {
    try {
      await webPush.sendNotification(
        {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh,
            auth: subscription.auth,
          },
        },
        JSON.stringify({
          ...notification,
          timestamp: new Date().toISOString(),
        })
      )
    } catch (error: any) {
      console.error("Error sending push notification:", error)

      // Remove invalid subscriptions
      if (error.statusCode === 410 || error.statusCode === 404) {
        await removeSubscription(subscription.endpoint)
      }
    }
  })

  await Promise.all(notifications)
}

// Client-side helper to request push notification permission
export async function requestPushPermission(): Promise<PushSubscription | null> {
  try {
    const permission = await Notification.requestPermission()
    if (permission !== "granted") return null

    // Register service worker
    const registration = await navigator.serviceWorker.register("/sw.js")
    await navigator.serviceWorker.ready

    // Subscribe to push notifications
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: vapidKeys.publicKey,
    })

    return subscription.toJSON() as PushSubscription
  } catch (error) {
    console.error("Failed to request push permission:", error)
    return null
  }
}
