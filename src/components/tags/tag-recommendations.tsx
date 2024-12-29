"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
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
  Tag,
  Plus,
  Sparkles,
  TrendingUp,
  Users,
  History,
  Info,
} from "lucide-react"

interface TagRecommendation {
  id: string
  name: string
  color: string
  score: number
  reasons: {
    type: "similar_content" | "co_occurrence" | "user_pattern" | "popularity"
    description: string
    score: number
  }[]
}

interface TagRecommendationsProps {
  workspaceId: string
  entityId: string
  entityType: "project" | "folder" | "template"
  currentTags: string[]
  onAddTag: (tagId: string) => void
}

export function TagRecommendations({
  workspaceId,
  entityId,
  entityType,
  currentTags,
  onAddTag,
}: TagRecommendationsProps) {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [recommendations, setRecommendations] = useState<TagRecommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTag, setSelectedTag] = useState<TagRecommendation | null>(null)

  useEffect(() => {
    fetchRecommendations()
  }, [entityId, currentTags])

  async function fetchRecommendations() {
    try {
      setLoading(true)
      const response = await fetch(
        `/api/workspaces/${workspaceId}/tags/recommendations?` +
          new URLSearchParams({
            entityId,
            entityType,
            currentTags: currentTags.join(","),
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

  function getReasonIcon(type: string) {
    switch (type) {
      case "similar_content":
        return <Tag className="h-4 w-4" />
      case "co_occurrence":
        return <Users className="h-4 w-4" />
      case "user_pattern":
        return <History className="h-4 w-4" />
      case "popularity":
        return <TrendingUp className="h-4 w-4" />
      default:
        return <Info className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading recommendations...</CardTitle>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Recommended Tags</CardTitle>
            <CardDescription>
              Smart tag suggestions based on content and patterns
            </CardDescription>
          </div>
          <Sparkles className="h-5 w-5 text-yellow-500" />
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px]">
          <div className="space-y-4">
            {recommendations.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No recommendations available
              </div>
            ) : (
              recommendations.map((recommendation) => (
                <div
                  key={recommendation.id}
                  className={`border rounded-lg p-4 transition-colors ${
                    selectedTag?.id === recommendation.id
                      ? "bg-muted/50"
                      : "hover:bg-muted/30"
                  }`}
                  onClick={() => setSelectedTag(recommendation)}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Badge
                          variant="outline"
                          style={{
                            backgroundColor: recommendation.color + "20",
                            borderColor: recommendation.color,
                            color: recommendation.color,
                          }}
                        >
                          {recommendation.name}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {Math.round(recommendation.score * 100)}% match
                        </span>
                      </div>

                      <div className="flex items-center space-x-2">
                        {recommendation.reasons.map((reason, index) => (
                          <TooltipProvider key={index}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center space-x-1 text-muted-foreground">
                                  {getReasonIcon(reason.type)}
                                  <span className="text-xs">
                                    {Math.round(reason.score * 100)}%
                                  </span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{reason.description}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ))}
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation()
                        onAddTag(recommendation.id)
                      }}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  {selectedTag?.id === recommendation.id && (
                    <div className="mt-4 text-sm text-muted-foreground">
                      <h4 className="font-medium mb-2">Why this tag?</h4>
                      <ul className="list-disc list-inside space-y-1">
                        {recommendation.reasons.map((reason, index) => (
                          <li key={index}>{reason.description}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
