import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"

const reorderSchema = z.object({
  type: z.enum(["FOLDER", "PROJECT"]),
  itemId: z.string(),
  sourceIndex: z.number(),
  destinationIndex: z.number(),
  sourceFolderId: z.string(),
  destinationFolderId: z.string(),
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
    const body = reorderSchema.parse(json);

    if (body.type === 'FOLDER') {
      // Reorder folders
      const folders = await prisma.projectFolder.findMany({
        where: {
          workspaceId: params.workspaceId,
          parentId: body.sourceFolderId === 'root' ? null : body.sourceFolderId,
        },
        orderBy: {
          position: 'asc',
        },
      });

      // Calculate new position
      const positions = folders.map((f) => f.position);
      let newPosition: number;

      if (body.destinationIndex === 0) {
        newPosition = positions[0] - 1000;
      } else if (body.destinationIndex === positions.length) {
        newPosition = positions[positions.length - 1] + 1000;
      } else {
        newPosition =
          (positions[body.destinationIndex - 1] +
            positions[body.destinationIndex]) /
          2;
      }

      await prisma.projectFolder.update({
        where: {
          id: body.itemId,
        },
        data: {
          position: newPosition,
          parentId:
            body.destinationFolderId === 'root'
              ? null
              : body.destinationFolderId,
        },
      });
    } else {
      // Reorder projects
      const projects = await prisma.project.findMany({
        where: {
          workspaceId: params.workspaceId,
          folderId:
            body.sourceFolderId === 'unorganized' ? null : body.sourceFolderId,
        },
        orderBy: {
          position: 'asc',
        },
      });

      // Calculate new position
      const positions = projects.map((p) => p.position);
      let newPosition: number;

      if (body.destinationIndex === 0) {
        newPosition = positions[0] - 1000;
      } else if (body.destinationIndex === positions.length) {
        newPosition = positions[positions.length - 1] + 1000;
      } else {
        newPosition =
          (positions[body.destinationIndex - 1] +
            positions[body.destinationIndex]) /
          2;
      }

      await prisma.project.update({
        where: {
          id: body.itemId,
        },
        data: {
          position: newPosition,
          folderId:
            body.destinationFolderId === 'unorganized'
              ? null
              : body.destinationFolderId,
        },
      });
    }

    return new NextResponse(null, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.errors), { status: 422 });
    }

    return new NextResponse(null, { status: 500 });
  }
}
