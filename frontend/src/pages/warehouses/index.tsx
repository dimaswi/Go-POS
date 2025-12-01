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
import { usePermission } from "@/hooks/usePermission";
import { Plus, Loader2 } from "lucide-react";
import { warehousesApi } from "@/lib/api";
import { createWarehouseColumns, type Warehouse } from "./columns";
import { setPageTitle } from "@/lib/page-title";
import { ConfirmDialog } from "@/components/confirm-dialog";

export default function WarehousesIndex() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { hasPermission } = usePermission();
  const [loading, setLoading] = useState(false);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [warehouseToDelete, setWarehouseToDelete] = useState<number | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    setPageTitle("Manajemen Gudang");
    loadWarehouses();
  }, []);

  const loadWarehouses = async (page = 1) => {
    setLoading(true);
    try {
      const response = await warehousesApi.getAll({ page, limit: pagination.limit });
      setWarehouses(response.data.data || []);
      if (response.data.pagination) {
        setPagination({
          page: response.data.pagination.current_page || page,
          limit: response.data.pagination.per_page || 10,
          total: response.data.pagination.total || 0,
          totalPages: response.data.pagination.total_pages || 1,
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: error.response?.data?.error || "Gagal memuat data gudang.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (warehouseId: number) => {
    navigate(`/warehouses/${warehouseId}/edit`);
  };

  const handleView = (warehouseId: number) => {
    navigate(`/warehouses/${warehouseId}`);
  };

  const handleDelete = (warehouseId: number) => {
    setWarehouseToDelete(warehouseId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!warehouseToDelete) return;

    try {
      await warehousesApi.delete(warehouseToDelete);
      
      toast({
        variant: "success",
        title: "Berhasil!",
        description: "Gudang berhasil dihapus.",
      });
      
      setDeleteDialogOpen(false);
      setWarehouseToDelete(null);
      loadWarehouses();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: error.response?.data?.error || "Gagal menghapus gudang.",
      });
    }
  };

  const columns = createWarehouseColumns({ onEdit: handleEdit, onDelete: handleDelete, onView: handleView });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-3 p-3 sm:p-4 lg:p-6">
      <Card className="shadow-md">
        <CardHeader className="border-b bg-muted/50 p-3 sm:p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <CardTitle className="text-sm font-semibold truncate">Gudang</CardTitle>
              <CardDescription className="text-xs hidden sm:block">Kelola data gudang</CardDescription>
            </div>
            {hasPermission('warehouses.create') && (
              <Button onClick={() => navigate('/warehouses/create')} size="sm" className="h-8 text-xs shrink-0">
                <Plus className="h-3.5 w-3.5 sm:mr-1" />
                <span className="hidden sm:inline">Tambah</span>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable 
            columns={columns} 
            data={warehouses} 
            searchPlaceholder="Cari..."
            mobileHiddenColumns={["address", "phone", "type", "store", "manager", "status", "created_at", "select"]}
            serverPagination={{
              page: pagination.page,
              totalPages: pagination.totalPages,
              total: pagination.total,
              onPageChange: (newPage) => loadWarehouses(newPage)
            }}
          />
        </CardContent>
      </Card>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="Hapus Gudang"
        description="Apakah Anda yakin ingin menghapus gudang ini? Tindakan ini tidak dapat dibatalkan."
        confirmText="Hapus"
        cancelText="Batal"
        variant="destructive"
      />
    </div>
  );
}
