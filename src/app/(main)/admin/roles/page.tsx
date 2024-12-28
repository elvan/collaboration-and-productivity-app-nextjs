import { Metadata } from "next"
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"

import { authOptions } from "@/lib/auth"
import { hasPermission } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"
import { DataTable } from "./data-table"
import { columns } from "./columns"
import { Button } from "@/components/ui/button"
import { PlusIcon } from "lucide-react"
import { CreateRoleDialog } from "./create-role-dialog"

export const metadata: Metadata = {
  title: "Role Management",
  description: "Manage roles and their permissions",
}

async function getRoles() {
  const roles = await prisma.role.findMany({
    include: {
      permissions: true,
      _count: {
        select: {
          userRoles: true,
          workspaceRoles: true,
          teamRoles: true,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  })

  return roles
}

export default async function RolesPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect("/login")

  // Check if user has permission to manage roles
  const canManageRoles = await hasPermission(session.user.id, "MANAGE", "ROLES")
  if (!canManageRoles) redirect("/dashboard")

  const roles = await getRoles()

  return (
    <div className="hidden h-full flex-1 flex-col space-y-8 p-8 md:flex">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Role Management</h2>
          <p className="text-muted-foreground">
            Manage roles and their permissions
          </p>
        </div>
        <CreateRoleDialog>
          <Button>
            <PlusIcon className="mr-2 h-4 w-4" />
            Create Role
          </Button>
        </CreateRoleDialog>
      </div>
      <DataTable data={roles} columns={columns} />
    </div>
  )
}
