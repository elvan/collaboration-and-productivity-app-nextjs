import { Metadata } from "next"
import { DocumentEditor } from "@/components/documents/document-editor"
import { Shell } from "@/components/shell"
import { getDocumentById } from "@/lib/documents"

interface DocumentPageProps {
  params: {
    documentId: string
  }
}

export const metadata: Metadata = {
  title: "Document Editor",
  description: "Create and edit team documents",
}

export default async function DocumentPage({ params }: DocumentPageProps) {
  const document = await getDocumentById(params.documentId)

  return (
    <Shell>
      <div className="flex-1 flex flex-col">
        <div className="flex-1 space-y-4 p-4 md:p-8">
          <DocumentEditor initialDocument={document} />
        </div>
      </div>
    </Shell>
  )
}
