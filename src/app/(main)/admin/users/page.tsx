"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { DataTable } from "./data-table"
import { columns } from "./columns"
import { UserPlus } from "lucide-react"

export default function UsersPage() {
  const router = useRouter()

  return (
    <div className="hidden h-full flex-1 flex-col space-y-8 p-8 md:flex">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">User Management</h2>
          <p className="text-muted-foreground">
            Here you can manage users and their roles
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={() => router.push("/admin/users/new")}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </div>
      </div>
      <DataTable columns={columns} />
    </div>
  )
}
