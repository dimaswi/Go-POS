import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import * as z from "zod";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Trash2, Check, ChevronsUpDown, Package, AlertCircle, Loader2 } from "lucide-react";
import {
  stockTransfersApi,
  warehousesApi,
  storesApi,
  inventoryApi,
  type Warehouse,
  type Store,
} from "@/lib/api";
import { setPageTitle } from "@/lib/page-title";

interface InventoryProduct {
  id: number;
  product_id: number;
  product?: {
    id: number;
    name: string;
    sku: string;
  };
  quantity: number;
  shelf_location?: string;
  section?: string;
  display_area?: string;
  zone?: string;
  aisle?: string;
}

const formSchema = z.object({
  from_type: z.enum(["warehouse", "store"]),
  from_warehouse_id: z.string().optional(),
  from_store_id: z.string().optional(),
  to_type: z.enum(["warehouse", "store"]),
  to_warehouse_id: z.string().optional(),
  to_store_id: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(z.object({
    product_id: z.string().min(1, "Product is required"),
    quantity: z.number().min(1, "Quantity must be at least 1"),
  })).min(1, "At least one item is required"),
}).refine(
  (data) => {
    const hasFromLocation = 
      (data.from_type === "warehouse" && data.from_warehouse_id) ||
      (data.from_type === "store" && data.from_store_id);
    const hasToLocation = 
      (data.to_type === "warehouse" && data.to_warehouse_id) ||
      (data.to_type === "store" && data.to_store_id);
    return hasFromLocation && hasToLocation;
  },
  { message: "Both from and to locations must be specified", path: ["from_type"] }
);

type FormData = z.infer<typeof formSchema>;

