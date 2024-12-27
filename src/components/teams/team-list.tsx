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
import { TeamDialog } from "./team-dialog"
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  Users,
  FileText,
  CheckSquare,
} from "lucide-react"

interface TeamMember {
  user: {
    id: string
    name: string
    email: string
    image?: string | null
  }
  role: "admin" | "member"
}

interface Team {
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
  members: TeamMember[]
  _count: {
    tasks: number
    documents: number
  }
}

interface TeamListProps {
  teams: Team[]
  onDelete: (id: string) => Promise<void>
  currentUserId: string
}

export function TeamList({ teams, onDelete, currentUserId }: TeamListProps) {
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)

  const isTeamAdmin = (team: Team) => {
    return team.members.some(
      (member) => member.user.id === currentUserId && member.role === "admin"
    )
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Team</TableHead>
              <TableHead>Members</TableHead>
              <TableHead>Documents</TableHead>
              <TableHead>Tasks</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teams.map((team) => (
              <TableRow key={team.id}>
                <TableCell>
                  <div className="flex flex-col">
                    <Link
                      href={`/teams/${team.id}`}
                      className="font-medium hover:underline"
                    >
                      {team.name}
                    </Link>
                    {team.description && (
                      <span className="text-sm text-muted-foreground">
                        {team.description}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex -space-x-2">
                    {team.members.slice(0, 3).map((member) => (
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
                    {team.members.length > 3 && (
                      <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-background bg-muted text-xs">
                        +{team.members.length - 3}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span>{team._count.documents}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <CheckSquare className="h-4 w-4 text-muted-foreground" />
                    <span>{team._count.tasks}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm">
                      {format(new Date(team.createdAt), "MMM d, yyyy")}
                    </span>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-5 w-5">
                        <AvatarImage
                          src={team.createdBy.image || ""}
                          alt={team.createdBy.name}
                        />
                        <AvatarFallback>
                          {team.createdBy.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-muted-foreground">
                        {team.createdBy.name}
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
                      {isTeamAdmin(team) && (
                        <DropdownMenuItem
                          onClick={() => setSelectedTeam(team)}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        asChild
                      >
                        <Link href={`/teams/${team.id}/members`}>
                          <Users className="mr-2 h-4 w-4" />
                          Manage Members
                        </Link>
                      </DropdownMenuItem>
                      {isTeamAdmin(team) && (
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => onDelete(team.id)}
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

      {selectedTeam && (
        <TeamDialog
          open={!!selectedTeam}
          onOpenChange={() => setSelectedTeam(null)}
          team={selectedTeam}
        />
      )}
    </>
  )
}
