"use client"

import * as React from "react"
import { Project, User } from "@prisma/client"
import { useRouter } from "next/navigation"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CalendarIcon, PlusIcon, Crown } from "lucide-react"
import { InviteMember } from "./invite-member"
import { MemberActions } from "./member-actions"

interface ExtendedProject extends Project {
  owner: {
    name: string | null
    email: string
    image: string | null
  }
  members: {
    id: string
    name: string | null
    email: string
    image: string | null
    createdAt: Date
  }[]
}

interface ProjectMembersProps {
  project: ExtendedProject
}

export function ProjectMembers({ project }: ProjectMembersProps) {
  const [showInviteDialog, setShowInviteDialog] = React.useState<boolean>(false)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Members</h3>
          <p className="text-sm text-muted-foreground">
            Manage project members and their roles
          </p>
        </div>
        <Button onClick={() => setShowInviteDialog(true)}>
          <PlusIcon className="mr-2 h-4 w-4" />
          Invite Member
        </Button>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Owner row */}
            <TableRow>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={project.owner.image || undefined} />
                    <AvatarFallback>
                      {project.owner.name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{project.owner.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {project.owner.email}
                    </p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Crown className="h-4 w-4 text-primary" />
                  <span>Owner</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {new Date(project.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-right">
                <span className="text-sm text-muted-foreground">
                  Project Owner
                </span>
              </TableCell>
            </TableRow>
            {/* Member rows */}
            {project.members
              .filter((member) => member.id !== project.ownerId)
              .map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={member.image || undefined} />
                        <AvatarFallback>
                          {member.name?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {member.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>Member</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {new Date(member.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <MemberActions
                      project={project}
                      member={member}
                      isOwner={project.ownerId === member.id}
                    />
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
      <InviteMember
        project={project}
        open={showInviteDialog}
        onOpenChange={setShowInviteDialog}
      />
    </div>
  )
}
