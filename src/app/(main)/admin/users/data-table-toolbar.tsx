"use client"

import { Table } from "@tanstack/react-table"
import { X, Download, UserPlus, UserMinus, Trash2, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTableViewOptions } from "./data-table-view-options"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface DataTableToolbarProps<TData> {
  table: Table<TData>
  bulkAction: (params: { userIds: string[], action: string, data?: any }) => void
  isBulkActioning: boolean
}

export function DataTableToolbar<TData>({
  table,
  bulkAction,
  isBulkActioning,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0
  const selectedRows = table.getFilteredSelectedRowModel().rows
  
  // Check if any selected users are admins
  const hasAdminUsers = selectedRows.some(row => 
    row.original.userRole?.some(ur => 
      ur.role.name.toLowerCase() === "admin"
    )
  )

  const handleExport = async () => {
    const searchParams = new URLSearchParams()
    table.getState().columnFilters.forEach(filter => {
      if (filter.value) {
        if (filter.id === "name" || filter.id === "email") {
          searchParams.set("search", filter.value as string)
        }
        if (filter.id === "userRole") {
          searchParams.set("role", filter.value as string)
        }
      }
    })
    
    const response = await fetch(`/api/admin/users/export?${searchParams.toString()}`)
    if (!response.ok) throw new Error("Export failed")
    
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "users.csv"
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        <Input
          placeholder="Search users..."
          value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("name")?.setFilterValue(event.target.value)
          }
          className="h-8 w-[150px] lg:w-[250px]"
        />
        {table.getColumn("userRole") && (
          <Select
            value={(table.getColumn("userRole")?.getFilterValue() as string) ?? "all"}
            onValueChange={(value) =>
              table.getColumn("userRole")?.setFilterValue(value === "all" ? "" : value)
            }
          >
            <SelectTrigger className="h-8 w-[150px]">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All roles</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="user">User</SelectItem>
              <SelectItem value="manager">Manager</SelectItem>
            </SelectContent>
          </Select>
        )}
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => table.resetColumnFilters()}
            className="h-8 px-2 lg:px-3"
          >
            Reset
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
      <div className="flex items-center space-x-2">
        {selectedRows.length > 0 && (
          <TooltipProvider>
            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-8" 
                      disabled={isBulkActioning}
                    >
                      Bulk Actions ({selectedRows.length})
                      {hasAdminUsers && (
                        <Shield className="ml-2 h-4 w-4 text-amber-500" />
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                {hasAdminUsers && (
                  <TooltipContent>
                    Some selected users are admins and will be skipped from destructive actions
                  </TooltipContent>
                )}
              </Tooltip>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => bulkAction({
                    userIds: selectedRows.map(row => row.original.id),
                    action: "assignRole",
                    data: { roleId: "user" }
                  })}
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Assign User Role
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => bulkAction({
                    userIds: selectedRows.map(row => row.original.id),
                    action: "removeRole",
                    data: { roleId: "user" }
                  })}
                >
                  <UserMinus className="mr-2 h-4 w-4" />
                  Remove User Role
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-600"
                  onClick={() => {
                    if (hasAdminUsers) {
                      const nonAdminUsers = selectedRows.filter(row => 
                        !row.original.userRole?.some(ur => 
                          ur.role.name.toLowerCase() === "admin"
                        )
                      )
                      bulkAction({
                        userIds: nonAdminUsers.map(row => row.original.id),
                        action: "delete"
                      })
                    } else {
                      bulkAction({
                        userIds: selectedRows.map(row => row.original.id),
                        action: "delete"
                      })
                    }
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Selected
                  {hasAdminUsers && (
                    <Shield className="ml-2 h-4 w-4 text-amber-500" />
                  )}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </TooltipProvider>
        )}
        <Button
          variant="outline"
          size="sm"
          className="h-8"
          onClick={handleExport}
        >
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
        <DataTableViewOptions table={table} />
      </div>
    </div>
  )
}
