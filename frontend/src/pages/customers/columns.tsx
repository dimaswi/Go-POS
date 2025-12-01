import type { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Edit, Trash2, ArrowUpDown, User, Eye, MoreHorizontal, Star, Crown } from "lucide-react"
import { createSelectColumn } from "@/components/ui/data-table"
import type { Customer } from "@/lib/api"

interface CustomerColumnsProps {
  onEdit: (id: number) => void
  onDelete: (id: number) => void
  onView: (id: number) => void
  canEdit?: boolean
  canDelete?: boolean
  canView?: boolean
}

export function createCustomerColumns({
  onEdit,
  onDelete,
  onView,
  canEdit = false,
  canDelete = false,
  canView = false,
}: CustomerColumnsProps): ColumnDef<Customer>[] {
  return [
    createSelectColumn<Customer>(),
    {
      accessorKey: "name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 p-0 hover:bg-transparent"
          >
            Customer Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const customer = row.original
        return (
          <div className="flex items-center gap-3">
            <div className={`flex h-8 w-8 items-center justify-center rounded-full ${customer.is_member ? 'bg-yellow-100 dark:bg-yellow-900' : 'bg-primary/10'}`}>
              {customer.is_member ? (
                <Crown className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              ) : (
                <User className="h-4 w-4 text-primary" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{customer.name}</span>
                {customer.is_member && (
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300 dark:bg-yellow-900/50 dark:text-yellow-400 dark:border-yellow-600 text-xs py-0">
                    <Crown className="h-3 w-3 mr-1" />
                    Member
                  </Badge>
                )}
              </div>
              {customer.email && (
                <div className="text-sm text-muted-foreground">{customer.email}</div>
              )}
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "phone",
      header: "Phone",
      cell: ({ row }) => {
        const customer = row.original
        return customer.phone ? (
          <span className="text-sm">{customer.phone}</span>
        ) : (
          <span className="text-muted-foreground">-</span>
        )
      },
    },
    {
      accessorKey: "loyalty_points",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 p-0 hover:bg-transparent"
          >
            Loyalty Points
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const points = row.getValue("loyalty_points") as number
        return (
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-yellow-500" />
            <span className="font-medium">{points.toLocaleString()}</span>
          </div>
        )
      },
    },
    {
      accessorKey: "total_spent",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 p-0 hover:bg-transparent"
          >
            Total Spent
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const amount = row.getValue("total_spent") as number
        return (
          <span className="font-medium">
            Rp {amount.toLocaleString('id-ID')}
          </span>
        )
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string
        return (
          <Badge variant={status === "active" ? "default" : "secondary"}>
            {status}
          </Badge>
        )
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const customer = row.original
        const hasActions = canView || canEdit || canDelete

        if (!hasActions) return null

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {canView && (
                <DropdownMenuItem onClick={() => onView(customer.id)}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
              )}
              {canEdit && (
                <DropdownMenuItem onClick={() => onEdit(customer.id)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
              )}
              {canDelete && (
                <DropdownMenuItem 
                  onClick={() => onDelete(customer.id)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]
}
