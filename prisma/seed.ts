import { PrismaClient } from "@prisma/client"
import { hash } from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  // Create demo user
  const password = await hash("password123", 10)
  const user = await prisma.user.upsert({
    where: { email: "demo@example.com" },
    update: {},
    create: {
      email: "demo@example.com",
      name: "Demo User",
      password,
    },
  })

  // Create demo workspace
  const workspace = await prisma.workspace.upsert({
    where: { id: "demo-workspace" },
    update: {},
    create: {
      id: "demo-workspace",
      name: "Demo Workspace",
      description: "A demo workspace for testing",
      members: {
        create: {
          userId: user.id,
          role: "admin",
        },
      },
    },
  })

  // Create demo project
  const project = await prisma.project.create({
    data: {
      name: "Website Redesign",
      description: "Redesign and implement the company website",
      status: "active",
      priority: "high",
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      workspace: { connect: { id: workspace.id } },
      owner: { connect: { id: user.id } },
      members: { connect: [{ id: user.id }] },
    },
  })

  // Create demo tasks
  const tasks = await Promise.all([
    prisma.task.create({
      data: {
        title: "Design System Setup",
        description: "Set up the design system and component library",
        status: "in_progress",
        priority: "high",
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        project: { connect: { id: project.id } },
        assignee: { connect: { id: user.id } },
      },
    }),
    prisma.task.create({
      data: {
        title: "Homepage Implementation",
        description: "Implement the new homepage design",
        status: "todo",
        priority: "medium",
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        project: { connect: { id: project.id } },
        assignee: { connect: { id: user.id } },
      },
    }),
    prisma.task.create({
      data: {
        title: "User Testing",
        description: "Conduct user testing sessions",
        status: "todo",
        priority: "medium",
        dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 21 days from now
        project: { connect: { id: project.id } },
        assignee: { connect: { id: user.id } },
      },
    }),
  ])

  console.log({ user, workspace, project, tasks })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
