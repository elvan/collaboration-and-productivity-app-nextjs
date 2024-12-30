import { Metadata } from "next"
import { ProjectMilestonesClient } from "@/components/projects/project-milestones-client"

export const metadata: Metadata = {
  title: "Project Milestones",
  description: "Track and manage project milestones and achievements.",
}

export default async function ProjectMilestonesPage({
  params,
}: {
  params: { projectId: string }
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <ProjectMilestonesClient projectId={params.projectId} />
      </div>
    </div>
  )
}
