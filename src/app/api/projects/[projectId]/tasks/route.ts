import { getServerSession } from "next-auth"
import { NextResponse } from "next/server"
import { z } from "zod"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const routeContextSchema = z.object({
  params: z.object({
    projectId: z.string(),
  }),
})

const taskCreateSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  status: z.string(),
  priority: z.string(),
  dueDate: z.string().optional(),
  assigneeId: z.string().optional(),
  customFields: z.record(z.any()).optional(),
  relationships: z.array(z.object({
    id: z.string(),
    type: z.string(),
    targetId: z.string(),
  })).optional(),
})

export async function POST(
  req: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const projectId = params.projectId;

    // Check if user is a member of the project
    const projectMember = await prisma.projectMember.findFirst({
      where: {
        projectId: projectId,
        userId: session.user.id,
      },
    });

    if (!projectMember) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const json = await req.json();
    const body = taskCreateSchema.parse(json);

    // Create task with activity log and relationships
    const task = await prisma.$transaction(async (tx) => {
      // Create the task
      const task = await tx.task.create({
        data: {
          title: body.title,
          description: body.description,
          status: body.status,
          priority: body.priority,
          dueDate: body.dueDate ? new Date(body.dueDate) : null,
          assigneeId: body.assigneeId,
          projectId: projectId,
          createdById: session.user.id,
          customFields: body.customFields || {},
        },
      });

      // Create relationships if provided
      if (body.relationships?.length) {
        await Promise.all(
          body.relationships.map((rel) =>
            tx.taskRelationship.create({
              data: {
                taskId: task.id,
                type: rel.type,
                targetTaskId: rel.targetId,
              },
            })
          )
        );
      }

      // Create activity log
      await tx.activity.create({
        data: {
          type: "task_created",
          projectId: projectId,
          taskId: task.id,
          userId: session.user.id,
          metadata: {
            taskTitle: task.title,
            assigneeId: body.assigneeId,
            customFields: body.customFields,
            relationships: body.relationships,
          },
        },
      });

      // Create notification for assignee if assigned
      if (body.assigneeId && body.assigneeId !== session.user.id) {
        await tx.notification.create({
          data: {
            type: "task_assigned",
            category: "task",
            title: "New Task Assignment",
            message: `You have been assigned to task: ${task.title}`,
            userId: body.assigneeId,
            projectId: projectId,
            taskId: task.id,
            metadata: {
              assignedBy: session.user.id,
              taskTitle: task.title,
            },
          },
        });
      }

      return task;
    });

    return NextResponse.json(task);
  } catch (error) {
    console.error("[TASKS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
