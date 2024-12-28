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
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const userFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  image: z.string().optional(),
})

type UserFormValues = z.infer<typeof userFormSchema>

export default function UserForm({ params }: { params: { id: string } }) {
  const router = useRouter()
  const isNew = params.id === "new"

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: "",
      email: "",
      image: "",
    }
  })

  const { data: user, error } = useQuery({
    queryKey: ["user", params.id],
    queryFn: async () => {
      if (isNew) return null
      const response = await fetch(`/api/admin/users/${params.id}`)
      if (!response.ok) {
        throw new Error("Failed to fetch user")
      }
      return response.json()
    },
    enabled: !isNew
  })

  useEffect(() => {
    if (!user) return

    form.reset({
      name: user.name,
      email: user.email,
      image: user.image || "",
    })
  }, [user, form])

  if (error) {
    toast({
      title: "Error",
      description: "Failed to fetch user details. Please try again.",
      variant: "destructive",
    })
  }

  async function onSubmit(data: UserFormValues) {
    try {
      const response = await fetch(`/api/admin/users${isNew ? "" : `/${params.id}`}`, {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) throw new Error("Failed to save user")

      toast({
        title: "Success",
        description: `User ${isNew ? "created" : "updated"} successfully.`,
      })

      router.push("/admin/users")
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
            {isNew ? "Create User" : "Edit User"}
          </h2>
          <p className="text-muted-foreground">
            {isNew
              ? "Create a new user account"
              : "Modify user account details"}
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>User Details</CardTitle>
              <CardDescription>
                Basic information about the user
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isNew && (
                <div className="flex items-center space-x-4 mb-6">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={user?.image || ""} alt={user?.name} />
                    <AvatarFallback>
                      {user?.name?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                </div>
              )}

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormDescription>
                      The user's full name
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input 
                        type="email" 
                        placeholder="john@example.com" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      The user's email address
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="image"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Profile Image URL</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="https://example.com/avatar.jpg" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      URL to the user's profile image (optional)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
              Cancel
            </Button>
            <Button type="submit">
              {isNew ? "Create User" : "Update User"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
