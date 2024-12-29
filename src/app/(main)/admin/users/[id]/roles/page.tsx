"use client"

import { useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { toast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"

interface Role {
  id: string
  name: string
  description: string
}

interface UserRole {
  roleId: string
  userId: string
  role: Role
}

interface User {
  id: string
  name: string
  email: string
  image: string | null
  userRoles: UserRole[]
}

export default function UserRolesPage({ params }: { params: { id: string } }) {
  const router = useRouter()

  const { data: user, error: userError } = useQuery({
    queryKey: ["user", params.id],
    queryFn: async () => {
      const response = await fetch(`/api/admin/users/${params.id}`)
      if (!response.ok) throw new Error("Failed to fetch user")
      return response.json() as Promise<User>
    },
  })

  const { data: roles, error: rolesError } = useQuery({
    queryKey: ["roles"],
    queryFn: async () => {
      const response = await fetch("/api/admin/roles")
      if (!response.ok) throw new Error("Failed to fetch roles")
      return response.json() as Promise<Role[]>
    },
  })

  if (userError || rolesError) {
    toast({
      title: "Error",
      description: "Failed to fetch data. Please try again.",
      variant: "destructive",
    })
  }

  const userRoleIds = user?.userRole.map(ur => ur.roleId) || []

  const handleRoleToggle = async (roleId: string, checked: boolean) => {
    try {
      const response = await fetch(`/api/admin/users/${params.id}/roles`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roleId,
          action: checked ? "add" : "remove"
        }),
      })

      if (!response.ok) throw new Error("Failed to update user roles")

      toast({
        title: "Success",
        description: "User roles updated successfully.",
      })

      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update user roles. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="h-full flex-1 flex-col space-y-8 p-8 md:flex">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Manage User Roles</h2>
          <p className="text-muted-foreground">
            Assign or remove roles for this user
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {user && (
          <Card>
            <CardHeader>
              <CardTitle>User Details</CardTitle>
              <CardDescription>
                Basic information about the user
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={user.image || ""} alt={user.name} />
                  <AvatarFallback>
                    {user.name?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-medium">{user.name}</h3>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Assigned Roles</CardTitle>
            <CardDescription>
              Select the roles you want to assign to this user
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {roles?.map((role, index) => (
              <div key={role.id}>
                {index > 0 && <Separator className="my-4" />}
                <div className="flex items-start space-x-4">
                  <Checkbox
                    id={role.id}
                    checked={userRoleIds.includes(role.id)}
                    onCheckedChange={(checked) =>
                      handleRoleToggle(role.id, checked as boolean)
                    }
                  />
                  <div className="space-y-1">
                    <label
                      htmlFor={role.id}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {role.name}
                    </label>
                    <p className="text-sm text-muted-foreground">
                      {role.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              router.push("/admin/users")
              router.refresh()
            }}
          >
            Done
          </Button>
        </div>
      </div>
    </div>
  )
}
