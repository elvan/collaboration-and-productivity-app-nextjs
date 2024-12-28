import { Metadata } from "next"
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"

import { authOptions } from "@/lib/auth"
import { hasPermission } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"
import { DataTable } from "./data-table"
import { columns } from "./columns"

export const metadata: Metadata = {
  title: "User Management",
  description: "Manage users, roles, and permissions",
}

async function getUsers() {
  const users = await prisma.user.findMany({
    include: {
      userRoles: {
        include: {
          role: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  return users
}

export default async function UsersPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect("/login")

  // Check if user has permission to view users
  const canViewUsers = await hasPermission(session.user.id, "READ", "USERS")
  if (!canViewUsers) redirect("/dashboard")

  const users = await getUsers()

  return (
    <div className="hidden h-full flex-1 flex-col space-y-8 p-8 md:flex">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">User Management</h2>
          <p className="text-muted-foreground">
            Here you can manage users and their roles
          </p>
        </div>
      </div>
      <DataTable data={users} columns={columns} />
    </div>
  )
}
