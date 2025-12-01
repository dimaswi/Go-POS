import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { setPageTitle } from '@/lib/page-title';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { createRoleColumns } from './columns';
import { rolesApi, type Role } from '@/lib/api';
import { usePermission } from '@/hooks/usePermission';
import { useToast } from '@/hooks/use-toast';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { Loader2, Plus } from 'lucide-react';

export default function RolesPage() {
  const navigate = useNavigate();
  const { hasPermission } = usePermission();
  const { toast } = useToast();
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<number | null>(null);

  useEffect(() => {
    setPageTitle('Peran');
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      const response = await rolesApi.getAll();
      setRoles(response.data.data);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: error.response?.data?.error || "Gagal memuat data peran.",
      });
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!roleToDelete) return;
    
    try {
      await rolesApi.delete(roleToDelete);
      toast({
        variant: "success",
        title: "Berhasil!",
        description: "Peran berhasil dihapus.",
      });
      loadRoles();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: error.response?.data?.error || "Gagal menghapus peran.",
      });
    } finally {
      setDeleteDialogOpen(false);
      setRoleToDelete(null);
    }
  };

  // Handle actions
  const handleView = (id: number) => {
    navigate(`/roles/${id}`);
  };

  const handleEdit = (id: number) => {
    navigate(`/roles/${id}/edit`);
  };

  const handleDeleteClick = (id: number) => {
    setRoleToDelete(id);
    setDeleteDialogOpen(true);
  };

  // Create columns
  const columns = createRoleColumns({
    onView: handleView,
    onEdit: handleEdit,
    onDelete: handleDeleteClick,
    hasViewPermission: hasPermission('roles.view'),
    hasEditPermission: hasPermission('roles.update'),
    hasDeletePermission: hasPermission('roles.delete'),
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
              <CardTitle className="text-sm font-semibold truncate">Peran</CardTitle>
              <CardDescription className="text-xs hidden sm:block">Kelola peran dan hak akses</CardDescription>
            </div>
            {hasPermission('roles.create') && (
              <Button onClick={() => navigate('/roles/create')} size="sm" className="h-8 text-xs shrink-0">
                <Plus className="h-3.5 w-3.5 sm:mr-1" />
                <span className="hidden sm:inline">Tambah</span>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={roles}
            searchPlaceholder="Cari..."
            pageSize={10}
            mobileHiddenColumns={["description", "permissions", "created_at", "select"]}
          />
        </CardContent>
      </Card>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="Hapus Peran"
        description="Apakah Anda yakin ingin menghapus peran ini? Tindakan ini tidak dapat dibatalkan."
        confirmText="Hapus"
        cancelText="Batal"
        variant="destructive"
      />
    </div>
  );
}
