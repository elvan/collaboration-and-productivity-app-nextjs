"use client"

import { useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { toast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

const permissionResources = [
  "USERS",
  "ROLES",
  "TEAMS",
  "PROJECTS",
  "TASKS",
  "WORKSPACES",
  "SETTINGS",
] as const

const permissionActions = ["CREATE", "READ", "UPDATE", "DELETE", "MANAGE"] as const

const roleFormSchema = z.object({
  name: z.string().min(1, "Role name is required"),
  description: z.string(),
  permissions: z.array(
    z.object({
      resource: z.enum(permissionResources),
      actions: z.array(z.enum(permissionActions))
    })
  )
})

type RoleFormValues = z.infer<typeof roleFormSchema>

export default function RoleForm({ params }: { params: { id: string } }) {
  const router = useRouter()
  const isNew = params.id === "new"

  const form = useForm<RoleFormValues>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: {
      name: "",
      description: "",
      permissions: permissionResources.map(resource => ({
        resource,
        actions: []
      }))
    }
  })

  const { data: role, error } = useQuery({
    queryKey: ["role", params.id],
    queryFn: async () => {
      if (isNew) return null
      const response = await fetch(`/api/admin/roles/${params.id}`)
      if (!response.ok) {
        throw new Error("Failed to fetch role")
      }
      return response.json()
    },
    enabled: !isNew
  })

  useEffect(() => {
    if (!role) return

    // Transform the permissions data to match the form structure
    const formattedPermissions = permissionResources.map(resource => {
      const resourcePermissions = role.permissions.filter(
        p => p.resource === resource
      )
      return {
        resource,
        actions: resourcePermissions.map(p => p.action)
      }
    })

    form.reset({
      name: role.name,
      description: role.description,
      permissions: formattedPermissions
    })
  }, [role, form])

  if (error) {
    toast({
      title: "Error",
      description: "Failed to fetch role details. Please try again.",
      variant: "destructive",
    })
  }

  async function onSubmit(data: RoleFormValues) {
    try {
      // Transform the permissions data to match the API structure
      const transformedPermissions = data.permissions.flatMap(p =>
        p.actions.map(action => ({
          resource: p.resource,
          action
        }))
      )

      const response = await fetch(`/api/admin/roles${isNew ? "" : `/${params.id}`}`, {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          permissions: transformedPermissions
        }),
      })

      if (!response.ok) throw new Error("Failed to save role")

      toast({
        title: "Success",
        description: `Role ${isNew ? "created" : "updated"} successfully.`,
      })

      router.push("/admin/roles")
      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="h-full flex-1 flex-col space-y-8 p-8 md:flex">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {isNew ? "Create Role" : "Edit Role"}
          </h2>
          <p className="text-muted-foreground">
            {isNew
              ? "Create a new role with permissions"
              : "Modify role details and permissions"}
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Role Details</CardTitle>
              <CardDescription>
                Basic information about the role
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Project Manager" {...field} />
                    </FormControl>
                    <FormDescription>
                      The name of the role (e.g., "Project Manager")
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="A brief description of the role's responsibilities"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      A brief description of the role's responsibilities
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Permissions</CardTitle>
              <CardDescription>
                Set the permissions for this role
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {permissionResources.map((resource, index) => (
                <div key={resource}>
                  {index > 0 && <Separator className="my-4" />}
                  <div className="space-y-4">
                    <h3 className="font-semibold">{resource}</h3>
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                      {permissionActions.map((action) => (
                        <FormField
                          key={`${resource}.${action}`}
                          control={form.control}
                          name={`permissions.${index}.actions`}
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(action)}
                                  onCheckedChange={(checked) => {
                                    const newActions = checked
                                      ? [...field.value, action]
                                      : field.value?.filter((a) => a !== action)
                                    field.onChange(newActions)
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">
                                {action}
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                      ))}
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
                router.push("/admin/roles")
                router.refresh()
              }}
            >
              Cancel
            </Button>
            <Button type="submit">
              {isNew ? "Create Role" : "Update Role"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
