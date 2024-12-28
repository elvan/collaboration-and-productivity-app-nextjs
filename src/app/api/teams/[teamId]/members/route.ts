import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function POST(
  request: Request,
  { params }: { params: { teamId: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    const { email, role } = body;

    // Verify team admin rights
    const team = await prisma.team.findFirst({
      where: {
        id: params.teamId,
        members: {
          some: {
            userId: session.user.id,
            role: 'admin',
          },
        },
      },
    });

    if (!team) {
      return new NextResponse('Unauthorized or team not found', {
        status: 404,
      });
    }

    // Check if user exists
    const userToInvite = await prisma.user.findUnique({
      where: { email },
    });

    if (!userToInvite) {
      // Create invitation for non-existing user
      const invitation = await prisma.teamInvitation.create({
        data: {
          teamId: params.teamId,
          email,
          role,
          invitedById: session.user.id,
          status: 'pending',
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
      });

      // Send invitation email (implement email service integration)
      // await sendInvitationEmail(invitation);

      return NextResponse.json(invitation);
    }

    // Add existing user to team
    const teamMember = await prisma.teamMember.create({
      data: {
        teamId: params.teamId,
        userId: userToInvite.id,
        role,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    revalidatePath(`/teams/${params.teamId}`);

    return NextResponse.json(teamMember);
  } catch (error) {
    console.error('[TEAM_MEMBER_INVITE]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { teamId: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    const { memberId, role } = body;

    // Verify team admin rights
    const team = await prisma.team.findFirst({
      where: {
        id: params.teamId,
        members: {
          some: {
            userId: session.user.id,
            role: 'admin',
          },
        },
      },
    });

    if (!team) {
      return new NextResponse('Unauthorized or team not found', {
        status: 404,
      });
    }

    // Update member role
    const updatedMember = await prisma.teamMember.update({
      where: {
        id: memberId,
        teamId: params.teamId,
      },
      data: { role },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    revalidatePath(`/teams/${params.teamId}`);

    return NextResponse.json(updatedMember);
  } catch (error) {
    console.error('[TEAM_MEMBER_UPDATE]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { teamId: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get('memberId');

    if (!memberId) {
      return new NextResponse('Member ID required', { status: 400 });
    }

    // Verify team admin rights
    const team = await prisma.team.findFirst({
      where: {
        id: params.teamId,
        members: {
          some: {
            userId: session.user.id,
            role: 'admin',
          },
        },
      },
    });

    if (!team) {
      return new NextResponse('Unauthorized or team not found', {
        status: 404,
      });
    }

    // Remove team member
    await prisma.teamMember.delete({
      where: {
        id: memberId,
        teamId: params.teamId,
      },
    });

    revalidatePath(`/teams/${params.teamId}`);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('[TEAM_MEMBER_DELETE]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}
