import { User, Project, Task } from "@prisma/client"
import { prisma } from "./prisma"
import { Liquid } from "liquidjs"

const engine = new Liquid()

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

interface TemplateData {
  title: string
  body: string
  metadata?: Record<string, any>
  variables?: Record<string, any>
}

interface CreateTemplateOptions extends TemplateData {
  name: string
  description?: string
  type: "email" | "push" | "app"
  userId: string
}

interface UpdateTemplateOptions extends Partial<TemplateData> {
  id: string
  userId: string
  description?: string
  isActive?: boolean
}

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

export async function createTemplate({
  name,
  description,
  type,
  title,
  body,
  metadata,
  variables,
  userId,
}: CreateTemplateOptions) {
  // Validate template variables
  validateTemplate(title, body, variables || {})

  // Create template
  const template = await prisma.notificationTemplate.create({
    data: {
      name,
      description,
      type,
      title,
      body,
      metadata,
      variables,
      createdById: userId,
    },
  })

  // Create initial version
  await prisma.notificationTemplateVersion.create({
    data: {
      templateId: template.id,
      version: 1,
      title,
      body,
      metadata,
      variables,
      createdById: userId,
    },
  })

  return template
}

export async function updateTemplate({
  id,
  title,
  body,
  metadata,
  variables,
  description,
  isActive,
  userId,
}: UpdateTemplateOptions) {
  // Get current template
  const currentTemplate = await prisma.notificationTemplate.findUnique({
    where: { id },
    include: {
      versions: {
        orderBy: { version: "desc" },
        take: 1,
      },
    },
  })

  if (!currentTemplate) {
    throw new Error("Template not found")
  }

  // Check if content has changed
  const contentChanged =
    title !== undefined ||
    body !== undefined ||
    metadata !== undefined ||
    variables !== undefined

  // If content changed, validate new template
  if (contentChanged) {
    validateTemplate(
      title || currentTemplate.title,
      body || currentTemplate.body,
      variables || currentTemplate.variables || {}
    )
  }

  // Update template
  const template = await prisma.notificationTemplate.update({
    where: { id },
    data: {
      ...(title && { title }),
      ...(body && { body }),
      ...(metadata && { metadata }),
      ...(variables && { variables }),
      ...(description !== undefined && { description }),
      ...(isActive !== undefined && { isActive }),
      updatedById: userId,
    },
  })

  // If content changed, create new version
  if (contentChanged) {
    const lastVersion = currentTemplate.versions[0]
    await prisma.notificationTemplateVersion.create({
      data: {
        templateId: template.id,
        version: lastVersion.version + 1,
        title: title || currentTemplate.title,
        body: body || currentTemplate.body,
        metadata: metadata || currentTemplate.metadata,
        variables: variables || currentTemplate.variables,
        createdById: userId,
      },
    })
  }

  return template
}

export async function getTemplate(id: string) {
  return prisma.notificationTemplate.findUnique({
    where: { id },
    include: {
      versions: {
        orderBy: { version: "desc" },
        take: 1,
      },
    },
  })
}

export async function getTemplates(type?: string) {
  return prisma.notificationTemplate.findMany({
    where: {
      ...(type && { type }),
      isActive: true,
    },
    orderBy: { createdAt: "desc" },
  })
}

export async function renderTemplate(
  templateId: string,
  data: Record<string, any>
) {
  const template = await getTemplate(templateId)
  if (!template) {
    throw new Error("Template not found")
  }

  // Validate required variables
  const requiredVars = template.variables as Record<string, any>
  for (const [key, config] of Object.entries(requiredVars)) {
    if (config.required && !(key in data)) {
      throw new Error(`Missing required variable: ${key}`)
    }
  }

  // Render title and body
  const title = await engine.parseAndRender(template.title, data)
  const body = await engine.parseAndRender(template.body, data)

  return {
    title,
    body,
    metadata: template.metadata,
  }
}

function validateTemplate(
  title: string,
  body: string,
  variables: Record<string, any>
) {
  try {
    // Parse template to validate syntax
    engine.parse(title)
    engine.parse(body)

    // Extract variables from templates
    const titleVars = engine.parse(title).findAll((token) => token.name === "variable")
    const bodyVars = engine.parse(body).findAll((token) => token.name === "variable")
    const templateVars = new Set([...titleVars, ...bodyVars].map((v) => v.value))

    // Check if all required variables are defined
    for (const variable of templateVars) {
      if (!(variable in variables)) {
        throw new Error(`Template variable not defined: ${variable}`)
      }
    }
  } catch (error) {
    throw new Error(`Invalid template: ${error.message}`)
  }
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
