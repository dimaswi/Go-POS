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

export default function ProductEdit() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
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
    setPageTitle("Edit Product");
    loadCategories();
    loadProduct();
  }, [id]);

  const loadProduct = async () => {
    if (!id) return;
    
    try {
      const response = await productsApi.getById(parseInt(id));
      const product = response.data.data;
      
      setFormData({
        name: product.name || "",
        sku: product.sku || "",
        barcode: product.barcode || "",
        category_id: product.category_id ? product.category_id.toString() : "",
        description: product.description || "",
        unit: product.unit || "pcs",
        cost_price: product.cost_price ? product.cost_price.toString() : "",
        selling_price: product.selling_price ? product.selling_price.toString() : "",
        min_stock: product.min_stock ? product.min_stock.toString() : "",
        max_stock: product.max_stock ? product.max_stock.toString() : "",
        is_trackable: product.is_trackable ?? true,
        is_active: product.is_active ?? true,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: error.response?.data?.error || "Failed to load product.",
      });
      navigate("/products");
    } finally {
      setPageLoading(false);
    }
  };

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
    if (!id) return;
    
    setLoading(true);

    try {
      await productsApi.update(parseInt(id), {
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
        description: "Product updated successfully.",
      });

      navigate("/products");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: error.response?.data?.error || "Failed to update product.",
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
              onClick={() => navigate("/products")}
              className="h-8 w-8 shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-0">
              <CardTitle className="text-sm font-semibold truncate">
                Edit Produk
              </CardTitle>
              <CardDescription className="text-xs hidden sm:block">
                Update informasi produk
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
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
                              <div><div className="font-medium text-sm">{category.name}</div><div className="text-xs text-muted-foreground">{category.code}</div></div>
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
                  className="min-h-[70px] text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
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

              <div className="flex flex-wrap gap-4 sm:gap-6">
                <div className="flex items-center space-x-2">
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

                <div className="flex items-center space-x-2">
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

              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/products")}
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
                  Update Produk
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
    </div>
  );
}
