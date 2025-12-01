import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Plus, Trash2, Check, ChevronsUpDown, Package } from 'lucide-react';
import { 
  purchaseOrdersApi, 
  warehousesApi, 
  productsApi,
  suppliersApi,
  type Warehouse, 
  type Product,
  type Supplier
} from '@/lib/api';
import { setPageTitle } from '@/lib/page-title';

const formSchema = z.object({
  warehouse_id: z.string().min(1, 'Warehouse is required'),
  supplier_id: z.string().optional(),
  supplier_name: z.string().min(1, 'Supplier name is required'),
  expected_date: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(z.object({
    product_id: z.string().min(1, 'Product is required'),
    quantity: z.number().min(1, 'Quantity must be at least 1'),
    unit_cost: z.number().min(0.01, 'Unit cost must be greater than 0'),
  })).min(1, 'At least one item is required'),
});

type FormData = z.infer<typeof formSchema>;

export default function CreatePurchaseOrderPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [productOpenIndex, setProductOpenIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      warehouse_id: '',
      supplier_id: '',
      supplier_name: '',
      expected_date: '',
      notes: '',
      items: [{ product_id: '', quantity: 1, unit_cost: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  useEffect(() => {
    setPageTitle('Buat Purchase Order');
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [warehousesResponse, productsResponse, suppliersResponse] = await Promise.all([
        warehousesApi.getAll(),
        productsApi.getAll(),
        suppliersApi.getAll(),
      ]);

      setWarehouses(warehousesResponse.data.data || warehousesResponse.data);
      setProducts(productsResponse.data.data || productsResponse.data);
      setSuppliers(suppliersResponse.data.data || suppliersResponse.data);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast({
        title: 'Error',
        description: 'Gagal memuat data',
        variant: 'destructive',
      });
    }
  };

  const calculateItemTotal = (quantity: number, unitCost: number) => {
    return quantity * unitCost;
  };

  const calculateTotal = () => {
    const items = form.watch('items') || [];
    return items.reduce((total, item) => {
      return total + calculateItemTotal(item.quantity || 0, item.unit_cost || 0);
    }, 0);
  };

  const getProductById = (id: string) => products.find((p) => p.id.toString() === id);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);

    try {
      const request: any = {
        warehouse_id: parseInt(data.warehouse_id),
        supplier_id: data.supplier_id ? parseInt(data.supplier_id) : null,
        supplier_name: data.supplier_name,
        expected_date: data.expected_date || null,
        notes: data.notes || '',
        items: data.items.map(item => ({
          product_id: parseInt(item.product_id),
          quantity_ordered: item.quantity,
          unit_cost: item.unit_cost,
        })),
      };

      await purchaseOrdersApi.create(request);
      
      toast({
        title: 'Berhasil',
        description: 'Purchase order berhasil dibuat',
      });
      
      navigate('/purchase-orders');
    } catch (error) {
      console.error('Failed to create purchase order:', error);
      toast({
        title: 'Error',
        description: 'Gagal membuat purchase order',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 lg:p-6">
      <Card className="shadow-md">
        <CardHeader className="border-b bg-muted/50 p-4 lg:p-6">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/purchase-orders')}
              className="h-8 w-8 p-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <CardTitle className="text-sm lg:text-base font-semibold">
                Buat Purchase Order
              </CardTitle>
              <CardDescription className="text-xs lg:text-sm">
                Buat purchase order baru untuk pengadaan inventori
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 lg:p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Basic Information */}
              <div className="grid gap-3 lg:gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="warehouse_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gudang Tujuan *</FormLabel>
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
                
                <FormField
                  control={form.control}
                  name="supplier_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Supplier *</FormLabel>
                      <Select 
                        onValueChange={(value) => {
                          field.onChange(value);
                          const supplier = suppliers.find(s => s.id.toString() === value);
                          if (supplier) {
                            form.setValue('supplier_name', supplier.name);
                          }
                        }} 
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih supplier..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {suppliers.map((supplier) => (
                            <SelectItem key={supplier.id} value={supplier.id.toString()}>
                              {supplier.name} ({supplier.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="supplier_name"
                  render={({ field }) => (
                    <FormItem className="hidden">
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="expected_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tanggal Diharapkan</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Catatan</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Catatan tambahan (opsional)"
                        rows={2}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Items Table */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium">Item Pembelian</h3>
                    <p className="text-sm text-muted-foreground">Tambahkan produk yang akan dibeli</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => append({ product_id: '', quantity: 1, unit_cost: 0 })}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Tambah Item
                  </Button>
                </div>
                
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="w-[50px] text-center">#</TableHead>
                        <TableHead>Produk</TableHead>
                        <TableHead className="w-[100px] text-center">SKU</TableHead>
                        <TableHead className="w-[120px] text-center">Kuantitas</TableHead>
                        <TableHead className="w-[150px] text-center">Harga Satuan</TableHead>
                        <TableHead className="w-[150px] text-right">Subtotal</TableHead>
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
                          const selectedProduct = getProductById(form.watch(`items.${index}.product_id`));
                          const quantity = form.watch(`items.${index}.quantity`) || 0;
                          const unitCost = form.watch(`items.${index}.unit_cost`) || 0;
                          const subtotal = calculateItemTotal(quantity, unitCost);
                          
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
                                            >
                                              {field.value
                                                ? products.find((p) => p.id.toString() === field.value)?.name
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
                                              {products.map((product) => (
                                                <CommandItem
                                                  key={product.id}
                                                  value={`${product.name} ${product.sku}`}
                                                  onSelect={() => {
                                                    field.onChange(product.id.toString());
                                                    setProductOpenIndex(null);
                                                  }}
                                                >
                                                  <Check
                                                    className={`mr-2 h-4 w-4 ${
                                                      field.value === product.id.toString() ? "opacity-100" : "opacity-0"
                                                    }`}
                                                  />
                                                  <div className="flex-1">
                                                    <div className="font-medium">{product.name}</div>
                                                    <div className="text-sm text-muted-foreground">{product.sku}</div>
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
                                {selectedProduct?.sku || '-'}
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
                                          className="text-center"
                                          {...field}
                                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                          value={field.value || ''}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </TableCell>
                              <TableCell>
                                <FormField
                                  control={form.control}
                                  name={`items.${index}.unit_cost`}
                                  render={({ field }) => (
                                    <FormItem className="space-y-0">
                                      <FormControl>
                                        <Input
                                          type="number"
                                          min="0"
                                          step="100"
                                          className="text-right"
                                          {...field}
                                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                          value={field.value || ''}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {formatCurrency(subtotal)}
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
                    {fields.length > 0 && (
                      <TableFooter>
                        <TableRow>
                          <TableCell colSpan={5} className="text-right font-medium">
                            Total
                          </TableCell>
                          <TableCell className="text-right font-bold text-lg">
                            {formatCurrency(calculateTotal())}
                          </TableCell>
                          <TableCell />
                        </TableRow>
                      </TableFooter>
                    )}
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
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/purchase-orders')}
                  disabled={loading}
                >
                  Batal
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Menyimpan...' : 'Buat Purchase Order'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
