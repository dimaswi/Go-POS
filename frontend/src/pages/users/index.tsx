import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { createUserColumns } from './columns';
import { usersApi, type User } from '@/lib/api';
import { usePermission } from '@/hooks/usePermission';
import { useToast } from '@/hooks/use-toast';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { setPageTitle } from '@/lib/page-title';
import { Loader2, Plus } from 'lucide-react';

export default function UsersPage() {
  const navigate = useNavigate();
  const { hasPermission } = usePermission();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<number | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const loadData = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const usersRes = await usersApi.getAll({ page, limit: pagination.limit });
      setUsers(usersRes.data.data || []);
      if (usersRes.data.pagination) {
        setPagination({
          page: usersRes.data.pagination.current_page || page,
          limit: usersRes.data.pagination.per_page || 10,
          total: usersRes.data.pagination.total || 0,
          totalPages: usersRes.data.pagination.total_pages || 1,
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: error instanceof Error ? error.message : "Gagal memuat data.",
      });
    } finally {
      setLoading(false);
    }
  }, [toast, pagination.limit]);

  useEffect(() => {
    setPageTitle('Pengguna');
    loadData();
  }, [loadData]);

  const confirmDelete = async () => {
    if (!userToDelete) return;
    
    try {
      await usersApi.delete(userToDelete);
      toast({
        variant: "success",
        title: "Berhasil!",
        description: "Pengguna berhasil dihapus.",
      });
      loadData();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: error instanceof Error ? error.message : "Gagal menghapus pengguna.",
      });
    } finally {
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    }
  };


  const handleView = (id: number) => {
    navigate(`/users/${id}`);
  };

  const handleEdit = (id: number) => {
    navigate(`/users/${id}/edit`);
  };

  const handleDeleteUser = (id: number) => {
    setUserToDelete(id);
    setDeleteDialogOpen(true);
  };

  // Create columns
  const columns = createUserColumns({
    onView: handleView,
    onEdit: handleEdit,
    onDelete: handleDeleteUser,
    hasViewPermission: hasPermission('users.view'),
    hasEditPermission: hasPermission('users.update'),
    hasDeletePermission: hasPermission('users.delete'),
  });

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
              <CardTitle className="text-sm font-semibold truncate">Pengguna</CardTitle>
              <CardDescription className="text-xs hidden sm:block">Kelola data pengguna</CardDescription>
            </div>
            {hasPermission('users.create') && (
              <Button onClick={() => navigate('/users/create')} size="sm" className="h-8 text-xs shrink-0">
                <Plus className="h-3.5 w-3.5 sm:mr-1" />
                <span className="hidden sm:inline">Tambah</span>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={users}
            searchPlaceholder="Cari..."
            pageSize={10}
            mobileHiddenColumns={["email", "role.name", "store.name", "is_active", "select"]}
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
        title="Hapus Pengguna"
        description="Apakah Anda yakin ingin menghapus pengguna ini? Tindakan ini tidak dapat dibatalkan."
        confirmText="Hapus"
        cancelText="Batal"
        variant="destructive"
      />
    </div>
  );
}
