import { useState } from "react"
import Link from "next/link"
import { format } from "date-fns"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { WorkspaceDialog } from "./workspace-dialog"
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  Users,
  FileText,
  CheckSquare,
  FolderTree,
} from "lucide-react"

interface WorkspaceMember {
  user: {
    id: string
    name: string
    email: string
    image?: string | null
  }
  role: "owner" | "admin" | "member"
}

interface Workspace {
  id: string
  name: string
  description?: string | null
  createdAt: Date
  updatedAt: Date
  createdBy: {
    id: string
    name: string
    email: string
    image?: string | null
  }
  members: WorkspaceMember[]
  _count: {
    teams: number
    documents: number
    tasks: number
    folders: number
  }
}

interface WorkspaceListProps {
  workspaces: Workspace[]
  onDelete: (id: string) => Promise<void>
  currentUserId: string
}

export function WorkspaceList({
  workspaces,
  onDelete,
  currentUserId,
}: WorkspaceListProps) {
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null)

  const isWorkspaceAdmin = (workspace: Workspace) => {
    const member = workspace.members.find(
      (member) => member.user.id === currentUserId
    )
    return member?.role === "owner" || member?.role === "admin"
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Workspace</TableHead>
              <TableHead>Members</TableHead>
              <TableHead>Teams</TableHead>
              <TableHead>Content</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {workspaces.map((workspace) => (
              <TableRow key={workspace.id}>
                <TableCell>
                  <div className="flex flex-col">
                    <Link
                      href={`/workspaces/${workspace.id}`}
                      className="font-medium hover:underline"
                    >
                      {workspace.name}
                    </Link>
                    {workspace.description && (
                      <span className="text-sm text-muted-foreground">
                        {workspace.description}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex -space-x-2">
                    {workspace.members.slice(0, 3).map((member) => (
                      <Avatar
                        key={member.user.id}
                        className="h-6 w-6 border-2 border-background"
                      >
                        <AvatarImage
                          src={member.user.image || ""}
                          alt={member.user.name}
                        />
                        <AvatarFallback>
                          {member.user.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                    {workspace.members.length > 3 && (
                      <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-background bg-muted text-xs">
                        +{workspace.members.length - 3}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{workspace._count.teams}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span>{workspace._count.documents}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckSquare className="h-4 w-4 text-muted-foreground" />
                      <span>{workspace._count.tasks}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FolderTree className="h-4 w-4 text-muted-foreground" />
                      <span>{workspace._count.folders}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm">
                      {format(new Date(workspace.createdAt), "MMM d, yyyy")}
                    </span>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-5 w-5">
                        <AvatarImage
                          src={workspace.createdBy.image || ""}
                          alt={workspace.createdBy.name}
                        />
                        <AvatarFallback>
                          {workspace.createdBy.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-muted-foreground">
                        {workspace.createdBy.name}
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="h-8 w-8 p-0"
                      >
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {isWorkspaceAdmin(workspace) && (
                        <DropdownMenuItem
                          onClick={() => setSelectedWorkspace(workspace)}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        asChild
                      >
                        <Link href={`/workspaces/${workspace.id}/members`}>
                          <Users className="mr-2 h-4 w-4" />
                          Manage Members
                        </Link>
                      </DropdownMenuItem>
                      {isWorkspaceAdmin(workspace) && (
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => onDelete(workspace.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {selectedWorkspace && (
        <WorkspaceDialog
          open={!!selectedWorkspace}
          onOpenChange={() => setSelectedWorkspace(null)}
          workspace={selectedWorkspace}
        />
      )}
    </>
  )
}
