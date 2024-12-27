import { useState } from "react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { AddMemberDialog } from "./add-member-dialog"
import { MoreHorizontal, UserPlus, Shield, UserMinus } from "lucide-react"

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
  members: TeamMember[]
}

interface TeamMembersProps {
  team: Team
  onAddMember: (userId: string, role: "admin" | "member") => Promise<void>
  onUpdateMember: (userId: string, role: "admin" | "member") => Promise<void>
  onRemoveMember: (userId: string) => Promise<void>
  currentUserId: string
  availableUsers: Array<{
    id: string
    name: string
    email: string
    image?: string | null
  }>
}

export function TeamMembers({
  team,
  onAddMember,
  onUpdateMember,
  onRemoveMember,
  currentUserId,
  availableUsers,
}: TeamMembersProps) {
  const [isAddingMember, setIsAddingMember] = useState(false)

  const isCurrentUserAdmin = team.members.some(
    (member) => member.user.id === currentUserId && member.role === "admin"
  )

  const canManageMembers = isCurrentUserAdmin

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Team Members</h2>
        {canManageMembers && (
          <Button onClick={() => setIsAddingMember(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add Member
          </Button>
        )}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {team.members.map((member) => (
              <TableRow key={member.user.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar>
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
                    <span className="font-medium">{member.user.name}</span>
                  </div>
                </TableCell>
                <TableCell>{member.user.email}</TableCell>
                <TableCell>
                  {canManageMembers && member.user.id !== currentUserId ? (
                    <Select
                      defaultValue={member.role}
                      onValueChange={(value) =>
                        onUpdateMember(member.user.id, value as "admin" | "member")
                      }
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4" />
                            Admin
                          </div>
                        </SelectItem>
                        <SelectItem value="member">
                          <div className="flex items-center gap-2">
                            <UserPlus className="h-4 w-4" />
                            Member
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge
                      variant={member.role === "admin" ? "default" : "secondary"}
                    >
                      <div className="flex items-center gap-2">
                        {member.role === "admin" ? (
                          <Shield className="h-3 w-3" />
                        ) : (
                          <UserPlus className="h-3 w-3" />
                        )}
                        {member.role}
                      </div>
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {canManageMembers && member.user.id !== currentUserId && (
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
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => onRemoveMember(member.user.id)}
                        >
                          <UserMinus className="mr-2 h-4 w-4" />
                          Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AddMemberDialog
        open={isAddingMember}
        onOpenChange={setIsAddingMember}
        onSubmit={onAddMember}
        availableUsers={availableUsers.filter(
          (user) =>
            !team.members.some((member) => member.user.id === user.id)
        )}
      />
    </div>
  )
}
