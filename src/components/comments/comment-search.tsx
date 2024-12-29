"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useSession } from "next-auth/react"
import { useToast } from "@/components/ui/use-toast"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Search,
  Filter,
  Calendar,
  User,
  MessageSquare,
  ChevronRight,
  SortAsc,
  SortDesc,
} from "lucide-react"
import { format } from "date-fns"
import debounce from "lodash/debounce"

interface CommentSearchProps {
  workspaceId: string
}

interface SearchResult {
  id: string
  content: string
  createdAt: string
  entityType: string
  entityId: string
  entityName: string
  author: {
    id: string
    name: string
    email: string
    image: string | null
  }
  mentions: Array<{
    id: string
    name: string
    email: string
    image: string | null
  }>
  reactions: Array<{
    type: string
    count: number
  }>
}

interface SearchFilters {
  entityType?: string
  authorId?: string
  mentionId?: string
  dateRange?: {
    start?: string
    end?: string
  }
}

interface SortOption {
  field: "createdAt" | "relevance"
  direction: "asc" | "desc"
}

export function CommentSearch({ workspaceId }: CommentSearchProps) {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [filters, setFilters] = useState<SearchFilters>({})
  const [sort, setSort] = useState<SortOption>({
    field: "relevance",
    direction: "desc",
  })
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [highlightedResult, setHighlightedResult] = useState<string | null>(null)

  const debouncedSearch = useCallback(
    debounce(async (query: string, filters: SearchFilters, sort: SortOption) => {
      if (!query.trim()) {
        setResults([])
        setHasMore(false)
        return
      }

      try {
        setLoading(true)
        const response = await fetch(
          `/api/workspaces/${workspaceId}/comments/search?` +
            new URLSearchParams({
              query,
              page: "1",
              ...filters,
              sortField: sort.field,
              sortDirection: sort.direction,
            })
        )

        if (!response.ok) throw new Error("Search failed")

        const data = await response.json()
        setResults(data.results)
        setHasMore(data.hasMore)
        setPage(1)
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to search comments",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }, 300),
    [workspaceId, toast]
  )

  const loadMore = async () => {
    if (!hasMore || loading) return

    try {
      setLoading(true)
      const response = await fetch(
        `/api/workspaces/${workspaceId}/comments/search?` +
          new URLSearchParams({
            query: searchQuery,
            page: (page + 1).toString(),
            ...filters,
            sortField: sort.field,
            sortDirection: sort.direction,
          })
      )

      if (!response.ok) throw new Error("Failed to load more results")

      const data = await response.json()
      setResults((prev) => [...prev, ...data.results])
      setHasMore(data.hasMore)
      setPage((prev) => prev + 1)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load more results",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (searchQuery) {
      debouncedSearch(searchQuery, filters, sort)
    }
  }, [searchQuery, filters, sort, debouncedSearch])

  const handleEntityClick = async (entityType: string, entityId: string) => {
    // Navigate to the entity
    // This should be implemented based on your routing structure
    console.log("Navigate to:", entityType, entityId)
  }

  const highlightSearchTerms = (text: string) => {
    if (!searchQuery.trim()) return text

    const terms = searchQuery.trim().split(/\s+/)
    let highlightedText = text

    terms.forEach((term) => {
      const regex = new RegExp(term, "gi")
      highlightedText = highlightedText.replace(
        regex,
        (match) => `<mark class="bg-yellow-200 dark:bg-yellow-800">${match}</mark>`
      )
    })

    return highlightedText
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Comment Search</CardTitle>
        <CardDescription>
          Search through comments across all items
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search comments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="p-2 space-y-2">
                  <Select
                    value={filters.entityType}
                    onValueChange={(value) =>
                      setFilters((prev) => ({ ...prev, entityType: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="project">Projects</SelectItem>
                      <SelectItem value="folder">Folders</SelectItem>
                      <SelectItem value="template">Templates</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={sort.field}
                    onValueChange={(value: "createdAt" | "relevance") =>
                      setSort((prev) => ({ ...prev, field: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="relevance">Relevance</SelectItem>
                      <SelectItem value="createdAt">Date</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() =>
                      setSort((prev) => ({
                        ...prev,
                        direction: prev.direction === "asc" ? "desc" : "asc",
                      }))
                    }
                  >
                    {sort.direction === "asc" ? (
                      <SortAsc className="mr-2 h-4 w-4" />
                    ) : (
                      <SortDesc className="mr-2 h-4 w-4" />
                    )}
                    {sort.direction === "asc" ? "Ascending" : "Descending"}
                  </Button>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <ScrollArea className="h-[500px]">
            <div className="space-y-4">
              {results.length === 0 && searchQuery && !loading ? (
                <div className="text-center text-muted-foreground py-8">
                  No comments found
                </div>
              ) : (
                results.map((result) => (
                  <div
                    key={result.id}
                    className={`border rounded-lg p-4 ${
                      highlightedResult === result.id
                        ? "ring-2 ring-primary"
                        : ""
                    }`}
                    onMouseEnter={() => setHighlightedResult(result.id)}
                    onMouseLeave={() => setHighlightedResult(null)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <Avatar>
                          <AvatarImage src={result.author.image || ""} />
                          <AvatarFallback>
                            {result.author.name?.[0] ||
                              result.author.email[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">
                              {result.author.name}
                            </span>
                            <span className="text-muted-foreground">·</span>
                            <span className="text-sm text-muted-foreground">
                              {format(
                                new Date(result.createdAt),
                                "MMM d, yyyy 'at' h:mm a"
                              )}
                            </span>
                          </div>
                          <div
                            className="mt-1"
                            dangerouslySetInnerHTML={{
                              __html: highlightSearchTerms(result.content),
                            }}
                          />
                          {result.mentions.length > 0 && (
                            <div className="mt-2 flex items-center space-x-1">
                              <User className="h-4 w-4 text-muted-foreground" />
                              {result.mentions.map((mention) => (
                                <Badge
                                  key={mention.id}
                                  variant="secondary"
                                  className="text-sm"
                                >
                                  {mention.name}
                                </Badge>
                              ))}
                            </div>
                          )}
                          {result.reactions.length > 0 && (
                            <div className="mt-2 flex items-center space-x-2">
                              {result.reactions.map((reaction) => (
                                <Badge
                                  key={reaction.type}
                                  variant="outline"
                                  className="text-sm"
                                >
                                  {reaction.type} {reaction.count}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleEntityClick(result.entityType, result.entityId)
                        }
                      >
                        <span className="text-sm text-muted-foreground mr-2">
                          {result.entityName}
                        </span>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}

              {hasMore && (
                <div className="flex justify-center py-4">
                  <Button
                    variant="outline"
                    onClick={loadMore}
                    disabled={loading}
                  >
                    {loading ? "Loading..." : "Load More"}
                  </Button>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  )
}
