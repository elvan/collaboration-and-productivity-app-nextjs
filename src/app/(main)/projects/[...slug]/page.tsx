import { redirect } from "next/navigation"

interface ProjectsPageProps {
  params: {
    slug: string[]
  }
}

export default function ProjectsPage({ params }: ProjectsPageProps) {
  // If the route is /projects/all, redirect to /projects
  if (params.slug[0] === "all") {
    redirect("/projects")
  }

  // For any other unknown routes, redirect to /projects
  redirect("/projects")
}
