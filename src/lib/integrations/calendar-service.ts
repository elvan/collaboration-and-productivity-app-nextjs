import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { google } from "googleapis"
import { addMinutes, format } from "date-fns"

const calendarIntegrationSchema = z.object({
  provider: z.enum(["google", "outlook", "ical"]),
  accessToken: z.string(),
  refreshToken: z.string().optional(),
  expiresAt: z.date().optional(),
  settings: z.record(z.any()).optional(),
  enabled: z.boolean().default(true),
})

export type CalendarIntegration = z.infer<typeof calendarIntegrationSchema>

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
)

export async function createCalendarIntegration(
  userId: string,
  data: CalendarIntegration
) {
  return prisma.calendarIntegration.create({
    data: {
      ...data,
      settings: data.settings ? JSON.stringify(data.settings) : null,
      userId,
    },
  })
}

export async function updateCalendarIntegration(
  id: string,
  data: Partial<CalendarIntegration>
) {
  return prisma.calendarIntegration.update({
    where: { id },
    data: {
      ...data,
      settings: data.settings ? JSON.stringify(data.settings) : undefined,
    },
  })
}

export async function deleteCalendarIntegration(id: string) {
  return prisma.calendarIntegration.delete({
    where: { id },
  })
}

export async function getUserCalendarIntegrations(userId: string) {
  const integrations = await prisma.calendarIntegration.findMany({
    where: { userId },
  })

  return integrations.map((i) => ({
    ...i,
    settings: i.settings ? JSON.parse(i.settings as string) : null,
  }))
}

export async function syncTaskWithCalendar(taskId: string) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      assignee: {
        include: {
          calendarIntegrations: true,
        },
      },
      project: true,
    },
  })

  if (!task || !task.assignee || !task.dueDate) return

  const googleIntegration = task.assignee.calendarIntegrations.find(
    (i) => i.provider === "google" && i.enabled
  )

  if (googleIntegration) {
    await syncWithGoogleCalendar(task, googleIntegration)
  }

  // Add other calendar provider syncs here
}

async function syncWithGoogleCalendar(
  task: any,
  integration: CalendarIntegration
) {
  oauth2Client.setCredentials({
    access_token: integration.accessToken,
    refresh_token: integration.refreshToken,
  })

  const calendar = google.calendar({ version: "v3", auth: oauth2Client })

  // Check if event already exists
  const existingEvent = await calendar.events.list({
    calendarId: "primary",
    q: `[Task ${task.id}]`,
    timeMin: new Date().toISOString(),
  })

  const eventData = {
    summary: `[Task ${task.id}] ${task.title}`,
    description: `${task.description}\n\nProject: ${task.project.name}\nPriority: ${task.priority}\nStatus: ${task.status}`,
    start: {
      dateTime: task.dueDate.toISOString(),
      timeZone: "UTC",
    },
    end: {
      dateTime: addMinutes(task.dueDate, 30).toISOString(),
      timeZone: "UTC",
    },
  }

  if (existingEvent.data.items?.length) {
    // Update existing event
    const event = existingEvent.data.items[0]
    await calendar.events.update({
      calendarId: "primary",
      eventId: event.id!,
      requestBody: eventData,
    })
  } else {
    // Create new event
    await calendar.events.insert({
      calendarId: "primary",
      requestBody: eventData,
    })
  }
}

export async function generateICalFeed(userId: string) {
  const tasks = await prisma.task.findMany({
    where: {
      assigneeId: userId,
      dueDate: {
        not: null,
      },
    },
    include: {
      project: true,
    },
  })

  let icalContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Your App//Task Calendar//EN",
  ]

  for (const task of tasks) {
    if (!task.dueDate) continue

    const dueDate = format(task.dueDate, "yyyyMMdd'T'HHmmss'Z'")
    const endDate = format(addMinutes(task.dueDate, 30), "yyyyMMdd'T'HHmmss'Z'")

    icalContent = icalContent.concat([
      "BEGIN:VEVENT",
      `UID:task-${task.id}`,
      `DTSTAMP:${format(new Date(), "yyyyMMdd'T'HHmmss'Z'")}`,
      `DTSTART:${dueDate}`,
      `DTEND:${endDate}`,
      `SUMMARY:[Task ${task.id}] ${task.title}`,
      `DESCRIPTION:${task.description}\\nProject: ${task.project.name}\\nPriority: ${task.priority}\\nStatus: ${task.status}`,
      "END:VEVENT",
    ])
  }

  icalContent.push("END:VCALENDAR")
  return icalContent.join("\r\n")
}
