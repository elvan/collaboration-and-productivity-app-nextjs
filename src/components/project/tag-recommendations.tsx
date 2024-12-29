"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Tag, Project, Folder } from "@prisma/client"
import { useToast } from "@/components/ui/use-toast"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import { Tag as TagIcon, Plus, Info } from "lucide-react"

interface TagRecommendation {
  tag: Tag
  score: number
  reason: string
  cooccurringTags?: string[]
  similarItems?: {
    id: string
    name: string
    type: "project" | "folder"
  }[]
}

interface TagRecommendationsProps {
  workspaceId: string
  itemId: string
  itemType: "project" | "folder"
  itemName: string
  currentTags: Tag[]
  onAddTag: (tagId: string) => void
}

export function TagRecommendations({
  workspaceId,
  itemId,
  itemType,
  itemName,
  currentTags,
  onAddTag,
}: TagRecommendationsProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [recommendations, setRecommendations] = useState<TagRecommendation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRecommendations()
  }, [itemId, currentTags])

  async function fetchRecommendations() {
    try {
      setLoading(true)
      const response = await fetch(
        `/api/workspaces/${workspaceId}/tags/recommendations?` +
          new URLSearchParams({
            itemId,
            itemType,
            currentTags: currentTags.map((t) => t.id).join(","),
          })
      )
      if (!response.ok) throw new Error("Failed to fetch recommendations")
      const data = await response.json()
      setRecommendations(data)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch tag recommendations",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  function getReasonIcon(reason: string) {
    switch (reason) {
      case "cooccurrence":
        return <TagIcon className="h-4 w-4" />
      case "similar_items":
        return <Info className="h-4 w-4" />
      default:
        return <Info className="h-4 w-4" />
    }
  }

  function getReasonText(reason: string) {
    switch (reason) {
      case "cooccurrence":
        return "Frequently used with your current tags"
      case "similar_items":
        return "Used in similar items"
      default:
        return "Recommended based on content"
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading Recommendations...</CardTitle>
        </CardHeader>
      </Card>
    )
  }

  if (recommendations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Recommendations</CardTitle>
          <CardDescription>
            We don't have any tag recommendations at this time
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recommended Tags</CardTitle>
        <CardDescription>
          Tags that might be relevant for "{itemName}"
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px]">
          <div className="space-y-4">
            {recommendations.map((rec) => (
              <div
                key={rec.tag.id}
                className="flex items-center justify-between border rounded-lg p-3"
              >
                <div className="flex items-center gap-3">
                  <Badge
                    style={{ backgroundColor: rec.tag.color }}
                    className="h-8"
                  >
                    {rec.tag.name}
                  </Badge>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          {getReasonIcon(rec.reason)}
                          <span>{getReasonText(rec.reason)}</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Confidence Score: {(rec.score * 100).toFixed(1)}%</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                <div className="flex items-center gap-2">
                  {rec.cooccurringTags && rec.cooccurringTags.length > 0 && (
                    <HoverCard>
                      <HoverCardTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <TagIcon className="h-4 w-4" />
                        </Button>
                      </HoverCardTrigger>
                      <HoverCardContent>
                        <div className="space-y-2">
                          <h4 className="text-sm font-semibold">
                            Commonly Used With
                          </h4>
                          <div className="flex flex-wrap gap-1">
                            {rec.cooccurringTags.map((tag) => (
                              <Badge key={tag} variant="secondary">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </HoverCardContent>
                    </HoverCard>
                  )}

                  {rec.similarItems && rec.similarItems.length > 0 && (
                    <HoverCard>
                      <HoverCardTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Info className="h-4 w-4" />
                        </Button>
                      </HoverCardTrigger>
                      <HoverCardContent>
                        <div className="space-y-2">
                          <h4 className="text-sm font-semibold">
                            Similar Items Using This Tag
                          </h4>
                          <div className="space-y-1">
                            {rec.similarItems.map((item) => (
                              <div
                                key={item.id}
                                className="flex items-center gap-2"
                              >
                                <Badge variant="outline">{item.type}</Badge>
                                <span className="text-sm">{item.name}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </HoverCardContent>
                    </HoverCard>
                  )}

                  <Button
                    size="sm"
                    onClick={() => onAddTag(rec.tag.id)}
                    className="ml-2"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Tag
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
