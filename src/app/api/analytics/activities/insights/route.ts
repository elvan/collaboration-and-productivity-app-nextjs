import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { startOfHour, format, parseISO } from 'date-fns';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Get activities from the last 30 days
    const activities = await prisma.activity.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Time distribution analysis
    const timeDistribution = new Array(24).fill(0).map((_, hour) => ({
      hour,
      count: activities.filter(
        (a) => new Date(a.createdAt).getHours() === hour
      ).length,
    }));

    // User correlation analysis
    const userActivities = new Map<string, Set<string>>();
    activities.forEach((activity) => {
      if (!userActivities.has(activity.userId)) {
        userActivities.set(activity.userId, new Set());
      }
      userActivities.get(activity.userId)!.add(activity.id);
    });

    const userCorrelations = [];
    const users = Array.from(userActivities.keys());
    for (let i = 0; i < users.length; i++) {
      for (let j = i + 1; j < users.length; j++) {
        const user1Activities = userActivities.get(users[i])!;
        const user2Activities = userActivities.get(users[j])!;
        const commonActivities = new Set(
          [...user1Activities].filter((x) => user2Activities.has(x))
        );
        const correlation =
          (commonActivities.size /
            Math.sqrt(user1Activities.size * user2Activities.size)) *
          100;

        if (correlation > 0) {
          userCorrelations.push({
            user1: activities.find((a) => a.userId === users[i])?.user.name || users[i],
            user2: activities.find((a) => a.userId === users[j])?.user.name || users[j],
            correlation: Math.round(correlation * 100) / 100,
            activities: commonActivities.size,
          });
        }
      }
    }

    // Activity pattern analysis
    const patterns = new Map<string, { sequence: string[]; count: number }>();
    for (let i = 0; i < activities.length - 2; i++) {
      const sequence = activities.slice(i, i + 3).map((a) => a.type);
      const key = sequence.join('-');
      if (!patterns.has(key)) {
        patterns.set(key, { sequence, count: 0 });
      }
      patterns.get(key)!.count++;
    }

    const activityPatterns = Array.from(patterns.entries())
      .map(([type, { sequence, count }]) => ({
        type,
        sequence,
        frequency: count,
      }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10);

    // Peak times analysis
    const activityByDayHour = new Map<string, number>();
    activities.forEach((activity) => {
      const date = new Date(activity.createdAt);
      const day = format(date, 'EEEE');
      const hour = date.getHours();
      const key = `${day}-${hour}`;
      activityByDayHour.set(key, (activityByDayHour.get(key) || 0) + 1);
    });

    const peakTimes = Array.from(activityByDayHour.entries())
      .map(([key, count]) => {
        const [day, hour] = key.split('-');
        return {
          day,
          hour: parseInt(hour),
          intensity: count,
        };
      })
      .sort((a, b) => b.intensity - a.intensity)
      .slice(0, 10);

    return new NextResponse(
      JSON.stringify({
        timeDistribution,
        userCorrelations,
        activityPatterns,
        peakTimes,
      })
    );
  } catch (error) {
    console.error('[ACTIVITY_INSIGHTS_ERROR]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
