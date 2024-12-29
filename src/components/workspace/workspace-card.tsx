import { Workspace } from "@prisma/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

interface WorkspaceCardProps {
  workspace: Workspace & {
    _count?: {
      projects: number
      teams: number
    }
  }
}

export function WorkspaceCard({ workspace }: WorkspaceCardProps) {
  return (
    <Link href={`/workspace/${workspace.slug}`}>
      <Card className="hover:bg-accent/5 transition-colors">
        <CardHeader className="flex flex-row items-center gap-4">
          <Avatar className="h-12 w-12">
            {workspace.logoUrl ? (
              <AvatarImage src={workspace.logoUrl} alt={workspace.name} />
            ) : (
              <AvatarFallback>
                {workspace.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            )}
          </Avatar>
          <div className="flex flex-col">
            <CardTitle className="text-xl">{workspace.name}</CardTitle>
            <CardDescription>{workspace.description}</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {workspace._count && (
              <>
                <Badge variant="secondary">
                  {workspace._count.projects} Projects
                </Badge>
                <Badge variant="secondary">
                  {workspace._count.teams} Teams
                </Badge>
              </>
            )}
            {workspace.isArchived && (
              <Badge variant="destructive">Archived</Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
