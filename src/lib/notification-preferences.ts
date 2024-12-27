import { prisma } from "@/lib/prisma"
import { getTemplate } from "./notification-templates"
import { addDays, addWeeks, isWithinInterval, parseISO } from "date-fns"
import { utcToZonedTime } from "date-fns-tz"

interface TimeWindow {
  start: string // HH:mm
  end: string // HH:mm
  days?: number[] // 0-6 for days of week
}

interface PreferenceCreateInput {
  userId: string
  channel: string
  type: string
  enabled?: boolean
  schedule?: TimeWindow[]
  frequency?: "immediate" | "daily_digest" | "weekly_digest"
}

interface PreferenceUpdateInput {
  enabled?: boolean
  schedule?: TimeWindow[]
  frequency?: "immediate" | "daily_digest" | "weekly_digest"
}

interface NotificationPreferenceUpdate {
  enabled?: boolean
  email?: boolean
  push?: boolean
  sound?: boolean
  soundType?: string | null
  priority?: string
  includeInDigest?: boolean
  digestFrequency?: string | null
}

export async function getNotificationPreferences(userId: string) {
  const preferences = await prisma.notificationPreference.findMany({
    where: { userId },
  })

  // Get all available template types
  const templateTypes = Object.keys(
    Object.fromEntries(
      Object.entries(await import("./notification-templates")).filter(
        ([key]) => !key.startsWith("_")
      )
    )
  )

  // Create default preferences for any missing template types
  const missingTypes = templateTypes.filter(
    (type) => !preferences.find((p) => p.templateType === type)
  )

  if (missingTypes.length > 0) {
    const defaultPreferences = await Promise.all(
      missingTypes.map((templateType) =>
        prisma.notificationPreference.create({
          data: {
            userId,
            templateType,
            enabled: true,
            email: true,
            push: true,
            sound: true,
            priority: getTemplate(templateType)?.priority || "normal",
            includeInDigest: true,
          },
        })
      )
    )

    preferences.push(...defaultPreferences)
  }

  return preferences
}

export async function getPreferences(userId: string) {
  return prisma.notificationPreference.findMany({
    where: { userId },
  })
}

export async function getPreference(
  userId: string,
  channel: string,
  type: string
) {
  return prisma.notificationPreference.findFirst({
    where: { userId, channel, type },
  })
}

export async function createPreference(data: PreferenceCreateInput) {
  return prisma.notificationPreference.create({
    data: {
      userId: data.userId,
      channel: data.channel,
      type: data.type,
      enabled: data.enabled ?? true,
      schedule: data.schedule || null,
      frequency: data.frequency || "immediate",
    },
  })
}

export async function updatePreference(
  userId: string,
  channel: string,
  type: string,
  data: PreferenceUpdateInput
) {
  return prisma.notificationPreference.update({
    where: {
      userId_channel_type: {
        userId,
        channel,
        type,
      },
    },
    data,
  })
}

export async function deletePreference(
  userId: string,
  channel: string,
  type: string
) {
  return prisma.notificationPreference.delete({
    where: {
      userId_channel_type: {
        userId,
        channel,
        type,
      },
    },
  })
}

export async function updateNotificationPreference(
  userId: string,
  templateType: string,
  updates: NotificationPreferenceUpdate
) {
  return prisma.notificationPreference.upsert({
    where: {
      userId_templateType: {
        userId,
        templateType,
      },
    },
    create: {
      userId,
      templateType,
      ...updates,
    },
    update: updates,
  })
}

export async function getUserPreferenceForTemplate(
  userId: string,
  templateType: string
) {
  const preference = await prisma.notificationPreference.findUnique({
    where: {
      userId_templateType: {
        userId,
        templateType,
      },
    },
  })

  if (!preference) {
    // Create default preference
    const template = getTemplate(templateType)
    return prisma.notificationPreference.create({
      data: {
        userId,
        templateType,
        enabled: true,
        email: true,
        push: true,
        sound: true,
        priority: template?.priority || "normal",
        includeInDigest: true,
      },
    })
  }

  return preference
}

