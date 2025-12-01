import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Switch } from "@/components/ui/switch";
import { warehousesApi, storesApi, usersApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  Loader2, 
  Warehouse, 
  MapPin, 
  Phone, 
  Store,
  User,
  Hash,
  Check,
  ChevronsUpDown
} from "lucide-react";
import { setPageTitle } from "@/lib/page-title";

export default function WarehouseCreate() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [stores, setStores] = useState<{ id: number; name: string; code: string }[]>([]);
  const [managers, setManagers] = useState<{ id: number; full_name: string; email: string }[]>([]);
  const [typeOpen, setTypeOpen] = useState(false);
  const [storeOpen, setStoreOpen] = useState(false);
  const [managerOpen, setManagerOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    address: "",
    phone: "",
    manager_id: "",
    store_id: "",
    type: "main",
    status: "active",
  });

  useEffect(() => {
    setPageTitle("Create Warehouse");
    loadStores();
    loadManagers();
  }, []);

  const loadStores = async () => {
    try {
      const response = await storesApi.getAll();
      setStores(response.data.data);
    } catch (error) {
      console.error("Failed to load stores:", error);
    }
  };

  const loadManagers = async () => {
    try {
      const response = await usersApi.getAll();
      setManagers(response.data.data);
    } catch (error) {
      console.error("Failed to load managers:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await warehousesApi.create({
        ...formData,
        manager_id: formData.manager_id ? parseInt(formData.manager_id) : null,
        store_id: formData.store_id ? parseInt(formData.store_id) : null,
      });

      toast({
        variant: "success",
        title: "Success!",
        description: "Warehouse created successfully.",
      });

      navigate("/warehouses");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: error.response?.data?.error || "Failed to create warehouse.",
      });
    } finally {
      setLoading(false);
    }
  };

  const warehouseTypes = [
    { value: "main", label: "Main Warehouse" },
    { value: "branch", label: "Branch Warehouse" },
    { value: "virtual", label: "Virtual Warehouse" },
  ];

  return (
    <div className="flex flex-1 flex-col gap-3 p-3 sm:p-4 lg:p-6">
      <div className="grid gap-3">
        <Card className="shadow-md">
          <CardHeader className="border-b bg-muted/50 p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigate("/warehouses")}
                className="h-8 w-8 shrink-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="min-w-0">
                <CardTitle className="text-sm font-semibold truncate">
                  Create Warehouse
                </CardTitle>
                <CardDescription className="text-xs hidden sm:block">
                  Buat warehouse baru untuk sistem POS
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label
                    htmlFor="name"
                    className="text-xs font-medium flex items-center gap-2"
                  >
                    <Warehouse className="h-3.5 w-3.5 text-muted-foreground" />
                    Nama Warehouse
                  </Label>
                  <Input
                    id="name"
                    required
                    placeholder="Masukkan nama warehouse"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="code"
                    className="text-xs font-medium flex items-center gap-2"
                  >
                    <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                    Kode Warehouse
                  </Label>
                  <Input
                    id="code"
                    required
                    placeholder="Masukkan kode warehouse"
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value })
                    }
                    className="h-9 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="address"
                  className="text-xs font-medium flex items-center gap-2"
                >
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                  Alamat
                </Label>
                <Textarea
                  id="address"
                  placeholder="Masukkan alamat warehouse"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  className="min-h-[80px] text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-5">
                <div className="space-y-2">
                  <Label
                    htmlFor="phone"
                    className="text-xs font-medium flex items-center gap-2"
                  >
                    <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                    Nomor Telepon
                  </Label>
                  <Input
                    id="phone"
                    placeholder="Masukkan nomor telepon"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium flex items-center gap-2">
                    <Warehouse className="h-3.5 w-3.5 text-muted-foreground" />
                    Tipe Warehouse
                  </Label>
                  <Popover open={typeOpen} onOpenChange={setTypeOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" className="w-full justify-between h-9 text-sm">
                        {warehouseTypes.find((t) => t.value === formData.type)?.label || "Pilih tipe warehouse"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Cari tipe..." />
                        <CommandEmpty>Tipe tidak ditemukan.</CommandEmpty>
                        <CommandGroup>
                          {warehouseTypes.map((type) => (
                            <CommandItem key={type.value} value={type.label} onSelect={() => { setFormData({ ...formData, type: type.value }); setTypeOpen(false); }}>
                              <Check className={`mr-2 h-4 w-4 ${formData.type === type.value ? "opacity-100" : "opacity-0"}`} />
                              {type.label}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-5">
                <div className="space-y-2">
                  <Label className="text-xs font-medium flex items-center gap-2">
                    <Store className="h-3.5 w-3.5 text-muted-foreground" />
                    Store
                  </Label>
                  <Popover open={storeOpen} onOpenChange={setStoreOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" className="w-full justify-between h-9 text-sm">
                        {formData.store_id ? stores.find((s) => s.id.toString() === formData.store_id)?.name || "Pilih store" : "Pilih store"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Cari store..." />
                        <CommandEmpty>Store tidak ditemukan.</CommandEmpty>
                        <CommandGroup>
                          {stores.map((store) => (
                            <CommandItem key={store.id} value={`${store.name} ${store.code}`} onSelect={() => { setFormData({ ...formData, store_id: store.id.toString() }); setStoreOpen(false); }}>
                              <Check className={`mr-2 h-4 w-4 ${formData.store_id === store.id.toString() ? "opacity-100" : "opacity-0"}`} />
                              <div><div className="font-medium">{store.name}</div><div className="text-sm text-muted-foreground">{store.code}</div></div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium flex items-center gap-2">
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                    Manager
                  </Label>
                  <Popover open={managerOpen} onOpenChange={setManagerOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" className="w-full justify-between h-9 text-sm">
                        {formData.manager_id ? managers.find((m) => m.id.toString() === formData.manager_id)?.full_name || "Pilih manager warehouse" : "Pilih manager warehouse"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Cari manager..." />
                        <CommandEmpty>Manager tidak ditemukan.</CommandEmpty>
                        <CommandGroup>
                          {managers.map((manager) => (
                            <CommandItem key={manager.id} value={`${manager.full_name} ${manager.email}`} onSelect={() => { setFormData({ ...formData, manager_id: manager.id.toString() }); setManagerOpen(false); }}>
                              <Check className={`mr-2 h-4 w-4 ${formData.manager_id === manager.id.toString() ? "opacity-100" : "opacity-0"}`} />
                              <div><div className="font-medium">{manager.full_name}</div><div className="text-sm text-muted-foreground">{manager.email}</div></div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Switch
                  id="status"
                  checked={formData.status === "active"}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, status: checked ? "active" : "inactive" })
                  }
                />
                <Label htmlFor="status" className="text-xs font-medium">
                  Warehouse Aktif
                </Label>
              </div>

              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/warehouses")}
                  disabled={loading}
                  className="h-8 text-xs"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="h-8 text-xs"
                >
                  {loading && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                  Buat Warehouse
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
