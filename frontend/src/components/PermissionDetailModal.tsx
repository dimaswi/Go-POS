import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Package, Tag, Shield, CheckCircle, Info } from 'lucide-react';

interface Permission {
  id: number;
  name: string;
  module: string;
  category: string;
  description: string;
  actions: string; // JSON string
}

interface PermissionDetailModalProps {
  permission: Permission | null;
  isOpen: boolean;
  onClose: () => void;
}

export function PermissionDetailModal({ permission, isOpen, onClose }: PermissionDetailModalProps) {
  if (!permission) return null;

  let actions: string[] = [];
  try {
    actions = JSON.parse(permission.actions || '[]');
  } catch {
    actions = [];
  }

  const actionLabels: Record<string, { label: string; description: string; color: string }> = {
    create: { label: 'Create', description: 'Dapat membuat data baru', color: 'bg-green-100 text-green-800' },
    read: { label: 'Read', description: 'Dapat melihat/membaca data', color: 'bg-blue-100 text-blue-800' },
    update: { label: 'Update', description: 'Dapat mengubah data yang ada', color: 'bg-yellow-100 text-yellow-800' },
    delete: { label: 'Delete', description: 'Dapat menghapus data', color: 'bg-red-100 text-red-800' },
    export: { label: 'Export', description: 'Dapat mengekspor data', color: 'bg-purple-100 text-purple-800' },
    import: { label: 'Import', description: 'Dapat mengimpor data', color: 'bg-indigo-100 text-indigo-800' },
    assign_permissions: { label: 'Assign Permissions', description: 'Dapat memberikan permission ke role', color: 'bg-orange-100 text-orange-800' },
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Detail Permission
          </DialogTitle>
          <DialogDescription>
            Informasi lengkap tentang permission dan akses yang diberikan
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-medium">Informasi Dasar</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Nama Permission</label>
                <p className="text-sm font-mono bg-muted p-2 rounded">{permission.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <Package className="h-3.5 w-3.5" />
                  Module
                </label>
                <p className="text-sm font-semibold">{permission.module}</p>
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <Tag className="h-3.5 w-3.5" />
                  Category
                </label>
                <Badge variant="outline" className="mt-1">{permission.category}</Badge>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <h3 className="font-medium">Deskripsi</h3>
            <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
              {permission.description || 'Tidak ada deskripsi tersedia'}
            </p>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-medium">Aksi yang Diizinkan</h3>
              <Badge variant="secondary">{actions.length} aksi</Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-6">
              {actions.map((action) => {
                const actionInfo = actionLabels[action] || { 
                  label: action, 
                  description: 'Aksi khusus', 
                  color: 'bg-gray-100 text-gray-800' 
                };
                return (
                  <div key={action} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50">
                    <div className={`px-2 py-1 rounded text-xs font-medium ${actionInfo.color}`}>
                      {actionInfo.label}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">{actionInfo.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            {actions.length === 0 && (
              <p className="text-sm text-muted-foreground pl-6">Tidak ada aksi yang didefinisikan</p>
            )}
          </div>

          {/* Security Note */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Shield className="h-4 w-4 text-amber-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800">Catatan Keamanan</p>
                <p className="text-xs text-amber-700 mt-1">
                  Permission ini akan memberikan akses sesuai dengan aksi yang telah didefinisikan. 
                  Pastikan hanya memberikan permission kepada role yang memang membutuhkannya.
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end">
            <Button onClick={onClose} variant="outline">
              Tutup
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}