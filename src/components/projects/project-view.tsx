'use client';

import { useProject, useProjectTasks } from '@/hooks/use-projects';
import { Project } from '@/types/project';
import { ProjectHeader } from './project-header';
import { ProjectTabs } from './project-tabs';
import { TaskBoard } from './task-board';
import { ProjectTaskList } from './project-task-list';
import { ProjectActivity } from './project-activity';
import { ProjectMembers } from './project-members';
import { useSearchParams } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';

interface ProjectViewProps {
  initialData: Project;
}

export function ProjectView({ initialData }: ProjectViewProps) {
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab') || 'board';
  
  const { data: project, isLoading: isProjectLoading } = useProject(initialData.id);
  const { data: tasks, isLoading: isTasksLoading } = useProjectTasks(initialData.id);

  if (isProjectLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-[500px] w-full" />
      </div>
    );
  }

  const currentProject = project || initialData;

  return (
    <div className="space-y-6">
      <ProjectHeader project={currentProject} />
      
      <div className="flex flex-col space-y-8">
        <ProjectTabs defaultValue={tab}>
          <div className="mt-6">
            {tab === 'board' && (
              <TaskBoard 
                project={currentProject}
                tasks={tasks || []}
                isLoading={isTasksLoading}
              />
            )}
            {tab === 'list' && (
              <ProjectTaskList 
                project={currentProject}
                tasks={tasks || []}
                isLoading={isTasksLoading}
              />
            )}
            {tab === 'activity' && (
              <ProjectActivity project={currentProject} />
            )}
            {tab === 'members' && (
              <ProjectMembers project={currentProject} />
            )}
          </div>
        </ProjectTabs>
      </div>
    </div>
  );
}
