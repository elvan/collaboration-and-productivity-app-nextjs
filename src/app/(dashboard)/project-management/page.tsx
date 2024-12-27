import { Metadata } from "next"
import { ProjectManagementDashboard } from "@/components/project-management/dashboard"

export const metadata: Metadata = {
  title: "Project Management | CollabSpace",
  description: "Manage your projects, tasks, and portfolios efficiently with CollabSpace",
}

export default function ProjectManagementPage() {
  return <ProjectManagementDashboard />
}
