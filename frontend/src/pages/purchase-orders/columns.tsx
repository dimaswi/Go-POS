import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import type { PurchaseOrder } from "@/lib/api";

// Utility functions
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
  }).format(amount);
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('id-ID');
}

interface PurchaseOrderColumnsProps {
  onReceive: (id: number) => void;
}

export function createPurchaseOrderColumns({ onReceive }: PurchaseOrderColumnsProps): ColumnDef<PurchaseOrder>[] {
  return [
    {
      accessorKey: "purchase_number",
      header: "PO Number",
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("purchase_number")}</div>
      ),
    },
    {
      accessorKey: "supplier_name",
      header: "Supplier",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.getValue("supplier_name")}</div>
          {row.original.supplier_contact && (
            <div className="text-sm text-muted-foreground">
              {row.original.supplier_contact}
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: "warehouse",
      header: "Warehouse",
      cell: ({ row }) => {
        const warehouse = row.original.warehouse;
        return (
          <div>
            <div className="font-medium">{warehouse?.name || "-"}</div>
            {warehouse?.code && (
              <div className="text-sm text-muted-foreground">
                {warehouse.code}
              </div>
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
        const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
          draft: "outline",
          pending: "secondary", 
          received: "default",
          cancelled: "destructive",
        };
        
        return (
          <Badge variant={variants[status] || "outline"}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        );
      },
    },
    {
      accessorKey: "total_amount",
      header: "Total Amount",
      cell: ({ row }) => (
        <div className="font-medium">
          {formatCurrency(row.getValue("total_amount"))}
        </div>
      ),
    },
    {
      accessorKey: "order_date",
      header: "Order Date",
      cell: ({ row }) => formatDate(row.getValue("order_date")),
    },
    {
      accessorKey: "expected_date",
      header: "Expected Date",
      cell: ({ row }) => {
        const date = row.getValue("expected_date") as string;
        return date ? formatDate(date) : "-";
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const po = row.original;
        return (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link to={`/purchase-orders/${po.id}`}>
                <Eye className="h-4 w-4" />
              </Link>
            </Button>
            {po.status === "pending" && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onReceive(po.id)}
              >
                <Package className="h-4 w-4 mr-1" />
                Receive
              </Button>
            )}
          </div>
        );
      },
    },
  ];
}
