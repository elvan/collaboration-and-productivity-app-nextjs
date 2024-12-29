import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { DashboardHeader } from '@/components/header';
import { redirect } from 'next/navigation';
import { ProjectManagementDashboard } from '@/components/projects/dashboard';

export const metadata: Metadata = {
  title: 'Projects | CollabSpace',
  description:
    'Manage your projects, tasks, and portfolios efficiently with CollabSpace',
};

async function getProjects(userId: string) {
  return await prisma.project.findMany({
    where: {
      OR: [
        { ownerId: userId },
        {
          members: {
            some: {
              userId: userId,
            },
          },
        },
      ],
    },
    include: {
      owner: {
        select: {
          name: true,
          email: true,
          image: true,
        },
      },
      workspace: {
        select: {
          name: true,
        },
      },
      tasks: {
        include: {
          assignees: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                },
              },
            },
          },
          taskStatus: true,
          taskPriority: true,
        },
      },
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      },
    },
    orderBy: {
      updatedAt: 'desc',
    },
  });
}

export default async function ProjectsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/auth');
  }

  const projects = await getProjects(session.user.id);

  return (
    <>
      <DashboardHeader
        heading='Projects'
        text='Manage your projects and collaborate with your team.'
      />
      <ProjectManagementDashboard projects={projects} />
    </>
  );
}
