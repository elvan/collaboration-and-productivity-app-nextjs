import { useState, useEffect } from "react"
import { requestPushPermission } from "@/lib/web-push"

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>("default")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Check initial permission state
    setPermission(Notification.permission)
    setLoading(false)
  }, [])

  const subscribe = async () => {
    try {
      setLoading(true)
      setError(null)

      const subscription = await requestPushPermission()
      if (!subscription) {
        setError("Permission denied")
        return false
      }

      // Save subscription to server
      const response = await fetch("/api/notifications/push-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(subscription),
      })

      if (!response.ok) {
        throw new Error("Failed to save subscription")
      }

      setPermission("granted")
      return true
    } catch (error) {
      console.error("Failed to subscribe to push notifications:", error)
      setError("Failed to subscribe to push notifications")
      return false
    } finally {
      setLoading(false)
    }
  }

  const unsubscribe = async () => {
    try {
      setLoading(true)
      setError(null)

      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()

      if (subscription) {
        // Remove subscription from server
        await fetch("/api/notifications/push-subscription", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            endpoint: subscription.endpoint,
          }),
        })

        // Unsubscribe from push manager
        await subscription.unsubscribe()
      }

      setPermission("default")
      return true
    } catch (error) {
      console.error("Failed to unsubscribe from push notifications:", error)
      setError("Failed to unsubscribe from push notifications")
      return false
    } finally {
      setLoading(false)
    }
  }

  return {
    permission,
    loading,
    error,
    subscribe,
    unsubscribe,
  }
}
