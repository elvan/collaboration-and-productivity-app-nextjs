import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/components/ui/use-toast"
import { WorkspaceRole, WorkspaceMember, User } from "@prisma/client"

interface MembersTableProps {
  members: (WorkspaceMember & {
    user: Pick<User, "id" | "name" | "email" | "image">
    role: WorkspaceRole
  })[]
  roles: WorkspaceRole[]
  workspaceId: string
  isAdmin: boolean
}

export function MembersTable({
  members,
  roles,
  workspaceId,
  isAdmin,
}: MembersTableProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState<string | null>(null)

  async function updateMemberRole(userId: string, roleId: string) {
    try {
      setLoading(userId)
      const response = await fetch(
        `/api/workspaces/${workspaceId}/members`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId, roleId }),
        }
      )

      if (!response.ok) {
        throw new Error("Failed to update member role")
      }

      toast({
        title: "Success",
        description: "Member role updated successfully",
      })
      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update member role",
        variant: "destructive",
      })
    } finally {
      setLoading(null)
    }
  }

  async function removeMember(userId: string) {
    try {
      setLoading(userId)
      const response = await fetch(
        `/api/workspaces/${workspaceId}/members?userId=${userId}`,
        {
          method: "DELETE",
        }
      )

      if (!response.ok) {
        throw new Error("Failed to remove member")
      }

      toast({
        title: "Success",
        description: "Member removed successfully",
      })
      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove member",
        variant: "destructive",
      })
    } finally {
      setLoading(null)
    }
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Member</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Joined</TableHead>
          {isAdmin && <TableHead className="text-right">Actions</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {members.map((member) => (
          <TableRow key={member.id}>
            <TableCell className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                {member.user.image ? (
                  <AvatarImage src={member.user.image} alt={member.user.name || ""} />
                ) : (
                  <AvatarFallback>
                    {member.user.name?.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                )}
              </Avatar>
              <div>
                <div className="font-medium">{member.user.name}</div>
                <div className="text-sm text-muted-foreground">
                  {member.user.email}
                </div>
              </div>
            </TableCell>
            <TableCell>
              {isAdmin ? (
                <Select
                  value={member.roleId}
                  onValueChange={(value) =>
                    updateMemberRole(member.user.id, value)
                  }
                  disabled={loading === member.user.id}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <span>{member.role.name}</span>
              )}
            </TableCell>
            <TableCell>
              {new Date(member.joinedAt).toLocaleDateString()}
            </TableCell>
            {isAdmin && (
              <TableCell className="text-right">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={loading === member.user.id}
                    >
                      Remove
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remove member</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to remove this member from the
                        workspace? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => removeMember(member.user.id)}
                      >
                        Remove
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
