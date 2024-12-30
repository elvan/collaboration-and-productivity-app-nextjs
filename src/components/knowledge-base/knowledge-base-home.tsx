"use client"

import { useState } from "react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, Plus, BookOpen, Star, Clock } from "lucide-react"
import { ArticleCard } from "./article-card"
import { CategoryList } from "./category-list"

export function KnowledgeBaseHome() {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")

  const { data: articles, isLoading } = useQuery({
    queryKey: ["articles", searchQuery, activeTab],
    queryFn: async () => {
      const response = await fetch(
        `/api/knowledge-base/articles?search=${searchQuery}&filter=${activeTab}`
      )
      if (!response.ok) throw new Error("Failed to fetch articles")
      return response.json()
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex w-full max-w-sm items-center space-x-2">
          <Input
            placeholder="Search articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9"
          />
          <Button size="sm" variant="ghost">
            <Search className="h-4 w-4" />
          </Button>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> New Article
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-[250px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Categories</CardTitle>
            <CardDescription>Browse by category</CardDescription>
          </CardHeader>
          <CardContent>
            <CategoryList />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">
                <BookOpen className="mr-2 h-4 w-4" />
                All Articles
              </TabsTrigger>
              <TabsTrigger value="favorites">
                <Star className="mr-2 h-4 w-4" />
                Favorites
              </TabsTrigger>
              <TabsTrigger value="recent">
                <Clock className="mr-2 h-4 w-4" />
                Recent
              </TabsTrigger>
            </TabsList>
            <TabsContent value="all" className="space-y-4">
              <ScrollArea className="h-[calc(100vh-300px)]">
                {isLoading ? (
                  <div>Loading...</div>
                ) : (
                  articles?.map((article) => (
                    <ArticleCard key={article.id} article={article} />
                  ))
                )}
              </ScrollArea>
            </TabsContent>
            <TabsContent value="favorites" className="space-y-4">
              <ScrollArea className="h-[calc(100vh-300px)]">
                {isLoading ? (
                  <div>Loading...</div>
                ) : (
                  articles
                    ?.filter((article) => article.isFavorite)
                    .map((article) => (
                      <ArticleCard key={article.id} article={article} />
                    ))
                )}
              </ScrollArea>
            </TabsContent>
            <TabsContent value="recent" className="space-y-4">
              <ScrollArea className="h-[calc(100vh-300px)]">
                {isLoading ? (
                  <div>Loading...</div>
                ) : (
                  articles
                    ?.filter((article) => article.isRecent)
                    .map((article) => (
                      <ArticleCard key={article.id} article={article} />
                    ))
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
