import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"

export async function GET(request: Request) {
  try {
    const session = await getServerSession()
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const filter = searchParams.get("filter") || "all"

    const articles = await prisma.article.findMany({
      where: {
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { content: { contains: search, mode: "insensitive" } },
        ],
        ...(filter === "favorites" && {
          favorites: {
            some: {
              userId: session.user.id,
            },
          },
        }),
      },
      include: {
        category: true,
        author: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        favorites: {
          where: {
            userId: session.user.id,
          },
        },
        _count: {
          select: {
            views: true,
            comments: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    })

    const formattedArticles = articles.map((article) => ({
      id: article.id,
      title: article.title,
      excerpt: article.content.substring(0, 150) + "...",
      category: {
        id: article.category.id,
        name: article.category.name,
        color: article.category.color,
      },
      author: article.author,
      createdAt: article.createdAt,
      updatedAt: article.updatedAt,
      viewCount: article._count.views,
      commentCount: article._count.comments,
      isFavorite: article.favorites.length > 0,
    }))

    return NextResponse.json(formattedArticles)
  } catch (error) {
    console.error("Failed to fetch articles:", error)
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
    const { title, content, categoryId } = body

    const article = await prisma.article.create({
      data: {
        title,
        content,
        categoryId,
        authorId: session.user.id,
      },
    })

    return NextResponse.json(article)
  } catch (error) {
    console.error("Failed to create article:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
