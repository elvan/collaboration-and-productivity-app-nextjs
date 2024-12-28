import { Task } from "@prisma/client";

interface CustomField {
  id: string;
  name: string;
  type: string;
  value: any;
}

interface Relationship {
  id: string;
  type: string;
  targetId: string;
}

interface CreateTaskDTO {
  title: string;
  description?: string;
  status: string;
  priority: string;
  dueDate?: string;
  assigneeId?: string;
  customFields?: Record<string, any>;
  relationships?: Relationship[];
}

export const taskService = {
  async createTask(projectId: string, data: CreateTaskDTO): Promise<Task> {
    const response = await fetch(`/api/projects/${projectId}/tasks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error("Failed to create task");
    }

    return response.json();
  },

  async getTasks(projectId: string, filters?: {
    status?: string;
    priority?: string;
    assigneeId?: string;
    customFields?: Record<string, any>;
  }): Promise<Task[]> {
    const searchParams = new URLSearchParams();
    if (filters?.status) searchParams.append("status", filters.status);
    if (filters?.priority) searchParams.append("priority", filters.priority);
    if (filters?.assigneeId) searchParams.append("assigneeId", filters.assigneeId);
    if (filters?.customFields) {
      searchParams.append("customFields", JSON.stringify(filters.customFields));
    }

    const response = await fetch(
      `/api/projects/${projectId}/tasks?${searchParams.toString()}`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch tasks");
    }

    return response.json();
  },

  async updateTask(projectId: string, taskId: string, data: Partial<CreateTaskDTO>): Promise<Task> {
    const response = await fetch(`/api/projects/${projectId}/tasks/${taskId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error("Failed to update task");
    }

    return response.json();
  },

  async deleteTask(projectId: string, taskId: string): Promise<void> {
    const response = await fetch(`/api/projects/${projectId}/tasks/${taskId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Failed to delete task");
    }
  },

  async getTaskCustomFields(projectId: string): Promise<CustomField[]> {
    const response = await fetch(`/api/projects/${projectId}/custom-fields`);

    if (!response.ok) {
      throw new Error("Failed to fetch custom fields");
    }

    return response.json();
  },

  async getTaskCustomFieldValues(taskId: string): Promise<any[]> {
    const response = await fetch(`/api/tasks/${taskId}/custom-field-values`);

    if (!response.ok) {
      throw new Error("Failed to fetch custom field values");
    }

    return response.json();
  },
};
