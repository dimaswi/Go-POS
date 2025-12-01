import type { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Eye, Edit, Trash2, ArrowUpDown, MoreHorizontal } from "lucide-react"
import { createSelectColumn } from "@/components/ui/data-table"

interface Permission {
  id: number;
  name: string;
  description: string;
}

interface PermissionColumnsProps {
  onView: (id: number) => void
  onEdit: (id: number) => void
  onDelete: (id: number) => void
  hasViewPermission: boolean
  hasEditPermission: boolean
  hasDeletePermission: boolean
}

export function createPermissionColumns({
  onView,
  onEdit,
  onDelete,
  hasViewPermission,
  hasEditPermission,
  hasDeletePermission,
}: PermissionColumnsProps): ColumnDef<Permission>[] {
  return [
    createSelectColumn<Permission>(),
    {
      accessorKey: "name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 p-0 hover:bg-transparent"
          >
            Nama
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const permission = row.original
        return (
          <div className="flex flex-col">
            <span className="font-medium font-mono text-sm">{permission.name}</span>
          </div>
        )
      },
    },
    {
      accessorKey: "description",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 p-0 hover:bg-transparent"
          >
            Deskripsi
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const description = row.getValue("description") as string
        return (
          <div className="text-muted-foreground">
            {description || "No description"}
          </div>
        )
      },
    },
    {
      id: "actions",
      header: () => <div className="text-right">Aksi</div>,
      cell: ({ row }) => {
        const permission = row.original
        
        return (
          <div className="flex items-center justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Buka menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {hasViewPermission && (
                  <DropdownMenuItem onClick={() => onView(permission.id)}>
                    <Eye className="mr-2 h-4 w-4" />
                    View
                  </DropdownMenuItem>
                )}
                {hasEditPermission && (
                  <DropdownMenuItem onClick={() => onEdit(permission.id)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                )}
                {hasDeletePermission && (
                  <DropdownMenuItem onClick={() => onDelete(permission.id)}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      },
    },
  ]
}
