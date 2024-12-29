import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"

const createFolderSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  parentId: z.string().optional(),
})

export async function POST(
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
    const body = createFolderSchema.parse(json);

    // Get the highest position for sibling folders
    const lastFolder = await prisma.projectFolder.findFirst({
      where: {
        workspaceId: params.workspaceId,
        parentId: body.parentId,
      },
      orderBy: {
        position: 'desc',
      },
    });

    const position = lastFolder ? lastFolder.position + 1000 : 0;

    const folder = await prisma.projectFolder.create({
      data: {
        name: body.name,
        description: body.description,
        workspaceId: params.workspaceId,
        parentId: body.parentId,
        position,
      },
    });

    return NextResponse.json(folder);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.errors), { status: 422 });
    }

    return new NextResponse(null, { status: 500 });
  }
}
