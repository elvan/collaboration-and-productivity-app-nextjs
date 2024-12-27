import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

const emailTemplateSchema = z.object({
  name: z.string(),
  subject: z.string(),
  body: z.string(),
  events: z.array(
    z.enum([
      "task.assigned",
      "task.due_soon",
      "task.overdue",
      "comment.mentioned",
      "task.status_changed",
      "task.priority_changed",
    ])
  ),
  enabled: z.boolean().default(true),
})

export type EmailTemplate = z.infer<typeof emailTemplateSchema>

export async function createEmailTemplate(
  projectId: string,
  data: EmailTemplate
) {
  return prisma.emailTemplate.create({
    data: {
      ...data,
      events: JSON.stringify(data.events),
      projectId,
    },
  })
}

export async function updateEmailTemplate(
  id: string,
  data: Partial<EmailTemplate>
) {
  return prisma.emailTemplate.update({
    where: { id },
    data: {
      ...data,
      events: data.events ? JSON.stringify(data.events) : undefined,
    },
  })
}

export async function deleteEmailTemplate(id: string) {
  return prisma.emailTemplate.delete({
    where: { id },
  })
}

export async function getProjectEmailTemplates(projectId: string) {
  const templates = await prisma.emailTemplate.findMany({
    where: { projectId },
  })

  return templates.map((t) => ({
    ...t,
    events: JSON.parse(t.events as string),
  }))
}

export async function sendTaskAssignmentEmail(
  taskId: string,
  assigneeId: string
) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      project: true,
      assignee: true,
    },
  })

  if (!task || !task.assignee) return

  const template = await prisma.emailTemplate.findFirst({
    where: {
      projectId: task.projectId,
      enabled: true,
      events: {
        contains: "task.assigned",
      },
    },
  })

  if (!template) return

  const variables = {
    taskTitle: task.title,
    taskDescription: task.description,
    taskPriority: task.priority,
    taskStatus: task.status,
    projectName: task.project.name,
    assigneeName: task.assignee.name,
  }

  const subject = replaceVariables(template.subject, variables)
  const body = replaceVariables(template.body, variables)

  await resend.emails.send({
    from: "tasks@yourdomain.com",
    to: task.assignee.email,
    subject,
    html: body,
  })

  await prisma.emailLog.create({
    data: {
      templateId: template.id,
      recipientId: assigneeId,
      taskId,
      subject,
      body,
    },
  })
}

export async function sendTaskDueSoonEmail(taskId: string) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      project: true,
      assignee: true,
    },
  })

  if (!task || !task.assignee || !task.dueDate) return

  const template = await prisma.emailTemplate.findFirst({
    where: {
      projectId: task.projectId,
      enabled: true,
      events: {
        contains: "task.due_soon",
      },
    },
  })

  if (!template) return

  const variables = {
    taskTitle: task.title,
    taskDescription: task.description,
    taskPriority: task.priority,
    taskStatus: task.status,
    projectName: task.project.name,
    assigneeName: task.assignee.name,
    dueDate: task.dueDate.toLocaleDateString(),
  }

  const subject = replaceVariables(template.subject, variables)
  const body = replaceVariables(template.body, variables)

  await resend.emails.send({
    from: "tasks@yourdomain.com",
    to: task.assignee.email,
    subject,
    html: body,
  })

  await prisma.emailLog.create({
    data: {
      templateId: template.id,
      recipientId: task.assigneeId!,
      taskId,
      subject,
      body,
    },
  })
}

export async function sendMentionEmail(
  commentId: string,
  mentionedUserId: string
) {
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    include: {
      task: {
        include: {
          project: true,
        },
      },
      author: true,
      mentions: {
        include: {
          user: true,
        },
      },
    },
  })

  if (!comment) return

  const template = await prisma.emailTemplate.findFirst({
    where: {
      projectId: comment.task.projectId,
      enabled: true,
      events: {
        contains: "comment.mentioned",
      },
    },
  })

  if (!template) return

  const mentionedUser = comment.mentions.find(
    (m) => m.userId === mentionedUserId
  )?.user

  if (!mentionedUser) return

  const variables = {
    taskTitle: comment.task.title,
    projectName: comment.task.project.name,
    authorName: comment.author.name,
    commentContent: comment.content,
    mentionedName: mentionedUser.name,
  }

  const subject = replaceVariables(template.subject, variables)
  const body = replaceVariables(template.body, variables)

  await resend.emails.send({
    from: "tasks@yourdomain.com",
    to: mentionedUser.email,
    subject,
    html: body,
  })

  await prisma.emailLog.create({
    data: {
      templateId: template.id,
      recipientId: mentionedUserId,
      taskId: comment.taskId,
      commentId,
      subject,
      body,
    },
  })
}

function replaceVariables(
  template: string,
  variables: Record<string, string>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => variables[key] || "")
}
