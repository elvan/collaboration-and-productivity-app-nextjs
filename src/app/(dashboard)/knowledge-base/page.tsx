import { Metadata } from "next"
import { Shell } from "@/components/shell"
import { KnowledgeBaseHome } from "@/components/knowledge-base/knowledge-base-home"

export const metadata: Metadata = {
  title: "Knowledge Base",
  description: "Team knowledge base and documentation",
}

export default function KnowledgeBasePage() {
  return (
    <Shell>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Knowledge Base</h2>
        </div>
        <div className="hidden h-full flex-1 flex-col space-y-8 md:flex">
          <KnowledgeBaseHome />
        </div>
      </div>
    </Shell>
  )
}
