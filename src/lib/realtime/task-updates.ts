import { Server as SocketIOServer } from 'socket.io'
import { Server as HTTPServer } from 'http'
import { Server as HTTPSServer } from 'https'
import { getSession } from 'next-auth/react'
import { prisma } from '@/lib/prisma'

export const EVENTS = {
  TASK_CREATED: 'task:created',
  TASK_UPDATED: 'task:updated',
  TASK_DELETED: 'task:deleted',
  TASK_COMMENT_ADDED: 'task:comment:added',
  TASK_COMMENT_UPDATED: 'task:comment:updated',
  TASK_COMMENT_DELETED: 'task:comment:deleted',
  TASK_ATTACHMENT_ADDED: 'task:attachment:added',
  TASK_ATTACHMENT_DELETED: 'task:attachment:deleted',
  TASK_DEPENDENCY_ADDED: 'task:dependency:added',
  TASK_DEPENDENCY_REMOVED: 'task:dependency:removed',
}

export class TaskRealtimeService {
  private io: SocketIOServer

  constructor(server: HTTPServer | HTTPSServer) {
    this.io = new SocketIOServer(server, {
      path: '/api/realtime',
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL,
        methods: ['GET', 'POST'],
      },
    })

    this.io.use(async (socket, next) => {
      const session = await getSession({ req: socket.request })
      if (!session?.user) {
        next(new Error('Unauthorized'))
        return
      }
      socket.data.userId = session.user.id
      next()
    })

    this.setupEventHandlers()
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`User connected: ${socket.data.userId}`)

      // Join project rooms for real-time updates
      socket.on('join:project', async (projectId: string) => {
        const project = await prisma.project.findFirst({
          where: {
            id: projectId,
            members: {
              some: {
                id: socket.data.userId,
              },
            },
          },
        })

        if (project) {
          socket.join(`project:${projectId}`)
          console.log(`User ${socket.data.userId} joined project ${projectId}`)
        }
      })

      socket.on('leave:project', (projectId: string) => {
        socket.leave(`project:${projectId}`)
        console.log(`User ${socket.data.userId} left project ${projectId}`)
      })

      socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.data.userId}`)
      })
    })
  }

  // Emit events to project members
  public emitToProject(projectId: string, event: string, data: any) {
    this.io.to(`project:${projectId}`).emit(event, data)
  }

  // Task events
  public emitTaskCreated(projectId: string, task: any) {
    this.emitToProject(projectId, EVENTS.TASK_CREATED, task)
  }

  public emitTaskUpdated(projectId: string, task: any) {
    this.emitToProject(projectId, EVENTS.TASK_UPDATED, task)
  }

  public emitTaskDeleted(projectId: string, taskId: string) {
    this.emitToProject(projectId, EVENTS.TASK_DELETED, { taskId })
  }

  // Comment events
  public emitCommentAdded(projectId: string, comment: any) {
    this.emitToProject(projectId, EVENTS.TASK_COMMENT_ADDED, comment)
  }

  public emitCommentUpdated(projectId: string, comment: any) {
    this.emitToProject(projectId, EVENTS.TASK_COMMENT_UPDATED, comment)
  }

  public emitCommentDeleted(projectId: string, commentId: string) {
    this.emitToProject(projectId, EVENTS.TASK_COMMENT_DELETED, { commentId })
  }

  // Attachment events
  public emitAttachmentAdded(projectId: string, attachment: any) {
    this.emitToProject(projectId, EVENTS.TASK_ATTACHMENT_ADDED, attachment)
  }

  public emitAttachmentDeleted(projectId: string, attachmentId: string) {
    this.emitToProject(projectId, EVENTS.TASK_ATTACHMENT_DELETED, { attachmentId })
  }

  // Dependency events
  public emitDependencyAdded(projectId: string, dependency: any) {
    this.emitToProject(projectId, EVENTS.TASK_DEPENDENCY_ADDED, dependency)
  }

  public emitDependencyRemoved(projectId: string, dependencyId: string) {
    this.emitToProject(projectId, EVENTS.TASK_DEPENDENCY_REMOVED, { dependencyId })
  }
}

let taskRealtimeService: TaskRealtimeService | null = null

export function initializeTaskRealtime(server: HTTPServer | HTTPSServer) {
  if (!taskRealtimeService) {
    taskRealtimeService = new TaskRealtimeService(server)
  }
  return taskRealtimeService
}

export function getTaskRealtimeService() {
  if (!taskRealtimeService) {
    throw new Error('Task realtime service not initialized')
  }
  return taskRealtimeService
}
