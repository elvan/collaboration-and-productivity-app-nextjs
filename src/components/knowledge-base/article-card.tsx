import Link from "next/link"
import { format } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Star, MessageSquare, Eye } from "lucide-react"

interface Article {
  id: string
  title: string
  excerpt: string
  category: {
    id: string
    name: string
    color: string
  }
  author: {
    id: string
    name: string
    image?: string
  }
  createdAt: Date
  updatedAt: Date
  viewCount: number
  commentCount: number
  isFavorite: boolean
}

interface ArticleCardProps {
  article: Article
}

export function ArticleCard({ article }: ArticleCardProps) {
  return (
    <Card className="mb-4">
      <CardHeader className="grid grid-cols-[1fr_110px] items-start gap-4 space-y-0">
        <div className="space-y-2">
          <CardTitle>
            <Link
              href={`/knowledge-base/${article.id}`}
              className="hover:underline"
            >
              {article.title}
            </Link>
          </CardTitle>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Avatar className="h-6 w-6">
              <AvatarImage src={article.author.image} alt={article.author.name} />
              <AvatarFallback>
                {article.author.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <span>{article.author.name}</span>
            <span>•</span>
            <span>{format(new Date(article.updatedAt), "MMM d, yyyy")}</span>
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Star
              className={article.isFavorite ? "fill-yellow-400" : ""}
              size={16}
            />
          </Button>
          <Badge
            variant="secondary"
            className="rounded-sm px-2 font-normal"
            style={{
              backgroundColor: `${article.category.color}20`,
              color: article.category.color,
            }}
          >
            {article.category.name}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{article.excerpt}</p>
        <div className="mt-4 flex items-center space-x-4 text-sm text-muted-foreground">
          <div className="flex items-center">
            <Eye className="mr-1 h-4 w-4" />
            {article.viewCount} views
          </div>
          <div className="flex items-center">
            <MessageSquare className="mr-1 h-4 w-4" />
            {article.commentCount} comments
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
