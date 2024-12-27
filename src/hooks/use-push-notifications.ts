import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { getToken, onMessage } from "firebase/messaging"
import { getFirebaseMessaging } from "@/lib/firebase-config"
import { useToast } from "@/components/ui/use-toast"

export function usePushNotifications() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [permission, setPermission] = useState<NotificationPermission>("default")
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Check permission status on mount
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermission(Notification.permission)
    }
  }, [])

  // Initialize Firebase messaging and handle foreground messages
  useEffect(() => {
    const messaging = getFirebaseMessaging()
    if (!messaging) return

    const unsubscribe = onMessage(messaging, (payload) => {
      console.log("Received foreground message:", payload)

      // Show toast notification
      toast({
        title: payload.notification?.title,
        description: payload.notification?.body,
        action: payload.data?.url
          ? {
              label: "View",
              onClick: () => window.open(payload.data.url, "_blank"),
            }
          : undefined,
      })
    })

    return () => unsubscribe()
  }, [toast])

  // Request permission and get FCM token
  const requestPermission = useCallback(async () => {
    if (!session?.user?.id) return null

    try {
      setLoading(true)

      // Request notification permission
      const permission = await Notification.requestPermission()
      setPermission(permission)

      if (permission === "granted") {
        const messaging = getFirebaseMessaging()
        if (!messaging) {
          throw new Error("Firebase messaging not available")
        }

        // Get FCM token
        const currentToken = await getToken(messaging, {
          vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
        })

        if (currentToken) {
          // Save token to database
          await fetch("/api/notifications/push/register", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              token: currentToken,
              userId: session.user.id,
            }),
          })

          setToken(currentToken)
          return currentToken
        }
      }

      return null
    } catch (error) {
      console.error("Failed to get push token:", error)
      toast({
        title: "Push Notification Error",
        description: "Failed to enable push notifications",
        variant: "destructive",
      })
      return null
    } finally {
      setLoading(false)
    }
  }, [session?.user?.id, toast])

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async () => {
    if (!session?.user?.id || !token) return

    try {
      setLoading(true)

      await fetch("/api/notifications/push/unregister", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          userId: session.user.id,
        }),
      })

      setToken(null)
      setPermission("default")
    } catch (error) {
      console.error("Failed to unsubscribe from push notifications:", error)
      toast({
        title: "Error",
        description: "Failed to disable push notifications",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [session?.user?.id, token, toast])

  return {
    permission,
    token,
    loading,
    requestPermission,
    unsubscribe,
  }
}
