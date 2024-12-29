'use client';

import { Task, TaskStatus } from '@prisma/client';
import { useUpdateTask } from '@/hooks/use-projects';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import { TaskCard } from './task-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Project } from '@/types/project';

interface TaskWithRelations extends Task {
  assignees?: {
    user: {
      id: string;
      name: string | null;
      image: string | null;
    };
  }[];
  taskPriority?: {
    name: string;
    color: string;
  };
  taskStatus?: {
    name: string;
    color: string;
  };
  taskType?: {
    name: string;
    color: string;
  };
  labels?: {
    name: string;
    color: string;
  }[];
  customFields?: any[];
  customValues?: any[];
}

interface TaskBoardProps {
  project: Project;
  tasks: TaskWithRelations[] | null;
  isLoading?: boolean;
}

const COLUMNS = [
  { id: 'TODO' as const, title: 'To Do' },
  { id: 'IN_PROGRESS' as const, title: 'In Progress' },
  { id: 'IN_REVIEW' as const, title: 'In Review' },
  { id: 'DONE' as const, title: 'Done' },
];

export function TaskBoard({ project, tasks = [], isLoading }: TaskBoardProps) {
  const updateTask = useUpdateTask();

  const columns = COLUMNS.map(column => ({
    ...column,
    tasks: (tasks || []).filter(task => task.status === column.id)
  }));

  const onDragEnd = async (result: any) => {
    const { source, destination, draggableId } = result;

    if (!destination || !tasks) return;

    const task = tasks.find(t => t.id === draggableId);
    if (!task) return;

    // Update task status
    try {
      await updateTask.mutateAsync({
        projectId: project.id,
        taskId: draggableId,
        data: {
          status: destination.droppableId as TaskStatus
        }
      });
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-4">
            <Skeleton className="h-8 w-[120px]" />
            <Skeleton className="h-[200px] w-full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="grid gap-4 md:grid-cols-4">
        {columns.map(column => (
          <div key={column.id} className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{column.title}</h3>
              <span className="text-sm text-muted-foreground">
                {column.tasks.length}
              </span>
            </div>
            <Droppable droppableId={column.id}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`space-y-2 rounded-lg border bg-muted/50 p-2 min-h-[150px] ${
                    snapshot.isDraggingOver ? 'ring-2 ring-primary' : ''
                  }`}
                >
                  {column.tasks.map((task, index) => (
                    <TaskCard key={task.id} task={task} index={index} />
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>
    </DragDropContext>
  );
}
