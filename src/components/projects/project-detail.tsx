'use client';

import { useEffect, useState } from 'react';
import { Project, Task } from '@/types/project';
import { ProjectHeader } from './project-header';
import { ProjectNavigation } from './project-navigation';
import { ProjectTabs } from './project-tabs';
import { TaskBoard } from './task-board';
import { ProjectTaskList } from './project-task-list';
import { ProjectActivity } from './project-activity';
import { ProjectMembers } from './project-members';
import { useSearchParams } from 'next/navigation';

interface ProjectDetailProps {
  project: Project;
}

export function ProjectDetail({ project }: ProjectDetailProps) {
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab') || 'board';

  return (
    <div className="space-y-6">
      <ProjectHeader project={project} />
      
      <div className="flex flex-col space-y-8">
        <ProjectNavigation projectId={project.id} />
        
        <ProjectTabs defaultValue={tab}>
          <div className="mt-6">
            {tab === 'board' && (
              <TaskBoard projects={[project]} />
            )}
            {tab === 'list' && (
              <ProjectTaskList project={project} />
            )}
            {tab === 'activity' && (
              <ProjectActivity project={project} />
            )}
            {tab === 'members' && (
              <ProjectMembers project={project} />
            )}
          </div>
        </ProjectTabs>
      </div>
    </div>
  );
}
