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
import { getRateLimits, updateRateLimit } from "@/lib/notification-rate-limit"

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

interface RateLimitSettingsProps {
  channel: string
  limits: any
  onUpdate: (values: any) => Promise<void>
}

function RateLimitSettings({ channel, limits, onUpdate }: RateLimitSettingsProps) {
  const [values, setValues] = React.useState({
    maxPerMinute: limits?.maxPerMinute || 2,
    maxPerHour: limits?.maxPerHour || 30,
    maxPerDay: limits?.maxPerDay || 100,
  })

  const handleChange = async (field: string, value: number) => {
    const newValues = { ...values, [field]: value }
    setValues(newValues)
    await onUpdate(newValues)
  }

  return (
    <div className="space-y-4">
      <div>
        <Label>Per Minute</Label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={1}
            max={10}
            value={values.maxPerMinute}
            onChange={(e) =>
              handleChange("maxPerMinute", parseInt(e.target.value))
            }
            className="w-20"
          />
          <span className="text-sm text-muted-foreground">
            notifications per minute
          </span>
        </div>
      </div>

      <div>
        <Label>Per Hour</Label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={1}
            max={100}
            value={values.maxPerHour}
            onChange={(e) => handleChange("maxPerHour", parseInt(e.target.value))}
            className="w-20"
          />
          <span className="text-sm text-muted-foreground">
            notifications per hour
          </span>
        </div>
      </div>

      <div>
        <Label>Per Day</Label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={1}
            max={1000}
            value={values.maxPerDay}
            onChange={(e) => handleChange("maxPerDay", parseInt(e.target.value))}
            className="w-20"
          />
          <span className="text-sm text-muted-foreground">
            notifications per day
          </span>
        </div>
      </div>
    </div>
  )
}

export default function NotificationPreferencesPage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [preferences, setPreferences] = React.useState<any[]>([])
  const [rateLimits, setRateLimits] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    if (session?.user?.id) {
      loadPreferences()
      loadRateLimits()
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
    }
  }

  const loadRateLimits = async () => {
    try {
      const limits = await getRateLimits(session!.user!.id)
      setRateLimits(limits)
    } catch (error) {
      console.error("Failed to load rate limits:", error)
      toast({
        title: "Error",
        description: "Failed to load rate limits",
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

  const handleRateLimitChange = async (channel: string, values: any) => {
    try {
      await updateRateLimit(session!.user!.id, channel, values)
      setRateLimits((prev) =>
        prev.map((limit) =>
          limit.channel === channel ? { ...limit, ...values } : limit
        )
      )
      toast({
        title: "Success",
        description: "Rate limit updated",
      })
    } catch (error) {
      console.error("Failed to update rate limit:", error)
      toast({
        title: "Error",
        description: "Failed to update rate limit",
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

        {/* Rate Limits */}
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold">Rate Limits</h2>
            <p className="text-muted-foreground mt-1">
              Control how frequently you receive notifications
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {["app", "email", "push"].map((channel) => {
              const limits = rateLimits.find(
                (limit) =>
                  limit.channel === channel &&
                  !limit.templateType &&
                  !limit.category
              )

              return (
                <Card key={channel}>
                  <CardHeader>
                    <CardTitle className="capitalize">{channel}</CardTitle>
                    <CardDescription>
                      Set rate limits for {channel} notifications
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <RateLimitSettings
                      channel={channel}
                      limits={limits}
                      onUpdate={async (values) => {
                        await handleRateLimitChange(channel, values)
                      }}
                    />
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
