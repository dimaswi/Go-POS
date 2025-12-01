import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { setPageTitle } from '@/lib/page-title';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { rolesApi, permissionsApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft, 
  Loader2, 
  Shield, 
  FileText, 
  CheckSquare, 
  Package,
  Check,
  X,
  Eye,
  Plus,
  Pencil,
  Trash2,
  Settings,
  Users,
  ShoppingCart,
  Warehouse,
  LayoutDashboard,
  Store,
  Layers,
  Box,
  ArrowRightLeft,
  Truck,
  Receipt,
  Percent,
  BarChart3,
  UserCircle,
  MapPin,
} from 'lucide-react';

// Icon mapping for modules
const moduleIcons: Record<string, any> = {
  'dashboard': LayoutDashboard,
  'users': Users,
  'roles': Shield,
  'permissions': CheckSquare,
  'stores': Store,
  'warehouses': Warehouse,
  'products': Box,
  'categories': Layers,
  'inventory': Package,
  'sales': ShoppingCart,
  'pos': Receipt,
  'purchase_orders': Truck,
  'stock_transfers': ArrowRightLeft,
  'suppliers': UserCircle,
  'customers': Users,
  'discounts': Percent,
  'reports': BarChart3,
  'settings': Settings,
  'storage_locations': MapPin,
};

// Action icons
const actionIcons: Record<string, any> = {
  'view': Eye,
  'create': Plus,
  'edit': Pencil,
  'delete': Trash2,
  'manage': Settings,
};

