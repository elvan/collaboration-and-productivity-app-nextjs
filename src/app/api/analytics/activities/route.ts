import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { startOfDay, subDays } from 'date-fns';

export async function GET(request: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '7d';
    const teamId = searchParams.get('teamId');
    const workspaceId = searchParams.get('workspaceId');

    // Calculate date range
    const days = timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 7;
    const startDate = startOfDay(subDays(new Date(), days));

    // Build where clause
    const where: any = {
      createdAt: {
        gte: startDate,
      },
    };

    if (teamId) where.teamId = teamId;
    if (workspaceId) where.workspaceId = workspaceId;

    // Get activities
    const activities = await prisma.activity.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Process time-based data
    const timeData = activities.reduce((acc: any[], activity) => {
      const date = activity.createdAt.toISOString().split('T')[0];
      const existingDate = acc.find((item) => item.date === date);
      
      if (existingDate) {
        existingDate.count += 1;
      } else {
        acc.push({ date, count: 1, type: activity.type });
      }
      
      return acc;
    }, []);

    // Calculate type distribution
    const typeDistribution = activities.reduce((acc: any, activity) => {
      const type = activity.type;
      const existing = acc.find((item: any) => item.type === type);
      
      if (existing) {
        existing.count += 1;
      } else {
        acc.push({ type, count: 1 });
      }
      
      return acc;
    }, []);

    // Calculate percentages
    const total = activities.length;
    typeDistribution.forEach((item: any) => {
      item.percentage = (item.count / total) * 100;
    });

    // Calculate user activity
    const userActivity = activities.reduce((acc: any, activity) => {
      const userId = activity.user.id;
      const existing = acc.find((item: any) => item.userId === userId);
      
      if (existing) {
        existing.activityCount += 1;
        if (new Date(activity.createdAt) > new Date(existing.lastActive)) {
          existing.lastActive = activity.createdAt;
        }
      } else {
        acc.push({
          userId,
          userName: activity.user.name,
          activityCount: 1,
          lastActive: activity.createdAt,
        });
      }
      
      return acc;
    }, []);

    // Sort user activity by count
    userActivity.sort((a: any, b: any) => b.activityCount - a.activityCount);

    // Calculate summary
    const summary = {
      totalActivities: total,
      averagePerDay: total / days,
      mostActiveType: typeDistribution.sort((a: any, b: any) => b.count - a.count)[0]?.type || '',
      mostActiveUser: userActivity[0]?.userName || '',
    };

    return NextResponse.json({
      timeData,
      typeDistribution,
      userActivity,
      summary,
    });
  } catch (error) {
    console.error('[ACTIVITY_ANALYTICS_ERROR]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}
