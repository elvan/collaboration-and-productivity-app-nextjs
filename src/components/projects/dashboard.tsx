'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BoardView } from '../board/board-view'
import { Task } from '@prisma/client'

interface ProjectDashboardProps {
  projectId: string
  tasks: Task[]
}

export function ProjectDashboard({ projectId, tasks }: ProjectDashboardProps) {
  const [view, setView] = useState('board')

  return (
    <div className="space-y-4">
      <Tabs defaultValue="board" className="w-full">
        <TabsList>
          <TabsTrigger value="board">Board</TabsTrigger>
          <TabsTrigger value="list">List</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
        </TabsList>
        <TabsContent value="board" className="min-h-[600px]">
          <BoardView projectId={projectId} initialTasks={tasks} />
        </TabsContent>
        <TabsContent value="list">
          {/* List view component will go here */}
        </TabsContent>
        <TabsContent value="calendar">
          {/* Calendar view component will go here */}
        </TabsContent>
      </Tabs>
    </div>
  )
}
