import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: { taskId: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const taskId = params.taskId;
    const userId = session.user.id;
    const { duration } = await request.json();

    // Update the time tracking entry
    const timeTracking = await prisma.timeTracking.updateMany({
      where: {
        taskId,
        userId,
        status: 'IN_PROGRESS',
      },
      data: {
        endTime: new Date(),
        duration,
        status: 'COMPLETED',
      },
    });

    // Update total time spent on the task
    await prisma.task.update({
      where: { id: taskId },
      data: {
        timeSpent: {
          increment: duration,
        },
      },
    });

    return NextResponse.json(timeTracking);
  } catch (error) {
    console.error('[TIME_TRACKING_STOP]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
