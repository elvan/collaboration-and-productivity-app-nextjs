import { prisma } from "./prisma"
import { addDays, isAfter, isBefore, isWithinInterval } from "date-fns"
import { renderTemplate } from "./notification-templates"
import { sendNotification } from "./notifications"

interface CampaignSchedule {
  type: "immediate" | "scheduled" | "recurring"
  startDate?: string
  endDate?: string
  frequency?: {
    type: "daily" | "weekly" | "monthly"
    interval: number
  }
}

interface CampaignCreateInput {
  name: string
  description?: string
  templateId: string
  audience: Record<string, any>
  schedule: CampaignSchedule
  metadata?: Record<string, any>
  userId: string
}

export async function createCampaign(data: CampaignCreateInput) {
  const campaign = await prisma.campaign.create({
    data: {
      name: data.name,
      description: data.description,
      status: "draft",
      templateId: data.templateId,
      audience: data.audience,
      schedule: data.schedule,
      metadata: data.metadata,
      startDate:
        data.schedule.type !== "immediate"
          ? new Date(data.schedule.startDate!)
          : new Date(),
      endDate: data.schedule.endDate
        ? new Date(data.schedule.endDate)
        : null,
      createdById: data.userId,
    },
  })

  // Initialize campaign metrics
  await prisma.campaignMetrics.create({
    data: {
      campaignId: campaign.id,
    },
  })

  return campaign
}

export async function updateCampaign(
  id: string,
  data: Partial<CampaignCreateInput> & { status?: string }
) {
  const campaign = await prisma.campaign.update({
    where: { id },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.description && { description: data.description }),
      ...(data.templateId && { templateId: data.templateId }),
      ...(data.audience && { audience: data.audience }),
      ...(data.schedule && { schedule: data.schedule }),
      ...(data.metadata && { metadata: data.metadata }),
      ...(data.status && { status: data.status }),
      ...(data.schedule?.startDate && {
        startDate: new Date(data.schedule.startDate),
      }),
      ...(data.schedule?.endDate && {
        endDate: new Date(data.schedule.endDate),
      }),
    },
  })

  return campaign
}

export async function getCampaign(id: string) {
  return prisma.campaign.findUnique({
    where: { id },
    include: {
      template: true,
      metrics: true,
    },
  })
}

export async function getCampaigns(status?: string) {
  return prisma.campaign.findMany({
    where: status ? { status } : undefined,
    include: {
      template: true,
      metrics: true,
    },
    orderBy: { createdAt: "desc" },
  })
}

export async function processCampaigns() {
  const now = new Date()

  // Get active campaigns that should be processed
  const campaigns = await prisma.campaign.findMany({
    where: {
      status: "active",
      OR: [
        { startDate: { lte: now }, endDate: null },
        {
          startDate: { lte: now },
          endDate: { gte: now },
        },
      ],
    },
    include: {
      template: true,
      metrics: true,
    },
  })

  for (const campaign of campaigns) {
    try {
      // Check if campaign should run based on schedule
      const schedule = campaign.schedule as CampaignSchedule
      if (!shouldRunCampaign(campaign, schedule)) {
        continue
      }

      // Get target audience
      const users = await prisma.user.findMany({
        where: campaign.audience as any,
        select: { id: true },
      })

      // Update target audience count
      await prisma.campaignMetrics.update({
        where: { campaignId: campaign.id },
        data: { targetAudience: users.length },
      })

      // Render template
      const rendered = await renderTemplate(
        campaign.templateId,
        campaign.metadata || {}
      )

      // Send notifications to each user
      for (const user of users) {
        try {
          await sendNotification({
            userId: user.id,
            title: rendered.title,
            message: rendered.body,
            metadata: {
              ...rendered.metadata,
              campaignId: campaign.id,
            },
          })

          // Track sent event
          await trackCampaignEvent(campaign.id, "sent", user.id)
        } catch (error) {
          console.error(
            `Failed to send campaign notification to user ${user.id}:`,
            error
          )
          await trackCampaignEvent(campaign.id, "bounced", user.id, {
            error: error instanceof Error ? error.message : "Unknown error",
          })
        }
      }

      // Update campaign status if it's complete
      if (
        campaign.endDate &&
        isAfter(now, new Date(campaign.endDate))
      ) {
        await updateCampaign(campaign.id, { status: "completed" })
      }
    } catch (error) {
      console.error("Failed to process campaign:", error)
      await updateCampaign(campaign.id, { status: "failed" })
    }
  }
}

