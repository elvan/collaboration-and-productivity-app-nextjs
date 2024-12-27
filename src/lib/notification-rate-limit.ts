import { prisma } from "./prisma"
import { addMinutes, addHours, addDays, startOfMinute, startOfHour, startOfDay } from "date-fns"

export type RateLimitWindow = "minute" | "hour" | "day"
export type NotificationChannel = "app" | "email" | "push"

interface RateLimitContext {
  userId: string
  channel: NotificationChannel
  templateType?: string
  category?: string
}

interface RateLimitConfig {
  maxPerMinute?: number
  maxPerHour?: number
  maxPerDay?: number
}

const DEFAULT_LIMITS: RateLimitConfig = {
  maxPerMinute: 2,
  maxPerHour: 30,
  maxPerDay: 100,
}

async function getOrCreateRateLimit(context: RateLimitContext) {
  const { userId, channel, templateType, category } = context

  const rateLimit = await prisma.notificationRateLimit.findUnique({
    where: {
      userId_channel_templateType_category: {
        userId,
        channel,
        templateType: templateType || null,
        category: category || null,
      },
    },
  })

  if (rateLimit) return rateLimit

  return prisma.notificationRateLimit.create({
    data: {
      userId,
      channel,
      templateType: templateType || null,
      category: category || null,
      ...DEFAULT_LIMITS,
    },
  })
}

async function getOrCreateThrottle(
  context: RateLimitContext,
  window: RateLimitWindow
) {
  const { userId, channel, templateType, category } = context
  const now = new Date()

  let windowStart: Date
  let windowEnd: Date

  switch (window) {
    case "minute":
      windowStart = startOfMinute(now)
      windowEnd = addMinutes(windowStart, 1)
      break
    case "hour":
      windowStart = startOfHour(now)
      windowEnd = addHours(windowStart, 1)
      break
    case "day":
      windowStart = startOfDay(now)
      windowEnd = addDays(windowStart, 1)
      break
  }

  const throttle = await prisma.notificationThrottle.findFirst({
    where: {
      userId,
      channel,
      templateType: templateType || null,
      category: category || null,
      windowType: window,
      windowEnd: {
        gt: now,
      },
    },
  })

  if (throttle) return throttle

  return prisma.notificationThrottle.create({
    data: {
      userId,
      channel,
      templateType: templateType || null,
      category: category || null,
      windowType: window,
      windowStart,
      windowEnd,
      count: 0,
    },
  })
}

async function incrementThrottle(throttleId: string) {
  return prisma.notificationThrottle.update({
    where: { id: throttleId },
    data: {
      count: {
        increment: 1,
      },
    },
  })
}

export async function checkRateLimit(context: RateLimitContext): Promise<{
  allowed: boolean
  reason?: string
  nextAllowedDate?: Date
}> {
  const rateLimit = await getOrCreateRateLimit(context)
  const now = new Date()

  // Check each window
  const windows: Array<{
    type: RateLimitWindow
    max: number
  }> = [
    { type: "minute", max: rateLimit.maxPerMinute },
    { type: "hour", max: rateLimit.maxPerHour },
    { type: "day", max: rateLimit.maxPerDay },
  ]

  for (const { type, max } of windows) {
    const throttle = await getOrCreateThrottle(context, type)

    if (throttle.count >= max) {
      return {
        allowed: false,
        reason: `Rate limit exceeded for ${type}`,
        nextAllowedDate: throttle.windowEnd,
      }
    }
  }

  return { allowed: true }
}

export async function trackNotificationSent(context: RateLimitContext) {
  const windows: RateLimitWindow[] = ["minute", "hour", "day"]

  await Promise.all(
    windows.map(async (window) => {
      const throttle = await getOrCreateThrottle(context, window)
      await incrementThrottle(throttle.id)
    })
  )
}

export async function getRateLimits(userId: string) {
  return prisma.notificationRateLimit.findMany({
    where: { userId },
  })
}

export async function updateRateLimit(
  userId: string,
  channel: NotificationChannel,
  config: RateLimitConfig,
  context?: {
    templateType?: string
    category?: string
  }
) {
  return prisma.notificationRateLimit.upsert({
    where: {
      userId_channel_templateType_category: {
        userId,
        channel,
        templateType: context?.templateType || null,
        category: context?.category || null,
      },
    },
    create: {
      userId,
      channel,
      templateType: context?.templateType || null,
      category: context?.category || null,
      ...config,
    },
    update: config,
  })
}

export async function getThrottleStatus(context: RateLimitContext) {
  const windows: RateLimitWindow[] = ["minute", "hour", "day"]
  const now = new Date()

  const throttles = await Promise.all(
    windows.map(async (window) => {
      const throttle = await getOrCreateThrottle(context, window)
      const rateLimit = await getOrCreateRateLimit(context)

      let max: number
      switch (window) {
        case "minute":
          max = rateLimit.maxPerMinute
          break
        case "hour":
          max = rateLimit.maxPerHour
          break
        case "day":
          max = rateLimit.maxPerDay
          break
      }

      return {
        window,
        current: throttle.count,
        max,
        remaining: Math.max(0, max - throttle.count),
        resetsAt: throttle.windowEnd,
      }
    })
  )

  return throttles.reduce(
    (acc, throttle) => ({
      ...acc,
      [throttle.window]: {
        current: throttle.current,
        max: throttle.max,
        remaining: throttle.remaining,
        resetsAt: throttle.resetsAt,
      },
    }),
    {}
  )
}
