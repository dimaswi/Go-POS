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
import { productsApi, categoriesApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  Loader2, 
  Package, 
  Barcode, 
  Ruler, 
  DollarSign,
  Hash,
  Layers3,
  Check,
  ChevronsUpDown
} from "lucide-react";
import { setPageTitle } from "@/lib/page-title";

export default function ProductCreate() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<{ id: number; name: string; code: string }[]>([]);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [unitOpen, setUnitOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    barcode: "",
    category_id: "",
    description: "",
    unit: "pcs",
    cost_price: "",
    selling_price: "",
    min_stock: "",
    max_stock: "",
    is_trackable: true,
    is_active: true,
  });

  useEffect(() => {
    setPageTitle("Create Product");
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await categoriesApi.getAll();
      setCategories(response.data.data);
    } catch (error) {
      console.error("Failed to load categories:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await productsApi.create({
        ...formData,
        category_id: formData.category_id ? parseInt(formData.category_id) : null,
        cost_price: formData.cost_price ? parseFloat(formData.cost_price) : 0,
        selling_price: formData.selling_price ? parseFloat(formData.selling_price) : 0,
        min_stock: formData.min_stock ? parseInt(formData.min_stock) : 0,
        max_stock: formData.max_stock ? parseInt(formData.max_stock) : null,
      });

      toast({
        variant: "success",
        title: "Success!",
        description: "Product created successfully.",
      });

      navigate("/products");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: error.response?.data?.error || "Failed to create product.",
      });
    } finally {
      setLoading(false);
    }
  };

  const units = [
    { value: "pcs", label: "Pieces (pcs)" },
    { value: "kg", label: "Kilogram (kg)" },
    { value: "gram", label: "Gram (g)" },
    { value: "liter", label: "Liter (l)" },
    { value: "meter", label: "Meter (m)" },
    { value: "box", label: "Box" },
    { value: "pack", label: "Pack" },
  ];

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 lg:p-6">
      <div className="grid gap-4">
        <Card className="shadow-md">
          <CardHeader className="border-b bg-muted/50 p-4 lg:p-6">
            <div className="flex items-center gap-3 lg:gap-4">
              <div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => navigate("/products")}
                  className="h-9 w-9"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </div>
              <div>
                <CardTitle className="text-sm lg:text-base font-semibold">
                  Buat Produk
                </CardTitle>
                <CardDescription className="text-xs lg:text-sm">
                  Buat produk baru untuk sistem POS
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 lg:p-6">
            <form onSubmit={handleSubmit} className="space-y-4 lg:space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-5">
                <div className="space-y-2">
                  <Label
                    htmlFor="name"
                    className="text-xs font-medium flex items-center gap-2"
                  >
                    <Package className="h-3.5 w-3.5 text-muted-foreground" />
                    Nama Produk
                  </Label>
                  <Input
                    id="name"
                    required
                    placeholder="Masukkan nama produk"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="sku"
                    className="text-xs font-medium flex items-center gap-2"
                  >
                    <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                    SKU
                  </Label>
                  <Input
                    id="sku"
                    required
                    placeholder="Masukkan kode SKU"
                    value={formData.sku}
                    onChange={(e) =>
                      setFormData({ ...formData, sku: e.target.value })
                    }
                    className="h-9 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-5">
                <div className="space-y-2">
                  <Label
                    htmlFor="barcode"
                    className="text-xs font-medium flex items-center gap-2"
                  >
                    <Barcode className="h-3.5 w-3.5 text-muted-foreground" />
                    Barcode
                  </Label>
                  <Input
                    id="barcode"
                    placeholder="Masukkan barcode"
                    value={formData.barcode}
                    onChange={(e) =>
                      setFormData({ ...formData, barcode: e.target.value })
                    }
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium flex items-center gap-2">
                    <Layers3 className="h-3.5 w-3.5 text-muted-foreground" />
                    Kategori
                  </Label>
                  <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" className="w-full justify-between h-9 text-sm">
                        {formData.category_id ? categories.find((c) => c.id.toString() === formData.category_id)?.name || "Pilih kategori" : "Pilih kategori"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Cari kategori..." />
                        <CommandEmpty>Kategori tidak ditemukan.</CommandEmpty>
                        <CommandGroup>
                          {categories.map((category) => (
                            <CommandItem key={category.id} value={`${category.name} ${category.code}`} onSelect={() => { setFormData({ ...formData, category_id: category.id.toString() }); setCategoryOpen(false); }}>
                              <Check className={`mr-2 h-4 w-4 ${formData.category_id === category.id.toString() ? "opacity-100" : "opacity-0"}`} />
                              <div><div className="font-medium">{category.name}</div><div className="text-sm text-muted-foreground">{category.code}</div></div>
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
                  htmlFor="description"
                  className="text-xs font-medium flex items-center gap-2"
                >
                  <Package className="h-3.5 w-3.5 text-muted-foreground" />
                  Deskripsi
                </Label>
                <Textarea
                  id="description"
                  placeholder="Masukkan deskripsi produk"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="min-h-[80px] text-sm"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="space-y-2">
                  <Label className="text-xs font-medium flex items-center gap-2">
                    <Ruler className="h-3.5 w-3.5 text-muted-foreground" />
                    Satuan
                  </Label>
                  <Popover open={unitOpen} onOpenChange={setUnitOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" className="w-full justify-between h-9 text-sm">
                        {units.find((u) => u.value === formData.unit)?.label || "Pilih satuan"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Cari satuan..." />
                        <CommandEmpty>Satuan tidak ditemukan.</CommandEmpty>
                        <CommandGroup>
                          {units.map((unit) => (
                            <CommandItem key={unit.value} value={unit.label} onSelect={() => { setFormData({ ...formData, unit: unit.value }); setUnitOpen(false); }}>
                              <Check className={`mr-2 h-4 w-4 ${formData.unit === unit.value ? "opacity-100" : "opacity-0"}`} />
                              {unit.label}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="cost_price"
                    className="text-xs font-medium flex items-center gap-2"
                  >
                    <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                    Harga Beli
                  </Label>
                  <Input
                    id="cost_price"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0"
                    value={formData.cost_price}
                    onChange={(e) =>
                      setFormData({ ...formData, cost_price: e.target.value })
                    }
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="selling_price"
                    className="text-xs font-medium flex items-center gap-2"
                  >
                    <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                    Harga Jual
                  </Label>
                  <Input
                    id="selling_price"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0"
                    value={formData.selling_price}
                    onChange={(e) =>
                      setFormData({ ...formData, selling_price: e.target.value })
                    }
                    className="h-9 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-5">
                <div className="space-y-2">
                  <Label
                    htmlFor="min_stock"
                    className="text-xs font-medium flex items-center gap-2"
                  >
                    <Package className="h-3.5 w-3.5 text-muted-foreground" />
                    Minimum Stock
                  </Label>
                  <Input
                    id="min_stock"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={formData.min_stock}
                    onChange={(e) =>
                      setFormData({ ...formData, min_stock: e.target.value })
                    }
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="max_stock"
                    className="text-xs font-medium flex items-center gap-2"
                  >
                    <Package className="h-3.5 w-3.5 text-muted-foreground" />
                    Maximum Stock
                  </Label>
                  <Input
                    id="max_stock"
                    type="number"
                    min="0"
                    placeholder="Tidak terbatas"
                    value={formData.max_stock}
                    onChange={(e) =>
                      setFormData({ ...formData, max_stock: e.target.value })
                    }
                    className="h-9 text-sm"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex items-center space-x-3">
                  <Switch
                    id="is_trackable"
                    checked={formData.is_trackable}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, is_trackable: checked })
                    }
                  />
                  <Label htmlFor="is_trackable" className="text-xs font-medium">
                    Trackable Inventory
                  </Label>
                </div>

                <div className="flex items-center space-x-3">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, is_active: checked })
                    }
                  />
                  <Label htmlFor="is_active" className="text-xs font-medium">
                    Produk Aktif
                  </Label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/products")}
                  disabled={loading}
                  className="h-9 text-sm"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="h-9 text-sm"
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Buat Product
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
