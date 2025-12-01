import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usersApi } from '@/lib/api';
import { usePermission } from '@/hooks/usePermission';
import { useToast } from '@/hooks/use-toast';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { 
  ArrowLeft, 
  Loader2, 
  Edit, 
  Trash2
} from 'lucide-react';
import { setPageTitle } from '@/lib/page-title';

export default function UserShow() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const { hasPermission } = usePermission();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    setPageTitle('User Details');
    loadUser();
  }, [id]);

  const loadUser = async () => {
    try {
      const response = await usersApi.getById(Number(id));
      setUser(response.data.data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: "Failed to load user data.",
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
      await usersApi.delete(parseInt(id!));
      toast({
        variant: "success",
        title: "Success!",
        description: "User deleted successfully.",
      });
      setTimeout(() => navigate('/users'), 500);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: error.response?.data?.error || "Failed to delete user.",
      });
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 sm:h-full">
        <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64 sm:h-full">
        <div className="text-center px-4">
          <p className="text-sm sm:text-lg font-semibold">User not found</p>
          <Button onClick={() => navigate('/users')} className="mt-3 sm:mt-4 h-8 text-xs sm:text-sm">
            Back to Users
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-3 p-3 sm:p-4 lg:p-6">
      {/* Header with actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => navigate('/users')}
            className="h-8 w-8 shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <h1 className="text-sm font-semibold truncate">Detail User</h1>
            <span className="text-xs text-muted-foreground">#{user.id}</span>
          </div>
        </div>
        <div className="flex gap-2 self-end sm:self-auto">
          {hasPermission('users.update') && (
            <Button 
              variant="outline"
              size="sm"
              onClick={() => navigate(`/users/${id}/edit`)}
              className="h-8 text-xs"
            >
              <Edit className="h-3.5 w-3.5 sm:mr-1" />
              <span className="hidden sm:inline">Edit</span>
            </Button>
          )}
          {hasPermission('users.delete') && (
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

      {/* Single Card with Sections */}
      <Card>
        <CardContent className="p-3 sm:p-4 lg:p-6">
          {/* User Information Section */}
          <div className="mb-6">
            <CardTitle className="text-xs text-muted-foreground font-medium mb-3">
              INFORMASI USER
            </CardTitle>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <div>
                <label className="text-xs text-muted-foreground">Nama</label>
                <p className="font-medium text-sm">{user.full_name}</p>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Username</label>
                <p className="font-medium text-sm">{user.username}</p>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Email</label>
                <p className="font-medium text-xs sm:text-sm truncate">{user.email}</p>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Status</label>
                <Badge 
                  variant={user.is_active ? "default" : "secondary"}
                  className="text-xs w-fit mt-1"
                >
                  {user.is_active ? 'AKTIF' : 'NONAKTIF'}
                </Badge>
              </div>
            </div>
          </div>

          <hr className="border-border/50" />

          {/* Role Information Section */}
          <div className="my-4 sm:my-6">
            <CardTitle className="text-xs text-muted-foreground font-medium mb-3">
              INFORMASI ROLE
            </CardTitle>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
              <div>
                <label className="text-xs text-muted-foreground">Role</label>
                <p className="font-medium text-sm">{user.role?.name || '-'}</p>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="text-xs text-muted-foreground">Deskripsi</label>
                <p className="text-muted-foreground text-xs">
                  {user.role?.description || 'Tidak ada deskripsi'}
                </p>
              </div>
              {user.role?.permissions && (
                <div>
                  <label className="text-xs text-muted-foreground">Permission</label>
                  <p className="font-medium text-sm">{user.role.permissions.length}</p>
                </div>
              )}
            </div>
          </div>

          <hr className="border-border/50" />

          {/* System Information Section */}
          <div className="my-4 sm:my-6">
            <CardTitle className="text-xs text-muted-foreground font-medium mb-3">
              INFORMASI SISTEM
            </CardTitle>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
              <div>
                <label className="text-xs text-muted-foreground">ID</label>
                <p className="font-medium text-sm">#{user.id}</p>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Dibuat</label>
                <p className="font-medium text-xs sm:text-sm">
                  {user.created_at ? new Date(user.created_at).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short', 
                    year: 'numeric',
                  }) : '-'}
                </p>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Diubah</label>
                <p className="font-medium text-xs sm:text-sm">
                  {user.updated_at ? new Date(user.updated_at).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric', 
                  }) : '-'}
                </p>
              </div>
            </div>
          </div>

          {/* Permissions Section */}
          {user.role?.permissions && user.role.permissions.length > 0 && (
            <>
              <hr className="border-border/50" />
              <div className="mt-4 sm:mt-6">
                <CardTitle className="text-xs text-muted-foreground font-medium mb-3">
                  DAFTAR PERMISSION
                  </CardTitle>
                <div className="flex flex-wrap gap-1">
                  {user.role.permissions.map((perm: any) => (
                    <Badge 
                      key={perm.id} 
                      variant="outline" 
                      className="text-xs font-mono"
                    >
                      {perm.name}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="Hapus User"
        description="Apakah Anda yakin ingin menghapus user ini? Tindakan ini tidak dapat dibatalkan."
        confirmText="Hapus"
        cancelText="Batal"
        variant="destructive"
      />
    </div>
  );
}
