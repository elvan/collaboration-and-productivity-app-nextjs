import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Search, FileText, Book, MessageSquare, Settings } from "lucide-react"
import { SearchResult } from "./search-result"

type SearchResultType = {
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

export function GlobalSearch() {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")

  const { data: results, isLoading } = useQuery<SearchResultType[]>({
    queryKey: ["global-search", query, activeTab],
    queryFn: async () => {
      if (!query) return []
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(query)}&type=${activeTab}`
      )
      if (!response.ok) throw new Error("Search failed")
      return response.json()
    },
    enabled: query.length > 2,
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query) {
      router.push(`/search/advanced?q=${encodeURIComponent(query)}`)
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="flex space-x-2">
        <div className="flex-1">
          <Input
            placeholder="Search everything..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-10"
          />
        </div>
        <Button type="submit">
          <Search className="mr-2 h-4 w-4" />
          Search
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/search/advanced")}
        >
          <Settings className="mr-2 h-4 w-4" />
          Advanced
        </Button>
      </form>

      {query.length > 2 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Search Results</CardTitle>
            <CardDescription>
              {isLoading
                ? "Searching..."
                : results?.length
                ? `Found ${results.length} results`
                : "No results found"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="documents">
                  <FileText className="mr-2 h-4 w-4" />
                  Documents
                </TabsTrigger>
                <TabsTrigger value="articles">
                  <Book className="mr-2 h-4 w-4" />
                  Articles
                </TabsTrigger>
                <TabsTrigger value="comments">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Comments
                </TabsTrigger>
              </TabsList>

              <ScrollArea className="h-[400px] mt-4">
                <div className="space-y-4">
                  {results?.map((result) => (
                    <SearchResult key={result.id} result={result} />
                  ))}
                </div>
              </ScrollArea>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
