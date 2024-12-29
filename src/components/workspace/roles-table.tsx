"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { WorkspaceRole } from "@prisma/client"

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  permissions: z.array(z.string()).min(1, "At least one permission is required"),
})

interface RolesTableProps {
  workspaceRoles: WorkspaceRole[];
  workspaceId: string;
}

const AVAILABLE_PERMISSIONS = [
  "read",
  "write",
  "delete",
  "manage_members",
  "manage_roles",
  "manage_settings",
]

export function RolesTable({ workspaceRoles, workspaceId }: RolesTableProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      permissions: [],
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/roles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error('Failed to create role');
      }

      toast({
        title: 'Success',
        description: 'Role created successfully',
      });
      setOpen(false);
      router.refresh();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create role',
        variant: 'destructive',
      });
    }
  }

  return (
    <div>
      <div className='flex justify-between items-center mb-4'>
        <h2 className='text-lg font-semibold'>Workspace Roles</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>Create Role</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Role</DialogTitle>
              <DialogDescription>
                Create a new role with custom permissions.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className='space-y-4'
              >
                <FormField
                  control={form.control}
                  name='name'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder='Role name' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='permissions'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Permissions</FormLabel>
                      <div className='flex flex-wrap gap-2'>
                        {AVAILABLE_PERMISSIONS.map((permission) => (
                          <Badge
                            key={permission}
                            variant={
                              field.value.includes(permission)
                                ? 'default'
                                : 'outline'
                            }
                            className='cursor-pointer'
                            onClick={() => {
                              const newValue = field.value.includes(permission)
                                ? field.value.filter((p) => p !== permission)
                                : [...field.value, permission];
                              field.onChange(newValue);
                            }}
                          >
                            {permission}
                          </Badge>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type='submit' loading={form.formState.isSubmitting}>
                    Create
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Role</TableHead>
            <TableHead>Permissions</TableHead>
            <TableHead>Default</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {workspaceRoles.map((role) => (
            <TableRow key={role.id}>
              <TableCell className='font-medium'>{role.name}</TableCell>
              <TableCell>
                <div className='flex flex-wrap gap-1'>
                  {(role.permissions as string[]).map((permission) => (
                    <Badge key={permission} variant='secondary'>
                      {permission}
                    </Badge>
                  ))}
                </div>
              </TableCell>
              <TableCell>
                {role.isDefault && <Badge variant='default'>Default</Badge>}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
