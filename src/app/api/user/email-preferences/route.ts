import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const preferences = await prisma.emailPreference.findMany({
      where: {
        userId: session.user.id,
      },
    });

    // Return default preferences if none exist
    if (preferences.length === 0) {
      const defaultPreferences = [
        {
          type: 'team_invitation',
          enabled: true,
          description: 'Receive emails when you are invited to join a team',
        },
        {
          type: 'team_updates',
          enabled: true,
          description: 'Receive emails about important team changes',
        },
        {
          type: 'member_activities',
          enabled: true,
          description: 'Receive emails about team member activities',
        },
        {
          type: 'daily_digest',
          enabled: false,
          description: 'Receive daily digest of team activities',
        },
        {
          type: 'weekly_summary',
          enabled: false,
          description: 'Receive weekly summary of team activities',
        },
      ];

      // Create default preferences
      await prisma.emailPreference.createMany({
        data: defaultPreferences.map((pref) => ({
          userId: session.user.id,
          type: pref.type,
          enabled: pref.enabled,
          description: pref.description,
        })),
      });

      return NextResponse.json(defaultPreferences);
    }

    return NextResponse.json(preferences);
  } catch (error) {
    console.error('[EMAIL_PREFERENCES_GET]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    const { type, enabled } = body;

    const preference = await prisma.emailPreference.upsert({
      where: {
        userId_type: {
          userId: session.user.id,
          type,
        },
      },
      update: {
        enabled,
      },
      create: {
        userId: session.user.id,
        type,
        enabled,
      },
    });

    return NextResponse.json(preference);
  } catch (error) {
    console.error('[EMAIL_PREFERENCES_UPDATE]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}