function shouldRunCampaign(
  campaign: any,
  schedule: CampaignSchedule
): boolean {
  const now = new Date()

  if (schedule.type === "immediate") {
    return true
  }

  if (schedule.type === "scheduled") {
    return (
      isWithinInterval(now, {
        start: new Date(campaign.startDate),
        end: campaign.endDate
          ? new Date(campaign.endDate)
          : addDays(now, 1),
      })
    )
  }

  if (schedule.type === "recurring" && schedule.frequency) {
    // Check if campaign should run based on frequency
    const lastRun = campaign.metrics?.lastUpdated

    if (!lastRun) {
      return true
    }

    const nextRun = addInterval(
      new Date(lastRun),
      schedule.frequency.type,
      schedule.frequency.interval
    )

    return isAfter(now, nextRun)
  }

  return false
}

function addInterval(
  date: Date,
  type: string,
  interval: number
): Date {
  switch (type) {
    case "daily":
      return addDays(date, interval)
    case "weekly":
      return addDays(date, interval * 7)
    case "monthly":
      return addDays(date, interval * 30)
    default:
      return date
  }
}

export async function trackCampaignEvent(
  campaignId: string,
  event: string,
  userId?: string,
  metadata?: Record<string, any>
) {
  // Record event
  await prisma.campaignEvent.create({
    data: {
      campaignId,
      event,
      userId,
      metadata,
    },
  })

  // Update campaign metrics
  const metrics = await prisma.campaignMetrics.findUnique({
    where: { campaignId },
  })

  if (!metrics) {
    return
  }

  const updates: Record<string, number> = {
    sentCount: metrics.sentCount,
    deliveredCount: metrics.deliveredCount,
    readCount: metrics.readCount,
    clickCount: metrics.clickCount,
    conversionCount: metrics.conversionCount,
    bounceCount: metrics.bounceCount,
    optOutCount: metrics.optOutCount,
  }

  // Update relevant count
  switch (event) {
    case "sent":
      updates.sentCount++
      break
    case "delivered":
      updates.deliveredCount++
      break
    case "read":
      updates.readCount++
      break
    case "clicked":
      updates.clickCount++
      break
    case "converted":
      updates.conversionCount++
      break
    case "bounced":
      updates.bounceCount++
      break
    case "optedOut":
      updates.optOutCount++
      break
  }

  // Calculate rates
  const rates = {
    deliveryRate:
      updates.sentCount > 0
        ? updates.deliveredCount / updates.sentCount
        : 0,
    readRate:
      updates.deliveredCount > 0
        ? updates.readCount / updates.deliveredCount
        : 0,
    clickRate:
      updates.readCount > 0 ? updates.clickCount / updates.readCount : 0,
    conversionRate:
      updates.clickCount > 0
        ? updates.conversionCount / updates.clickCount
        : 0,
    bounceRate:
      updates.sentCount > 0
        ? updates.bounceCount / updates.sentCount
        : 0,
    optOutRate:
      updates.deliveredCount > 0
        ? updates.optOutCount / updates.deliveredCount
        : 0,
  }

  // Update metrics
  await prisma.campaignMetrics.update({
    where: { campaignId },
    data: {
      ...updates,
      ...rates,
      lastUpdated: new Date(),
    },
  })
}
