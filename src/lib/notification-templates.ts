import { User, Project, Task } from "@prisma/client"

export type NotificationCategory = "project" | "task" | "member" | "system"
export type NotificationPriority = "high" | "normal" | "low"

interface BaseTemplateData {
  actor: Pick<User, "id" | "name" | "email">
  project?: Pick<Project, "id" | "name">
}

interface ProjectTemplateData extends BaseTemplateData {
  action: "created" | "updated" | "deleted" | "archived"
}

interface MemberTemplateData extends BaseTemplateData {
  action: "joined" | "left" | "invited" | "removed"
  subject: Pick<User, "id" | "name" | "email">
  role?: string
}

interface TaskTemplateData extends BaseTemplateData {
  action: "created" | "completed" | "assigned" | "updated" | "deleted"
  task: Pick<Task, "id" | "title">
  assignee?: Pick<User, "id" | "name" | "email">
}

interface CommentTemplateData extends BaseTemplateData {
  action: "created" | "replied"
  taskTitle: string
  commentPreview: string
}

interface MentionTemplateData extends BaseTemplateData {
  context: "task" | "comment"
  title: string
  preview: string
}

export type NotificationTemplateData =
  | ProjectTemplateData
  | MemberTemplateData
  | TaskTemplateData
  | CommentTemplateData
  | MentionTemplateData

interface NotificationTemplate {
  type: string
  category: NotificationCategory
  priority: NotificationPriority
  groupKey?: (data: NotificationTemplateData) => string
  title: (data: NotificationTemplateData) => string
  message: (data: NotificationTemplateData) => string
  metadata?: (data: NotificationTemplateData) => Record<string, any>
}

const templates: Record<string, NotificationTemplate> = {
  // Project templates
  "project.created": {
    type: "project.created",
    category: "project",
    priority: "normal",
    title: (data) => {
      const { actor, project } = data as ProjectTemplateData
      return `New Project Created`
    },
    message: (data) => {
      const { actor, project } = data as ProjectTemplateData
      return `${actor.name || actor.email} created project "${project?.name}"`
    },
    metadata: (data) => ({
      projectId: (data as ProjectTemplateData).project?.id,
    }),
  },

  // Member templates
  "member.joined": {
    type: "member.joined",
    category: "member",
    priority: "normal",
    groupKey: (data) => `member_${(data as MemberTemplateData).project?.id}`,
    title: (data) => {
      const { subject } = data as MemberTemplateData
      return `New Team Member`
    },
    message: (data) => {
      const { subject, project, role } = data as MemberTemplateData
      return `${subject.name || subject.email} joined ${
        project?.name
      }${role ? ` as ${role}` : ""}`
    },
    metadata: (data) => ({
      projectId: (data as MemberTemplateData).project?.id,
      memberId: (data as MemberTemplateData).subject.id,
    }),
  },

  // Task templates
  "task.created": {
    type: "task.created",
    category: "task",
    priority: "normal",
    groupKey: (data) => `task_${(data as TaskTemplateData).project?.id}`,
    title: (data) => {
      const { actor } = data as TaskTemplateData
      return `New Task Created`
    },
    message: (data) => {
      const { actor, task, project } = data as TaskTemplateData
      return `${actor.name || actor.email} created task "${
        task.title
      }" in ${project?.name}`
    },
    metadata: (data) => ({
      projectId: (data as TaskTemplateData).project?.id,
      taskId: (data as TaskTemplateData).task.id,
    }),
  },

  "task.assigned": {
    type: "task.assigned",
    category: "task",
    priority: "high",
    groupKey: (data) => `task_${(data as TaskTemplateData).project?.id}`,
    title: (data) => {
      const { actor } = data as TaskTemplateData
      return `Task Assigned to You`
    },
    message: (data) => {
      const { actor, task, project } = data as TaskTemplateData
      return `${actor.name || actor.email} assigned you task "${
        task.title
      }" in ${project?.name}`
    },
    metadata: (data) => ({
      projectId: (data as TaskTemplateData).project?.id,
      taskId: (data as TaskTemplateData).task.id,
    }),
  },

  "task.completed": {
    type: "task.completed",
    category: "task",
    priority: "normal",
    groupKey: (data) => `task_${(data as TaskTemplateData).project?.id}`,
    title: (data) => {
      const { actor } = data as TaskTemplateData
      return `Task Completed`
    },
    message: (data) => {
      const { actor, task, project } = data as TaskTemplateData
      return `${actor.name || actor.email} completed task "${
        task.title
      }" in ${project?.name}`
    },
    metadata: (data) => ({
      projectId: (data as TaskTemplateData).project?.id,
      taskId: (data as TaskTemplateData).task.id,
    }),
  },

  // Comment templates
  "comment.created": {
    type: "comment.created",
    category: "task",
    priority: "normal",
    title: (data) => {
      const { actor } = data as CommentTemplateData
      return `New Comment`
    },
    message: (data) => {
      const { actor, taskTitle, commentPreview } = data as CommentTemplateData
      return `${
        actor.name || actor.email
      } commented on "${taskTitle}": ${commentPreview}`
    },
  },

  // Mention templates
  "mention.created": {
    type: "mention.created",
    category: "task",
    priority: "high",
    title: (data) => {
      const { actor } = data as MentionTemplateData
      return `You were mentioned`
    },
    message: (data) => {
      const { actor, context, title, preview } = data as MentionTemplateData
      return `${
        actor.name || actor.email
      } mentioned you in ${context} "${title}": ${preview}`
    },
  },
}

export function getTemplate(type: string): NotificationTemplate | undefined {
  return templates[type]
}

export function formatNotification(
  type: string,
  data: NotificationTemplateData
): {
  type: string
  category: NotificationCategory
  priority: NotificationPriority
  title: string
  message: string
  groupId?: string
  metadata?: Record<string, any>
} {
  const template = getTemplate(type)
  if (!template) {
    throw new Error(`Unknown notification template: ${type}`)
  }

  return {
    type: template.type,
    category: template.category,
    priority: template.priority,
    title: template.title(data),
    message: template.message(data),
    groupId: template.groupKey?.(data),
    metadata: template.metadata?.(data),
  }
}
