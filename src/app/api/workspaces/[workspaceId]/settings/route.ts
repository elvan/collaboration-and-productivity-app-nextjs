import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function PUT(
  request: Request,
  { params }: { params: { workspaceId: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    const { name, description, settings } = body;

    // Verify workspace ownership/admin rights
    const workspace = await prisma.workspace.findFirst({
      where: {
        id: params.workspaceId,
        members: {
          some: {
            userId: session.user.id,
            role: 'admin',
          },
        },
      },
    });

    if (!workspace) {
      return new NextResponse('Unauthorized or workspace not found', {
        status: 404,
      });
    }

    // Update workspace settings
    const updatedWorkspace = await prisma.workspace.update({
      where: {
        id: params.workspaceId,
      },
      data: {
        name: name || undefined,
        description: description || undefined,
        settings: settings ? JSON.stringify(settings) : undefined,
        updatedAt: new Date(),
      },
    });

    revalidatePath(`/workspaces/${params.workspaceId}`);

    return NextResponse.json(updatedWorkspace);
  } catch (error) {
    console.error('[WORKSPACE_SETTINGS_UPDATE]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

export async function GET(
  request: Request,
  { params }: { params: { workspaceId: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const workspace = await prisma.workspace.findFirst({
      where: {
        id: params.workspaceId,
        members: {
          some: {
            userId: session.user.id,
          },
        },
      },
      include: {
        members: {
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
        },
      },
    });

    if (!workspace) {
      return new NextResponse('Workspace not found', { status: 404 });
    }

    return NextResponse.json(workspace);
  } catch (error) {
    console.error('[WORKSPACE_SETTINGS_GET]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}
