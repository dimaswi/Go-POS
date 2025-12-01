import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { usersApi, rolesApi, storesApi, type Store } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { cn } from "@/lib/utils";
import { ArrowLeft, Loader2, User, Shield, Check, ChevronsUpDown, Store as StoreIcon } from 'lucide-react';
import { setPageTitle } from '@/lib/page-title';

export default function UserEdit() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [roles, setRoles] = useState<any[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [roleOpen, setRoleOpen] = useState(false);
  const [storeOpen, setStoreOpen] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    role_id: '',
    store_id: '',
    is_active: true,
  });

  useEffect(() => {
    setPageTitle('Edit User');
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const [userRes, rolesRes, storesRes] = await Promise.all([
        usersApi.getById(Number(id)),
        rolesApi.getAll(),
        storesApi.getAll(),
      ]);
      const user = userRes.data.data;
      setFormData({
        full_name: user.full_name,
        role_id: String(user.role_id),
        store_id: user.store_id ? String(user.store_id) : '',
        is_active: user.is_active,
      });
      setRoles(rolesRes.data.data);
      setStores(storesRes.data.data || []);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: "Failed to load user data.",
      });
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await usersApi.update(Number(id), {
        ...formData,
        role_id: parseInt(formData.role_id),
        store_id: formData.store_id ? parseInt(formData.store_id) : null,
      });
      toast({
        variant: "success",
        title: "Success!",
        description: "User updated successfully.",
      });
      setTimeout(() => navigate('/users'), 500);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: error.response?.data?.error || "Failed to update user.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
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
          <div className="flex items-center gap-2 sm:gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate("/users")}
              className="h-8 w-8 shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-0">
              <CardTitle className="text-sm font-semibold truncate">
                Edit User
              </CardTitle>
              <CardDescription className="text-xs hidden sm:block">
                Update detail informasi user
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 lg:p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name" className="text-xs font-medium flex items-center gap-2">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                Nama Lengkap
              </Label>
              <Input
                id="full_name"
                required
                placeholder="Masukkan nama lengkap"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="h-9 text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label htmlFor="role_id" className="text-xs font-medium flex items-center gap-2">
                  <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                  Role
                </Label>
                <Popover open={roleOpen} onOpenChange={setRoleOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={roleOpen}
                      className="w-full justify-between h-9 text-sm font-normal"
                    >
                      {formData.role_id
                        ? roles.find((r) => r.id.toString() === formData.role_id)?.name || "Pilih Role"
                        : "Pilih Role"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-[--radix-popover-trigger-width] p-0"
                    align="start"
                  >
                    <Command>
                      <CommandInput placeholder="Cari role..." />
                      <CommandEmpty>Role tidak ditemukan.</CommandEmpty>
                      <CommandGroup>
                          {roles.map((role) => (
                            <CommandItem
                              key={role.id}
                              value={role.name}
                              onSelect={() => {
                                setFormData({ ...formData, role_id: role.id.toString() });
                                setRoleOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  formData.role_id === role.id.toString()
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                              {role.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="store_id" className="text-xs font-medium flex items-center gap-2">
                    <StoreIcon className="h-3.5 w-3.5 text-muted-foreground" />
                    Toko (untuk POS)
                  </Label>
                  <Popover open={storeOpen} onOpenChange={setStoreOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={storeOpen}
                        className="w-full justify-between h-9 text-sm font-normal"
                      >
                        {formData.store_id
                          ? stores.find((s) => s.id.toString() === formData.store_id)?.name || "Pilih Toko"
                          : "Tidak Ada (Bebas pilih)"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-[--radix-popover-trigger-width] p-0"
                      align="start"
                    >
                      <Command>
                        <CommandInput placeholder="Cari toko..." />
                        <CommandEmpty>Toko tidak ditemukan.</CommandEmpty>
                        <CommandGroup>
                          <CommandItem
                            value=""
                            onSelect={() => {
                              setFormData({ ...formData, store_id: "" });
                              setStoreOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                formData.store_id === ""
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            Tidak Ada (Bebas pilih)
                          </CommandItem>
                          {stores.map((store) => (
                            <CommandItem
                              key={store.id}
                              value={store.name}
                              onSelect={() => {
                                setFormData({ ...formData, store_id: store.id.toString() });
                                setStoreOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  formData.store_id === store.id.toString()
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                              {store.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <p className="text-xs text-muted-foreground">
                    Jika dipilih, user hanya bisa transaksi di toko ini
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <Label htmlFor="is_active" className="text-xs font-medium cursor-pointer">
                    Status Akun
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {formData.is_active ? 'Aktif' : 'Nonaktif'}
                  </p>
                </div>
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end pt-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate('/users')}
                  size="sm"
                  className="h-9 text-xs"
                >
                  Batal
                </Button>
                <Button 
                  type="submit" 
                  disabled={loading}
                  size="sm"
                  className="h-9 text-xs"
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Update
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
    </div>
  );
}
