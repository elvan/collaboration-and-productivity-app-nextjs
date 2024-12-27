import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TaskBoard } from "./task-board"
import { TaskList } from "./task-list"
import { GanttChart } from "./gantt-chart"
import { Portfolio } from "./portfolio"

export function ProjectManagementDashboard() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Project Management</h1>
      
      <Tabs defaultValue="tasks" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="board">Kanban Board</TabsTrigger>
          <TabsTrigger value="gantt">Gantt Chart</TabsTrigger>
          <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks">
          <TaskList />
        </TabsContent>

        <TabsContent value="board">
          <TaskBoard />
        </TabsContent>

        <TabsContent value="gantt">
          <GanttChart />
        </TabsContent>

        <TabsContent value="portfolio">
          <Portfolio />
        </TabsContent>
      </Tabs>
    </div>
  )
}
