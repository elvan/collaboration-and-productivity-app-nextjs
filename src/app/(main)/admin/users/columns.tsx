"use client"

import { ColumnDef } from "@tanstack/react-table"
import { User } from "@prisma/client"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { DataTableColumnHeader } from "./data-table-column-header"
import { DataTableRowActions } from "./data-table-row-actions"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Pencil, Trash2, Shield } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export const columns: ColumnDef<User>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    cell: ({ row }) => {
      const isAdmin = row.original.userRole?.some(
        (ur: any) => ur.role.name.toLowerCase() === "admin"
      )

      return (
        <div className="flex items-center">
          <Avatar className="h-8 w-8">
            <AvatarImage src={row.original.image || ""} alt={row.getValue("name")} />
            <AvatarFallback>
              {row.getValue<string>("name")?.charAt(0).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <span className="ml-2 font-medium">{row.getValue("name")}</span>
          {isAdmin && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Shield className="ml-2 h-4 w-4 text-amber-500" />
                </TooltipTrigger>
                <TooltipContent>
                  Admin user - protected from deletion
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      )
    },
    enableSorting: true,
    enableHiding: true,
    filterFn: "includesString",
  },
  {
    accessorKey: "email",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Email" />
    ),
    cell: ({ row }) => {
      return (
        <div className="flex space-x-2">
          <span className="max-w-[500px] truncate font-medium">
            {row.getValue("email")}
          </span>
        </div>
      )
    },
    enableSorting: true,
    enableHiding: true,
    filterFn: "includesString",
  },
  {
    accessorKey: "userRole",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Roles" />
    ),
    cell: ({ row }) => {
      const roles = row.original.userRole
      return (
        <div className="flex gap-1">
          {roles.map((role: any) => (
            <Badge key={role.roleId} variant="outline">
              {role.role.name}
            </Badge>
          ))}
        </div>
      )
    },
    enableSorting: true,
    enableHiding: true,
    filterFn: (row, id, value) => {
      const roles = row.original.userRole
      return roles.some((role: any) => 
        role.role.name.toLowerCase().includes(value.toLowerCase())
      )
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const isAdmin = row.original.userRole?.some(
        (ur: any) => ur.role.name.toLowerCase() === "admin"
      )

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(row.getValue("email"))}
            >
              Copy email
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            {isAdmin ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuItem
                      className="text-gray-400 cursor-not-allowed"
                      disabled
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                      <Shield className="ml-2 h-4 w-4 text-amber-500" />
                    </DropdownMenuItem>
                  </TooltipTrigger>
                  <TooltipContent>
                    Admin users cannot be deleted
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <DropdownMenuItem className="text-red-600">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
    enableHiding: false,
  },
]
