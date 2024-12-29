import Link from "next/link"
import { format } from "date-fns"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { FileText, Book, MessageSquare, CheckSquare } from "lucide-react"

interface SearchResult {
  id: string
  type: "document" | "article" | "comment" | "task"
  title: string
  excerpt: string
  url: string
  createdAt: Date
  author: {
    name: string
    image?: string
  }
  matchedContent?: string
}

interface SearchResultProps {
  result: SearchResult
}

export function SearchResult({ result }: SearchResultProps) {
  const getTypeIcon = () => {
    switch (result.type) {
      case "document":
        return <FileText className="h-4 w-4" />
      case "article":
        return <Book className="h-4 w-4" />
      case "comment":
        return <MessageSquare className="h-4 w-4" />
      case "task":
        return <CheckSquare className="h-4 w-4" />
    }
  }

  const getTypeColor = () => {
    switch (result.type) {
      case "document":
        return "bg-blue-500"
      case "article":
        return "bg-green-500"
      case "comment":
        return "bg-yellow-500"
      case "task":
        return "bg-purple-500"
    }
  }

  return (
    <Link href={result.url}>
      <Card className="p-4 hover:bg-muted/50 transition-colors">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Badge
                variant="secondary"
                className={`${getTypeColor()} text-white`}
              >
                <span className="flex items-center space-x-1">
                  {getTypeIcon()}
                  <span className="capitalize">{result.type}</span>
                </span>
              </Badge>
              <span className="text-sm text-muted-foreground">
                {format(new Date(result.createdAt), "MMM d, yyyy")}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={result.author.image} />
                <AvatarFallback>
                  {result.author.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm">{result.author.name}</span>
            </div>
          </div>

          <div>
            <h3 className="font-semibold">{result.title}</h3>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {result.excerpt}
            </p>
          </div>

          {result.matchedContent && (
            <div className="text-sm bg-muted/50 p-2 rounded-md">
              <p className="line-clamp-2">{result.matchedContent}</p>
            </div>
          )}
        </div>
      </Card>
    </Link>
  )
}
