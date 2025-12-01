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
import { stockTransfersApi, type StockTransfer } from "@/lib/api";
import { createStockTransferColumns } from "./columns";
import { setPageTitle } from "@/lib/page-title";
import { usePermission } from "@/hooks/usePermission";

export default function StockTransfersIndex() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { hasPermission } = usePermission();
  const [stockTransfers, setStockTransfers] = useState<StockTransfer[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
  });

  const loadData = async (page = 1) => {
    try {
      const response = await stockTransfersApi.getAll({
        page,
        limit: pagination.limit,
      });
      
      setStockTransfers(response.data.data);
      setPagination({
        page: response.data.pagination.current_page,
        limit: response.data.pagination.per_page,
        total: response.data.pagination.total,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: "Failed to load stock transfers.",
      });
    }
  };

  useEffect(() => {
    setPageTitle("Stock Transfers");
    loadData();
  }, []);

  const handleExecute = async (id: number) => {
    try {
      await stockTransfersApi.execute(id);
      toast({
        variant: "default",
        title: "Success!",
        description: "Stock transfer executed successfully.",
      });
      loadData(pagination.page);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: "Failed to execute stock transfer.",
      });
    }
  };

  const columns = createStockTransferColumns({ onExecute: handleExecute });

  return (
    <div className="flex flex-1 flex-col gap-3 p-3 sm:p-4 lg:p-6">
      <Card className="shadow-md">
        <CardHeader className="border-b bg-muted/50 p-3 sm:p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <CardTitle className="text-sm font-semibold truncate">
                Stock Transfers
              </CardTitle>
              <CardDescription className="text-xs hidden sm:block">
                Manage stock transfers between locations
              </CardDescription>
            </div>
            {hasPermission("stock_transfers.create") && (
              <Button
                onClick={() => navigate("/stock-transfers/create")}
                size="sm"
                className="h-8 text-xs shrink-0"
              >
                <Plus className="h-3.5 w-3.5 sm:mr-1" />
                <span className="hidden sm:inline">Buat Transfer</span>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={stockTransfers}
            searchPlaceholder="Cari..."
            pageSize={10}
            mobileHiddenColumns={["from_location", "to_location", "quantity", "created_at", "select"]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
