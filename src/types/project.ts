import { Activity, CustomField, CustomFieldValue, Label, Task, TaskPriority, TaskStatus, TaskType, User } from "@prisma/client"

export interface ProjectMember {
  id: string
  role: string
  joinedAt: Date
  user: {
    id: string
    name: string
    email: string
    image: string
  }
}

export interface ProjectTask extends Task {
  assignees: {
    user: {
      id: string
      name: string
      image: string
    }
  }[]
  taskStatus?: TaskStatus | null
  taskPriority?: TaskPriority | null
  taskType?: TaskType | null
  labels: Label[]
  customFields: CustomField[]
  customValues: CustomFieldValue[]
}

export interface ProjectActivity extends Activity {
  user: {
    name: string
    email: string
    image: string
  }
}

export interface Project {
  id: string
  name: string
  description: string | null
  workspaceId: string
  ownerId: string
  status: string
  createdAt: Date
  updatedAt: Date
  owner: {
    name: string
    email: string
    image: string
  }
  workspace: {
    name: string
  }
  tasks: ProjectTask[]
  members: ProjectMember[]
  activities: ProjectActivity[]
}
