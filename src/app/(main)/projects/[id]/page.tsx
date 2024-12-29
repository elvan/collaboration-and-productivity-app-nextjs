import { notFound } from 'next/navigation'
import { getProject } from '@/lib/actions/projects'
import { getProjectTasks } from '@/lib/actions/tasks'
import { ProjectView } from '@/components/projects/project-view'

interface ProjectPageProps {
  params: {
    id: string
  }
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const project = await getProject(params.id)
  const tasks = await getProjectTasks(params.id)

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
