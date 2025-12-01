import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { createCustomerColumns } from './columns';
import { customersApi, type Customer } from '@/lib/api';
import { usePermission } from '@/hooks/usePermission';
import { useToast } from '@/hooks/use-toast';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { setPageTitle } from '@/lib/page-title';
import { Loader2, Plus } from 'lucide-react';

export default function CustomersPage() {
  const navigate = useNavigate();
  const { hasPermission } = usePermission();
  const { toast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    try {
      const response = await customersApi.getAll();
      setCustomers(response.data.data || []);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: error instanceof Error ? error.message : "Gagal memuat data pelanggan.",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    setPageTitle('Pelanggan');
    loadData();
  }, [loadData]);

  const confirmDelete = async () => {
    if (!customerToDelete) return;
    
    try {
      await customersApi.delete(customerToDelete);
      toast({
        variant: "success",
        title: "Berhasil!",
        description: "Pelanggan berhasil dihapus.",
      });
      loadData();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: error instanceof Error ? error.message : "Gagal menghapus pelanggan.",
      });
    }
    
    setDeleteDialogOpen(false);
    setCustomerToDelete(null);
  };

  const handleDelete = (id: number) => {
    setCustomerToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleEdit = (id: number) => {
    navigate(`/customers/${id}/edit`);
  };

  const handleView = (id: number) => {
    navigate(`/customers/${id}`);
  };

  const columns = createCustomerColumns({ 
    onEdit: handleEdit, 
    onDelete: handleDelete, 
    onView: handleView,
    canEdit: hasPermission('customers.update'),
    canDelete: hasPermission('customers.delete'),
    canView: hasPermission('customers.view')
  });

  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 lg:p-6">
        <Card className="shadow-md">
          <CardContent className="flex items-center justify-center h-32">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Memuat data pelanggan...</span>
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
              <CardTitle className="text-sm font-semibold truncate">Pelanggan</CardTitle>
              <CardDescription className="text-xs hidden sm:block">Kelola data pelanggan</CardDescription>
            </div>
            {hasPermission('customers.create') && (
              <Button onClick={() => navigate('/customers/create')} size="sm" className="h-8 text-xs shrink-0">
                <Plus className="h-3.5 w-3.5 sm:mr-1" />
                <span className="hidden sm:inline">Tambah</span>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable 
            columns={columns} 
            data={customers}
            searchPlaceholder="Cari..."
            mobileHiddenColumns={["phone", "email", "address", "loyalty_points", "select"]}
          />
        </CardContent>
      </Card>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="Hapus Pelanggan"
        description="Apakah Anda yakin ingin menghapus pelanggan ini? Tindakan ini tidak dapat dibatalkan."
      />
    </div>
  );
}
