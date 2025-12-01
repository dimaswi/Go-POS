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
import { customersApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Loader2, User, Mail, MapPin, Phone, Calendar, Check, ChevronsUpDown, Crown } from "lucide-react";
import { setPageTitle } from "@/lib/page-title";

const genderOptions = [
  { value: "male", label: "Laki-laki" },
  { value: "female", label: "Perempuan" },
  { value: "other", label: "Lainnya" },
];

const statusOptions = [
  { value: "active", label: "Aktif" },
  { value: "inactive", label: "Tidak Aktif" },
];

export default function CustomerCreate() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [genderOpen, setGenderOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    date_of_birth: "",
    gender: "",
    status: "active",
    is_member: false,
  });

  useEffect(() => {
    setPageTitle("Tambah Pelanggan");
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload: any = {
        name: formData.name,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        address: formData.address || undefined,
        gender: formData.gender || undefined,
        status: formData.status,
        is_member: formData.is_member,
      };

      if (formData.date_of_birth) {
        payload.date_of_birth = new Date(formData.date_of_birth).toISOString();
      }

      await customersApi.create(payload);

      toast({
        variant: "success",
        title: "Berhasil!",
        description: "Pelanggan berhasil ditambahkan.",
      });

      navigate("/customers");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: error?.response?.data?.error || "Gagal menambahkan pelanggan.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-3 p-3 sm:p-4 lg:p-6">
      <div className="grid gap-3">
        <Card className="shadow-md">
          <CardHeader className="border-b bg-muted/50 p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigate("/customers")}
                className="h-8 w-8 shrink-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="min-w-0">
                <CardTitle className="text-sm font-semibold truncate">
                  Informasi Pelanggan
                </CardTitle>
                <CardDescription className="text-xs hidden sm:block">
                  Masukkan detail pelanggan
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="name"
                    className="text-sm font-medium flex items-center gap-2"
                  >
                    <User className="h-4 w-4 text-muted-foreground" />
                    Nama Pelanggan <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    required
                    placeholder="Masukkan nama pelanggan"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className="text-sm font-medium flex items-center gap-2"
                  >
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="customer@example.com"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-5">
                <div className="space-y-2">
                  <Label
                    htmlFor="phone"
                    className="text-sm font-medium flex items-center gap-2"
                  >
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    Nomor Telepon
                  </Label>
                  <Input
                    id="phone"
                    placeholder="08xxxxxxxxxx"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="date_of_birth"
                    className="text-sm font-medium flex items-center gap-2"
                  >
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    Tanggal Lahir
                  </Label>
                  <Input
                    id="date_of_birth"
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) =>
                      setFormData({ ...formData, date_of_birth: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-5">
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    Jenis Kelamin
                  </Label>
                  <Popover open={genderOpen} onOpenChange={setGenderOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={genderOpen}
                        className="w-full justify-between font-normal"
                      >
                        {formData.gender
                          ? genderOptions.find((g) => g.value === formData.gender)?.label
                          : "Pilih jenis kelamin"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-[--radix-popover-trigger-width] p-0"
                      align="start"
                    >
                      <Command>
                        <CommandInput placeholder="Cari jenis kelamin..." />
                        <CommandEmpty>Tidak ditemukan.</CommandEmpty>
                        <CommandGroup>
                          {genderOptions.map((option) => (
                            <CommandItem
                              key={option.value}
                              value={option.label}
                              onSelect={() => {
                                setFormData({ ...formData, gender: option.value });
                                setGenderOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  formData.gender === option.value
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                              {option.label}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    Status
                  </Label>
                  <Popover open={statusOpen} onOpenChange={setStatusOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={statusOpen}
                        className="w-full justify-between font-normal"
                      >
                        {formData.status
                          ? statusOptions.find((s) => s.value === formData.status)?.label
                          : "Pilih status"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-[--radix-popover-trigger-width] p-0"
                      align="start"
                    >
                      <Command>
                        <CommandInput placeholder="Cari status..." />
                        <CommandEmpty>Tidak ditemukan.</CommandEmpty>
                        <CommandGroup>
                          {statusOptions.map((option) => (
                            <CommandItem
                              key={option.value}
                              value={option.label}
                              onSelect={() => {
                                setFormData({ ...formData, status: option.value });
                                setStatusOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  formData.status === option.value
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                              {option.label}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="address"
                  className="text-sm font-medium flex items-center gap-2"
                >
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  Alamat
                </Label>
                <Textarea
                  id="address"
                  placeholder="Masukkan alamat pelanggan"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  rows={3}
                />
              </div>

              {/* Member Status */}
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Crown className="h-4 w-4 text-amber-500" />
                    Status Member
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Member akan mendapatkan diskon khusus saat transaksi
                  </p>
                </div>
                <Switch
                  checked={formData.is_member}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_member: checked })
                  }
                />
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/customers")}
                >
                  Batal
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Simpan Pelanggan
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
