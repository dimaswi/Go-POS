import type { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Edit, Trash2, ArrowUpDown, Store as StoreIcon, MapPin, Eye, MoreHorizontal } from "lucide-react"
import { createSelectColumn } from "@/components/ui/data-table"
import type { Store } from "@/lib/api"

interface StoreColumnsProps {
  onEdit: (id: number) => void
  onDelete: (id: number) => void
  onView: (id: number) => void
}

export function createStoreColumns({
  onEdit,
  onDelete,
  onView,
}: StoreColumnsProps): ColumnDef<Store>[] {
  return [
    createSelectColumn<Store>(),
    {
      accessorKey: "name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 p-0 hover:bg-transparent"
          >
            Store Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const store = row.original
        return (
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
              <StoreIcon className="h-4 w-4 text-primary" />
            </div>
            <div>
              <div className="font-medium">{store.name}</div>
              <div className="text-sm text-muted-foreground">{store.code}</div>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "address",
      header: "Address",
      cell: ({ row }) => {
        const store = row.original
        return (
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{store.address || "No address"}</span>
          </div>
        )
      },
    },
    {
      accessorKey: "phone",
      header: "Phone",
      cell: ({ row }) => (
        <span className="text-sm font-mono">{row.getValue("phone") || "No phone"}</span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string
        return (
          <Badge variant={status === "active" ? "default" : "secondary"}>
            {status === "active" ? "Active" : "Inactive"}
          </Badge>
        )
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const store = row.original
        
        return (
          <div className="flex items-center justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onView(store.id)}>
                  <Eye className="mr-2 h-4 w-4" />
                  View
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(store.id)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDelete(store.id)}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      },
    },
  ]
}
