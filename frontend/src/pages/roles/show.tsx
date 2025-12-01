import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { setPageTitle } from '@/lib/page-title';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { rolesApi } from '@/lib/api';
import { usePermission } from '@/hooks/usePermission';
import { useToast } from '@/hooks/use-toast';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { 
  ArrowLeft, 
  Loader2, 
  Edit, 
  Trash2
} from 'lucide-react';

export default function RoleShow() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const { hasPermission } = usePermission();
  const [role, setRole] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    setPageTitle('Role Details');
    loadRole();
  }, [id]);

  const loadRole = async () => {
    try {
      const response = await rolesApi.getById(Number(id));
      setRole(response.data.data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: "Failed to load role data.",
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
      await rolesApi.delete(parseInt(id!));
      toast({
        variant: "success",
        title: "Success!",
        description: "Role deleted successfully.",
      });
      setTimeout(() => navigate('/roles'), 500);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: error.response?.data?.error || "Failed to delete role.",
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

  if (!role) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-lg font-semibold">Role not found</p>
          <Button onClick={() => navigate('/roles')} className="mt-4">
            Back to Roles
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-3 p-3 sm:p-4 lg:p-6">
      <div className="grid gap-3">
        {/* Header with actions */}
        <Card className="shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-4 border-b bg-muted/50">
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => navigate('/roles')}
                className="h-8 w-8 shrink-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="min-w-0">
                <h1 className="text-sm font-semibold truncate">Detail Role</h1>
                <span className="text-xs text-muted-foreground">#{role.id}</span>
              </div>
            </div>
            <div className="flex gap-2 self-end sm:self-auto">
              {hasPermission('roles.update') && (
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/roles/${id}/edit`)}
                  className="h-8 text-xs"
                >
                  <Edit className="h-3.5 w-3.5 sm:mr-1" />
                  <span className="hidden sm:inline">Edit</span>
                </Button>
              )}
              {hasPermission('roles.delete') && (
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
            {/* Role Information Section */}
            <div className="mb-6">
              <CardTitle className="text-xs text-muted-foreground font-medium mb-3">
                INFORMASI ROLE
              </CardTitle>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <label className="text-[10px] sm:text-xs text-muted-foreground">Nama Role</label>
                  <p className="font-medium text-xs sm:text-sm">{role.name}</p>
                </div>
                <div>
                  <label className="text-[10px] sm:text-xs text-muted-foreground">Deskripsi</label>
                  <p className="text-muted-foreground text-xs">
                    {role.description || 'Tidak ada deskripsi'}
                  </p>
                </div>
                <div>
                  <label className="text-[10px] sm:text-xs text-muted-foreground">Total Permission</label>
                  <p className="font-medium text-xs sm:text-sm">{role.permissions?.length || 0} permission</p>
                </div>
              </div>
            </div>

            <hr className="border-border/50" />

            {/* System Information Section */}
            <div className="my-6">
              <CardTitle className="text-xs text-muted-foreground font-medium mb-3">
                INFORMASI SISTEM
              </CardTitle>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <label className="text-[10px] sm:text-xs text-muted-foreground">ID Role</label>
                  <p className="font-medium text-xs sm:text-sm">#{role.id}</p>
                </div>
                <div>
                  <label className="text-[10px] sm:text-xs text-muted-foreground">Dibuat Pada</label>
                  <p className="font-medium text-xs sm:text-sm">
                    {role.created_at ? new Date(role.created_at).toLocaleDateString('id-ID', {
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
                    {role.updated_at ? new Date(role.updated_at).toLocaleDateString('id-ID', {
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

            {/* Permissions Section */}
            <hr className="border-border/50" />
            <div className="mt-6">
              <CardTitle className="text-xs text-muted-foreground font-medium mb-3">
                DAFTAR PERMISSION
              </CardTitle>
              {role.permissions && role.permissions.length > 0 ? (
                <div className="space-y-1.5 max-h-[300px] sm:max-h-[400px] overflow-auto">
                  {role.permissions.map((perm: any, index: number) => (
                    <div 
                      key={perm.id} 
                      className="flex items-center justify-between p-2 bg-muted/30 rounded-md"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-mono font-medium truncate">{perm.name}</p>
                        {perm.description && (
                          <p className="text-[10px] text-muted-foreground truncate">{perm.description}</p>
                        )}
                      </div>
                      <Badge variant="outline" className="text-[10px] shrink-0 ml-2">
                        {index + 1}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 sm:py-8">
                  <p className="text-xs sm:text-sm text-muted-foreground mb-3">Tidak ada permission yang diberikan</p>
                  {hasPermission('roles.update') && (
                    <Button 
                      onClick={() => navigate(`/roles/${id}/edit`)}
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs"
                    >
                      <Edit className="h-3.5 w-3.5 mr-1" />
                      Kelola Permission
                    </Button>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="Hapus Role"
        description="Apakah Anda yakin ingin menghapus role ini? Tindakan ini tidak dapat dibatalkan."
        confirmText="Hapus"
        cancelText="Batal"
        variant="destructive"
      />
    </div>
  );
}
