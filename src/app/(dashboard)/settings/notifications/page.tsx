"use client"

import * as React from "react"
import { useSession } from "next-auth/react"
import { Bell, Mail, Radio, Volume2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  getNotificationPreferences,
  updateNotificationPreference,
} from "@/lib/notification-preferences"
import { getTemplate } from "@/lib/notification-templates"

const soundOptions = [
  { label: "Default", value: "default" },
  { label: "Ping", value: "ping" },
  { label: "Chime", value: "chime" },
  { label: "Bell", value: "bell" },
]

const digestFrequencies = [
  { label: "Immediate", value: "" },
  { label: "Daily Digest", value: "daily" },
  { label: "Weekly Digest", value: "weekly" },
]

export default function NotificationPreferencesPage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [preferences, setPreferences] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    if (session?.user?.id) {
      loadPreferences()
    }
  }, [session?.user?.id])

  const loadPreferences = async () => {
    try {
      const prefs = await getNotificationPreferences(session!.user!.id)
      setPreferences(prefs)
    } catch (error) {
      console.error("Failed to load preferences:", error)
      toast({
        title: "Error",
        description: "Failed to load notification preferences",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePreferenceChange = async (
    templateType: string,
    field: string,
    value: any
  ) => {
    try {
      const updatedPref = await updateNotificationPreference(
        session!.user!.id,
        templateType,
        { [field]: value }
      )

      setPreferences((prev) =>
        prev.map((p) =>
          p.templateType === templateType ? { ...p, [field]: value } : p
        )
      )

      toast({
        title: "Success",
        description: "Notification preference updated",
      })
    } catch (error) {
      console.error("Failed to update preference:", error)
      toast({
        title: "Error",
        description: "Failed to update notification preference",
        variant: "destructive",
      })
    }
  }

  const groupedPreferences = React.useMemo(() => {
    const groups: Record<string, typeof preferences> = {}
    preferences.forEach((pref) => {
      const template = getTemplate(pref.templateType)
      if (template) {
        const category = template.category
        if (!groups[category]) {
          groups[category] = []
        }
        groups[category].push(pref)
      }
    })
    return groups
  }, [preferences])

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Loading preferences...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold">Notification Preferences</h1>
          <p className="text-muted-foreground mt-2">
            Customize how and when you receive notifications
          </p>
        </div>

        {Object.entries(groupedPreferences).map(([category, prefs]) => (
          <Card key={category}>
            <CardHeader>
              <CardTitle className="capitalize">{category} Notifications</CardTitle>
              <CardDescription>
                Configure your {category} notification preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {prefs.map((pref) => {
                const template = getTemplate(pref.templateType)
                if (!template) return null

                return (
                  <div
                    key={pref.templateType}
                    className="border-b pb-6 last:border-0"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium">{template.type}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {template.description || "No description available"}
                        </p>
                      </div>
                      <Switch
                        checked={pref.enabled}
                        onCheckedChange={(checked) =>
                          handlePreferenceChange(
                            pref.templateType,
                            "enabled",
                            checked
                          )
                        }
                      />
                    </div>

                    {pref.enabled && (
                      <div className="mt-4 grid grid-cols-2 gap-4">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Mail className="h-4 w-4" />
                              <Label>Email notifications</Label>
                            </div>
                            <Switch
                              checked={pref.email}
                              onCheckedChange={(checked) =>
                                handlePreferenceChange(
                                  pref.templateType,
                                  "email",
                                  checked
                                )
                              }
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Radio className="h-4 w-4" />
                              <Label>Push notifications</Label>
                            </div>
                            <Switch
                              checked={pref.push}
                              onCheckedChange={(checked) =>
                                handlePreferenceChange(
                                  pref.templateType,
                                  "push",
                                  checked
                                )
                              }
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Volume2 className="h-4 w-4" />
                              <Label>Sound notifications</Label>
                            </div>
                            <Switch
                              checked={pref.sound}
                              onCheckedChange={(checked) =>
                                handlePreferenceChange(
                                  pref.templateType,
                                  "sound",
                                  checked
                                )
                              }
                            />
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>Sound Type</Label>
                            <Select
                              value={pref.soundType || "default"}
                              onValueChange={(value) =>
                                handlePreferenceChange(
                                  pref.templateType,
                                  "soundType",
                                  value
                                )
                              }
                              disabled={!pref.sound}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select a sound" />
                              </SelectTrigger>
                              <SelectContent>
                                {soundOptions.map((option) => (
                                  <SelectItem
                                    key={option.value}
                                    value={option.value}
                                  >
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label>Delivery Preference</Label>
                            <Select
                              value={pref.digestFrequency || ""}
                              onValueChange={(value) =>
                                handlePreferenceChange(
                                  pref.templateType,
                                  "digestFrequency",
                                  value
                                )
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select frequency" />
                              </SelectTrigger>
                              <SelectContent>
                                {digestFrequencies.map((option) => (
                                  <SelectItem
                                    key={option.value}
                                    value={option.value}
                                  >
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
