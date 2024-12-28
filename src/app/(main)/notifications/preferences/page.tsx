"use client"

import * as React from "react"
import { useSession } from "next-auth/react"
import { format } from "date-fns"
import { Loader2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import { PreferenceDialog } from "@/components/notifications/preference-dialog"

interface NotificationPreference {
  id: string
  channel: string
  type: string
  enabled: boolean
  schedule?: {
    start: string
    end: string
    days?: number[]
  }[]
  frequency?: string
}

const CHANNELS = [
  { value: "email", label: "Email" },
  { value: "in-app", label: "In-App" },
  { value: "mobile", label: "Mobile" },
]

const NOTIFICATION_TYPES = [
  { value: "mentions", label: "Mentions" },
  { value: "comments", label: "Comments" },
  { value: "updates", label: "Updates" },
  { value: "reminders", label: "Reminders" },
]

export default function NotificationPreferences() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [loading, setLoading] = React.useState(true)
  const [preferences, setPreferences] = React.useState<NotificationPreference[]>([])
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [selectedPreference, setSelectedPreference] =
    React.useState<NotificationPreference>()

  // Load preferences
  React.useEffect(() => {
    if (session?.user?.id) {
      loadPreferences()
    }
  }, [session?.user?.id])

  const loadPreferences = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/notifications/preferences")
      if (!res.ok) {
        throw new Error("Failed to load preferences")
      }
      const data = await res.json()
      setPreferences(data)
    } catch (error) {
      console.error("Failed to load preferences:", error)
      toast({
        title: "Error",
        description: "Failed to load preferences",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePreference = async (
    preference: Partial<NotificationPreference>
  ) => {
    try {
      const res = await fetch("/api/notifications/preferences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(preference),
      })

      if (!res.ok) {
        throw new Error("Failed to create preference")
      }

      toast({
        title: "Success",
        description: "Preference created successfully",
      })

      loadPreferences()
      setDialogOpen(false)
    } catch (error) {
      console.error("Failed to create preference:", error)
      toast({
        title: "Error",
        description: "Failed to create preference",
        variant: "destructive",
      })
    }
  }

  const handleUpdatePreference = async (
    preference: Partial<NotificationPreference>
  ) => {
    try {
      const res = await fetch(
        `/api/notifications/preferences?channel=${preference.channel}&type=${preference.type}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(preference),
        }
      )

      if (!res.ok) {
        throw new Error("Failed to update preference")
      }

      toast({
        title: "Success",
        description: "Preference updated successfully",
      })

      loadPreferences()
      setDialogOpen(false)
      setSelectedPreference(undefined)
    } catch (error) {
      console.error("Failed to update preference:", error)
      toast({
        title: "Error",
        description: "Failed to update preference",
        variant: "destructive",
      })
    }
  }

  const handleTogglePreference = async (
    preference: NotificationPreference,
    enabled: boolean
  ) => {
    try {
      const res = await fetch(
        `/api/notifications/preferences?channel=${preference.channel}&type=${preference.type}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ enabled }),
        }
      )

      if (!res.ok) {
        throw new Error("Failed to update preference")
      }

      loadPreferences()
    } catch (error) {
      console.error("Failed to update preference:", error)
      toast({
        title: "Error",
        description: "Failed to update preference",
        variant: "destructive",
      })
    }
  }

  const handleDeletePreference = async (preference: NotificationPreference) => {
    try {
      const res = await fetch(
        `/api/notifications/preferences?channel=${preference.channel}&type=${preference.type}`,
        {
          method: "DELETE",
        }
      )

      if (!res.ok) {
        throw new Error("Failed to delete preference")
      }

      toast({
        title: "Success",
        description: "Preference deleted successfully",
      })

      loadPreferences()
    } catch (error) {
      console.error("Failed to delete preference:", error)
      toast({
        title: "Error",
        description: "Failed to delete preference",
        variant: "destructive",
      })
    }
  }

  if (!session) {
    return null
  }

  return (
    <div className="container mx-auto py-8">
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Notification Preferences</h1>
            <p className="text-muted-foreground mt-2">
              Manage your notification settings
            </p>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Preference
          </Button>
        </div>

        <div className="grid gap-4">
          {preferences.map((preference) => (
            <Card key={preference.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle>
                      {CHANNELS.find((c) => c.value === preference.channel)?.label}
                      {" - "}
                      {
                        NOTIFICATION_TYPES.find(
                          (t) => t.value === preference.type
                        )?.label
                      }
                    </CardTitle>
                  </div>
                  <Switch
                    checked={preference.enabled}
                    onCheckedChange={(enabled) =>
                      handleTogglePreference(preference, enabled)
                    }
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium">Frequency</p>
                      <p className="text-sm text-muted-foreground">
                        {preference.frequency || "Immediate"}
                      </p>
                    </div>
                    {preference.schedule && (
                      <div>
                        <p className="text-sm font-medium">Schedule</p>
                        <div className="flex flex-wrap gap-2">
                          {preference.schedule.map((window, i) => (
                            <Badge key={i} variant="secondary">
                              {window.start} - {window.end}
                              {window.days &&
                                ` (${window.days
                                  .map(
                                    (d) =>
                                      ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][
                                        d
                                      ]
                                  )
                                  .join(", ")})`}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedPreference(preference)
                        setDialogOpen(true)
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleDeletePreference(preference)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <PreferenceDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        preference={selectedPreference}
        onSubmit={selectedPreference ? handleUpdatePreference : handleCreatePreference}
        channels={CHANNELS}
        types={NOTIFICATION_TYPES}
      />
    </div>
  )
}
