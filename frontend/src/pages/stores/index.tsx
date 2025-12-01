import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { createStoreColumns } from './columns';
import { storesApi, type Store } from '@/lib/api';
import { usePermission } from '@/hooks/usePermission';
import { useToast } from '@/hooks/use-toast';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { setPageTitle } from '@/lib/page-title';
import { Loader2, Plus } from 'lucide-react';

export default function StoresPage() {
  const navigate = useNavigate();
  const { hasPermission } = usePermission();
  const { toast } = useToast();
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [storeToDelete, setStoreToDelete] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    try {
      const storesRes = await storesApi.getAll();
      setStores(storesRes.data.data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: error instanceof Error ? error.message : "Gagal memuat data toko.",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    setPageTitle('Toko');
    loadData();
  }, [loadData]);

  const confirmDelete = async () => {
    if (!storeToDelete) return;
    
    try {
      await storesApi.delete(storeToDelete);
      toast({
        variant: "success",
        title: "Berhasil!",
        description: "Toko berhasil dihapus.",
      });
      loadData();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: error instanceof Error ? error.message : "Gagal menghapus toko.",
      });
    } finally {
      setDeleteDialogOpen(false);
      setStoreToDelete(null);
    }
  };

  const handleEdit = (storeId: number) => {
    navigate(`/stores/${storeId}/edit`);
  };

  const handleView = (storeId: number) => {
    navigate(`/stores/${storeId}`);
  };

  const handleDelete = (storeId: number) => {
    setStoreToDelete(storeId);
    setDeleteDialogOpen(true);
  };

  const columns = createStoreColumns({ onEdit: handleEdit, onDelete: handleDelete, onView: handleView });

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
              <CardTitle className="text-sm font-semibold truncate">Toko</CardTitle>
              <CardDescription className="text-xs hidden sm:block">Kelola data toko</CardDescription>
            </div>
            {hasPermission('stores.create') && (
              <Button onClick={() => navigate('/stores/create')} size="sm" className="h-8 text-xs shrink-0">
                <Plus className="h-3.5 w-3.5 sm:mr-1" />
                <span className="hidden sm:inline">Tambah</span>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={stores}
            searchPlaceholder="Cari..."
            pageSize={10}
            mobileHiddenColumns={["address", "phone", "status", "select"]}
          />
        </CardContent>
      </Card>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="Hapus Toko"
        description="Apakah Anda yakin ingin menghapus toko ini? Tindakan ini tidak dapat dibatalkan."
        confirmText="Hapus"
        cancelText="Batal"
        variant="destructive"
      />
    </div>
  );
}
