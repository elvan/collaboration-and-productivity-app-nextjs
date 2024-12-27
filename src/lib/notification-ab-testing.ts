import { prisma } from "./prisma"
import { renderTemplate } from "./notification-templates"

interface Variant {
  id: string
  title: string
  body: string
  metadata?: Record<string, any>
  weight?: number // For weighted distribution
}

interface CreateABTestOptions {
  name: string
  description?: string
  templateId: string
  variants: Variant[]
  startDate: Date
  endDate?: Date
  userId: string
}

interface UpdateABTestOptions {
  id: string
  name?: string
  description?: string
  variants?: Variant[]
  startDate?: Date
  endDate?: Date
  status?: "draft" | "active" | "completed" | "stopped"
  winningVariant?: string
}

export async function createABTest({
  name,
  description,
  templateId,
  variants,
  startDate,
  endDate,
  userId,
}: CreateABTestOptions) {
  // Validate variants
  if (variants.length < 2) {
    throw new Error("At least 2 variants are required")
  }

  // Ensure all variants have IDs and weights
  const normalizedVariants = variants.map((variant) => ({
    ...variant,
    weight: variant.weight || 1,
  }))

  return prisma.aBTest.create({
    data: {
      name,
      description,
      templateId,
      variants: normalizedVariants,
      startDate,
      endDate,
      status: "draft",
      createdById: userId,
    },
  })
}

export async function updateABTest({
  id,
  name,
  description,
  variants,
  startDate,
  endDate,
  status,
  winningVariant,
}: UpdateABTestOptions) {
  // Validate status transition
  const currentTest = await prisma.aBTest.findUnique({
    where: { id },
  })

  if (!currentTest) {
    throw new Error("Test not found")
  }

  if (status) {
    validateStatusTransition(currentTest.status, status)
  }

  // If variants are provided, validate them
  if (variants && variants.length < 2) {
    throw new Error("At least 2 variants are required")
  }

  return prisma.aBTest.update({
    where: { id },
    data: {
      ...(name && { name }),
      ...(description !== undefined && { description }),
      ...(variants && { variants }),
      ...(startDate && { startDate }),
      ...(endDate !== undefined && { endDate }),
      ...(status && { status }),
      ...(winningVariant && { winningVariant }),
    },
  })
}

export async function getABTest(id: string) {
  return prisma.aBTest.findUnique({
    where: { id },
    include: {
      template: true,
      createdBy: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  })
}

export async function getABTests(status?: string) {
  return prisma.aBTest.findMany({
    where: {
      ...(status && { status }),
    },
    orderBy: { createdAt: "desc" },
    include: {
      template: true,
      createdBy: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  })
}

export async function selectVariant(testId: string, userId: string) {
  const test = await prisma.aBTest.findUnique({
    where: { id: testId },
  })

  if (!test || test.status !== "active") {
    throw new Error("Test not found or not active")
  }

  const variants = test.variants as Variant[]
  const totalWeight = variants.reduce((sum, v) => sum + (v.weight || 1), 0)
  let random = Math.random() * totalWeight

  // Select variant based on weights
  let selectedVariant: Variant | undefined
  for (const variant of variants) {
    random -= variant.weight || 1
    if (random <= 0) {
      selectedVariant = variant
      break
    }
  }

  // Fallback to first variant if something went wrong
  selectedVariant = selectedVariant || variants[0]

  return selectedVariant
}

export async function trackABTestEvent(
  testId: string,
  variantId: string,
  userId: string,
  event: "sent" | "delivered" | "read" | "clicked",
  metadata?: Record<string, any>
) {
  return prisma.aBTestEvent.create({
    data: {
      testId,
      variantId,
      userId,
      event,
      metadata,
    },
  })
}

export async function getABTestMetrics(testId: string) {
  const test = await prisma.aBTest.findUnique({
    where: { id: testId },
  })

  if (!test) {
    throw new Error("Test not found")
  }

  const variants = test.variants as Variant[]
  const metrics: Record<string, any> = {}

  // Get metrics for each variant
  for (const variant of variants) {
    const [sent, delivered, read, clicked] = await Promise.all([
      prisma.aBTestEvent.count({
        where: {
          testId,
          variantId: variant.id,
          event: "sent",
        },
      }),
      prisma.aBTestEvent.count({
        where: {
          testId,
          variantId: variant.id,
          event: "delivered",
        },
      }),
      prisma.aBTestEvent.count({
        where: {
          testId,
          variantId: variant.id,
          event: "read",
        },
      }),
      prisma.aBTestEvent.count({
        where: {
          testId,
          variantId: variant.id,
          event: "clicked",
        },
      }),
    ])

    metrics[variant.id] = {
      sent,
      delivered,
      read,
      clicked,
      deliveryRate: sent ? (delivered / sent) * 100 : 0,
      readRate: delivered ? (read / delivered) * 100 : 0,
      clickRate: read ? (clicked / read) * 100 : 0,
    }
  }

  return {
    metrics,
    startDate: test.startDate,
    endDate: test.endDate,
    status: test.status,
    winningVariant: test.winningVariant,
  }
}

function validateStatusTransition(
  currentStatus: string,
  newStatus: string
) {
  const validTransitions: Record<string, string[]> = {
    draft: ["active", "stopped"],
    active: ["completed", "stopped"],
    completed: [],
    stopped: [],
  }

  if (!validTransitions[currentStatus]?.includes(newStatus)) {
    throw new Error(
      `Invalid status transition from ${currentStatus} to ${newStatus}`
    )
  }
}
