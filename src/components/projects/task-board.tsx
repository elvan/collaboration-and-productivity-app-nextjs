'use client';

import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
}

interface Column {
  id: string;
  title: string;
  tasks: Task[];
}

const initialColumns: Column[] = [
  {
    id: 'todo',
    title: 'To Do',
    tasks: [
      { id: '1', title: 'Research competitors', priority: 'high' },
      { id: '2', title: 'Design mockups', priority: 'medium' },
    ],
  },
  {
    id: 'in-progress',
    title: 'In Progress',
    tasks: [{ id: '3', title: 'Implement authentication', priority: 'high' }],
  },
  {
    id: 'done',
    title: 'Done',
    tasks: [{ id: '4', title: 'Project setup', priority: 'medium' }],
  },
];

export function TaskBoard() {
  const [columns, setColumns] = useState(initialColumns);

  const onDragEnd = (result: any) => {
    const { source, destination } = result;

    // Dropped outside the list
    if (!destination) {
      return;
    }

    // If the task was dropped in the same column
    if (source.droppableId === destination.droppableId) {
      const column = columns.find((col) => col.id === source.droppableId);
      if (!column) return;

      const newTasks = Array.from(column.tasks);
      const [removed] = newTasks.splice(source.index, 1);
      newTasks.splice(destination.index, 0, removed);

      const newColumns = columns.map((col) =>
        col.id === source.droppableId ? { ...col, tasks: newTasks } : col
      );

      setColumns(newColumns);
    } else {
      // If the task was dropped in a different column
      const sourceColumn = columns.find((col) => col.id === source.droppableId);
      const destColumn = columns.find(
        (col) => col.id === destination.droppableId
      );
      if (!sourceColumn || !destColumn) return;

      const sourceTasks = Array.from(sourceColumn.tasks);
      const destTasks = Array.from(destColumn.tasks);
      const [removed] = sourceTasks.splice(source.index, 1);
      destTasks.splice(destination.index, 0, removed);

      const newColumns = columns.map((col) => {
        if (col.id === source.droppableId) {
          return { ...col, tasks: sourceTasks };
        }
        if (col.id === destination.droppableId) {
          return { ...col, tasks: destTasks };
        }
        return col;
      });

      setColumns(newColumns);
    }
  };

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
            <div key={column.id} className='bg-secondary/20 rounded-lg p-4'>
              <h3 className='font-semibold mb-4'>{column.title}</h3>
              <Droppable droppableId={column.id}>
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className='space-y-2 min-h-[200px]'
                  >
                    {column.tasks.map((task, index) => (
                      <Draggable
                        key={task.id}
                        draggableId={task.id}
                        index={index}
                      >
                        {(provided) => (
                          <Card
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className='p-4 cursor-pointer hover:shadow-md transition-shadow'
                          >
                            <div className='flex items-start justify-between'>
                              <div>
                                <h4 className='font-medium'>{task.title}</h4>
                                {task.description && (
                                  <p className='text-sm text-muted-foreground mt-1'>
                                    {task.description}
                                  </p>
                                )}
                              </div>
                              {task.priority && (
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
                              )}
                            </div>
                          </Card>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}
