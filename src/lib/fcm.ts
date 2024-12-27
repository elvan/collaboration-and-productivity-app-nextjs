import { credential } from "firebase-admin"
import { initializeApp, getApps, getApp } from "firebase-admin/app"
import { getMessaging } from "firebase-admin/messaging"
import { prisma } from "./prisma"

// Initialize Firebase Admin
const firebaseAdminConfig = {
  credential: credential.cert({
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  }),
}

if (!getApps().length) {
  initializeApp(firebaseAdminConfig)
}

export async function sendPushNotification(
  userId: string,
  notification: {
    title: string
    body: string
    icon?: string
    url?: string
    data?: Record<string, string>
  }
) {
  try {
    // Get user's FCM tokens
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId },
    })

    if (!subscriptions.length) {
      return
    }

    const messaging = getMessaging(getApp())

    // Send to all user's devices
    const messages = subscriptions.map((sub) => ({
      token: sub.token,
      notification: {
        title: notification.title,
        body: notification.body,
        icon: notification.icon || "/icon-192x192.png",
      },
      data: {
        url: notification.url || "/notifications",
        ...notification.data,
      },
      webpush: {
        fcmOptions: {
          link: notification.url || "/notifications",
        },
      },
    }))

    const response = await messaging.sendEach(messages)

    // Handle failed tokens
    const failedTokens = response.responses
      .map((resp, idx) => (resp.success ? null : messages[idx].token))
      .filter(Boolean) as string[]

    if (failedTokens.length > 0) {
      // Remove failed tokens
      await prisma.pushSubscription.deleteMany({
        where: {
          token: {
            in: failedTokens,
          },
          userId,
        },
      })
    }

    return {
      successCount: response.successCount,
      failureCount: response.failureCount,
    }
  } catch (error) {
    console.error("Failed to send push notification:", error)
    throw error
  }
}

export async function sendBatchPushNotification(
  userIds: string[],
  notification: {
    title: string
    body: string
    icon?: string
    url?: string
    data?: Record<string, string>
  }
) {
  try {
    // Get all users' FCM tokens
    const subscriptions = await prisma.pushSubscription.findMany({
      where: {
        userId: {
          in: userIds,
        },
      },
    })

    if (!subscriptions.length) {
      return
    }

    const messaging = getMessaging(getApp())

    // Send to all devices
    const messages = subscriptions.map((sub) => ({
      token: sub.token,
      notification: {
        title: notification.title,
        body: notification.body,
        icon: notification.icon || "/icon-192x192.png",
      },
      data: {
        url: notification.url || "/notifications",
        ...notification.data,
      },
      webpush: {
        fcmOptions: {
          link: notification.url || "/notifications",
        },
      },
    }))

    const response = await messaging.sendEach(messages)

    // Handle failed tokens
    const failedTokens = response.responses
      .map((resp, idx) => (resp.success ? null : messages[idx].token))
      .filter(Boolean) as string[]

    if (failedTokens.length > 0) {
      // Remove failed tokens
      await prisma.pushSubscription.deleteMany({
        where: {
          token: {
            in: failedTokens,
          },
        },
      })
    }

    return {
      successCount: response.successCount,
      failureCount: response.failureCount,
    }
  } catch (error) {
    console.error("Failed to send batch push notification:", error)
    throw error
  }
}
