import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GanttChart } from "./gantt-chart";
import { TaskBoard } from "./task-board";
import { TaskList } from "./task-list";
import { CreateProject } from "./create-project";
import { Portfolio } from "./portfolio";
import { ProjectTable } from "./project-table";

interface Project {
  id: string
  name: string
  description: string | null
  status: string
  owner: {
    name: string | null
    email: string | null
    image: string | null
  }
  workspace: {
    name: string | null
  } | null
  tasks: {
    id: string
    status: string
  }[]
  members: {
    id: string
    name: string | null
    image: string | null
  }[]
}

interface ProjectManagementDashboardProps {
  projects: Project[]
  userId: string
}

export function ProjectManagementDashboard({ projects, userId }: ProjectManagementDashboardProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <CreateProject />
      </div>

      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="board">Kanban Board</TabsTrigger>
          <TabsTrigger value="gantt">Gantt Chart</TabsTrigger>
          <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <ProjectTable projects={projects} />
        </TabsContent>

        <TabsContent value="tasks">
          <TaskList projects={projects} userId={userId} />
        </TabsContent>

        <TabsContent value="board">
          <TaskBoard projects={projects} userId={userId} />
        </TabsContent>

        <TabsContent value="gantt">
          <GanttChart projects={projects} userId={userId} />
        </TabsContent>

        <TabsContent value="portfolio">
          <Portfolio projects={projects} userId={userId} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
