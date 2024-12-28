import { useSession } from "next-auth/react"
import { useQuery } from "@tanstack/react-query"

export function useAdminAccess() {
  const { data: session } = useSession()

  const { data: hasAccess = false } = useQuery({
    queryKey: ["adminAccess", session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return false
      
      console.log('Checking admin access for user:', session.user.id)
      const response = await fetch("/api/admin/access")
      if (!response.ok) {
        console.error('Admin access check failed:', response.status, response.statusText)
        return false
      }
      
      const data = await response.json()
      console.log('Admin access response:', data)
      return data.hasAccess
    },
    enabled: !!session?.user?.id,
    staleTime: 30000, // Cache for 30 seconds
  })

  return hasAccess
}
