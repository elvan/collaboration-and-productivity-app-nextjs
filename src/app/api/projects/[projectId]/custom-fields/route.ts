import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const routeContextSchema = z.object({
  params: z.object({
    projectId: z.string(),
  }),
});

export async function GET(
  req: Request,
  context: { params: { projectId: string } }
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

    // Get project custom fields
    const customFields = await prisma.customField.findMany({
      where: {
        projectId: params.projectId,
      },
      include: {
        options: true,
      },
    });

    return NextResponse.json(customFields);
  } catch (error) {
    console.error("[CUSTOM_FIELDS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