export default function RoleCreate() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [loadingPermissions, setLoadingPermissions] = useState(true);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [groupedPermissions, setGroupedPermissions] = useState<Record<string, any[]>>({});
  const [selectedModule, setSelectedModule] = useState<string>('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permission_ids: [] as number[],
  });

  useEffect(() => {
    setPageTitle('Create Role');
    loadPermissions();
  }, []);

  const loadPermissions = async () => {
    setLoadingPermissions(true);
    try {
      const response = await permissionsApi.getAll();
      const allPermissions = response.data.data || [];
      setPermissions(allPermissions);
      
      // Group permissions by module
      const grouped = allPermissions.reduce((acc: Record<string, any[]>, permission: any) => {
        const module = permission.module || 'Other';
        if (!acc[module]) {
          acc[module] = [];
        }
        acc[module].push(permission);
        return acc;
      }, {});
      
      setGroupedPermissions(grouped);
      
      // Set first module as selected
      const modules = Object.keys(grouped);
      if (modules.length > 0) {
        setSelectedModule(modules[0]);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: "Failed to load permissions.",
      });
    } finally {
      setLoadingPermissions(false);
    }
  };

  const handlePermissionToggle = (permId: number) => {
    setFormData(prev => ({
      ...prev,
      permission_ids: prev.permission_ids.includes(permId)
        ? prev.permission_ids.filter(id => id !== permId)
        : [...prev.permission_ids, permId]
    }));
  };

  const handleSelectAllModule = (module: string) => {
    const modulePermIds = groupedPermissions[module]?.map(p => p.id) || [];
    setFormData(prev => ({
      ...prev,
      permission_ids: [...new Set([...prev.permission_ids, ...modulePermIds])]
    }));
  };

  const handleDeselectAllModule = (module: string) => {
    const modulePermIds = groupedPermissions[module]?.map(p => p.id) || [];
    setFormData(prev => ({
      ...prev,
      permission_ids: prev.permission_ids.filter(id => !modulePermIds.includes(id))
    }));
  };

  const handleSelectAll = () => {
    setFormData(prev => ({
      ...prev,
      permission_ids: permissions.map(p => p.id)
    }));
  };

  const handleDeselectAll = () => {
    setFormData(prev => ({
      ...prev,
      permission_ids: []
    }));
  };

  const getModuleSelectedCount = (module: string) => {
    const modulePermIds = groupedPermissions[module]?.map(p => p.id) || [];
    return modulePermIds.filter(id => formData.permission_ids.includes(id)).length;
  };

  const isModuleFullySelected = (module: string) => {
    const modulePerms = groupedPermissions[module] || [];
    return modulePerms.length > 0 && modulePerms.every(p => formData.permission_ids.includes(p.id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await rolesApi.create(formData);
      toast({
        variant: "success",
        title: "Success!",
        description: "Role created successfully.",
      });
      setTimeout(() => navigate('/roles'), 500);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: error.response?.data?.error || "Failed to create role.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Don't render until we have a selected module
  if (loadingPermissions || !selectedModule) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="mt-2 text-muted-foreground">Memuat permissions...</p>
        </div>
      </div>
    );
  }

  const ModuleIcon = moduleIcons[selectedModule.toLowerCase()] || Package;

  return (
    <div className="flex flex-1 flex-col gap-3 p-3 sm:p-4 lg:p-6">
      <Card className="shadow-md">
        <CardHeader className="border-b bg-muted/50 p-3 sm:p-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate('/roles')}
              className="h-8 w-8 shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-sm font-semibold truncate">
                Buat Role Baru
              </CardTitle>
              <CardDescription className="text-xs hidden sm:block">
                Atur nama, deskripsi, dan permissions untuk role
              </CardDescription>
            </div>
            <Badge variant="secondary" className="text-xs px-2 py-0.5 shrink-0">
              <CheckSquare className="h-3 w-3 mr-1" />
              {formData.permission_ids.length}/{permissions.length}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <form onSubmit={handleSubmit}>
            {/* Role Info Section */}
            <div className="p-3 sm:p-4 lg:p-6 border-b bg-background">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-xs font-medium flex items-center gap-2">
                    <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                    Nama Role
                  </Label>
                  <Input
                    id="name"
                    required
                    placeholder="e.g., Kasir, Manager, Admin"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="description" className="text-xs font-medium flex items-center gap-2">
                    <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                    Deskripsi
                  </Label>
                  <Input
                    id="description"
                    placeholder="Deskripsi singkat role..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="h-9 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Permissions Section */}
            <div className="flex flex-col md:flex-row min-h-[400px] sm:min-h-[500px]">
              {/* Module Sidebar */}
              <div className="w-full md:w-56 lg:w-64 flex-shrink-0 border-b md:border-b-0 md:border-r bg-muted/30">
                <div className="p-3 border-b bg-muted/50">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Modul</p>
                </div>
                <ScrollArea className="h-[200px] md:h-[455px]">
                  <div className="p-2">
                    {Object.keys(groupedPermissions).map((module) => {
                      const Icon = moduleIcons[module.toLowerCase()] || Package;
                      const selectedCount = getModuleSelectedCount(module);
                      const totalCount = groupedPermissions[module].length;
                      const isFullySelected = isModuleFullySelected(module);
                      
                      return (
                        <button
                          key={module}
                          type="button"
                          onClick={() => setSelectedModule(module)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all mb-1 ${
                            selectedModule === module 
                              ? 'bg-primary text-primary-foreground shadow-sm' 
                              : 'hover:bg-muted'
                          }`}
                        >
                          <Icon className="h-4 w-4 flex-shrink-0" />
                          <span className="flex-1 text-sm font-medium truncate capitalize">
                            {module.replace(/_/g, ' ')}
                          </span>
                          <Badge 
                            variant={isFullySelected ? "default" : selectedCount > 0 ? "secondary" : "outline"}
                            className={`text-xs px-1.5 min-w-[40px] justify-center ${
                              selectedModule === module && isFullySelected ? 'bg-primary-foreground text-primary' : ''
                            }`}
                          >
                            {selectedCount}/{totalCount}
                          </Badge>
                        </button>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>

              {/* Permissions Panel */}
              <div className="flex-1 flex flex-col">
                {/* Module Header */}
                <div className="p-4 border-b bg-muted/30 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <ModuleIcon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold capitalize">{selectedModule.replace(/_/g, ' ')}</h3>
                      <p className="text-xs text-muted-foreground">
                        {getModuleSelectedCount(selectedModule)} dari {groupedPermissions[selectedModule]?.length || 0} permission dipilih
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeselectAllModule(selectedModule)}
                      className="h-8"
                    >
                      <X className="h-3.5 w-3.5 mr-1.5" />
                      Hapus Semua
                    </Button>
                    <Button
                      type="button"
                      variant="default"
                      size="sm"
                      onClick={() => handleSelectAllModule(selectedModule)}
                      className="h-8"
                    >
                      <Check className="h-3.5 w-3.5 mr-1.5" />
                      Pilih Semua
                    </Button>
                  </div>
                </div>

                {/* Permissions List */}
                <ScrollArea className="flex-1">
                  <div className="p-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                      {groupedPermissions[selectedModule]?.map((perm) => {
                        const isSelected = formData.permission_ids.includes(perm.id);
                        // Try to get action from category or name
                        const actionKey = perm.category?.toLowerCase() || perm.name?.split('.')[1] || 'view';
                        const ActionIcon = actionIcons[actionKey] || Eye;
                        
                        return (
                          <div
                            key={perm.id}
                            className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all cursor-pointer ${
                              isSelected 
                                ? 'border-primary bg-primary/5' 
                                : 'border-border hover:border-muted-foreground/30 hover:bg-muted/30'
                            }`}
                            onClick={() => handlePermissionToggle(perm.id)}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${
                                isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'
                              }`}>
                                <ActionIcon className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="font-medium text-sm">{perm.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {perm.description || perm.category}
                                </p>
                              </div>
                            </div>
                            <div className={`h-6 w-11 rounded-full transition-colors flex items-center px-0.5 ${isSelected ? 'bg-primary justify-end' : 'bg-muted justify-start'}`}>
                              <div className={`h-5 w-5 rounded-full bg-white shadow-sm`} />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {(!groupedPermissions[selectedModule] || groupedPermissions[selectedModule].length === 0) && (
                      <div className="text-center py-12 text-muted-foreground">
                        <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>Tidak ada permission untuk modul ini</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t bg-muted/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                >
                  Pilih Semua Permission
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleDeselectAll}
                >
                  Reset
                </Button>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/roles')}
                >
                  Batal
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Simpan Role
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
