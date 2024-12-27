import { prisma } from "@/lib/prisma"
import { z } from "zod"

const taskListSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  projectId: z.string(),
  color: z.string().optional(),
  icon: z.string().optional(),
  sortOrder: z.array(z.string()).optional(), // Task IDs in sorted order
  filters: z
    .object({
      status: z.array(z.string()).optional(),
      priority: z.array(z.string()).optional(),
      assignee: z.array(z.string()).optional(),
      dueDate: z
        .object({
          start: z.string().optional(),
          end: z.string().optional(),
        })
        .optional(),
      customFields: z.record(z.any()).optional(),
    })
    .optional(),
  viewSettings: z
    .object({
      groupBy: z.string().optional(), // status, priority, assignee, etc.
      sortBy: z.string().optional(),
      sortDirection: z.enum(["asc", "desc"]).optional(),
      showSubtasks: z.boolean().optional(),
      showCompletedTasks: z.boolean().optional(),
      columns: z.array(z.string()).optional(),
    })
    .optional(),
})

export type TaskList = z.infer<typeof taskListSchema>

export async function createTaskList(data: TaskList) {
  return prisma.taskList.create({
    data: {
      name: data.name,
      description: data.description,
      projectId: data.projectId,
      color: data.color,
      icon: data.icon,
      sortOrder: data.sortOrder ? JSON.stringify(data.sortOrder) : null,
      filters: data.filters ? JSON.stringify(data.filters) : null,
      viewSettings: data.viewSettings
        ? JSON.stringify(data.viewSettings)
        : null,
    },
  })
}

export async function updateTaskList(id: string, data: Partial<TaskList>) {
  return prisma.taskList.update({
    where: { id },
    data: {
      ...data,
      sortOrder: data.sortOrder ? JSON.stringify(data.sortOrder) : undefined,
      filters: data.filters ? JSON.stringify(data.filters) : undefined,
      viewSettings: data.viewSettings
        ? JSON.stringify(data.viewSettings)
        : undefined,
    },
  })
}

export async function deleteTaskList(id: string) {
  return prisma.taskList.delete({
    where: { id },
  })
}

export async function getProjectTaskLists(projectId: string) {
  const lists = await prisma.taskList.findMany({
    where: { projectId },
    include: {
      tasks: {
        include: {
          assignee: true,
          customFieldValues: {
            include: {
              customField: true,
            },
          },
        },
      },
    },
  })

  return lists.map((list) => ({
    ...list,
    sortOrder: list.sortOrder ? JSON.parse(list.sortOrder as string) : null,
    filters: list.filters ? JSON.parse(list.filters as string) : null,
    viewSettings: list.viewSettings
      ? JSON.parse(list.viewSettings as string)
      : null,
  }))
}

export async function addTaskToList(taskId: string, listId: string) {
  return prisma.taskList.update({
    where: { id: listId },
    data: {
      tasks: {
        connect: { id: taskId },
      },
    },
  })
}

export async function removeTaskFromList(taskId: string, listId: string) {
  return prisma.taskList.update({
    where: { id: listId },
    data: {
      tasks: {
        disconnect: { id: taskId },
      },
    },
  })
}

export async function reorderTasksInList(
  listId: string,
  taskIds: string[]
) {
  return prisma.taskList.update({
    where: { id: listId },
    data: {
      sortOrder: JSON.stringify(taskIds),
    },
  })
}

export async function updateListFilters(
  listId: string,
  filters: TaskList["filters"]
) {
  return prisma.taskList.update({
    where: { id: listId },
    data: {
      filters: JSON.stringify(filters),
    },
  })
}

export async function updateListViewSettings(
  listId: string,
  viewSettings: TaskList["viewSettings"]
) {
  return prisma.taskList.update({
    where: { id: listId },
    data: {
      viewSettings: JSON.stringify(viewSettings),
    },
  })
}

