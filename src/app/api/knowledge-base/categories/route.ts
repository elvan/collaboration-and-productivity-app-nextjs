import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"

export async function GET() {
  try {
    const session = await getServerSession()
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: {
            articles: true,
          },
        },
      },
    })

    const formattedCategories = categories.map((category) => ({
      id: category.id,
      name: category.name,
      color: category.color,
      articleCount: category._count.articles,
      slug: category.name.toLowerCase().replace(/\s+/g, "-"),
    }))

    return NextResponse.json(formattedCategories)
  } catch (error) {
    console.error("Failed to fetch categories:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession()
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await request.json()
    const { name, color } = body

    const category = await prisma.category.create({
      data: {
        name,
        color,
      },
    })

    return NextResponse.json(category)
  } catch (error) {
    console.error("Failed to create category:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
