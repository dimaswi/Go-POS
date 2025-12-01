import type { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Eye, Edit, Trash2, ArrowUpDown, MoreHorizontal } from "lucide-react"
import { createSelectColumn } from "@/components/ui/data-table"

interface Role {
  id: number;
  name: string;
  description: string;
  permissions?: Permission[];
}

interface Permission {
  id: number;
  name: string;
  description: string;
}

interface RoleColumnsProps {
  onView: (id: number) => void
  onEdit: (id: number) => void
  onDelete: (id: number) => void
  hasViewPermission: boolean
  hasEditPermission: boolean
  hasDeletePermission: boolean
}

export function createRoleColumns({
  onView,
  onEdit,
  onDelete,
  hasViewPermission,
  hasEditPermission,
  hasDeletePermission,
}: RoleColumnsProps): ColumnDef<Role>[] {
  return [
    createSelectColumn<Role>(),
    {
      accessorKey: "name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 p-0 hover:bg-transparent"
          >
            Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const role = row.original
        return (
          <div className="flex flex-col">
            <span className="font-medium">{role.name}</span>
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
            Description
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
      accessorKey: "permissions",
      header: "Permissions",
      cell: ({ row }) => {
        const role = row.original
        const permissionCount = role.permissions?.length || 0
        return (
          <Badge variant="outline" className="font-normal">
            {permissionCount} permission{permissionCount !== 1 ? 's' : ''}
          </Badge>
        )
      },
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => {
        const role = row.original
        
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
                {hasViewPermission && (
                  <DropdownMenuItem onClick={() => onView(role.id)}>
                    <Eye className="mr-2 h-4 w-4" />
                    View
                  </DropdownMenuItem>
                )}
                {hasEditPermission && (
                  <DropdownMenuItem onClick={() => onEdit(role.id)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                )}
                {hasDeletePermission && (
                  <DropdownMenuItem onClick={() => onDelete(role.id)}>
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
