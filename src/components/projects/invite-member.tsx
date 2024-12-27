"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Project } from "@prisma/client"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"

const inviteFormSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
})

type InviteFormValues = z.infer<typeof inviteFormSchema>

interface InviteMemberProps {
  project: Project
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function InviteMember({
  project,
  open,
  onOpenChange,
}: InviteMemberProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = React.useState<boolean>(false)

  const form = useForm<InviteFormValues>({
    resolver: zodResolver(inviteFormSchema),
    defaultValues: {
      email: "",
    },
  })

  async function onSubmit(data: InviteFormValues) {
    setIsLoading(true)

    const response = await fetch(`/api/projects/${project.id}/invite`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: data.email,
      }),
    })

    if (!response?.ok) {
      toast({
        title: "Something went wrong.",
        description: "The invitation was not sent. Please try again.",
        variant: "destructive",
      })
      return
    }

    toast({
      description: "Invitation has been sent.",
    })

    onOpenChange(false)
    router.refresh()
    form.reset()
    setIsLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite Member</DialogTitle>
          <DialogDescription>
            Invite a new member to join your project.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter member's email address"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                Send Invitation
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
