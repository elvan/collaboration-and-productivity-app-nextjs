"use client"

import * as React from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  ColumnDef,
  ColumnFiltersState,
  PaginationState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { DataTablePagination } from "./data-table-pagination"
import { DataTableToolbar } from "./data-table-toolbar"
import { toast } from "@/components/ui/use-toast"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
}

async function getUsers({ 
  page, 
  pageSize, 
  sorting, 
  filters 
}: { 
  page: number
  pageSize: number
  sorting: SortingState
  filters: ColumnFiltersState
}) {
  const searchParams = new URLSearchParams()
  
  // Add pagination params
  searchParams.set("page", String(page))
  searchParams.set("pageSize", String(pageSize))
  
  // Add sorting params
  if (sorting.length > 0) {
    searchParams.set("sortBy", sorting[0].id)
    searchParams.set("sortOrder", sorting[0].desc ? "desc" : "asc")
  }
  
  // Add filter params
  filters.forEach(filter => {
    if (filter.value) {
      if (filter.id === "name" || filter.id === "email") {
        searchParams.set("search", filter.value as string)
      }
      if (filter.id === "userRole") {
        searchParams.set("role", filter.value as string)
      }
    }
  })

  const response = await fetch(`/api/admin/users?${searchParams.toString()}`)
  if (!response.ok) throw new Error("Failed to fetch users")
  return response.json()
}

export function DataTable<TData, TValue>({
  columns,
}: DataTableProps<TData, TValue>) {
  const queryClient = useQueryClient()
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })

  const { data, error, isFetching } = useQuery({
    queryKey: ["users", pagination, sorting, columnFilters],
    queryFn: () => getUsers({
      page: pagination.pageIndex + 1,
      pageSize: pagination.pageSize,
      sorting,
      filters: columnFilters,
    }),
  })

  const bulkActionMutation = useMutation({
    mutationFn: async ({ userIds, action, data }: { userIds: string[], action: string, data?: any }) => {
      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIds, action, data }),
      })
      if (!response.ok) throw new Error("Failed to perform bulk action")
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] })
      setRowSelection({})
      toast({
        title: "Success",
        description: "Bulk action completed successfully",
      })
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to perform bulk action",
        variant: "destructive",
      })
    },
  })

  if (error) {
    toast({
      title: "Error",
      description: "Failed to fetch users. Please try again.",
      variant: "destructive",
    })
  }

  const table = useReactTable({
    data: data?.users ?? [],
    columns,
    pageCount: data?.pagination?.pageCount ?? -1,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
  })

  return (
    <div className="space-y-4">
      <DataTableToolbar 
        table={table} 
        bulkAction={bulkActionMutation.mutate}
        isBulkActioning={bulkActionMutation.isPending}
      />
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} colSpan={header.colSpan}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  {isFetching ? "Loading..." : "No results."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} />
    </div>
  )
}
