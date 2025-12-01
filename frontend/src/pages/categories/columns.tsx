import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Trash2, 
  Layers3
} from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

export interface Category {
  id: number;
  name: string;
  code: string;
  description: string;
  parent_id?: number;
  parent?: {
    id: number;
    name: string;
    code: string;
  };
  image_url: string;
  status: string; // active, inactive
  created_at: string;
  updated_at: string;
}

interface ActionsProps {
  row: Category;
  onView: (categoryId: number) => void;
  onEdit: (categoryId: number) => void;
  onDelete: (categoryId: number) => void;
}

const ActionsCell = ({ row, onView, onEdit, onDelete }: ActionsProps) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" className="h-8 w-8 p-0">
        <span className="sr-only">Buka menu</span>
        <MoreHorizontal className="h-4 w-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="w-[160px]">
      <DropdownMenuItem onClick={() => onView(row.id)} className="text-sm">
        <Eye className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
        View
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => onEdit(row.id)} className="text-sm">
        <Edit className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
        Edit
      </DropdownMenuItem>
      <DropdownMenuItem
        onClick={() => onDelete(row.id)}
        className="text-sm text-destructive focus:text-destructive"
      >
        <Trash2 className="mr-2 h-3.5 w-3.5" />
        Delete
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
);

export const createCategoryColumns = ({
  onView,
  onEdit,
  onDelete,
}: {
  onView: (categoryId: number) => void;
  onEdit: (categoryId: number) => void;
  onDelete: (categoryId: number) => void;
}): ColumnDef<Category>[] => [
  {
    accessorKey: "code",
    header: "Code",
    cell: ({ row }) => (
      <div className="font-medium text-sm">{row.getValue("code")}</div>
    ),
  },
  {
    accessorKey: "name",
    header: "Category Name",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
          <Layers3 className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="font-medium text-sm">{row.getValue("name")}</div>
      </div>
    ),
  },
  {
    accessorKey: "parent",
    header: "Parent Category",
    cell: ({ row }) => {
      const parent = row.getValue("parent") as Category["parent"];
      return (
        <div className="text-sm">
          {parent ? (
            <Badge variant="secondary" className="text-xs">
              {parent.name}
            </Badge>
          ) : (
            <span className="text-muted-foreground">-</span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => {
      const description = row.getValue("description") as string;
      return (
        <div className="text-sm text-muted-foreground max-w-[200px] truncate">
          {description || "-"}
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return (
        <Badge
          variant={status === "active" ? "default" : "secondary"}
          className="text-xs"
        >
          {status === "active" ? "Active" : "Inactive"}
        </Badge>
      );
    },
  },
  {
    accessorKey: "created_at",
    header: "Created",
    cell: ({ row }) => {
      const date = new Date(row.getValue("created_at"));
      return (
        <div className="text-xs text-muted-foreground">
          {format(date, "dd MMM yyyy", { locale: idLocale })}
        </div>
      );
    },
  },
  {
    id: "actions",
    header: () => <div className="text-right">Actions</div>,
    cell: ({ row }) => (
      <div className="text-right">
        <ActionsCell
          row={row.original}
          onView={onView}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </div>
    ),
  },
];
