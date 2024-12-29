import { notFound } from 'next/navigation'
import { getProject } from '@/lib/actions/projects'
import { getProjectTasks } from '@/lib/actions/tasks'
import { ProjectView } from '@/components/projects/project-view'

interface ProjectPageProps {
  params: {
    projectId: string
  }
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const project = await getProject(params.projectId)
  const tasks = await getProjectTasks(params.projectId)

  if (!project) {
    notFound()
  }

  return (
    <ProjectView 
      project={project}
      tasks={tasks}
    />
  )
}
