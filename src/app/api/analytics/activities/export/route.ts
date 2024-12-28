import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { exportActivities } from '@/lib/activity/activity-export';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await req.json();
    const { format, dateRange, types } = body;

    if (!format || !['csv', 'excel', 'json'].includes(format)) {
      return new NextResponse('Invalid format specified', { status: 400 });
    }

    // Validate date range if provided
    if (dateRange) {
      const { from, to } = dateRange;
      if (!from || !to || new Date(from) > new Date(to)) {
        return new NextResponse('Invalid date range', { status: 400 });
      }
    }

    // Fetch activities
    const activities = await prisma.activity.findMany({
      where: {
        createdAt: dateRange
          ? {
              gte: new Date(dateRange.from),
              lte: new Date(dateRange.to),
            }
          : undefined,
        type: types?.length ? { in: types } : undefined,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    // Generate export file
    const { data, filename, mimeType } = await exportActivities(activities, {
      format,
      dateRange: dateRange
        ? {
            from: new Date(dateRange.from),
            to: new Date(dateRange.to),
          }
        : undefined,
      types,
      userId: session.user.id,
    });

    // Set appropriate headers
    const headers = new Headers();
    headers.set('Content-Disposition', `attachment; filename="${filename}"`);
    headers.set('Content-Type', mimeType);

    return new NextResponse(data, { headers });
  } catch (error) {
    console.error('[ACTIVITY_EXPORT_ERROR]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
