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

    // Create a new time tracking entry
    const timeTracking = await prisma.timeTracking.create({
      data: {
        taskId,
        userId,
        startTime: new Date(),
        status: 'IN_PROGRESS',
      },
    });

    return NextResponse.json(timeTracking);
  } catch (error) {
    console.error('[TIME_TRACKING_START]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
