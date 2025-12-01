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
  Package 
} from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

// Simple column header component
const DataTableColumnHeader = ({ title }: { title: string }) => (
  <div className="text-xs font-medium">{title}</div>
);

export interface Product {
  id: number;
  name: string;
  sku: string;
  barcode: string;
  category_id?: number;
  category?: {
    id: number;
    name: string;
    code: string;
  };
  description: string;
  unit: string;
  cost_price: number;
  selling_price: number;
  min_stock: number;
  max_stock?: number;
  is_trackable: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface ActionsProps {
  row: Product;
  onView: (product: Product) => void;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
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
      <DropdownMenuItem onClick={() => onView(row)} className="text-sm">
        <Eye className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
        View
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => onEdit(row)} className="text-sm">
        <Edit className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
        Edit
      </DropdownMenuItem>
      <DropdownMenuItem
        onClick={() => onDelete(row)}
        className="text-sm text-destructive focus:text-destructive"
      >
        <Trash2 className="mr-2 h-3.5 w-3.5" />
        Delete
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
);

export const createProductColumns = (
  onView: (product: Product) => void,
  onEdit: (product: Product) => void,
  onDelete: (product: Product) => void
): ColumnDef<Product>[] => [
  {
    accessorKey: "sku",
    header: () => (
      <DataTableColumnHeader title="SKU" />
    ),
    cell: ({ row }) => (
      <div className="font-medium text-xs">{row.getValue("sku")}</div>
    ),
  },
  {
    accessorKey: "name",
    header: () => (
      <DataTableColumnHeader title="Produk" />
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <div className="flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center rounded-md bg-muted flex-shrink-0">
          <Package className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
        </div>
        <div className="font-medium text-xs sm:text-sm truncate max-w-[120px] sm:max-w-none">{row.getValue("name")}</div>
      </div>
    ),
  },
  {
    accessorKey: "category",
    header: () => (
      <DataTableColumnHeader title="Kategori" />
    ),
    cell: ({ row }) => {
      const category = row.getValue("category") as Product["category"];
      return (
        <div className="text-sm">
          {category ? (
            <Badge variant="secondary" className="text-xs">
              {category.name}
            </Badge>
          ) : (
            <span className="text-muted-foreground">-</span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "unit",
    header: () => (
      <DataTableColumnHeader title="Satuan" />
    ),
    cell: ({ row }) => (
      <div className="text-sm">{row.getValue("unit")}</div>
    ),
  },
  {
    accessorKey: "cost_price",
    header: () => (
      <DataTableColumnHeader title="Harga Beli" />
    ),
    cell: ({ row }) => {
      const price = parseFloat(row.getValue("cost_price"));
      return (
        <div className="text-sm font-medium">
          {new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
          }).format(price)}
        </div>
      );
    },
  },
  {
    accessorKey: "selling_price",
    header: () => (
      <DataTableColumnHeader title="Harga Jual" />
    ),
    cell: ({ row }) => {
      const price = parseFloat(row.getValue("selling_price"));
      return (
        <div className="text-sm font-medium">
          {new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
          }).format(price)}
        </div>
      );
    },
  },
  {
    accessorKey: "is_active",
    header: () => (
      <DataTableColumnHeader title="Status" />
    ),
    cell: ({ row }) => {
      const isActive = row.getValue("is_active") as boolean;
      return (
        <Badge
          variant={isActive ? "default" : "secondary"}
          className={`text-xs ${isActive ? "bg-green-500 hover:bg-green-600 text-white" : ""}`}
        >
          {isActive ? "Aktif" : "Nonaktif"}
        </Badge>
      );
    },
  },
  {
    accessorKey: "created_at",
    header: () => (
      <DataTableColumnHeader title="Dibuat" />
    ),
    cell: ({ row }) => {
      const date = new Date(row.getValue("created_at"));
      return (
        <div className="text-xs text-muted-foreground">
          {format(date, "dd MMM yyyy", { locale: id })}
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
