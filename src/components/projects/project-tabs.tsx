'use client'

import * as React from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Project, Task } from '@prisma/client'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ProjectTaskList } from './project-task-list'
import { ProjectMembers } from './project-members'
import { ProjectActivity } from './project-activity'
import { TaskBoard } from './task-board'
import { KanbanIcon, ListIcon, UsersIcon, ActivityIcon } from 'lucide-react'

interface ExtendedTask extends Task {
  assignedTo: {
    id: string
    name: string | null
    image: string | null
  } | null
}

interface ExtendedProject extends Project {
  tasks: ExtendedTask[]
  members: {
    id: string
    name: string | null
    image: string | null
  }[]
}

interface ProjectTabsProps {
  project: ExtendedProject
}

export function ProjectTabs({ project }: ProjectTabsProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tab = searchParams.get('tab') || 'board'

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', value)
    router.push(`/projects/${project.id}?${params.toString()}`)
  }

  return (
    <Tabs defaultValue={tab} className="space-y-4" onValueChange={handleTabChange}>
      <TabsList>
        <TabsTrigger value="board" className="flex items-center gap-2">
          <KanbanIcon className="h-4 w-4" />
          Board
        </TabsTrigger>
        <TabsTrigger value="tasks" className="flex items-center gap-2">
          <ListIcon className="h-4 w-4" />
          List
        </TabsTrigger>
        <TabsTrigger value="members" className="flex items-center gap-2">
          <UsersIcon className="h-4 w-4" />
          Members
        </TabsTrigger>
        <TabsTrigger value="activity" className="flex items-center gap-2">
          <ActivityIcon className="h-4 w-4" />
          Activity
        </TabsTrigger>
      </TabsList>
      <TabsContent value="board" className="space-y-4">
        <TaskBoard project={project} />
      </TabsContent>
      <TabsContent value="tasks" className="space-y-4">
        <ProjectTaskList project={project} />
      </TabsContent>
      <TabsContent value="members" className="space-y-4">
        <ProjectMembers project={project} />
      </TabsContent>
      <TabsContent value="activity" className="space-y-4">
        <ProjectActivity project={project} />
      </TabsContent>
    </Tabs>
  )
}
