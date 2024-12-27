"use client"

import * as React from "react"
import { NotificationPreference } from "@prisma/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/components/ui/use-toast"

interface NotificationPreferencesProps {
  preferences: NotificationPreference | null
  userId: string
}

export function NotificationPreferences({
  preferences: initialPreferences,
  userId,
}: NotificationPreferencesProps) {
  const [preferences, setPreferences] = React.useState<NotificationPreference | null>(
    initialPreferences
  )
  const [isSaving, setIsSaving] = React.useState<boolean>(false)

  async function handleToggle(field: keyof NotificationPreference) {
    if (!preferences) return

    const updatedPreferences = {
      ...preferences,
      [field]: !preferences[field],
    }

    setPreferences(updatedPreferences as NotificationPreference)

    try {
      const response = await fetch("/api/user/notification-preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedPreferences),
      })

      if (!response.ok) {
        throw new Error("Failed to update preferences")
      }

      toast({
        title: "Success",
        description: "Your notification preferences have been updated.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update preferences. Please try again.",
        variant: "destructive",
      })
      // Revert changes on error
      setPreferences(preferences)
    }
  }

  async function createDefaultPreferences() {
    setIsSaving(true)
    try {
      const response = await fetch("/api/user/notification-preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          emailEnabled: true,
          memberActivity: true,
          taskActivity: true,
          mentions: true,
          dailyDigest: false,
          weeklyDigest: false,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create preferences")
      }

      const newPreferences = await response.json()
      setPreferences(newPreferences)

      toast({
        title: "Success",
        description: "Your notification preferences have been set up.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to set up preferences. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (!preferences) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Set Up Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            You haven't set up your notification preferences yet. Set them up now
            to control how you receive updates about your projects.
          </p>
          <Button
            onClick={createDefaultPreferences}
            disabled={isSaving}
          >
            Set Up Notifications
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Email Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="emailEnabled">
              Enable email notifications
            </Label>
            <Switch
              id="emailEnabled"
              checked={preferences.emailEnabled}
              onCheckedChange={() => handleToggle("emailEnabled")}
            />
          </div>
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="dailyDigest">
              Daily activity digest
            </Label>
            <Switch
              id="dailyDigest"
              checked={preferences.dailyDigest}
              onCheckedChange={() => handleToggle("dailyDigest")}
              disabled={!preferences.emailEnabled}
            />
          </div>
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="weeklyDigest">
              Weekly activity digest
            </Label>
            <Switch
              id="weeklyDigest"
              checked={preferences.weeklyDigest}
              onCheckedChange={() => handleToggle("weeklyDigest")}
              disabled={!preferences.emailEnabled}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Activity Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="memberActivity">
              Member activity (joins, leaves)
            </Label>
            <Switch
              id="memberActivity"
              checked={preferences.memberActivity}
              onCheckedChange={() => handleToggle("memberActivity")}
            />
          </div>
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="taskActivity">
              Task activity (created, completed, assigned)
            </Label>
            <Switch
              id="taskActivity"
              checked={preferences.taskActivity}
              onCheckedChange={() => handleToggle("taskActivity")}
            />
          </div>
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="mentions">
              Mentions and replies
            </Label>
            <Switch
              id="mentions"
              checked={preferences.mentions}
              onCheckedChange={() => handleToggle("mentions")}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
