import { prisma } from "./prisma"

interface IntegrationConfig {
  [key: string]: any
}

interface IntegrationCreateInput {
  type: string
  name: string
  config: IntegrationConfig
  userId: string
  workspaceId: string
}

export async function createIntegration(data: IntegrationCreateInput) {
  return prisma.integration.create({
    data: {
      type: data.type,
      name: data.name,
      config: data.config,
      createdById: data.userId,
      workspaceId: data.workspaceId,
    },
  })
}

export async function updateIntegration(
  id: string,
  data: {
    name?: string
    config?: IntegrationConfig
    isActive?: boolean
  }
) {
  return prisma.integration.update({
    where: { id },
    data,
  })
}

export async function deleteIntegration(id: string) {
  return prisma.integration.delete({
    where: { id },
  })
}

export async function getIntegration(id: string) {
  return prisma.integration.findUnique({
    where: { id },
  })
}

export async function getIntegrations(
  workspaceId: string,
  options?: {
    type?: string
    isActive?: boolean
  }
) {
  return prisma.integration.findMany({
    where: {
      workspaceId,
      ...(options?.type && { type: options.type }),
      ...(options?.isActive !== undefined && {
        isActive: options.isActive,
      }),
    },
    orderBy: { createdAt: "desc" },
  })
}

// GitHub Integration
interface GitHubConfig {
  accessToken: string
  repositories?: string[]
}

export async function createGitHubIntegration(
  userId: string,
  workspaceId: string,
  config: GitHubConfig
) {
  return createIntegration({
    type: "github",
    name: "GitHub",
    config,
    userId,
    workspaceId,
  })
}

export async function syncGitHubIssues(integrationId: string) {
  const integration = await getIntegration(integrationId)
  if (!integration || integration.type !== "github") {
    throw new Error("Invalid GitHub integration")
  }

  const config = integration.config as GitHubConfig
  const { accessToken, repositories = [] } = config

  for (const repo of repositories) {
    const [owner, name] = repo.split("/")
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${name}/issues`,
      {
        headers: {
          Authorization: `token ${accessToken}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    )

    if (!response.ok) {
      throw new Error(
        `Failed to fetch GitHub issues: ${response.statusText}`
      )
    }

    const issues = await response.json()

    // Process issues and create/update tasks
    for (const issue of issues) {
      await prisma.task.upsert({
        where: {
          externalId: `github:${issue.id}`,
        },
        create: {
          title: issue.title,
          description: issue.body,
          status: issue.state === "open" ? "todo" : "done",
          priority: "medium",
          externalId: `github:${issue.id}`,
          externalUrl: issue.html_url,
          metadata: {
            source: "github",
            repository: repo,
            issueNumber: issue.number,
            labels: issue.labels.map((label: any) => label.name),
          },
          workspaceId: integration.workspaceId,
          createdById: integration.createdById,
        },
        update: {
          title: issue.title,
          description: issue.body,
          status: issue.state === "open" ? "todo" : "done",
          metadata: {
            source: "github",
            repository: repo,
            issueNumber: issue.number,
            labels: issue.labels.map((label: any) => label.name),
          },
        },
      })
    }
  }
}

// Slack Integration
interface SlackConfig {
  accessToken: string
  channels?: string[]
}

export async function createSlackIntegration(
  userId: string,
  workspaceId: string,
  config: SlackConfig
) {
  return createIntegration({
    type: "slack",
    name: "Slack",
    config,
    userId,
    workspaceId,
  })
}

export async function sendSlackMessage(
  integrationId: string,
  channel: string,
  message: string
) {
  const integration = await getIntegration(integrationId)
  if (!integration || integration.type !== "slack") {
    throw new Error("Invalid Slack integration")
  }

  const config = integration.config as SlackConfig
  const { accessToken } = config

  const response = await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      channel,
      text: message,
    }),
  })

  if (!response.ok) {
    throw new Error(`Failed to send Slack message: ${response.statusText}`)
  }

  const result = await response.json()
  if (!result.ok) {
    throw new Error(`Slack API error: ${result.error}`)
  }

  return result
}

// Jira Integration
interface JiraConfig {
  host: string
  email: string
  apiToken: string
  projects?: string[]
}

export async function createJiraIntegration(
  userId: string,
  workspaceId: string,
  config: JiraConfig
) {
  return createIntegration({
    type: "jira",
    name: "Jira",
    config,
    userId,
    workspaceId,
  })
}

export async function syncJiraIssues(integrationId: string) {
  const integration = await getIntegration(integrationId)
  if (!integration || integration.type !== "jira") {
    throw new Error("Invalid Jira integration")
  }

  const config = integration.config as JiraConfig
  const { host, email, apiToken, projects = [] } = config
  const auth = Buffer.from(`${email}:${apiToken}`).toString("base64")

  for (const project of projects) {
    const response = await fetch(
      `${host}/rest/api/3/search?jql=project=${project}`,
      {
        headers: {
          Authorization: `Basic ${auth}`,
          Accept: "application/json",
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to fetch Jira issues: ${response.statusText}`)
    }

    const { issues } = await response.json()

    // Process issues and create/update tasks
    for (const issue of issues) {
      await prisma.task.upsert({
        where: {
          externalId: `jira:${issue.id}`,
        },
        create: {
          title: issue.fields.summary,
          description: issue.fields.description,
          status: mapJiraStatus(issue.fields.status.name),
          priority: mapJiraPriority(issue.fields.priority.name),
          externalId: `jira:${issue.id}`,
          externalUrl: `${host}/browse/${issue.key}`,
          metadata: {
            source: "jira",
            project,
            issueKey: issue.key,
            issueType: issue.fields.issuetype.name,
            labels: issue.fields.labels,
          },
          workspaceId: integration.workspaceId,
          createdById: integration.createdById,
        },
        update: {
          title: issue.fields.summary,
          description: issue.fields.description,
          status: mapJiraStatus(issue.fields.status.name),
          priority: mapJiraPriority(issue.fields.priority.name),
          metadata: {
            source: "jira",
            project,
            issueKey: issue.key,
            issueType: issue.fields.issuetype.name,
            labels: issue.fields.labels,
          },
        },
      })
    }
  }
}

function mapJiraStatus(status: string): string {
  const statusMap: { [key: string]: string } = {
    "To Do": "todo",
    "In Progress": "in_progress",
    Done: "done",
  }
  return statusMap[status] || "todo"
}

function mapJiraPriority(priority: string): string {
  const priorityMap: { [key: string]: string } = {
    Highest: "urgent",
    High: "high",
    Medium: "medium",
    Low: "low",
    Lowest: "low",
  }
  return priorityMap[priority] || "medium"
}