export async function getFilteredTasks(
  listId: string,
  filters: TaskList["filters"]
) {
  const list = await prisma.taskList.findUnique({
    where: { id: listId },
    include: {
      tasks: {
        include: {
          assignee: true,
          customFieldValues: {
            include: {
              customField: true,
            },
          },
        },
      },
    },
  })

  if (!list) return []

  let filteredTasks = list.tasks

  if (filters) {
    if (filters.status?.length) {
      filteredTasks = filteredTasks.filter((task) =>
        filters.status?.includes(task.status)
      )
    }

    if (filters.priority?.length) {
      filteredTasks = filteredTasks.filter((task) =>
        filters.priority?.includes(task.priority)
      )
    }

    if (filters.assignee?.length) {
      filteredTasks = filteredTasks.filter(
        (task) =>
          task.assigneeId && filters.assignee?.includes(task.assigneeId)
      )
    }

    if (filters.dueDate) {
      const { start, end } = filters.dueDate
      if (start) {
        filteredTasks = filteredTasks.filter(
          (task) =>
            task.dueDate && task.dueDate >= new Date(start)
        )
      }
      if (end) {
        filteredTasks = filteredTasks.filter(
          (task) =>
            task.dueDate && task.dueDate <= new Date(end)
        )
      }
    }

    if (filters.customFields) {
      for (const [fieldId, value] of Object.entries(
        filters.customFields
      )) {
        filteredTasks = filteredTasks.filter((task) => {
          const fieldValue = task.customFieldValues.find(
            (v) => v.customFieldId === fieldId
          )
          if (!fieldValue) return false
          const parsedValue = JSON.parse(fieldValue.value as string)
          return JSON.stringify(parsedValue) === JSON.stringify(value)
        })
      }
    }
  }

  return filteredTasks
}

export function sortTasks(
  tasks: any[],
  sortBy: string,
  sortDirection: "asc" | "desc" = "asc"
) {
  return [...tasks].sort((a, b) => {
    let aValue = a[sortBy]
    let bValue = b[sortBy]

    // Handle special cases
    if (sortBy === "dueDate") {
      aValue = aValue ? new Date(aValue).getTime() : Infinity
      bValue = bValue ? new Date(bValue).getTime() : Infinity
    } else if (sortBy === "customField") {
      // Sort by custom field value
      const fieldId = sortBy.split(".")[1]
      aValue = a.customFieldValues.find(
        (v: any) => v.customFieldId === fieldId
      )?.value
      bValue = b.customFieldValues.find(
        (v: any) => v.customFieldId === fieldId
      )?.value
      aValue = aValue ? JSON.parse(aValue) : null
      bValue = bValue ? JSON.parse(bValue) : null
    }

    if (aValue === bValue) return 0
    if (aValue === null) return 1
    if (bValue === null) return -1

    const result = aValue < bValue ? -1 : 1
    return sortDirection === "asc" ? result : -result
  })
}

export function groupTasks(tasks: any[], groupBy: string) {
  const groups: Record<string, any[]> = {}

  for (const task of tasks) {
    let groupKey = task[groupBy]

    // Handle special cases
    if (groupBy === "dueDate") {
      if (!task.dueDate) {
        groupKey = "No Due Date"
      } else {
        const date = new Date(task.dueDate)
        const today = new Date()
        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)

        if (date < today) {
          groupKey = "Overdue"
        } else if (
          date.toDateString() === today.toDateString()
        ) {
          groupKey = "Today"
        } else if (
          date.toDateString() === tomorrow.toDateString()
        ) {
          groupKey = "Tomorrow"
        } else {
          groupKey = date.toLocaleDateString()
        }
      }
    } else if (groupBy === "customField") {
      // Group by custom field value
      const fieldId = groupBy.split(".")[1]
      const fieldValue = task.customFieldValues.find(
        (v: any) => v.customFieldId === fieldId
      )
      groupKey = fieldValue
        ? JSON.parse(fieldValue.value as string)
        : "No Value"
    }

    if (!groups[groupKey]) {
      groups[groupKey] = []
    }
    groups[groupKey].push(task)
  }

  return groups
}
