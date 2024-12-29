'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GanttChart } from './gantt-chart';
import { TaskBoard } from './task-board';
import { TaskList } from './task-list';
import { CreateProject } from './create-project';
import { Portfolio } from './portfolio';
import { ProjectTable } from './project-table';
import { Project } from '@/types/project';
import { Button } from '@/components/ui/button';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ViewIcon,
  ListIcon,
  KanbanIcon,
  GanttChartIcon,
  FolderIcon,
} from 'lucide-react';

interface ProjectManagementDashboardProps {
  projects: Project[];
}

export function ProjectManagementDashboard({
  projects,
}: ProjectManagementDashboardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const view = searchParams.get('view') || 'list';

  const handleViewChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('view', value);
    router.push(`/projects?${params.toString()}`);
  };

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center space-x-2'>
          <Button
            variant={view === 'list' ? 'default' : 'outline'}
            size='sm'
            onClick={() => handleViewChange('list')}
          >
            <ListIcon className='mr-2 h-4 w-4' />
            List
          </Button>
          <Button
            variant={view === 'board' ? 'default' : 'outline'}
            size='sm'
            onClick={() => handleViewChange('board')}
          >
            <KanbanIcon className='mr-2 h-4 w-4' />
            Board
          </Button>
          <Button
            variant={view === 'gantt' ? 'default' : 'outline'}
            size='sm'
            onClick={() => handleViewChange('gantt')}
          >
            <GanttChartIcon className='mr-2 h-4 w-4' />
            Gantt
          </Button>
          <Button
            variant={view === 'portfolio' ? 'default' : 'outline'}
            size='sm'
            onClick={() => handleViewChange('portfolio')}
          >
            <FolderIcon className='mr-2 h-4 w-4' />
            Portfolio
          </Button>
        </div>
        <CreateProject />
      </div>

      <div className='mt-6'>
        {view === 'list' && <ProjectTable projects={projects} />}
        {view === 'board' && <TaskBoard projects={projects} />}
        {view === 'gantt' && <GanttChart projects={projects} />}
        {view === 'portfolio' && <Portfolio projects={projects} />}
      </div>
    </div>
  );
}
