import { prisma } from "@/lib/prisma"
import { z } from "zod"

const taskRelationshipSchema = z.object({
  type: z.enum(["parent_child", "blocks", "depends_on", "related_to"]),
  sourceTaskId: z.string(),
  targetTaskId: z.string(),
  metadata: z.record(z.any()).optional(),
})

export type TaskRelationship = z.infer<typeof taskRelationshipSchema>

export async function createTaskRelationship(data: TaskRelationship) {
  // Validate that both tasks exist and are in the same project
  const [sourceTask, targetTask] = await Promise.all([
    prisma.task.findUnique({
      where: { id: data.sourceTaskId },
      select: { projectId: true },
    }),
    prisma.task.findUnique({
      where: { id: data.targetTaskId },
      select: { projectId: true },
    }),
  ])

  if (!sourceTask || !targetTask) {
    throw new Error("One or both tasks do not exist")
  }

  if (sourceTask.projectId !== targetTask.projectId) {
    throw new Error("Tasks must be in the same project")
  }

  // Check for circular dependencies
  if (data.type === "depends_on") {
    const hasCycle = await checkForDependencyCycle(
      data.sourceTaskId,
      data.targetTaskId
    )
    if (hasCycle) {
      throw new Error("Creating this dependency would create a circular dependency")
    }
  }

  return prisma.taskRelationship.create({
    data: {
      type: data.type,
      sourceTaskId: data.sourceTaskId,
      targetTaskId: data.targetTaskId,
      metadata: data.metadata ? JSON.stringify(data.metadata) : null,
    },
  })
}

export async function deleteTaskRelationship(
  sourceTaskId: string,
  targetTaskId: string,
  type: string
) {
  return prisma.taskRelationship.deleteMany({
    where: {
      sourceTaskId,
      targetTaskId,
      type,
    },
  })
}

export async function getTaskRelationships(taskId: string) {
  const [outgoing, incoming] = await Promise.all([
    prisma.taskRelationship.findMany({
      where: { sourceTaskId: taskId },
      include: {
        targetTask: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
          },
        },
      },
    }),
    prisma.taskRelationship.findMany({
      where: { targetTaskId: taskId },
      include: {
        sourceTask: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
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

export async function getTaskHierarchy(rootTaskId: string) {
  const visited = new Set<string>()
  const result: any = {}

  async function buildHierarchy(taskId: string) {
    if (visited.has(taskId)) return null
    visited.add(taskId)

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        outgoingRelationships: {
          where: { type: "parent_child" },
          include: {
            targetTask: true,
          },
        },
      },
    })

    if (!task) return null

    const children = await Promise.all(
      task.outgoingRelationships
        .filter((rel) => rel.type === "parent_child")
        .map((rel) => buildHierarchy(rel.targetTaskId))
    )

    return {
      ...task,
      children: children.filter(Boolean),
    }
  }

  return buildHierarchy(rootTaskId)
}

export async function getTaskDependencies(taskId: string) {
  const visited = new Set<string>()
  const dependencies: any[] = []

  async function traverseDependencies(currentTaskId: string) {
    if (visited.has(currentTaskId)) return
    visited.add(currentTaskId)

    const relationships = await prisma.taskRelationship.findMany({
      where: {
        sourceTaskId: currentTaskId,
        type: "depends_on",
      },
      include: {
        targetTask: true,
      },
    })

    for (const rel of relationships) {
      dependencies.push(rel.targetTask)
      await traverseDependencies(rel.targetTaskId)
    }
  }

  await traverseDependencies(taskId)
  return dependencies
}

async function checkForDependencyCycle(
  sourceTaskId: string,
  targetTaskId: string
): Promise<boolean> {
  const visited = new Set<string>()

  async function traverse(currentTaskId: string): Promise<boolean> {
    if (currentTaskId === sourceTaskId) return true
    if (visited.has(currentTaskId)) return false
    visited.add(currentTaskId)

    const dependencies = await prisma.taskRelationship.findMany({
      where: {
        sourceTaskId: currentTaskId,
        type: "depends_on",
      },
    })

    for (const dep of dependencies) {
      if (await traverse(dep.targetTaskId)) {
        return true
      }
    }

    return false
  }

  return traverse(targetTaskId)
}

export async function updateTaskProgress(taskId: string) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      outgoingRelationships: {
        where: { type: "parent_child" },
        include: {
          targetTask: true,
        },
      },
    },
  })

  if (!task) return

  // Calculate progress based on subtasks
  if (task.outgoingRelationships.length > 0) {
    const subtasks = task.outgoingRelationships.map((rel) => rel.targetTask)
    const completedSubtasks = subtasks.filter((t) => t.status === "done").length
    const progress = Math.round(
      (completedSubtasks / subtasks.length) * 100
    )

    await prisma.task.update({
      where: { id: taskId },
      data: {
        progress,
        status: progress === 100 ? "done" : progress > 0 ? "in_progress" : "todo",
      },
    })
  }

  // Update parent task progress if this task is a subtask
  const parentRelationship = await prisma.taskRelationship.findFirst({
    where: {
      targetTaskId: taskId,
      type: "parent_child",
    },
  })

  if (parentRelationship) {
    await updateTaskProgress(parentRelationship.sourceTaskId)
  }
}
