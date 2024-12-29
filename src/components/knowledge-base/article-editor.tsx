import { useState } from "react"
import { useRouter } from "next/navigation"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { DocumentEditor } from "@/components/documents/document-editor"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Save, ArrowLeft } from "lucide-react"

interface Article {
  id: string
  title: string
  content: string
  categoryId: string
}

interface ArticleEditorProps {
  initialArticle?: Article
}

export function ArticleEditor({ initialArticle }: ArticleEditorProps) {
  const router = useRouter()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [article, setArticle] = useState<Article>({
    id: initialArticle?.id || "",
    title: initialArticle?.title || "",
    content: initialArticle?.content || "",
    categoryId: initialArticle?.categoryId || "",
  })

  const { mutate: saveArticle, isLoading } = useMutation({
    mutationFn: async (articleData: Article) => {
      const response = await fetch(
        `/api/knowledge-base/articles/${articleData.id || ""}`,
        {
          method: articleData.id ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(articleData),
        }
      )
      if (!response.ok) throw new Error("Failed to save article")
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["articles"] })
      toast({
        title: "Success",
        description: "Article saved successfully",
      })
      if (!initialArticle) {
        router.push("/knowledge-base")
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save article",
        variant: "destructive",
      })
    },
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <Button
          onClick={() => saveArticle(article)}
          disabled={isLoading}
          className="gap-2"
        >
          <Save className="h-4 w-4" />
          {isLoading ? "Saving..." : "Save"}
        </Button>
      </div>

      <div className="space-y-4">
        <Input
          placeholder="Article title"
          value={article.title}
          onChange={(e) => setArticle({ ...article, title: e.target.value })}
          className="text-lg font-semibold"
        />

        <Select
          value={article.categoryId}
          onValueChange={(value) => setArticle({ ...article, categoryId: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="getting-started">Getting Started</SelectItem>
            <SelectItem value="tutorials">Tutorials</SelectItem>
            <SelectItem value="api-docs">API Documentation</SelectItem>
            <SelectItem value="best-practices">Best Practices</SelectItem>
          </SelectContent>
        </Select>

        <div className="min-h-[500px] rounded-md border">
          <DocumentEditor
            content={article.content}
            documentId={article.id}
            onChange={(content) => setArticle({ ...article, content })}
            currentUser={{
              id: "current-user-id",
              name: "Current User",
            }}
          />
        </div>
      </div>
    </div>
  )
}
