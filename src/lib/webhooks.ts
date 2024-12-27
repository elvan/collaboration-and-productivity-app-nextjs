import { prisma } from "./prisma"
import crypto from "crypto"

interface WebhookPayload {
  event: string
  data: any
}

export async function createWebhook(data: {
  name: string
  url: string
  events: string[]
  userId: string
  workspaceId: string
}) {
  const secret = crypto.randomBytes(32).toString("hex")

  return prisma.webhook.create({
    data: {
      ...data,
      secret,
    },
  })
}

export async function updateWebhook(
  id: string,
  data: {
    name?: string
    url?: string
    events?: string[]
    isActive?: boolean
  }
) {
  return prisma.webhook.update({
    where: { id },
    data,
  })
}

export async function deleteWebhook(id: string) {
  return prisma.webhook.delete({
    where: { id },
  })
}

export async function getWebhook(id: string) {
  return prisma.webhook.findUnique({
    where: { id },
    include: {
      deliveries: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  })
}

export async function getWebhooks(workspaceId: string) {
  return prisma.webhook.findMany({
    where: {
      workspaceId,
      isActive: true,
    },
    include: {
      deliveries: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  })
}

export async function deliverWebhook(
  webhook: {
    id: string
    url: string
    secret: string
  },
  payload: WebhookPayload
) {
  const signature = crypto
    .createHmac("sha256", webhook.secret)
    .update(JSON.stringify(payload))
    .digest("hex")

  try {
    const response = await fetch(webhook.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Signature": signature,
      },
      body: JSON.stringify(payload),
    })

    const delivery = await prisma.webhookDelivery.create({
      data: {
        webhookId: webhook.id,
        event: payload.event,
        payload,
        response: await response.json().catch(() => null),
        statusCode: response.status,
        succeededAt: response.ok ? new Date() : null,
        attempts: 1,
      },
    })

    if (!response.ok) {
      throw new Error(`Webhook delivery failed: ${response.statusText}`)
    }

    return delivery
  } catch (error) {
    await prisma.webhookDelivery.create({
      data: {
        webhookId: webhook.id,
        event: payload.event,
        payload,
        error: error instanceof Error ? error.message : "Unknown error",
        attempts: 1,
      },
    })

    throw error
  }
}

export async function retryWebhookDelivery(deliveryId: string) {
  const delivery = await prisma.webhookDelivery.findUnique({
    where: { id: deliveryId },
    include: { webhook: true },
  })

  if (!delivery || !delivery.webhook) {
    throw new Error("Webhook delivery not found")
  }

  try {
    const signature = crypto
      .createHmac("sha256", delivery.webhook.secret)
      .update(JSON.stringify(delivery.payload))
      .digest("hex")

    const response = await fetch(delivery.webhook.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Signature": signature,
      },
      body: JSON.stringify(delivery.payload),
    })

    return prisma.webhookDelivery.update({
      where: { id: deliveryId },
      data: {
        response: await response.json().catch(() => null),
        statusCode: response.status,
        succeededAt: response.ok ? new Date() : null,
        attempts: { increment: 1 },
        error: response.ok ? null : `HTTP ${response.status}: ${response.statusText}`,
      },
    })
  } catch (error) {
    return prisma.webhookDelivery.update({
      where: { id: deliveryId },
      data: {
        attempts: { increment: 1 },
        error: error instanceof Error ? error.message : "Unknown error",
      },
    })
  }
}

export async function processWebhooks(event: string, data: any) {
  const webhooks = await prisma.webhook.findMany({
    where: {
      isActive: true,
      events: {
        has: event,
      },
    },
  })

  const payload: WebhookPayload = {
    event,
    data,
  }

  return Promise.allSettled(
    webhooks.map((webhook) =>
      deliverWebhook(webhook, payload).catch((error) => {
        console.error(`Failed to deliver webhook ${webhook.id}:`, error)
      })
    )
  )
}
