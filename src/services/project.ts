import { Project, ProjectTask } from '@/types/project';

const API_BASE = '/api/projects';

export const projectService = {
  async getProjects(): Promise<Project[]> {
    const response = await fetch(API_BASE);
    if (!response.ok) {
      throw new Error('Failed to fetch projects');
    }
    return response.json();
  },

  async getProject(id: string): Promise<Project> {
    const response = await fetch(`${API_BASE}/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch project');
    }
    return response.json();
  },

  async createProject(data: Partial<Project>): Promise<Project> {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('Failed to create project');
    }
    return response.json();
  },

  async updateProject(id: string, data: Partial<Project>): Promise<Project> {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('Failed to update project');
    }
    return response.json();
  },

  async deleteProject(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete project');
    }
  },

  async getTasks(projectId: string): Promise<ProjectTask[]> {
    const response = await fetch(`${API_BASE}/${projectId}/tasks`);
    if (!response.ok) {
      throw new Error('Failed to fetch tasks');
    }
    return response.json();
  },

  async createTask(projectId: string, data: Partial<ProjectTask>): Promise<ProjectTask> {
    const response = await fetch(`${API_BASE}/${projectId}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('Failed to create task');
    }
    return response.json();
  },

  async updateTask(projectId: string, taskId: string, data: Partial<ProjectTask>): Promise<ProjectTask> {
    const response = await fetch(`${API_BASE}/${projectId}/tasks/${taskId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('Failed to update task');
    }
    return response.json();
  },

  async deleteTask(projectId: string, taskId: string): Promise<void> {
    const response = await fetch(`${API_BASE}/${projectId}/tasks/${taskId}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete task');
    }
  },
};
