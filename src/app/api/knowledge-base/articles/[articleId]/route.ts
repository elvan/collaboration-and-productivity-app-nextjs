import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"

export async function GET(
  request: Request,
  { params }: { params: { articleId: string } }
) {
  try {
    const session = await getServerSession()
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const article = await prisma.article.findUnique({
      where: { id: params.articleId },
      include: {
        category: true,
        author: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    })

    if (!article) {
      return new NextResponse("Article not found", { status: 404 })
    }

    // Record view
    await prisma.articleView.create({
      data: {
        articleId: article.id,
        userId: session.user.id,
      },
    })

    return NextResponse.json(article)
  } catch (error) {
    console.error("Failed to fetch article:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { articleId: string } }
) {
  try {
    const session = await getServerSession()
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await request.json()
    const { title, content, categoryId } = body

    const article = await prisma.article.update({
      where: { id: params.articleId },
      data: {
        title,
        content,
        categoryId,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json(article)
  } catch (error) {
    console.error("Failed to update article:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { articleId: string } }
) {
  try {
    const session = await getServerSession()
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    await prisma.article.delete({
      where: { id: params.articleId },
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("Failed to delete article:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
