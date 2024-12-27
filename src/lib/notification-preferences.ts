import { prisma } from "@/lib/prisma"
import { getTemplate } from "./notification-templates"

export interface NotificationPreferenceUpdate {
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
