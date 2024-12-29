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
    const query = searchParams.get("q")
    const type = searchParams.get("type") || "all"

    if (!query) {
      return NextResponse.json([])
    }

    const searchResults = await prisma.$transaction(async (tx) => {
      const results = []

      // Search documents if type is 'all' or 'documents'
      if (type === "all" || type === "documents") {
        const documents = await tx.document.findMany({
          where: {
            OR: [
              { title: { contains: query, mode: "insensitive" } },
              { content: { contains: query, mode: "insensitive" } },
            ],
          },
          include: {
            author: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
          take: 10,
        })

        results.push(
          ...documents.map((doc) => ({
            id: doc.id,
            type: "document",
            title: doc.title,
            excerpt: doc.content.substring(0, 150),
            url: `/documents/${doc.id}`,
            createdAt: doc.createdAt,
            author: doc.author,
            matchedContent: doc.content.match(
              new RegExp(`.{0,50}${query}.{0,50}`, "i")
            )?.[0],
          }))
        )
      }

      // Search articles if type is 'all' or 'articles'
      if (type === "all" || type === "articles") {
        const articles = await tx.article.findMany({
          where: {
            OR: [
              { title: { contains: query, mode: "insensitive" } },
              { content: { contains: query, mode: "insensitive" } },
            ],
          },
          include: {
            author: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
          take: 10,
        })

        results.push(
          ...articles.map((article) => ({
            id: article.id,
            type: "article",
            title: article.title,
            excerpt: article.content.substring(0, 150),
            url: `/knowledge-base/${article.id}`,
            createdAt: article.createdAt,
            author: article.author,
            matchedContent: article.content.match(
              new RegExp(`.{0,50}${query}.{0,50}`, "i")
            )?.[0],
          }))
        )
      }

      // Search comments if type is 'all' or 'comments'
      if (type === "all" || type === "comments") {
        const comments = await tx.comment.findMany({
          where: {
            content: { contains: query, mode: "insensitive" },
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
            article: {
              select: {
                id: true,
                title: true,
              },
            },
          },
          take: 10,
        })

        results.push(
          ...comments.map((comment) => ({
            id: comment.id,
            type: "comment",
            title: `Comment on "${comment.article.title}"`,
            excerpt: comment.content,
            url: `/knowledge-base/${comment.article.id}#comment-${comment.id}`,
            createdAt: comment.createdAt,
            author: comment.user,
            matchedContent: comment.content.match(
              new RegExp(`.{0,50}${query}.{0,50}`, "i")
            )?.[0],
          }))
        )
      }

      return results.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    })

    return NextResponse.json(searchResults)
  } catch (error) {
    console.error("Search failed:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
