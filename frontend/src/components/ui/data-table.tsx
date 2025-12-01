"use client"

import * as React from "react"
import type {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
} from "@tanstack/react-table"
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react"

import { useIsMobile } from "@/hooks/use-mobile"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  searchPlaceholder?: string
  showColumnVisibility?: boolean
  showPagination?: boolean
  showSearch?: boolean
  pageSize?: number
  customFilters?: React.ReactNode
  mobileHiddenColumns?: string[]
  // Server-side pagination props
  serverPagination?: {
    page: number
    totalPages: number
    total: number
    onPageChange: (page: number) => void
  }
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchPlaceholder = "Search...",
  showColumnVisibility = true,
  showPagination = true,
  showSearch = true,
  pageSize = 10,
  customFilters,
  mobileHiddenColumns = [],
  serverPagination,
}: DataTableProps<TData, TValue>) {
  const isMobile = useIsMobile()
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [globalFilter, setGlobalFilter] = React.useState("")

  // Auto-hide columns on mobile
  React.useEffect(() => {
    if (isMobile && mobileHiddenColumns.length > 0) {
      const hiddenCols: VisibilityState = {}
      mobileHiddenColumns.forEach(col => {
        hiddenCols[col] = false
      })
      setColumnVisibility(prev => ({ ...prev, ...hiddenCols }))
    } else if (!isMobile && mobileHiddenColumns.length > 0) {
      const visibleCols: VisibilityState = {}
      mobileHiddenColumns.forEach(col => {
        visibleCols[col] = true
      })
      setColumnVisibility(prev => ({ ...prev, ...visibleCols }))
    }
  }, [isMobile, mobileHiddenColumns])

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: "includesString",
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
    },
    initialState: {
      pagination: {
        pageSize,
      },
    },
  })

  return (
    <div className="w-full">
      {/* Search and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
          {showSearch && (
            <Input
              placeholder={searchPlaceholder}
              value={globalFilter ?? ""}
              onChange={(event) => setGlobalFilter(event.target.value)}
              className="w-full sm:max-w-sm h-9 text-sm"
            />
          )}
          {customFilters}
        </div>
        {showColumnVisibility && !isMobile && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="w-full sm:w-auto sm:ml-auto h-9">
                Columns <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column: any) => column.getCanHide())
                .map((column: any) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Table */}
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup: any) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header: any) => {
                  return (
                    <TableHead key={header.id} className="text-xs whitespace-nowrap px-2 sm:px-4">
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
              table.getRowModel().rows.map((row: any) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell: any) => (
                    <TableCell key={cell.id} className="text-xs sm:text-sm px-2 sm:px-4 py-2 sm:py-3">
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
                  className="h-24 text-center text-sm"
                >
                  Tidak ada data.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {showPagination && (
        <div className="flex items-center justify-between gap-2 p-3 sm:p-4 border-t">
          <div className="text-xs text-muted-foreground hidden sm:block">
            {serverPagination ? serverPagination.total : table.getFilteredRowModel().rows.length} item
          </div>
          <div className="flex items-center gap-2 mx-auto sm:mx-0">
            <div className="text-xs font-medium whitespace-nowrap">
              {serverPagination 
                ? `${serverPagination.page}/${serverPagination.totalPages}`
                : `${table.getState().pagination.pageIndex + 1}/${table.getPageCount()}`
              }
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                onClick={() => {
                  if (serverPagination) {
                    serverPagination.onPageChange(serverPagination.page - 1)
                  } else {
                    table.previousPage()
                  }
                }}
                disabled={serverPagination ? serverPagination.page <= 1 : !table.getCanPreviousPage()}
              >
                <ChevronLeft className="h-3 w-3" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                onClick={() => {
                  if (serverPagination) {
                    serverPagination.onPageChange(serverPagination.page + 1)
                  } else {
                    table.nextPage()
                  }
                }}
                disabled={serverPagination ? serverPagination.page >= serverPagination.totalPages : !table.getCanNextPage()}
              >
                <ChevronRight className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Helper function to create a select column
export function createSelectColumn<T>(): ColumnDef<T> {
  return {
    id: "select",
    header: ({ table }: any) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }: any) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  }
}