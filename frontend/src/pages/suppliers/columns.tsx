import type { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Edit, Trash2, ArrowUpDown, Building2, MapPin, Eye, MoreHorizontal } from "lucide-react"
import { createSelectColumn } from "@/components/ui/data-table"
import type { Supplier } from "@/lib/api"

interface SupplierColumnsProps {
  onEdit: (id: number) => void
  onDelete: (id: number) => void
  onView: (id: number) => void
  canEdit?: boolean
  canDelete?: boolean
  canView?: boolean
}

export function createSupplierColumns({
  onEdit,
  onDelete,
  onView,
  canEdit = false,
  canDelete = false,
  canView = false,
}: SupplierColumnsProps): ColumnDef<Supplier>[] {
  return [
    createSelectColumn<Supplier>(),
    {
      accessorKey: "name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 p-0 hover:bg-transparent"
          >
            Supplier Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const supplier = row.original
        return (
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
              <Building2 className="h-4 w-4 text-primary" />
            </div>
            <div>
              <div className="font-medium">{supplier.name}</div>
              <div className="text-sm text-muted-foreground">{supplier.code}</div>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "contact",
      header: "Contact",
      cell: ({ row }) => {
        const supplier = row.original
        return (
          <div>
            {supplier.contact && <div className="font-medium">{supplier.contact}</div>}
            {supplier.phone && <div className="text-sm text-muted-foreground">{supplier.phone}</div>}
            {supplier.email && <div className="text-sm text-muted-foreground">{supplier.email}</div>}
          </div>
        )
      },
    },
    {
      accessorKey: "address",
      header: "Address",
      cell: ({ row }) => {
        const supplier = row.original
        return supplier.address ? (
          <div className="flex items-center gap-2 max-w-[200px]">
            <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="text-sm truncate" title={supplier.address}>
              {supplier.address}
            </span>
          </div>
        ) : (
          <span className="text-muted-foreground">-</span>
        )
      },
    },
    {
      accessorKey: "payment_terms",
      header: "Payment Terms",
      cell: ({ row }) => {
        const supplier = row.original
        return supplier.payment_terms ? (
          <Badge variant="outline">{supplier.payment_terms}</Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
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
        const supplier = row.original
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
                <DropdownMenuItem onClick={() => onView(supplier.id)}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
              )}
              {canEdit && (
                <DropdownMenuItem onClick={() => onEdit(supplier.id)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
              )}
              {canDelete && (
                <DropdownMenuItem
                  onClick={() => onDelete(supplier.id)}
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
