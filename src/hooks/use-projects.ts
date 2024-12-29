import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { projectService } from '@/services/project';
import { Project, ProjectTask } from '@/types/project';
import { toast } from 'sonner';

export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: () => projectService.getProjects(),
  });
}

export function useProject(id: string) {
  return useQuery({
    queryKey: ['projects', id],
    queryFn: () => projectService.getProject(id),
    enabled: !!id,
  });
}

export function useProjectTasks(projectId: string) {
  return useQuery({
    queryKey: ['projects', projectId, 'tasks'],
    queryFn: () => projectService.getTasks(projectId),
    enabled: !!projectId,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<Project>) => projectService.createProject(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create project');
      console.error('Create project error:', error);
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Project> }) =>
      projectService.updateProject(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['projects', id] });
      toast.success('Project updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update project');
      console.error('Update project error:', error);
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => projectService.deleteProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete project');
      console.error('Delete project error:', error);
    },
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, data }: { projectId: string; data: Partial<ProjectTask> }) =>
      projectService.createTask(projectId, data),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'tasks'] });
      toast.success('Task created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create task');
      console.error('Create task error:', error);
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      projectId,
      taskId,
      data,
    }: {
      projectId: string;
      taskId: string;
      data: Partial<ProjectTask>;
    }) => projectService.updateTask(projectId, taskId, data),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'tasks'] });
      toast.success('Task updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update task');
      console.error('Update task error:', error);
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, taskId }: { projectId: string; taskId: string }) =>
      projectService.deleteTask(projectId, taskId),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'tasks'] });
      toast.success('Task deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete task');
      console.error('Delete task error:', error);
    },
  });
}
