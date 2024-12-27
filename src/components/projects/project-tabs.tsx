"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import { Project, Task, User } from "@prisma/client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProjectTaskList } from "./project-task-list"
import { ProjectMembers } from "./project-members"
import { ProjectActivity } from "./project-activity"

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
  const searchParams = useSearchParams()
  const tab = searchParams.get("tab") || "tasks"

  return (
    <Tabs defaultValue={tab} className="space-y-4">
      <TabsList>
        <TabsTrigger value="tasks">Tasks</TabsTrigger>
        <TabsTrigger value="members">Members</TabsTrigger>
        <TabsTrigger value="activity">Activity</TabsTrigger>
      </TabsList>
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
