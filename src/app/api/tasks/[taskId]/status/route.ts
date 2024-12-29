import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

export async function PATCH(
  request: Request,
  { params }: { params: { taskId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { taskId } = params
    const { status } = await request.json()

    // Validate status
    const validStatuses = ['todo', 'in_progress', 'review', 'done']
    if (!validStatuses.includes(status)) {
      return new NextResponse('Invalid status', { status: 400 })
    }

    // Check if user has access to the task
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: {
          include: {
            owner: true,
            members: true,
          },
        },
      },
    })

    if (!task) {
      return new NextResponse('Task not found', { status: 404 })
    }

    // Check if user is project owner or member
    const isAuthorized =
      task.project.ownerId === session.user.id ||
      task.project.members.some((member) => member.id === session.user.id)

    if (!isAuthorized) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Update task status
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: { status },
    })

    return NextResponse.json(updatedTask)
  } catch (error) {
    console.error('[TASK_STATUS_UPDATE]', error)
    return new NextResponse('Internal error', { status: 500 })
  }
}
