import { prisma } from "./prisma"
import { format } from "date-fns"
import { FilterConditions, buildFilterQuery } from "./notification-filters"
import { Parser } from "@json2csv/plainjs"

export interface ExportOptions {
  format: "csv" | "json"
  conditions?: FilterConditions
  fields?: string[]
  includeMetadata?: boolean
  dateRange?: {
    start: Date
    end: Date
  }
}

const defaultFields = [
  "id",
  "type",
  "category",
  "priority",
  "title",
  "message",
  "read",
  "dismissed",
  "createdAt",
]

export async function exportNotifications(
  userId: string,
  options: ExportOptions
) {
  const { format = "csv", conditions = {}, fields = defaultFields, includeMetadata = false, dateRange } = options

  // Build filter query
  const query = await buildFilterQuery(conditions)
  query.userId = userId

  // Add date range if specified
  if (dateRange) {
    query.createdAt = {
      gte: dateRange.start,
      lte: dateRange.end,
    }
  }

  // Fetch notifications
  const notifications = await prisma.notification.findMany({
    where: query,
    orderBy: { createdAt: "desc" },
    include: {
      activity: true,
      batch: true,
    },
  })

  // Transform notifications for export
  const transformedData = notifications.map((notification) => {
    const data: any = {}

    // Add selected fields
    fields.forEach((field) => {
      if (field === "createdAt") {
        data[field] = format(new Date(notification[field]), "yyyy-MM-dd HH:mm:ss")
      } else {
        data[field] = notification[field]
      }
    })

    // Add activity data if available
    if (notification.activity) {
      data.activityType = notification.activity.type
      data.activityStatus = notification.activity.status
    }

    // Add batch data if available
    if (notification.batch) {
      data.batchId = notification.batch.id
      data.batchCreatedAt = format(
        new Date(notification.batch.createdAt),
        "yyyy-MM-dd HH:mm:ss"
      )
    }

    // Add metadata if requested
    if (includeMetadata && notification.metadata) {
      Object.entries(notification.metadata as Record<string, any>).forEach(
        ([key, value]) => {
          data[`metadata_${key}`] = JSON.stringify(value)
        }
      )
    }

    return data
  })

  // Format data based on requested format
  if (format === "json") {
    return JSON.stringify(transformedData, null, 2)
  } else {
    try {
      const parser = new Parser({
        fields: Object.keys(transformedData[0] || {}),
      })
      return parser.parse(transformedData)
    } catch (err) {
      console.error("Error converting to CSV:", err)
      throw new Error("Failed to convert notifications to CSV")
    }
  }
}

export function generateExportFilename(
  format: "csv" | "json",
  prefix = "notifications"
) {
  const timestamp = format(new Date(), "yyyy-MM-dd-HHmmss")
  return `${prefix}-${timestamp}.${format}`
}
