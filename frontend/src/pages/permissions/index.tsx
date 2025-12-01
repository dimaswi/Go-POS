import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { setPageTitle } from '@/lib/page-title';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { createPermissionColumns } from './columns';
import { permissionsApi, type Permission } from '@/lib/api';
import { usePermission } from '@/hooks/usePermission';
import { useToast } from '@/hooks/use-toast';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { Loader2, Plus } from 'lucide-react';

export default function PermissionsPage() {
  const navigate = useNavigate();
  const { hasPermission } = usePermission();
  const { toast } = useToast();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [permissionToDelete, setPermissionToDelete] = useState<number | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    setPageTitle('Permissions');
    loadPermissions();
  }, []);

  const loadPermissions = async (page = 1) => {
    setLoading(true);
    try {
      const response = await permissionsApi.getAll({ page, limit: pagination.limit });
      setPermissions(response.data.data || []);
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
        description: error.response?.data?.error || "Failed to load permissions.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (id: number) => {
    setPermissionToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!permissionToDelete) return;
    
    try {
      await permissionsApi.delete(permissionToDelete);
      toast({
        variant: "success",
        title: "Success!",
        description: "Permission deleted successfully.",
      });
      loadPermissions();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: error.response?.data?.error || "Failed to delete permission.",
      });
    } finally {
      setDeleteDialogOpen(false);
      setPermissionToDelete(null);
    }
  };

  // Handle actions
  const handleView = (id: number) => {
    navigate(`/permissions/${id}`);
  };

  const handleEdit = (id: number) => {
    navigate(`/permissions/${id}/edit`);
  };

  // Create columns
  const columns = createPermissionColumns({
    onView: handleView,
    onEdit: handleEdit,
    onDelete: handleDeleteClick,
    hasViewPermission: hasPermission('permissions.view'),
    hasEditPermission: hasPermission('permissions.update'),
    hasDeletePermission: hasPermission('permissions.delete'),
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
              <CardTitle className="text-sm font-semibold truncate">Permission</CardTitle>
              <CardDescription className="text-xs hidden sm:block">Kelola system permissions</CardDescription>
            </div>
            {hasPermission('permissions.create') && (
              <Button onClick={() => navigate('/permissions/create')} size="sm" className="h-8 text-xs shrink-0">
                <Plus className="h-3.5 w-3.5 sm:mr-1" />
                <span className="hidden sm:inline">Tambah</span>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={permissions}
            searchPlaceholder="Cari..."
            pageSize={10}
            mobileHiddenColumns={["description", "module", "created_at", "select"]}
            serverPagination={{
              page: pagination.page,
              totalPages: pagination.totalPages,
              total: pagination.total,
              onPageChange: (newPage) => loadPermissions(newPage)
            }}
          />
        </CardContent>
      </Card>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="Delete Permission"
        description="Are you sure you want to delete this permission? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />
    </div>
  );
}
