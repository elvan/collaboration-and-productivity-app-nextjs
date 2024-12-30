import { Metadata } from "next"
import { ProjectResourcesClient } from "@/components/projects/project-resources-client"

export const metadata: Metadata = {
  title: "Project Resources",
  description: "Manage project resources and resource allocation.",
}

export default async function ProjectResourcesPage({
  params,
}: {
  params: { projectId: string }
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <ProjectResourcesClient projectId={params.projectId} />
      </div>
    </div>
  )
}
