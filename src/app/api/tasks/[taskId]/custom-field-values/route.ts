import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const routeContextSchema = z.object({
  params: z.object({
    taskId: z.string(),
  }),
});

export async function GET(
  req: Request,
  context: { params: { taskId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { params } = routeContextSchema.parse(context);

    // Get task to check project membership
    const task = await prisma.task.findUnique({
      where: { id: params.taskId },
      include: {
        project: {
          include: {
            members: {
              where: {
                userId: session.user.id,
              },
            },
          },
        },
      },
    });

    if (!task || !task.project.members.length) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get custom field values for the task
    const customFieldValues = await prisma.taskCustomFieldValue.findMany({
      where: {
        taskId: params.taskId,
      },
      include: {
        customField: {
          include: {
            options: true,
          },
        },
      },
    });

    return NextResponse.json(customFieldValues);
  } catch (error) {
    console.error("[CUSTOM_FIELD_VALUES_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
