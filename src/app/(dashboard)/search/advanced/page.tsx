import { Metadata } from "next"
import { Shell } from "@/components/shell"
import { AdvancedSearchForm } from "@/components/search/advanced-search-form"

export const metadata: Metadata = {
  title: "Advanced Search",
  description: "Advanced search with filters and options",
}

export default function AdvancedSearchPage() {
  return (
    <Shell>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Advanced Search</h2>
        </div>
        <div className="flex-1 space-y-4">
          <AdvancedSearchForm />
        </div>
      </div>
    </Shell>
  )
}
