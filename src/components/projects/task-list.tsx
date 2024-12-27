'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, ChevronDown, ChevronRight } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  subtasks?: Task[];
}

const initialTasks: Task[] = [
  {
    id: '1',
    title: 'Project Planning',
    description: 'Create project roadmap and timeline',
    completed: false,
    priority: 'high',
    dueDate: '2024-02-15',
    subtasks: [
      {
        id: '1-1',
        title: 'Define project scope',
        completed: true,
        priority: 'medium',
      },
      {
        id: '1-2',
        title: 'Create timeline',
        completed: false,
        priority: 'high',
      },
    ],
  },
  {
    id: '2',
    title: 'Design System',
    description: 'Develop and document design system',
    completed: false,
    priority: 'medium',
    dueDate: '2024-03-01',
  },
];

function TaskItem({ task, level = 0 }: { task: Task; level?: number }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <Card className='p-4 mb-2'>
        <div className='flex items-start gap-4'>
          <div className='flex items-center gap-2'>
            <Checkbox checked={task.completed} />
            {task.subtasks && (
              <Button
                variant='ghost'
                size='sm'
                className='p-0 h-6 w-6'
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? (
                  <ChevronDown className='h-4 w-4' />
                ) : (
                  <ChevronRight className='h-4 w-4' />
                )}
              </Button>
            )}
          </div>

          <div className='flex-1'>
            <div className='flex items-start justify-between'>
              <div>
                <h4 className='font-medium'>{task.title}</h4>
                {task.description && (
                  <p className='text-sm text-muted-foreground mt-1'>
                    {task.description}
                  </p>
                )}
              </div>
              <div className='flex items-center gap-4'>
                {task.dueDate && (
                  <span className='text-sm text-muted-foreground'>
                    Due {new Date(task.dueDate).toLocaleDateString()}
                  </span>
                )}
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    task.priority === 'high'
                      ? 'bg-red-100 text-red-800'
                      : task.priority === 'medium'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                  }`}
                >
                  {task.priority}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {expanded && task.subtasks && (
        <div style={{ marginLeft: `${(level + 1) * 2}rem` }}>
          {task.subtasks.map((subtask) => (
            <TaskItem key={subtask.id} task={subtask} level={level + 1} />
          ))}
        </div>
      )}
    </>
  );
}

export function TaskList() {
  const [tasks] = useState(initialTasks);

  return (
    <div className='h-full'>
      <div className='mb-6 flex flex-col gap-4'>
        <div className='flex justify-between items-center'>
          <h2 className='text-2xl font-semibold'>Tasks</h2>
          <Button>
            <Plus className='mr-2 h-4 w-4' />
            Add Task
          </Button>
        </div>

        <div className='flex gap-4'>
          <Select defaultValue='all'>
            <SelectTrigger className='w-[180px]'>
              <SelectValue placeholder='Filter by Priority' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Priorities</SelectItem>
              <SelectItem value='high'>High Priority</SelectItem>
              <SelectItem value='medium'>Medium Priority</SelectItem>
              <SelectItem value='low'>Low Priority</SelectItem>
            </SelectContent>
          </Select>

          <Select defaultValue='all'>
            <SelectTrigger className='w-[180px]'>
              <SelectValue placeholder='Filter by Status' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Status</SelectItem>
              <SelectItem value='completed'>Completed</SelectItem>
              <SelectItem value='pending'>Pending</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className='space-y-2'>
        {tasks.map((task) => (
          <TaskItem key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
}
