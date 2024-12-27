import { prisma } from "./prisma"
import { addDays, addMonths, addWeeks, parseISO, setHours, setMinutes } from "date-fns"
import { zonedTimeToUtc, utcToZonedTime } from "date-fns-tz"
import { renderTemplate } from "./notification-templates"
import { sendNotification } from "./notifications"

interface ScheduleConfig {
  type: "one-time" | "recurring"
  date?: string // ISO string for one-time
  recurring?: {
    type: "daily" | "weekly" | "monthly"
    time: string // HH:mm
    days?: number[] // Array of days for weekly/monthly
    timezone: string
    startDate: string // ISO string
    endDate?: string // ISO string
  }
}

interface CreateScheduleOptions {
  templateId: string
  recipients: string[] | { [key: string]: any } // User IDs or criteria
  schedule: ScheduleConfig
  data?: Record<string, any> // Template variables
  userId: string
}

export async function createSchedule({
  templateId,
  recipients,
  schedule,
  data,
  userId,
}: CreateScheduleOptions) {
  // Calculate next run time
  const nextRunAt = calculateNextRunTime(schedule)

  // Create scheduled notification
  const scheduledNotification = await prisma.scheduledNotification.create({
    data: {
      templateId,
      recipients,
      schedule,
      data,
      status: "pending",
      nextRunAt,
      createdById: userId,
    },
  })

  // If it's recurring, create recurring schedule
  if (schedule.type === "recurring" && schedule.recurring) {
    await prisma.recurringSchedule.create({
      data: {
        type: schedule.recurring.type,
        time: schedule.recurring.time,
        days: schedule.recurring.days || [],
        timezone: schedule.recurring.timezone,
        startDate: new Date(schedule.recurring.startDate),
        endDate: schedule.recurring.endDate
          ? new Date(schedule.recurring.endDate)
          : null,
        nextRunAt,
      },
    })
  }

  return scheduledNotification
}

export async function updateSchedule(
  id: string,
  {
    recipients,
    schedule,
    data,
    status,
  }: {
    recipients?: string[] | { [key: string]: any }
    schedule?: ScheduleConfig
    data?: Record<string, any>
    status?: string
  }
) {
  const currentSchedule = await prisma.scheduledNotification.findUnique({
    where: { id },
  })

  if (!currentSchedule) {
    throw new Error("Schedule not found")
  }

  // Calculate new next run time if schedule changed
  const nextRunAt = schedule
    ? calculateNextRunTime(schedule)
    : currentSchedule.nextRunAt

  return prisma.scheduledNotification.update({
    where: { id },
    data: {
      ...(recipients && { recipients }),
      ...(schedule && { schedule, nextRunAt }),
      ...(data && { data }),
      ...(status && { status }),
    },
  })
}

export async function processScheduledNotifications() {
  const now = new Date()

  // Get all pending notifications that should run now
  const scheduledNotifications = await prisma.scheduledNotification.findMany({
    where: {
      status: "pending",
      nextRunAt: {
        lte: now,
      },
    },
    include: {
      template: true,
    },
  })

  for (const notification of scheduledNotifications) {
    try {
      // Mark as processing
      await prisma.scheduledNotification.update({
        where: { id: notification.id },
        data: { status: "processing" },
      })

      // Get recipients
      const recipients =
        typeof notification.recipients === "string"
          ? JSON.parse(notification.recipients)
          : notification.recipients

      // Render template
      const rendered = await renderTemplate(
        notification.templateId,
        notification.data || {}
      )

      // Send notifications
      if (Array.isArray(recipients)) {
        // Direct recipients
        await Promise.all(
          recipients.map((userId) =>
            sendNotification({
              userId,
              title: rendered.title,
              message: rendered.body,
              metadata: rendered.metadata,
            })
          )
        )
      } else {
        // Query recipients
        const users = await prisma.user.findMany({
          where: recipients,
          select: { id: true },
        })
        await Promise.all(
          users.map((user) =>
            sendNotification({
              userId: user.id,
              title: rendered.title,
              message: rendered.body,
              metadata: rendered.metadata,
            })
          )
        )
      }

      // Update schedule
      const schedule = notification.schedule as ScheduleConfig
      if (schedule.type === "recurring" && schedule.recurring) {
        // Calculate next run time for recurring schedule
        const nextRunAt = calculateNextRunTime(schedule)
        await prisma.scheduledNotification.update({
          where: { id: notification.id },
          data: {
            status: "pending",
            lastRunAt: now,
            nextRunAt,
          },
        })
      } else {
        // Mark one-time schedule as completed
        await prisma.scheduledNotification.update({
          where: { id: notification.id },
          data: {
            status: "completed",
            lastRunAt: now,
          },
        })
      }
    } catch (error) {
      console.error("Failed to process scheduled notification:", error)
      await prisma.scheduledNotification.update({
        where: { id: notification.id },
        data: {
          status: "failed",
          error: error instanceof Error ? error.message : "Unknown error",
        },
      })
    }
  }
}

function calculateNextRunTime(schedule: ScheduleConfig): Date {
  const now = new Date()

  if (schedule.type === "one-time") {
    if (!schedule.date) {
      throw new Error("Date is required for one-time schedule")
    }
    return new Date(schedule.date)
  }

  if (!schedule.recurring) {
    throw new Error("Recurring config is required for recurring schedule")
  }

  const {
    type,
    time,
    days,
    timezone,
    startDate,
    endDate,
  } = schedule.recurring

  // Convert time string to hours and minutes
  const [hours, minutes] = time.split(":").map(Number)

  // Convert current time to user's timezone
  const zonedNow = utcToZonedTime(now, timezone)
  let nextRun = setHours(setMinutes(zonedNow, minutes), hours)

  // If the time has passed for today, move to next occurrence
  if (nextRun <= zonedNow) {
    switch (type) {
      case "daily":
        nextRun = addDays(nextRun, 1)
        break
      case "weekly":
        if (!days || !days.length) {
          throw new Error("Days are required for weekly schedule")
        }
        // Find next day of week
        let found = false
        let currentDay = nextRun
        while (!found) {
          currentDay = addDays(currentDay, 1)
          if (days.includes(currentDay.getDay())) {
            found = true
            nextRun = currentDay
          }
        }
        break
      case "monthly":
        if (!days || !days.length) {
          throw new Error("Days are required for monthly schedule")
        }
        // Find next day of month
        found = false
        currentDay = nextRun
        while (!found) {
          currentDay = addDays(currentDay, 1)
          if (days.includes(currentDay.getDate())) {
            found = true
            nextRun = currentDay
          }
          // If we've checked all days in the month, move to next month
          if (currentDay.getDate() === 1) {
            currentDay = addMonths(currentDay, 1)
          }
        }
        break
    }
  }

  // Convert back to UTC
  return zonedTimeToUtc(nextRun, timezone)
}
