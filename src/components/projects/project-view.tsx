'use client'

import { useState } from 'react'
import { Project, Task } from '@prisma/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BoardView } from '@/components/board/board-view'
import { GanttChart } from '@/components/projects/gantt-chart'
import { ProjectHeader } from '@/components/projects/project-header'
import { useUpdateTask } from '@/hooks/use-update-task'
import { 
  KanbanSquare, 
  BarChart2, 
  List, 
  Users, 
  Settings 
} from 'lucide-react'

interface ProjectViewProps {
  project: Project
  tasks: Task[]
}

export function ProjectView({ project, tasks }: ProjectViewProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const view = searchParams.get('view') || 'board'
  const updateTask = useUpdateTask()

  const handleViewChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('view', value)
    router.push(`/projects/${project.id}?${params.toString()}`)
  }

  const handleTaskUpdate = async (updatedTask: Task) => {
    try {
      await updateTask.mutateAsync({
        projectId: project.id,
        taskId: updatedTask.id,
        data: updatedTask
      })
    } catch (error) {
      console.error('Failed to update task:', error)
    }
  }

  return (
    <div className="flex h-full flex-col space-y-6">
      <ProjectHeader project={project} />

      <Tabs value={view} onValueChange={handleViewChange} className="flex-1">
        <TabsList>
          <TabsTrigger value="board" className="flex items-center gap-2">
            <KanbanSquare className="h-4 w-4" />
            Board
          </TabsTrigger>
          <TabsTrigger value="gantt" className="flex items-center gap-2">
            <BarChart2 className="h-4 w-4" />
            Timeline
          </TabsTrigger>
          <TabsTrigger value="list" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            List
          </TabsTrigger>
          <TabsTrigger value="members" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Members
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="board" className="flex-1 border-none p-0">
          <BoardView 
            projectId={project.id} 
            initialTasks={tasks} 
          />
        </TabsContent>

        <TabsContent value="gantt" className="flex-1 border-none p-0">
          <GanttChart 
            tasks={tasks}
            onTaskUpdate={handleTaskUpdate}
          />
        </TabsContent>

        <TabsContent value="list" className="border-none p-0">
          {/* TaskList component will be implemented next */}
          <div className="rounded-lg border bg-card p-4">
            Task List view coming soon...
          </div>
        </TabsContent>

        <TabsContent value="members" className="border-none p-0">
          {/* Members component will be implemented next */}
          <div className="rounded-lg border bg-card p-4">
            Members view coming soon...
          </div>
        </TabsContent>

        <TabsContent value="settings" className="border-none p-0">
          {/* Settings component will be implemented next */}
          <div className="rounded-lg border bg-card p-4">
            Project settings coming soon...
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
