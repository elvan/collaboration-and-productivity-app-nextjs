import { Metadata } from "next"
import { ProjectRoadmapClient } from "@/components/projects/project-roadmap-client"

export const metadata: Metadata = {
  title: "Project Roadmap",
  description: "View and manage project timeline, milestones, and deliverables.",
}

export default async function ProjectRoadmapPage({
  params,
}: {
  params: { projectId: string }
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <ProjectRoadmapClient projectId={params.projectId} />
      </div>
    </div>
  )
}