export async function shouldSendNotification(
  userId: string,
  channel: string,
  type: string,
  timezone: string
) {
  const preference = await getPreference(userId, channel, type)

  if (!preference || !preference.enabled) {
    return false
  }

  // If no schedule is set, notifications can be sent anytime
  if (!preference.schedule) {
    return true
  }

  const schedule = preference.schedule as TimeWindow[]
  const now = utcToZonedTime(new Date(), timezone)
  const currentHour = now.getHours()
  const currentMinute = now.getMinutes()
  const currentDay = now.getDay()

  // Check if current time falls within any of the scheduled windows
  return schedule.some((window) => {
    // Parse time windows
    const [startHour, startMinute] = window.start.split(":").map(Number)
    const [endHour, endMinute] = window.end.split(":").map(Number)

    // Check if current day is allowed
    if (window.days && !window.days.includes(currentDay)) {
      return false
    }

    // Convert to comparable numbers (minutes since midnight)
    const currentTime = currentHour * 60 + currentMinute
    const startTime = startHour * 60 + startMinute
    const endTime = endHour * 60 + endMinute

    // Handle windows that span midnight
    if (endTime < startTime) {
      return currentTime >= startTime || currentTime <= endTime
    }

    return currentTime >= startTime && currentTime <= endTime
  })
}

export async function shouldSendNotification(
  userId: string,
  templateType: string,
  channel: "app" | "email" | "push"
): Promise<boolean> {
  const preference = await getUserPreferenceForTemplate(userId, templateType)

  if (!preference.enabled) return false

  switch (channel) {
    case "app":
      return true // Always send in-app notifications if enabled
    case "email":
      return preference.email
    case "push":
      return preference.push
    default:
      return false
  }
}

export async function createDigest(
  userId: string,
  channel: string,
  type: string,
  notificationIds: string[]
) {
  const preference = await getPreference(userId, channel, type)

  if (!preference || preference.frequency === "immediate") {
    return null
  }

  const scheduledFor = new Date()
  if (preference.frequency === "daily_digest") {
    scheduledFor.setHours(scheduledFor.getHours() + 24)
  } else if (preference.frequency === "weekly_digest") {
    scheduledFor.setDate(scheduledFor.getDate() + 7)
  }

  return prisma.notificationDigest.create({
    data: {
      userId,
      channel,
      type,
      notifications: notificationIds,
      status: "pending",
      scheduledFor,
    },
  })
}

export async function getDigestPreferences(frequency: "daily" | "weekly") {
  return prisma.notificationPreference.findMany({
    where: {
      digestFrequency: frequency,
      enabled: true,
      includeInDigest: true,
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
  })
}

export async function getNotificationSound(
  userId: string,
  templateType: string
): Promise<string | null> {
  const preference = await getUserPreferenceForTemplate(userId, templateType)
  return preference.sound ? preference.soundType || "default" : null
}

export async function processDigests() {
  const now = new Date()

  // Get all pending digests that should be sent
  const digests = await prisma.notificationDigest.findMany({
    where: {
      status: "pending",
      scheduledFor: {
        lte: now,
      },
    },
    include: {
      user: true,
    },
  })

  for (const digest of digests) {
    try {
      // Get all notifications in the digest
      const notifications = await prisma.notification.findMany({
        where: {
          id: {
            in: digest.notifications as string[],
          },
        },
      })

      // TODO: Format and send digest based on channel
      // This would involve creating a digest template and sending it
      // through the appropriate channel (email, in-app, etc.)

      // Mark digest as sent
      await prisma.notificationDigest.update({
        where: { id: digest.id },
        data: { status: "sent" },
      })
    } catch (error) {
      console.error("Failed to process digest:", error)
      await prisma.notificationDigest.update({
        where: { id: digest.id },
        data: {
          status: "failed",
          error: error instanceof Error ? error.message : "Unknown error",
        },
      })
    }
  }
}
