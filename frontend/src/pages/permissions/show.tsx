import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { setPageTitle } from '@/lib/page-title';
import { Button } from '@/components/ui/button';
import { permissionsApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { ArrowLeft, Loader2, Edit, Trash2 } from 'lucide-react';
import { usePermission } from '@/hooks/usePermission';

export default function PermissionShow() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const { canPerform } = usePermission();
  const [permission, setPermission] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    setPageTitle('Permission Details');
    loadPermission();
  }, [id]);

  const loadPermission = async () => {
    try {
      const response = await permissionsApi.getById(Number(id));
      setPermission(response.data.data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: "Failed to load permission data.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    setDeleting(true);
    setDeleteDialogOpen(false);
    try {
      await permissionsApi.delete(parseInt(id!));
      toast({
        variant: "success",
        title: "Success!",
        description: "Permission deleted successfully.",
      });
      setTimeout(() => navigate('/permissions'), 500);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: error.response?.data?.error || "Failed to delete permission.",
      });
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!permission) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-lg font-semibold">Permission not found</p>
          <Button onClick={() => navigate('/permissions')} className="mt-4">
            Back to Permissions
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-3 p-3 sm:p-4 lg:p-6">
      <div className="grid gap-3">
        {/* Card with Header and Content */}
        <Card className="shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-4 border-b bg-muted/50">
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => navigate('/permissions')}
                className="h-8 w-8 shrink-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="min-w-0">
                <h1 className="text-sm font-semibold truncate">Detail Permission</h1>
                <span className="text-xs text-muted-foreground">#{permission.id}</span>
              </div>
            </div>
            <div className="flex gap-2 self-end sm:self-auto">
              {canPerform('role_management', 'update') && (
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/permissions/${id}/edit`)}
                  className="h-8 text-xs"
                >
                  <Edit className="h-3.5 w-3.5 sm:mr-1" />
                  <span className="hidden sm:inline">Edit</span>
                </Button>
              )}
              {canPerform('role_management', 'delete') && (
                <Button 
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="h-8 text-xs"
                >
                  {deleting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <>
                      <Trash2 className="h-3.5 w-3.5 sm:mr-1" />
                      <span className="hidden sm:inline">Hapus</span>
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
          <CardContent className="p-3 sm:p-4 lg:p-6">
            {/* Permission Information Section */}
            <div className="mb-6">
              <CardTitle className="text-xs text-muted-foreground font-medium mb-3">
                INFORMASI PERMISSION
              </CardTitle>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <label className="text-[10px] sm:text-xs text-muted-foreground">Nama Permission</label>
                  <p className="font-medium text-xs sm:text-sm font-mono truncate">{permission.name}</p>
                </div>
                <div>
                  <label className="text-[10px] sm:text-xs text-muted-foreground">Deskripsi</label>
                  <p className="text-muted-foreground text-xs">
                    {permission.description || 'Tidak ada deskripsi'}
                  </p>
                </div>
                <div>
                  <label className="text-[10px] sm:text-xs text-muted-foreground">Kategori</label>
                  <p className="font-medium text-xs sm:text-sm">
                    {permission.name ? permission.name.split('.')[0] : '-'}
                  </p>
                </div>
              </div>
            </div>

            <hr className="border-border/50" />

            {/* System Information Section */}
            <div className="mt-6">
              <CardTitle className="text-xs text-muted-foreground font-medium mb-3">
                INFORMASI SISTEM
              </CardTitle>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <label className="text-[10px] sm:text-xs text-muted-foreground">ID Permission</label>
                  <p className="font-medium text-xs sm:text-sm">#{permission.id}</p>
                </div>
                <div>
                  <label className="text-[10px] sm:text-xs text-muted-foreground">Dibuat Pada</label>
                  <p className="font-medium text-xs sm:text-sm">
                    {permission.created_at ? new Date(permission.created_at).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short', 
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : '-'}
                  </p>
                </div>
                <div>
                  <label className="text-[10px] sm:text-xs text-muted-foreground">Terakhir Diubah</label>
                  <p className="font-medium text-xs sm:text-sm">
                    {permission.updated_at ? new Date(permission.updated_at).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric', 
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : '-'}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="Hapus Permission"
        description="Apakah Anda yakin ingin menghapus permission ini? Tindakan ini tidak dapat dibatalkan."
        confirmText="Hapus"
        cancelText="Batal"
        variant="destructive"
      />
    </div>
  );
}
