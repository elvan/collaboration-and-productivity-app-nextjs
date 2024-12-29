import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Folder } from "lucide-react"
import { cn } from "@/lib/utils"

interface Category {
  id: string
  name: string
  color: string
  articleCount: number
  slug: string
}

export function CategoryList() {
  const { data: categories, isLoading } = useQuery<Category[]>({
    queryKey: ["knowledge-base-categories"],
    queryFn: async () => {
      const response = await fetch("/api/knowledge-base/categories")
      if (!response.ok) throw new Error("Failed to fetch categories")
      return response.json()
    },
  })

  if (isLoading) {
    return <div>Loading categories...</div>
  }

  return (
    <ScrollArea className="h-[calc(100vh-300px)]">
      <div className="space-y-1">
        <Button
          variant="ghost"
          className="w-full justify-start"
          asChild
        >
          <Link href="/knowledge-base">
            <Folder className="mr-2 h-4 w-4" />
            All Categories
          </Link>
        </Button>
        {categories?.map((category) => (
          <Button
            key={category.id}
            variant="ghost"
            className="w-full justify-start"
            asChild
          >
            <Link href={`/knowledge-base/category/${category.slug}`}>
              <div
                className={cn(
                  "mr-2 h-2 w-2 rounded-full",
                  `bg-[${category.color}]`
                )}
              />
              {category.name}
              <span className="ml-auto text-muted-foreground">
                {category.articleCount}
              </span>
            </Link>
          </Button>
        ))}
      </div>
    </ScrollArea>
  )
}
