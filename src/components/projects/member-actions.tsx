"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Project, User } from "@prisma/client"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, UserX } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "@/components/ui/use-toast"

interface MemberActionsProps {
  project: Project
  member: {
    id: string
    name: string | null
    email: string
  }
  isOwner: boolean
}

export function MemberActions({ project, member, isOwner }: MemberActionsProps) {
  const router = useRouter()
  const [showRemoveAlert, setShowRemoveAlert] = React.useState<boolean>(false)
  const [isLoading, setIsLoading] = React.useState<boolean>(false)

  async function removeMember() {
    setIsLoading(true)
    const response = await fetch(
      `/api/projects/${project.id}/members/${member.id}`,
      {
        method: "DELETE",
      }
    )

    if (!response?.ok) {
      toast({
        title: "Something went wrong.",
        description: "The member was not removed. Please try again.",
        variant: "destructive",
      })
      return
    }

    toast({
      description: "Member has been removed from the project.",
    })

    router.refresh()
    setIsLoading(false)
  }

  if (isOwner) {
    return null
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
          >
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[160px]">
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onSelect={() => setShowRemoveAlert(true)}
          >
            <UserX className="mr-2 h-4 w-4" />
            Remove
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <AlertDialog open={showRemoveAlert} onOpenChange={setShowRemoveAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Are you sure you want to remove this member?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will remove {member.name || member.email} from the project.
              They will no longer have access to any project resources.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={removeMember}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading ? (
                <UserX className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <UserX className="mr-2 h-4 w-4" />
              )}
              <span>Remove Member</span>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
