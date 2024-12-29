import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"

const updateWorkspaceSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  settings: z.object({
    features: z.object({
      timeTracking: z.boolean(),
      sprints: z.boolean(),
      customFields: z.boolean(),
      automations: z.boolean(),
    }),
    notifications: z.object({
      email: z.boolean(),
      desktop: z.boolean(),
      mobile: z.boolean(),
    }),
  }),
})

export async function PATCH(
  req: Request,
  { params }: { params: { workspaceId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const workspace = await prisma.workspace.findFirst({
      where: {
        id: params.workspaceId,
        workspaceMembers: {
          some: {
            userId: session.user.id,
            role: {
              name: 'Admin',
            },
          },
        },
      },
    });

    if (!workspace) {
      return new NextResponse('Not found', { status: 404 });
    }

    const json = await req.json();
    const body = updateWorkspaceSchema.parse(json);

    const updatedWorkspace = await prisma.workspace.update({
      where: {
        id: params.workspaceId,
      },
      data: {
        name: body.name,
        description: body.description,
        settings: body.settings,
      },
    });

    return NextResponse.json(updatedWorkspace);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.errors), { status: 422 });
    }

    return new NextResponse(null, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const workspace = await prisma.workspace.findFirst({
      where: {
        id: params.id,
        workspaceMembers: {
          some: {
            userId: session.user.id,
            role: {
              name: "Admin",
            },
          },
        },
      },
    })

    if (!workspace) {
      return new NextResponse("Not found", { status: 404 })
    }

    await prisma.workspace.update({
      where: {
        id: params.id,
      },
      data: {
        isArchived: true,
      },
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    return new NextResponse(null, { status: 500 })
  }
}
