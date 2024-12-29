import { Metadata } from "next"
import { Shell } from "@/components/shell"
import { ArticleEditor } from "@/components/knowledge-base/article-editor"
import { getArticleById } from "@/lib/knowledge-base"

interface ArticlePageProps {
  params: {
    articleId: string
  }
}

export const metadata: Metadata = {
  title: "Knowledge Base Article",
  description: "View and edit knowledge base article",
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const article = await getArticleById(params.articleId)

  return (
    <Shell>
      <div className="flex-1 flex flex-col">
        <div className="flex-1 space-y-4 p-4 md:p-8">
          <ArticleEditor initialArticle={article} />
        </div>
      </div>
    </Shell>
  )
}
