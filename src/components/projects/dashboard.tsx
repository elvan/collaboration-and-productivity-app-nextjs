'use client'

import { useState } from 'react'
import { Project, Task } from '@prisma/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PlusIcon } from 'lucide-react'
import Link from 'next/link'

interface ProjectWithDetails extends Project {
  owner: {
    name: string
    email: string
    image: string
  }
  workspace: {
    name: string
  }
  tasks: Task[]
  members: {
    user: {
      id: string
      name: string
      image: string
    }
  }[]
}

interface ProjectManagementDashboardProps {
  projects: ProjectWithDetails[]
}

export function ProjectManagementDashboard({ projects }: ProjectManagementDashboardProps) {
  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">Your Projects</h2>
          <p className="text-muted-foreground">
            Here&apos;s a list of all your projects and collaborations.
          </p>
        </div>
        <Button>
          <PlusIcon className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <Link key={project.id} href={`/projects/${project.id}`}>
            <Card className="hover:bg-muted/50 transition-colors">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg">{project.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {project.workspace.name}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm">
                      <span className="text-muted-foreground">Owner:</span>
                      <span className="ml-2">{project.owner.name}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <span className="text-muted-foreground">Tasks:</span>
                      <span className="ml-2">{project.tasks.length}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <span className="text-muted-foreground">Members:</span>
                      <span className="ml-2">{project.members.length}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
