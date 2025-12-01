import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Play } from "lucide-react";
import { Link } from "react-router-dom";
import type { StockTransfer } from "@/lib/api";

// Utility functions
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('id-ID');
}

interface StockTransferColumnsProps {
  onExecute: (id: number) => void;
}

export function createStockTransferColumns({ onExecute }: StockTransferColumnsProps): ColumnDef<StockTransfer>[] {
  return [
    {
      accessorKey: "transfer_number",
      header: "Transfer Number",
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("transfer_number")}</div>
      ),
    },
    {
      id: "from_location",
      header: "From",
      cell: ({ row }) => {
        const transfer = row.original;
        if (transfer.from_warehouse) {
          return (
            <div>
              <div className="font-medium">{transfer.from_warehouse.name}</div>
              <div className="text-sm text-muted-foreground">Warehouse</div>
            </div>
          );
        }
        if (transfer.from_store) {
          return (
            <div>
              <div className="font-medium">{transfer.from_store.name}</div>
              <div className="text-sm text-muted-foreground">Store</div>
            </div>
          );
        }
        return "-";
      },
    },
    {
      id: "to_location",
      header: "To",
      cell: ({ row }) => {
        const transfer = row.original;
        if (transfer.to_warehouse) {
          return (
            <div>
              <div className="font-medium">{transfer.to_warehouse.name}</div>
              <div className="text-sm text-muted-foreground">Warehouse</div>
            </div>
          );
        }
        if (transfer.to_store) {
          return (
            <div>
              <div className="font-medium">{transfer.to_store.name}</div>
              <div className="text-sm text-muted-foreground">Store</div>
            </div>
          );
        }
        return "-";
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
          pending: "outline",
          in_transit: "secondary",
          completed: "default",
          cancelled: "destructive",
        };
        
        return (
          <Badge variant={variants[status] || "outline"}>
            {status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </Badge>
        );
      },
    },
    {
      id: "items_count",
      header: "Items",
      cell: ({ row }) => {
        const items = row.original.items;
        return (
          <div className="text-center">
            {items ? items.length : 0} items
          </div>
        );
      },
    },
    {
      accessorKey: "requested_by_user",
      header: "Requested By",
      cell: ({ row }) => {
        const user = row.original.requested_by_user;
        return user ? user.full_name : "-";
      },
    },
    {
      accessorKey: "created_at",
      header: "Created Date",
      cell: ({ row }) => formatDate(row.getValue("created_at")),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const transfer = row.original;
        return (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link to={`/stock-transfers/${transfer.id}`}>
                <Eye className="h-4 w-4" />
              </Link>
            </Button>
            {transfer.status === "pending" && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onExecute(transfer.id)}
              >
                <Play className="h-4 w-4 mr-1" />
                Execute
              </Button>
            )}
          </div>
        );
      },
    },
  ];
}
