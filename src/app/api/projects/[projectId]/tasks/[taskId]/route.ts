import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const routeContextSchema = z.object({
  params: z.object({
    projectId: z.string(),
    taskId: z.string(),
  }),
});

const taskUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  dueDate: z.string().optional(),
  assigneeId: z.string().optional(),
  customFields: z.record(z.any()).optional(),
});

export async function PATCH(
  req: Request,
  context: { params: { projectId: string; taskId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { params } = routeContextSchema.parse(context);

    // Check if user is a member of the project
    const projectMember = await prisma.projectMember.findFirst({
      where: {
        projectId: params.projectId,
        userId: session.user.id,
      },
    });

    if (!projectMember) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const json = await req.json();
    const body = taskUpdateSchema.parse(json);

    // Update task with activity log
    const updatedTask = await prisma.$transaction(async (tx) => {
      const task = await tx.task.update({
        where: { id: params.taskId },
        data: {
          title: body.title,
          description: body.description,
          status: body.status,
          priority: body.priority,
          dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
          assigneeId: body.assigneeId,
          customFields: body.customFields,
        },
      });

      // Create activity log
      await tx.activity.create({
        data: {
          type: "task_updated",
          projectId: params.projectId,
          taskId: task.id,
          userId: session.user.id,
          metadata: {
            taskTitle: task.title,
            changes: body,
          },
        },
      });

      return task;
    });

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error("[TASK_UPDATE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  context: { params: { projectId: string; taskId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { params } = routeContextSchema.parse(context);

    // Check if user is a member of the project
    const projectMember = await prisma.projectMember.findFirst({
      where: {
        projectId: params.projectId,
        userId: session.user.id,
      },
    });

    if (!projectMember) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Delete task with activity log
    await prisma.$transaction(async (tx) => {
      const task = await tx.task.findUnique({
        where: { id: params.taskId },
      });

      if (!task) {
        throw new Error("Task not found");
      }

      // Delete task relationships
      await tx.taskRelationship.deleteMany({
        where: {
          OR: [
            { taskId: params.taskId },
            { targetTaskId: params.taskId },
          ],
        },
      });

      // Delete task custom field values
      await tx.taskCustomFieldValue.deleteMany({
        where: { taskId: params.taskId },
      });

      // Delete task comments
      await tx.comment.deleteMany({
        where: { taskId: params.taskId },
      });

      // Delete task attachments
      await tx.attachment.deleteMany({
        where: { taskId: params.taskId },
      });

      // Delete the task
      await tx.task.delete({
        where: { id: params.taskId },
      });

      // Create activity log
      await tx.activity.create({
        data: {
          type: "task_deleted",
          projectId: params.projectId,
          userId: session.user.id,
          metadata: {
            taskTitle: task.title,
          },
        },
      });
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[TASK_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
