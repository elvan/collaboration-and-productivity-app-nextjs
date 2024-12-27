import { Metadata } from "next"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { DashboardShell } from "@/components/shell"
import { DashboardHeader } from "@/components/header"
import { Button } from "@/components/ui/button"
import { PlusIcon } from "lucide-react"
import { redirect } from "next/navigation"
import { ProjectTable } from "@/components/projects/project-table"
import { CreateProject } from "@/components/projects/create-project"

export const metadata: Metadata = {
  title: "Projects | CollabSpace",
  description: "Manage your projects",
}

async function getProjects(userId: string) {
  return await prisma.project.findMany({
    where: {
      OR: [
        { ownerId: userId },
        { members: { some: { id: userId } } }
      ]
    },
    include: {
      owner: {
        select: {
          name: true,
          email: true,
          image: true
        }
      },
      workspace: {
        select: {
          name: true
        }
      },
      tasks: {
        select: {
          id: true,
          status: true
        }
      },
      members: {
        select: {
          id: true,
          name: true,
          image: true
        }
      }
    },
    orderBy: {
      updatedAt: "desc"
    }
  })
}

export default async function ProjectsPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    redirect("/login")
  }

  const projects = await getProjects(session.user.id)

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Projects"
        text="Create and manage your projects."
      >
        <CreateProject />
      </DashboardHeader>
      <ProjectTable projects={projects} />
    </DashboardShell>
  )
}
