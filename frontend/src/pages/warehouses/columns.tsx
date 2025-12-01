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
  Warehouse,
  MapPin
} from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

export interface Warehouse {
  id: number;
  name: string;
  code: string;
  address: string;
  phone: string;
  manager_id?: number;
  manager?: {
    id: number;
    full_name: string;
    email: string;
  };
  store_id?: number;
  store?: {
    id: number;
    name: string;
    code: string;
  };
  type: string; // main, branch, virtual
  status: string; // active, inactive
  created_at: string;
  updated_at: string;
}

interface ActionsProps {
  row: Warehouse;
  onView: (warehouseId: number) => void;
  onEdit: (warehouseId: number) => void;
  onDelete: (warehouseId: number) => void;
}

const ActionsCell = ({ row, onView, onEdit, onDelete }: ActionsProps) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" className="h-8 w-8 p-0">
        <span className="sr-only">Open menu</span>
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

export const createWarehouseColumns = ({
  onView,
  onEdit,
  onDelete,
}: {
  onView: (warehouseId: number) => void;
  onEdit: (warehouseId: number) => void;
  onDelete: (warehouseId: number) => void;
}): ColumnDef<Warehouse>[] => [
  {
    accessorKey: "code",
    header: "Kode",
    cell: ({ row }) => (
      <div className="font-medium text-sm">{row.getValue("code")}</div>
    ),
  },
  {
    accessorKey: "name",
    header: "Nama Warehouse",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
          <Warehouse className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="font-medium text-sm">{row.getValue("name")}</div>
      </div>
    ),
  },
  {
    accessorKey: "type",
    header: "Tipe",
    cell: ({ row }) => {
      const type = row.getValue("type") as string;
      const typeLabels = {
        main: "Main",
        branch: "Branch", 
        virtual: "Virtual"
      };
      const typeColors = {
        main: "default",
        branch: "secondary",
        virtual: "outline"
      } as const;
      
      return (
        <Badge variant={typeColors[type as keyof typeof typeColors]} className="text-xs">
          {typeLabels[type as keyof typeof typeLabels] || type}
        </Badge>
      );
    },
  },
  {
    accessorKey: "store",
    header: "Store",
    cell: ({ row }) => {
      const store = row.getValue("store") as Warehouse["store"];
      return (
        <div className="text-sm">
          {store ? (
            <Badge variant="secondary" className="text-xs">
              {store.name}
            </Badge>
          ) : (
            <span className="text-muted-foreground">-</span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "address",
    header: "Alamat",
    cell: ({ row }) => {
      const address = row.getValue("address") as string;
      return (
        <div className="text-sm text-muted-foreground max-w-[200px] truncate">
          {address ? (
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3 flex-shrink-0" />
              {address}
            </div>
          ) : (
            "-"
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "manager",
    header: "Manager",
    cell: ({ row }) => {
      const manager = row.getValue("manager") as Warehouse["manager"];
      return (
        <div className="text-sm">
          {manager ? (
            <div>
              <div className="font-medium">{manager.full_name}</div>
              <div className="text-xs text-muted-foreground">{manager.email}</div>
            </div>
          ) : (
            <span className="text-muted-foreground">-</span>
          )}
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
          {status === "active" ? "Aktif" : "Nonaktif"}
        </Badge>
      );
    },
  },
  {
    accessorKey: "created_at",
    header: "Dibuat",
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
