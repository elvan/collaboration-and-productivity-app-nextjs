import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import * as z from "zod"
import { prisma } from "@/lib/prisma"

const viewUpdateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  viewType: z.string(),
  defaultGroupBy: z.string().optional(),
  defaultSortBy: z.string().optional(),
  visibleColumns: z.array(z.string()),
  filters: z.array(
    z.object({
      field: z.string(),
      operator: z.string(),
      value: z.string(),
    })
  ),
  autoRefresh: z.boolean(),
  refreshInterval: z.number().min(5).optional(),
})

export async function PATCH(
  req: Request,
  { params }: { params: { viewId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const json = await req.json()
    const body = viewUpdateSchema.parse(json)

    const view = await prisma.taskList.update({
      where: {
        id: params.viewId,
      },
      data: {
        name: body.name,
        description: body.description,
        viewType: body.viewType,
        viewSettings: JSON.stringify({
          defaultGroupBy: body.defaultGroupBy,
          defaultSortBy: body.defaultSortBy,
          visibleColumns: body.visibleColumns,
          filters: body.filters,
          autoRefresh: body.autoRefresh,
          refreshInterval: body.refreshInterval,
        }),
      },
    })

    return NextResponse.json(view)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.issues), { status: 422 })
    }

    return new NextResponse(null, { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { viewId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    await prisma.taskList.delete({
      where: {
        id: params.viewId,
      },
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    return new NextResponse(null, { status: 500 })
  }
}
