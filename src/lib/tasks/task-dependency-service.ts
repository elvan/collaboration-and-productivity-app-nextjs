import { prisma } from "@/lib/prisma"
import { z } from "zod"

const dependencySchema = z.object({
  sourceTaskId: z.string(),
  targetTaskId: z.string(),
  type: z.enum([
    "blocks",
    "blocked_by",
    "depends_on",
    "required_for",
    "related_to",
    "duplicates",
    "duplicated_by",
  ]),
  metadata: z
    .object({
      description: z.string().optional(),
      delay: z.number().optional(), // Delay in days
      progress: z.number().optional(), // Progress percentage
      status: z.string().optional(),
    })
    .optional(),
})

export type TaskDependency = z.infer<typeof dependencySchema>

export async function createDependency(data: TaskDependency) {
  // Validate that tasks exist and are different
  if (data.sourceTaskId === data.targetTaskId) {
    throw new Error("A task cannot depend on itself")
  }

  const [sourceTask, targetTask] = await Promise.all([
    prisma.task.findUnique({ where: { id: data.sourceTaskId } }),
    prisma.task.findUnique({ where: { id: data.targetTaskId } }),
  ])

  if (!sourceTask || !targetTask) {
    throw new Error("One or both tasks not found")
  }

  // Check for circular dependencies
  const hasCircular = await checkCircularDependency(
    data.sourceTaskId,
    data.targetTaskId
  )
  if (hasCircular) {
    throw new Error("Creating this dependency would result in a circular dependency")
  }

  return prisma.taskRelationship.create({
    data: {
      type: data.type,
      metadata: data.metadata ? JSON.stringify(data.metadata) : null,
      sourceTask: { connect: { id: data.sourceTaskId } },
      targetTask: { connect: { id: data.targetTaskId } },
    },
  })
}

export async function updateDependency(
  id: string,
  data: Partial<TaskDependency>
) {
  return prisma.taskRelationship.update({
    where: { id },
    data: {
      type: data.type,
      metadata: data.metadata ? JSON.stringify(data.metadata) : undefined,
    },
  })
}

export async function deleteDependency(id: string) {
  return prisma.taskRelationship.delete({
    where: { id },
  })
}

export async function getTaskDependencies(taskId: string) {
  const [outgoing, incoming] = await Promise.all([
    prisma.taskRelationship.findMany({
      where: { sourceTaskId: taskId },
      include: {
        targetTask: {
          include: {
            assignee: true,
          },
        },
      },
    }),
    prisma.taskRelationship.findMany({
      where: { targetTaskId: taskId },
      include: {
        sourceTask: {
          include: {
            assignee: true,
          },
        },
      },
    }),
  ])

  return {
    outgoing: outgoing.map((rel) => ({
      ...rel,
      metadata: rel.metadata ? JSON.parse(rel.metadata as string) : null,
    })),
    incoming: incoming.map((rel) => ({
      ...rel,
      metadata: rel.metadata ? JSON.parse(rel.metadata as string) : null,
    })),
  }
}

export async function checkCircularDependency(
  sourceId: string,
  targetId: string,
  visited = new Set<string>()
): Promise<boolean> {
  if (visited.has(targetId)) {
    return targetId === sourceId
  }

  visited.add(targetId)

  const dependencies = await prisma.taskRelationship.findMany({
    where: { sourceTaskId: targetId },
    select: { targetTaskId: true },
  })

  for (const dep of dependencies) {
    if (await checkCircularDependency(sourceId, dep.targetTaskId, visited)) {
      return true
    }
  }

  return false
}

export async function updateDependencyProgress(id: string, progress: number) {
  return prisma.taskRelationship.update({
    where: { id },
    data: {
      metadata: JSON.stringify({
        progress,
      }),
    },
  })
}

export async function getDependencyChain(taskId: string) {
  const dependencies = new Map<string, Set<string>>()
  const visited = new Set<string>()

  async function traverse(currentId: string) {
    if (visited.has(currentId)) return
    visited.add(currentId)

    const outgoing = await prisma.taskRelationship.findMany({
      where: { sourceTaskId: currentId },
      select: { targetTaskId: true },
    })

    dependencies.set(currentId, new Set(outgoing.map((d) => d.targetTaskId)))

    for (const dep of outgoing) {
      await traverse(dep.targetTaskId)
    }
  }

  await traverse(taskId)
  return dependencies
}

export async function calculateCriticalPath(taskId: string) {
  const dependencies = await getDependencyChain(taskId)
  const tasks = await prisma.task.findMany({
    where: {
      id: {
        in: [...dependencies.keys(), ...Array.from(dependencies.values()).flatMap((s) => Array.from(s))],
      },
    },
    select: {
      id: true,
      dueDate: true,
      startDate: true,
      endDate: true,
    },
  })

  const taskMap = new Map(tasks.map((t) => [t.id, t]))
  const criticalPath: string[] = []
  let maxDuration = 0

  function calculatePathDuration(
    currentId: string,
    path: string[] = []
  ): number {
    const task = taskMap.get(currentId)
    if (!task) return 0

    const deps = dependencies.get(currentId)
    if (!deps || deps.size === 0) {
      const duration = task.endDate && task.startDate
        ? (task.endDate.getTime() - task.startDate.getTime()) / (1000 * 60 * 60 * 24)
        : 0
      if (duration > maxDuration) {
        maxDuration = duration
        criticalPath.length = 0
        criticalPath.push(...path, currentId)
      }
      return duration
    }

    let maxDepDuration = 0
    for (const depId of deps) {
      const depDuration = calculatePathDuration(depId, [...path, currentId])
      maxDepDuration = Math.max(maxDepDuration, depDuration)
    }

    return maxDepDuration + (task.endDate && task.startDate
      ? (task.endDate.getTime() - task.startDate.getTime()) / (1000 * 60 * 60 * 24)
      : 0)
  }

  calculatePathDuration(taskId)
  return {
    path: criticalPath,
    duration: maxDuration,
  }
}

export async function getBlockingTasks(taskId: string) {
  return prisma.taskRelationship.findMany({
    where: {
      OR: [
        { sourceTaskId: taskId, type: "blocks" },
        { targetTaskId: taskId, type: "blocked_by" },
      ],
    },
    include: {
      sourceTask: true,
      targetTask: true,
    },
  })
}

export async function getDependentTasks(taskId: string) {
  return prisma.taskRelationship.findMany({
    where: {
      OR: [
        { sourceTaskId: taskId, type: "depends_on" },
        { targetTaskId: taskId, type: "required_for" },
      ],
    },
    include: {
      sourceTask: true,
      targetTask: true,
    },
  })
}

export async function getRelatedTasks(taskId: string) {
  return prisma.taskRelationship.findMany({
    where: {
      OR: [
        { sourceTaskId: taskId, type: "related_to" },
        { targetTaskId: taskId, type: "related_to" },
      ],
    },
    include: {
      sourceTask: true,
      targetTask: true,
    },
  })
}

export async function getDuplicateTasks(taskId: string) {
  return prisma.taskRelationship.findMany({
    where: {
      OR: [
        { sourceTaskId: taskId, type: "duplicates" },
        { targetTaskId: taskId, type: "duplicated_by" },
      ],
    },
    include: {
      sourceTask: true,
      targetTask: true,
    },
  })
}
