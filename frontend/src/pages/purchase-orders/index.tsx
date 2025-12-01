import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { useToast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";
import { purchaseOrdersApi, type PurchaseOrder } from "@/lib/api";
import { createPurchaseOrderColumns } from "./columns";
import { setPageTitle } from "@/lib/page-title";
import { usePermission } from "@/hooks/usePermission";

export default function PurchaseOrdersIndex() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { hasPermission } = usePermission();
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const loadData = async (page = 1) => {
    try {
      const response = await purchaseOrdersApi.getAll({
        page,
        limit: pagination.limit,
      });
      
      setPurchaseOrders(response.data.data);
      setPagination({
        page: response.data.pagination.current_page,
        limit: response.data.pagination.per_page,
        total: response.data.pagination.total,
        totalPages: response.data.pagination.total_pages,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: "Failed to load purchase orders.",
      });
    }
  };

  useEffect(() => {
    setPageTitle("Purchase Orders");
    loadData();
  }, []);

  const handleReceive = async (id: number) => {
    navigate(`/purchase-orders/receive/${id}`);
  };

  const columns = createPurchaseOrderColumns({ onReceive: handleReceive });

  return (
    <div className="flex flex-1 flex-col gap-3 p-3 sm:p-4 lg:p-6">
      <Card className="shadow-md">
        <CardHeader className="border-b bg-muted/50 p-3 sm:p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <CardTitle className="text-sm font-semibold truncate">
                Purchase Orders
              </CardTitle>
              <CardDescription className="text-xs hidden sm:block">
                Kelola pengadaan stok dari supplier
              </CardDescription>
            </div>
            {hasPermission("purchase_orders.create") && (
              <Button
                onClick={() => navigate("/purchase-orders/create")}
                size="sm"
                className="h-8 text-xs shrink-0"
              >
                <Plus className="h-3.5 w-3.5 sm:mr-1" />
                <span className="hidden sm:inline">Buat PO</span>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={purchaseOrders}
            searchPlaceholder="Cari..."
            pageSize={10}
            mobileHiddenColumns={["supplier", "warehouse", "total", "created_at", "select"]}
            serverPagination={{
              page: pagination.page,
              totalPages: pagination.totalPages,
              total: pagination.total,
              onPageChange: (newPage) => loadData(newPage)
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
