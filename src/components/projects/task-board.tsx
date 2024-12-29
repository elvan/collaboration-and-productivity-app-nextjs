'use client';

import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Project, ProjectTask } from '@/types/project';
import { useUpdateTask } from '@/hooks/use-projects';
import { Skeleton } from '@/components/ui/skeleton';

interface TaskBoardProps {
  project: Project;
  tasks: ProjectTask[];
  isLoading?: boolean;
}

interface Column {
  id: TaskStatus;
  title: string;
  tasks: ProjectTask[];
}

const COLUMNS: Column[] = [
  {
    id: 'todo',
    title: 'To Do',
    tasks: [],
  },
  {
    id: 'in-progress',
    title: 'In Progress',
    tasks: [],
  },
  {
    id: 'done',
    title: 'Done',
    tasks: [],
  },
];

export function TaskBoard({ project, tasks, isLoading }: TaskBoardProps) {
  const updateTask = useUpdateTask();
  
  const columns = COLUMNS.map(column => ({
    ...column,
    tasks: tasks.filter(task => task.status === column.id)
  }));

  const onDragEnd = (result: any) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;

    const task = tasks.find(t => t.id === draggableId);
    if (!task) return;

    // Update task status
    updateTask.mutate({
      projectId: project.id,
      taskId: draggableId,
      data: {
        status: destination.droppableId as TaskStatus
      }
    });
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-4">
            <Skeleton className="h-6 w-24 mb-4" />
            <div className="space-y-2">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className='h-full'>
      <div className='mb-4 flex justify-between items-center'>
        <h2 className='text-2xl font-semibold'>Task Board</h2>
        <Button>
          <Plus className='mr-2 h-4 w-4' />
          Add Task
        </Button>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          {columns.map((column) => (
            <Card key={column.id} className='p-4'>
              <div className='mb-4'>
                <h3 className='font-semibold'>{column.title}</h3>
                <p className='text-sm text-gray-500'>
                  {column.tasks.length} tasks
                </p>
              </div>

              <Droppable droppableId={column.id}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className='space-y-2'
                  >
                    {column.tasks.map((task, index) => (
                      <Draggable
                        key={task.id}
                        draggableId={task.id}
                        index={index}
                      >
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                          >
                            <Card className='p-3'>
                              <h4 className='font-medium'>{task.title}</h4>
                              {task.description && (
                                <p className='text-sm text-gray-500 mt-1'>
                                  {task.description}
                                </p>
                              )}
                              {task.priority && (
                                <div className='mt-2'>
                                  <span
                                    className={`text-xs px-2 py-1 rounded-full ${
                                      task.priority === 'high'
                                        ? 'bg-red-100 text-red-700'
                                        : task.priority === 'medium'
                                        ? 'bg-yellow-100 text-yellow-700'
                                        : 'bg-green-100 text-green-700'
                                    }`}
                                  >
                                    {task.priority}
                                  </span>
                                </div>
                              )}
                            </Card>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </Card>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}
