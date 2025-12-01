import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
import { storesApi, usersApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, Store, Mail, MapPin, Phone, User, Check, ChevronsUpDown } from "lucide-react";
import { setPageTitle } from "@/lib/page-title";

export default function StoreEdit() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [managers, setManagers] = useState<{ id: number; full_name: string; email: string }[]>([]);
  const [managerOpen, setManagerOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    address: "",
    phone: "",
    email: "",
    manager_id: "",
    status: "active",
  });

  useEffect(() => {
    setPageTitle("Edit Store");
    loadManagers();
    loadStore();
  }, [id]);

  const loadStore = async () => {
    if (!id) return;
    
    try {
      const response = await storesApi.getById(parseInt(id));
      const store = response.data.data;
      
      setFormData({
        name: store.name || "",
        code: store.code || "",
        address: store.address || "",
        phone: store.phone || "",
        email: store.email || "",
        manager_id: store.manager_id ? store.manager_id.toString() : "",
        status: store.status || "active",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: error.response?.data?.error || "Failed to load store.",
      });
      navigate("/stores");
    } finally {
      setPageLoading(false);
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
    if (!id) return;
    
    setLoading(true);

    try {
      await storesApi.update(parseInt(id), {
        ...formData,
        manager_id: formData.manager_id ? parseInt(formData.manager_id) : null,
      });

      toast({
        variant: "success",
        title: "Success!",
        description: "Store updated successfully.",
      });

      navigate("/stores");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: error.response?.data?.error || "Failed to update store.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
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
              onClick={() => navigate("/stores")}
              className="h-8 w-8 shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-0">
              <CardTitle className="text-sm font-semibold truncate">
                Edit Toko
              </CardTitle>
              <CardDescription className="text-xs hidden sm:block">
                Update informasi toko
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 lg:p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="name"
                  className="text-xs font-medium flex items-center gap-2"
                >
                  <Store className="h-3.5 w-3.5 text-muted-foreground" />
                  Nama Toko
                </Label>
                <Input
                  id="name"
                  required
                  placeholder="Masukkan nama toko"
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
                  <Store className="h-3.5 w-3.5 text-muted-foreground" />
                  Kode Toko
                </Label>
                <Input
                  id="code"
                  required
                  placeholder="Masukkan kode toko"
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
                placeholder="Masukkan alamat toko"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                className="min-h-[70px] text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
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
                  <Label
                    htmlFor="email"
                    className="text-xs font-medium flex items-center gap-2"
                  >
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Masukkan email store"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="h-9 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-medium flex items-center gap-2">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                  Manager
                </Label>
                <Popover open={managerOpen} onOpenChange={setManagerOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" className="w-full justify-between h-9 text-sm">
                      {formData.manager_id ? managers.find((m) => m.id.toString() === formData.manager_id)?.full_name || "Pilih manager store" : "Pilih manager store"}
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

              <div className="flex items-center space-x-2">
                <Switch
                  id="status"
                  checked={formData.status === "active"}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, status: checked ? "active" : "inactive" })
                  }
                />
                <Label htmlFor="status" className="text-xs font-medium">
                  Toko Aktif
                </Label>
              </div>

              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/stores")}
                  disabled={loading}
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
                  Update Toko
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
    </div>
  );
}
