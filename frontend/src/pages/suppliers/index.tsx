import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { createSupplierColumns } from './columns';
import { suppliersApi, type Supplier } from '@/lib/api';
import { usePermission } from '@/hooks/usePermission';
import { useToast } from '@/hooks/use-toast';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { setPageTitle } from '@/lib/page-title';
import { Loader2, Plus } from 'lucide-react';

export default function SuppliersPage() {
  const navigate = useNavigate();
  const { hasPermission } = usePermission();
  const { toast } = useToast();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<number | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const loadData = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const suppliersRes = await suppliersApi.getAll({ page, limit: pagination.limit });
      setSuppliers(suppliersRes.data.data || []);
      if (suppliersRes.data.pagination) {
        setPagination({
          page: suppliersRes.data.pagination.page || page,
          limit: suppliersRes.data.pagination.limit || 10,
          total: suppliersRes.data.pagination.total || 0,
          totalPages: suppliersRes.data.pagination.pages || 1,
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: error instanceof Error ? error.message : "Gagal memuat data pemasok.",
      });
    } finally {
      setLoading(false);
    }
  }, [toast, pagination.limit]);

  useEffect(() => {
    setPageTitle('Pemasok');
    loadData();
  }, [loadData]);

  const confirmDelete = async () => {
    if (!supplierToDelete) return;
    
    try {
      await suppliersApi.delete(supplierToDelete);
      toast({
        variant: "success",
        title: "Berhasil!",
        description: "Pemasok berhasil dihapus.",
      });
      loadData();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: error instanceof Error ? error.message : "Gagal menghapus pemasok.",
      });
    }
    
    setDeleteDialogOpen(false);
    setSupplierToDelete(null);
  };

  const handleDelete = (id: number) => {
    setSupplierToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleEdit = (id: number) => {
    navigate(`/suppliers/${id}/edit`);
  };

  const handleView = (id: number) => {
    navigate(`/suppliers/${id}`);
  };

  const columns = createSupplierColumns({ 
    onEdit: handleEdit, 
    onDelete: handleDelete, 
    onView: handleView,
    canEdit: hasPermission('suppliers.update'),
    canDelete: hasPermission('suppliers.delete'),
    canView: hasPermission('suppliers.view')
  });

  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 lg:p-6">
        <Card className="shadow-md">
          <CardContent className="flex items-center justify-center h-32">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Memuat data pemasok...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-3 p-3 sm:p-4 lg:p-6">
      <Card className="shadow-md">
        <CardHeader className="border-b bg-muted/50 p-3 sm:p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <CardTitle className="text-sm font-semibold truncate">Pemasok</CardTitle>
              <CardDescription className="text-xs hidden sm:block">Kelola data pemasok</CardDescription>
            </div>
            {hasPermission('suppliers.create') && (
              <Button onClick={() => navigate('/suppliers/create')} size="sm" className="h-8 text-xs shrink-0">
                <Plus className="h-3.5 w-3.5 sm:mr-1" />
                <span className="hidden sm:inline">Tambah</span>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable 
            columns={columns} 
            data={suppliers}
            searchPlaceholder="Cari..."
            mobileHiddenColumns={["contact", "address", "status", "select"]}
            serverPagination={{
              page: pagination.page,
              totalPages: pagination.totalPages,
              total: pagination.total,
              onPageChange: (newPage) => loadData(newPage)
            }}
          />
        </CardContent>
      </Card>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="Hapus Pemasok"
        description="Apakah Anda yakin ingin menghapus pemasok ini? Tindakan ini tidak dapat dibatalkan."
      />
    </div>
  );
}
