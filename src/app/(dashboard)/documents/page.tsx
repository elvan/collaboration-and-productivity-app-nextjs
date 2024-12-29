import { Metadata } from "next"
import { DocumentList } from "@/components/documents/document-list"
import { Shell } from "@/components/shell"

export const metadata: Metadata = {
  title: "Documents",
  description: "Manage and collaborate on team documents",
}

export default function DocumentsPage() {
  return (
    <Shell>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Documents</h2>
        </div>
        <div className="hidden h-full flex-1 flex-col space-y-8 md:flex">
          <DocumentList />
        </div>
      </div>
    </Shell>
  )
}