export default function CreateStockTransferPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [availableProducts, setAvailableProducts] = useState<InventoryProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productOpenIndex, setProductOpenIndex] = useState<number | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      from_type: "warehouse",
      to_type: "store",
      notes: "",
      items: [{ product_id: "", quantity: 1 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const fromType = form.watch("from_type");
  const fromWarehouseId = form.watch("from_warehouse_id");
  const fromStoreId = form.watch("from_store_id");

  useEffect(() => {
    setPageTitle("Buat Transfer Stok");
    loadData();
  }, []);

  // Load products when from location changes
  useEffect(() => {
    const loadProducts = async () => {
      // Reset items when location changes
      form.setValue("items", [{ product_id: "", quantity: 1 }]);
      
      if (fromType === "warehouse" && fromWarehouseId) {
        setLoadingProducts(true);
        try {
          const response = await inventoryApi.getWarehouseInventory({ 
            warehouse_id: fromWarehouseId,
            limit: 1000 
          });
          setAvailableProducts(response.data.data || []);
        } catch (error) {
          console.error("Failed to load warehouse inventory:", error);
          setAvailableProducts([]);
        } finally {
          setLoadingProducts(false);
        }
      } else if (fromType === "store" && fromStoreId) {
        setLoadingProducts(true);
        try {
          const response = await inventoryApi.getStoreInventory({ 
            store_id: fromStoreId,
            limit: 1000 
          });
          setAvailableProducts(response.data.data || []);
        } catch (error) {
          console.error("Failed to load store inventory:", error);
          setAvailableProducts([]);
        } finally {
          setLoadingProducts(false);
        }
      } else {
        setAvailableProducts([]);
      }
    };

    loadProducts();
  }, [fromType, fromWarehouseId, fromStoreId, form]);

  const loadData = async () => {
    try {
      const [warehousesRes, storesRes] = await Promise.all([
        warehousesApi.getAll(),
        storesApi.getAll(),
      ]);
      setWarehouses(warehousesRes.data.data || warehousesRes.data);
      setStores(storesRes.data.data || storesRes.data);
    } catch (error) {
      toast({ title: "Error", description: "Gagal memuat data", variant: "destructive" });
    }
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await stockTransfersApi.create({
        from_warehouse_id: data.from_type === "warehouse" && data.from_warehouse_id ? parseInt(data.from_warehouse_id) : undefined,
        from_store_id: data.from_type === "store" && data.from_store_id ? parseInt(data.from_store_id) : undefined,
        to_warehouse_id: data.to_type === "warehouse" && data.to_warehouse_id ? parseInt(data.to_warehouse_id) : undefined,
        to_store_id: data.to_type === "store" && data.to_store_id ? parseInt(data.to_store_id) : undefined,
        notes: data.notes || "",
        items: data.items.map(item => ({
          product_id: parseInt(item.product_id),
          quantity_requested: item.quantity,
        })),
      });
      toast({ title: "Berhasil", description: "Transfer stok berhasil dibuat" });
      navigate("/stock-transfers");
    } catch (error: any) {
      const message = error?.response?.data?.error || "Gagal membuat transfer stok";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setLoading(false)
    }
  };

  const getProductById = (productId: string) => {
    return availableProducts.find((p) => p.product_id.toString() === productId);
  };

  const getAvailableStock = (productId: string) => {
    const product = getProductById(productId);
    return product?.quantity || 0;
  };

  const hasSourceLocation = (fromType === "warehouse" && fromWarehouseId) || (fromType === "store" && fromStoreId);

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 lg:p-6">
      <Card className="shadow-md">
        <CardHeader className="border-b bg-muted/50 p-4 lg:p-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/stock-transfers")} className="h-8 w-8 p-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <CardTitle className="text-sm lg:text-base font-semibold">Buat Transfer Stok</CardTitle>
              <CardDescription className="text-xs lg:text-sm">Transfer stok antar gudang dan toko</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 lg:p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Transfer Locations */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* From Location */}
                <Card className="border-dashed">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Dari Lokasi</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="from_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipe Lokasi</FormLabel>
                          <Select onValueChange={(value) => {
                            field.onChange(value);
                            form.setValue("from_warehouse_id", undefined);
                            form.setValue("from_store_id", undefined);
                          }} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Pilih tipe..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="warehouse">Gudang</SelectItem>
                              <SelectItem value="store">Toko</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {form.watch("from_type") === "warehouse" ? (
                      <FormField
                        control={form.control}
                        name="from_warehouse_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Gudang Asal</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Pilih gudang..." />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {warehouses.map((warehouse) => (
                                  <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                                    {warehouse.name} ({warehouse.code})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ) : (
                      <FormField
                        control={form.control}
                        name="from_store_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Toko Asal</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Pilih toko..." />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {stores.map((store) => (
                                  <SelectItem key={store.id} value={store.id.toString()}>
                                    {store.name} ({store.code})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {hasSourceLocation && (
                      <div className="pt-2 border-t">
                        <p className="text-sm text-muted-foreground">
                          {loadingProducts ? (
                            <span className="flex items-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Memuat produk...
                            </span>
                          ) : (
                            <span>{availableProducts.length} produk tersedia</span>
                          )}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* To Location */}
                <Card className="border-dashed">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Ke Lokasi</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="to_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipe Lokasi</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Pilih tipe..." />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="warehouse">Gudang</SelectItem>
                              <SelectItem value="store">Toko</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {form.watch("to_type") === "warehouse" ? (
                      <FormField
                        control={form.control}
                        name="to_warehouse_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Gudang Tujuan</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Pilih gudang..." />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {warehouses.map((warehouse) => (
                                  <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                                    {warehouse.name} ({warehouse.code})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ) : (
                      <FormField
                        control={form.control}
                        name="to_store_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Toko Tujuan</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Pilih toko..." />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {stores.map((store) => (
                                  <SelectItem key={store.id} value={store.id.toString()}>
                                    {store.name} ({store.code})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Notes */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Catatan</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Catatan tambahan (opsional)" rows={2} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Items Table */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium">Item Transfer</h3>
                    <p className="text-sm text-muted-foreground">Tambahkan produk yang akan ditransfer</p>
                  </div>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={() => append({ product_id: "", quantity: 1 })}
                    disabled={!hasSourceLocation || availableProducts.length === 0}
                  >
                    <Plus className="h-4 w-4 mr-1" /> Tambah Item
                  </Button>
                </div>

                {!hasSourceLocation && (
                  <div className="flex items-center gap-2 p-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg text-yellow-800 dark:text-yellow-200">
                    <AlertCircle className="h-5 w-5" />
                    <p className="text-sm">Pilih lokasi asal terlebih dahulu untuk melihat produk yang tersedia</p>
                  </div>
                )}

                {hasSourceLocation && availableProducts.length === 0 && !loadingProducts && (
                  <div className="flex items-center gap-2 p-4 bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-lg text-orange-800 dark:text-orange-200">
                    <AlertCircle className="h-5 w-5" />
                    <p className="text-sm">Tidak ada produk tersedia di lokasi ini</p>
                  </div>
                )}

                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="w-[50px] text-center">#</TableHead>
                        <TableHead>Produk</TableHead>
                        <TableHead className="w-[100px] text-center">SKU</TableHead>
                        <TableHead className="w-[120px] text-center">Stok Tersedia</TableHead>
                        <TableHead className="w-[100px] text-center">Lokasi</TableHead>
                        <TableHead className="w-[120px] text-center">Jumlah Transfer</TableHead>
                        <TableHead className="w-[60px] text-center">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fields.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="h-24 text-center">
                            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                              <Package className="h-8 w-8 opacity-50" />
                              <p>Belum ada item. Klik "Tambah Item" untuk menambahkan produk.</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        fields.map((field, index) => {
                          const productId = form.watch(`items.${index}.product_id`);
                          const selectedProduct = getProductById(productId);
                          const availableStock = getAvailableStock(productId);
                          const quantity = form.watch(`items.${index}.quantity`) || 0;
                          const isOverStock = quantity > availableStock;

                          return (
                            <TableRow key={field.id}>
                              <TableCell className="text-center font-medium text-muted-foreground">
                                {index + 1}
                              </TableCell>
                              <TableCell>
                                <FormField
                                  control={form.control}
                                  name={`items.${index}.product_id`}
                                  render={({ field }) => (
                                    <FormItem className="space-y-0">
                                      <Popover 
                                        open={productOpenIndex === index} 
                                        onOpenChange={(open) => setProductOpenIndex(open ? index : null)}
                                      >
                                        <PopoverTrigger asChild>
                                          <FormControl>
                                            <Button 
                                              variant="outline" 
                                              role="combobox" 
                                              className="w-full justify-between font-normal"
                                              disabled={!hasSourceLocation || availableProducts.length === 0}
                                            >
                                              {field.value 
                                                ? availableProducts.find((p) => p.product_id.toString() === field.value)?.product?.name 
                                                : "Pilih produk..."}
                                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                          </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                                          <Command>
                                            <CommandInput placeholder="Cari produk..." />
                                            <CommandEmpty>Produk tidak ditemukan.</CommandEmpty>
                                            <CommandGroup className="max-h-[300px] overflow-auto">
                                              {availableProducts.map((item) => (
                                                <CommandItem 
                                                  key={item.id} 
                                                  value={`${item.product?.name} ${item.product?.sku}`} 
                                                  onSelect={() => { 
                                                    field.onChange(item.product_id.toString()); 
                                                    setProductOpenIndex(null); 
                                                  }}
                                                >
                                                  <Check 
                                                    className={`mr-2 h-4 w-4 ${
                                                      field.value === item.product_id.toString() ? "opacity-100" : "opacity-0"
                                                    }`} 
                                                  />
                                                  <div className="flex-1">
                                                    <div className="font-medium">{item.product?.name}</div>
                                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                      <span>{item.product?.sku}</span>
                                                      <span>•</span>
                                                      <span>Stok: {item.quantity}</span>
                                                      {item.shelf_location && (
                                                        <>
                                                          <span>•</span>
                                                          <span>Lokasi: {item.shelf_location}</span>
                                                        </>
                                                      )}
                                                    </div>
                                                  </div>
                                                </CommandItem>
                                              ))}
                                            </CommandGroup>
                                          </Command>
                                        </PopoverContent>
                                      </Popover>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </TableCell>
                              <TableCell className="text-center text-muted-foreground">
                                {selectedProduct?.product?.sku || '-'}
                              </TableCell>
                              <TableCell className="text-center">
                                {selectedProduct ? (
                                  <Badge variant={availableStock > 0 ? "secondary" : "destructive"}>
                                    {availableStock}
                                  </Badge>
                                ) : '-'}
                              </TableCell>
                              <TableCell className="text-center text-sm text-muted-foreground">
                                {selectedProduct?.shelf_location || selectedProduct?.section || '-'}
                              </TableCell>
                              <TableCell>
                                <FormField
                                  control={form.control}
                                  name={`items.${index}.quantity`}
                                  render={({ field }) => (
                                    <FormItem className="space-y-0">
                                      <FormControl>
                                        <Input 
                                          type="number" 
                                          min="1"
                                          max={availableStock}
                                          className={`text-center ${isOverStock ? 'border-red-500' : ''}`}
                                          {...field} 
                                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} 
                                          value={field.value || ""} 
                                        />
                                      </FormControl>
                                      {isOverStock && (
                                        <p className="text-xs text-red-500 mt-1">Melebihi stok</p>
                                      )}
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </TableCell>
                              <TableCell className="text-center">
                                <Button 
                                  type="button" 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => remove(index)} 
                                  disabled={fields.length === 1}
                                  className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex justify-between items-center text-sm text-muted-foreground px-1">
                  <span>Total: {fields.length} item</span>
                  <span>
                    Total Kuantitas: {fields.reduce((sum, _, i) => sum + (form.watch(`items.${i}.quantity`) || 0), 0)}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => navigate("/stock-transfers")}>
                  Batal
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Menyimpan..." : "Buat Transfer Stok"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
