import { prisma } from "@/lib/prisma"
import { z } from "zod"

const webhookSchema = z.object({
  url: z.string().url(),
  events: z.array(
    z.enum([
      "task.created",
      "task.updated",
      "task.deleted",
      "comment.created",
      "comment.updated",
      "comment.deleted",
      "attachment.added",
      "attachment.deleted",
      "status.changed",
      "priority.changed",
      "assignee.changed",
    ])
  ),
  secret: z.string().min(32),
  enabled: z.boolean().default(true),
  description: z.string().optional(),
})

export type Webhook = z.infer<typeof webhookSchema>

export async function createWebhook(projectId: string, data: Webhook) {
  return prisma.webhook.create({
    data: {
      ...data,
      events: JSON.stringify(data.events),
      projectId,
    },
  })
}

export async function updateWebhook(id: string, data: Partial<Webhook>) {
  return prisma.webhook.update({
    where: { id },
    data: {
      ...data,
      events: data.events ? JSON.stringify(data.events) : undefined,
    },
  })
}

export async function deleteWebhook(id: string) {
  return prisma.webhook.delete({
    where: { id },
  })
}

export async function getProjectWebhooks(projectId: string) {
  const webhooks = await prisma.webhook.findMany({
    where: { projectId },
  })

  return webhooks.map((w) => ({
    ...w,
    events: JSON.parse(w.events as string),
  }))
}

export async function triggerWebhooks(
  projectId: string,
  event: string,
  data: any
) {
  const webhooks = await prisma.webhook.findMany({
    where: {
      projectId,
      enabled: true,
      events: {
        contains: event,
      },
    },
  })

  const payload = {
    event,
    timestamp: new Date().toISOString(),
    data,
  }

  return Promise.all(
    webhooks.map(async (webhook) => {
      try {
        const signature = await generateSignature(webhook.secret, payload)
        const response = await fetch(webhook.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Webhook-Signature": signature,
          },
          body: JSON.stringify(payload),
        })

        await prisma.webhookDelivery.create({
          data: {
            webhookId: webhook.id,
            event,
            payload: JSON.stringify(payload),
            status: response.ok ? "success" : "failed",
            statusCode: response.status,
            response: await response.text(),
          },
        })

        return response.ok
      } catch (error) {
        await prisma.webhookDelivery.create({
          data: {
            webhookId: webhook.id,
            event,
            payload: JSON.stringify(payload),
            status: "failed",
            statusCode: 0,
            response: error.message,
          },
        })
        return false
      }
    })
  )
}

async function generateSignature(secret: string, payload: any): Promise<string> {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  )

  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(JSON.stringify(payload))
  )

  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}
