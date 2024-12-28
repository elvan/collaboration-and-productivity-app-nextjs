import { useSession } from "next-auth/react"
import { useQuery } from "@tanstack/react-query"

export function useAdminAccess() {
  const { data: session } = useSession()

  const { data: hasAccess = false } = useQuery({
    queryKey: ["adminAccess", session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return false
      
      const response = await fetch("/api/admin/access")
      if (!response.ok) return false
      
      const data = await response.json()
      return data.hasAccess
    },
    enabled: !!session?.user?.id,
  })

  return hasAccess
}
