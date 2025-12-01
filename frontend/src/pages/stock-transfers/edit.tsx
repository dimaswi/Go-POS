import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, ArrowRightLeft, Plus, Trash2, Check, ChevronsUpDown } from 'lucide-react';
import {
  stockTransfersApi,
  inventoryApi,
  warehousesApi,
  storesApi,
  type StockTransfer,
  type Warehouse,
  type Store,
} from '@/lib/api';
import { setPageTitle } from '@/lib/page-title';
import { usePermission } from '@/hooks/usePermission';

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

const stockTransferSchema = z.object({
  from_warehouse_id: z.string().optional(),
  from_store_id: z.string().optional(),
  to_warehouse_id: z.string().optional(),
  to_store_id: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(z.object({
    product_id: z.string().min(1, 'Product is required'),
    quantity_requested: z.number().min(1, 'Quantity must be at least 1'),
  })).min(1, 'At least one item is required'),
}).refine(
  (data) => {
    const hasFromLocation = data.from_warehouse_id || data.from_store_id;
    const hasToLocation = data.to_warehouse_id || data.to_store_id;
    return hasFromLocation && hasToLocation;
  },
  {
    message: "Both from and to locations must be specified",
    path: ["from_warehouse_id"],
  }
);

type StockTransferFormData = z.infer<typeof stockTransferSchema>;

export default function StockTransferEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { hasPermission } = usePermission();
  const [stockTransfer, setStockTransfer] = useState<StockTransfer | null>(null);
  const [availableProducts, setAvailableProducts] = useState<InventoryProduct[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [fromWarehouseOpen, setFromWarehouseOpen] = useState(false);
  const [fromStoreOpen, setFromStoreOpen] = useState(false);
  const [toWarehouseOpen, setToWarehouseOpen] = useState(false);
  const [toStoreOpen, setToStoreOpen] = useState(false);
  const [productOpenIndex, setProductOpenIndex] = useState<number | null>(null);

  const form = useForm<StockTransferFormData>({
    resolver: zodResolver(stockTransferSchema),
    defaultValues: {
      from_warehouse_id: '',
      from_store_id: '',
      to_warehouse_id: '',
      to_store_id: '',
      notes: '',
      items: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  useEffect(() => {
    if (!hasPermission('stock_transfers.update')) {
      navigate('/stock-transfers');
      return;
    }

    if (!id) {
      navigate('/stock-transfers');
      return;
    }
    
    setPageTitle('Edit Stock Transfer');
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [transferResponse, warehousesResponse, storesResponse] = await Promise.all([
        stockTransfersApi.getById(parseInt(id!)),
        warehousesApi.getAll(),
        storesApi.getAll(),
      ]);
      
      const transfer = transferResponse.data.data;
      setStockTransfer(transfer);
      setWarehouses(warehousesResponse.data.data);
      setStores(storesResponse.data.data);

      // Check if transfer can be edited
      if (transfer.status !== 'pending') {
        toast({
          variant: "destructive",
          title: "Cannot Edit!",
          description: "Only pending stock transfers can be edited.",
        });
        navigate(`/stock-transfers/${id}`);
        return;
      }

      // Populate form with existing data
      form.reset({
        from_warehouse_id: transfer.from_warehouse_id?.toString() || '',
        from_store_id: transfer.from_store_id?.toString() || '',
        to_warehouse_id: transfer.to_warehouse_id?.toString() || '',
        to_store_id: transfer.to_store_id?.toString() || '',
        notes: transfer.notes || '',
        items: transfer.items?.map((item: any) => ({
          product_id: item.product_id.toString(),
          quantity_requested: item.quantity_requested,
        })) || [],
      });

      // Load products from source location
      if (transfer.from_warehouse_id) {
        await loadProductsFromWarehouse(transfer.from_warehouse_id.toString());
      } else if (transfer.from_store_id) {
        await loadProductsFromStore(transfer.from_store_id.toString());
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: "Failed to load stock transfer details.",
      });
      navigate('/stock-transfers');
    } finally {
      setLoading(false);
    }
  };

  const loadProductsFromWarehouse = async (warehouseId: string) => {
    setLoadingProducts(true);
    try {
      const response = await inventoryApi.getWarehouseInventory({ 
        warehouse_id: warehouseId,
        limit: 1000 
      });
      setAvailableProducts(response.data.data || []);
    } catch (error) {
      console.error("Failed to load warehouse inventory:", error);
      setAvailableProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  };

  const loadProductsFromStore = async (storeId: string) => {
    setLoadingProducts(true);
    try {
      const response = await inventoryApi.getStoreInventory({ 
        store_id: storeId,
        limit: 1000 
      });
      setAvailableProducts(response.data.data || []);
    } catch (error) {
      console.error("Failed to load store inventory:", error);
      setAvailableProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  };

  const getProductById = (productId: string) => {
    return availableProducts.find((p) => p.product_id.toString() === productId);
  };

  const getAvailableStock = (productId: string) => {
    const product = getProductById(productId);
    return product?.quantity || 0;
  };

  const addItem = () => {
    append({
      product_id: '',
      quantity_requested: 1,
    });
  };

  const onSubmit = async (data: StockTransferFormData) => {
    try {
      setSubmitting(true);
      
      const payload = {
        from_warehouse_id: data.from_warehouse_id ? parseInt(data.from_warehouse_id) : undefined,
        from_store_id: data.from_store_id ? parseInt(data.from_store_id) : undefined,
        to_warehouse_id: data.to_warehouse_id ? parseInt(data.to_warehouse_id) : undefined,
        to_store_id: data.to_store_id ? parseInt(data.to_store_id) : undefined,
        notes: data.notes,
        items: data.items.map(item => ({
          product_id: parseInt(item.product_id),
          quantity_requested: item.quantity_requested,
        })),
      };

      await stockTransfersApi.update(parseInt(id!), payload);
      
      toast({
        variant: "default",
        title: "Success!",
        description: "Stock transfer updated successfully.",
      });
      
      navigate(`/stock-transfers/${id}`);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: "Failed to update stock transfer.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-96 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!stockTransfer) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <ArrowRightLeft className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-lg font-medium">Stock transfer not found</h3>
              <p className="mt-1 text-muted-foreground">
                The stock transfer you're trying to edit doesn't exist.
              </p>
              <Button onClick={() => navigate('/stock-transfers')} className="mt-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Stock Transfers
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 lg:p-6">
      <div className="grid gap-4">
        <Card className="shadow-md">
          <CardHeader className="border-b bg-muted/50">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate(`/stock-transfers/${id}`)}
                className="h-8 w-8 p-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <CardTitle className="text-base font-semibold">
                  Edit Stock Transfer #{stockTransfer.transfer_number}
                </CardTitle>
                <CardDescription>
                  Modify transfer details and items
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowRightLeft className="h-5 w-5" />
                Transfer Details
              </CardTitle>
              <CardDescription>
                Update source and destination locations for this transfer
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
                {/* From Location */}
                <div className="space-y-4">
                  <h3 className="font-medium">From Location</h3>
                  
                  <FormField
                    control={form.control}
                    name="from_warehouse_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>From Warehouse</FormLabel>
                        <Popover open={fromWarehouseOpen} onOpenChange={setFromWarehouseOpen}>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button variant="outline" role="combobox" className="w-full justify-between">
                                {field.value ? warehouses.find((w) => w.id.toString() === field.value)?.name || "Select warehouse..." : "Select warehouse..."}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                            <Command>
                              <CommandInput placeholder="Search warehouse..." />
                              <CommandEmpty>No warehouse found.</CommandEmpty>
                              <CommandGroup>
                                <CommandItem value="none" onSelect={() => { field.onChange(''); form.setValue('from_store_id', ''); setAvailableProducts([]); form.setValue('items', []); setFromWarehouseOpen(false); }}>
                                  <Check className={`mr-2 h-4 w-4 ${!field.value ? "opacity-100" : "opacity-0"}`} />
                                  None
                                </CommandItem>
                                {warehouses.filter(w => w.id).map((warehouse) => (
                                  <CommandItem key={warehouse.id} value={`${warehouse.name} ${warehouse.code}`} onSelect={() => { field.onChange(warehouse.id.toString()); form.setValue('from_store_id', ''); loadProductsFromWarehouse(warehouse.id.toString()); form.setValue('items', []); setFromWarehouseOpen(false); }}>
                                    <Check className={`mr-2 h-4 w-4 ${field.value === warehouse.id.toString() ? "opacity-100" : "opacity-0"}`} />
                                    <div><div className="font-medium">{warehouse.name}</div><div className="text-sm text-muted-foreground">{warehouse.code}</div></div>
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

                  <FormField
                    control={form.control}
                    name="from_store_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>From Store</FormLabel>
                        <Popover open={fromStoreOpen} onOpenChange={setFromStoreOpen}>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button variant="outline" role="combobox" className="w-full justify-between">
                                {field.value ? stores.find((s) => s.id.toString() === field.value)?.name || "Select store..." : "Select store..."}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                            <Command>
                              <CommandInput placeholder="Search store..." />
                              <CommandEmpty>No store found.</CommandEmpty>
                              <CommandGroup>
                                <CommandItem value="none" onSelect={() => { field.onChange(''); form.setValue('from_warehouse_id', ''); setAvailableProducts([]); form.setValue('items', []); setFromStoreOpen(false); }}>
                                  <Check className={`mr-2 h-4 w-4 ${!field.value ? "opacity-100" : "opacity-0"}`} />
                                  None
                                </CommandItem>
                                {stores.filter(s => s.id).map((store) => (
                                  <CommandItem key={store.id} value={`${store.name} ${store.code}`} onSelect={() => { field.onChange(store.id.toString()); form.setValue('from_warehouse_id', ''); loadProductsFromStore(store.id.toString()); form.setValue('items', []); setFromStoreOpen(false); }}>
                                    <Check className={`mr-2 h-4 w-4 ${field.value === store.id.toString() ? "opacity-100" : "opacity-0"}`} />
                                    <div><div className="font-medium">{store.name}</div><div className="text-sm text-muted-foreground">{store.code}</div></div>
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
                </div>

                {/* To Location */}
                <div className="space-y-4">
                  <h3 className="font-medium">To Location</h3>
                  
                  <FormField
                    control={form.control}
                    name="to_warehouse_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>To Warehouse</FormLabel>
                        <Popover open={toWarehouseOpen} onOpenChange={setToWarehouseOpen}>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button variant="outline" role="combobox" className="w-full justify-between">
                                {field.value ? warehouses.find((w) => w.id.toString() === field.value)?.name || "Select warehouse..." : "Select warehouse..."}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                            <Command>
                              <CommandInput placeholder="Search warehouse..." />
                              <CommandEmpty>No warehouse found.</CommandEmpty>
                              <CommandGroup>
                                <CommandItem value="none" onSelect={() => { field.onChange(''); form.setValue('to_store_id', ''); setToWarehouseOpen(false); }}>
                                  <Check className={`mr-2 h-4 w-4 ${!field.value ? "opacity-100" : "opacity-0"}`} />
                                  None
                                </CommandItem>
                                {warehouses.filter(w => w.id).map((warehouse) => (
                                  <CommandItem key={warehouse.id} value={`${warehouse.name} ${warehouse.code}`} onSelect={() => { field.onChange(warehouse.id.toString()); form.setValue('to_store_id', ''); setToWarehouseOpen(false); }}>
                                    <Check className={`mr-2 h-4 w-4 ${field.value === warehouse.id.toString() ? "opacity-100" : "opacity-0"}`} />
                                    <div><div className="font-medium">{warehouse.name}</div><div className="text-sm text-muted-foreground">{warehouse.code}</div></div>
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

                  <FormField
                    control={form.control}
                    name="to_store_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>To Store</FormLabel>
                        <Popover open={toStoreOpen} onOpenChange={setToStoreOpen}>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button variant="outline" role="combobox" className="w-full justify-between">
                                {field.value ? stores.find((s) => s.id.toString() === field.value)?.name || "Select store..." : "Select store..."}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                            <Command>
                              <CommandInput placeholder="Search store..." />
                              <CommandEmpty>No store found.</CommandEmpty>
                              <CommandGroup>
                                <CommandItem value="none" onSelect={() => { field.onChange(''); form.setValue('to_warehouse_id', ''); setToStoreOpen(false); }}>
                                  <Check className={`mr-2 h-4 w-4 ${!field.value ? "opacity-100" : "opacity-0"}`} />
                                  None
                                </CommandItem>
                                {stores.filter(s => s.id).map((store) => (
                                  <CommandItem key={store.id} value={`${store.name} ${store.code}`} onSelect={() => { field.onChange(store.id.toString()); form.setValue('to_warehouse_id', ''); setToStoreOpen(false); }}>
                                    <Check className={`mr-2 h-4 w-4 ${field.value === store.id.toString() ? "opacity-100" : "opacity-0"}`} />
                                    <div><div className="font-medium">{store.name}</div><div className="text-sm text-muted-foreground">{store.code}</div></div>
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
                </div>
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Additional notes about this transfer..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Items Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Transfer Items
                <Button type="button" onClick={addItem} size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Item
                </Button>
              </CardTitle>
              <CardDescription>
                Products to transfer between locations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {fields.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead className="w-[100px] text-center">Available Stock</TableHead>
                      <TableHead className="w-[120px]">Quantity Requested</TableHead>
                      <TableHead className="w-12">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fields.map((field, index) => {
                      const productId = form.watch(`items.${index}.product_id`);
                      const selectedProduct = getProductById(productId);
                      const availableStock = getAvailableStock(productId);
                      const quantity = form.watch(`items.${index}.quantity_requested`) || 0;
                      const isOverStock = quantity > availableStock && availableStock > 0;

                      return (
                        <TableRow key={field.id}>
                          <TableCell>
                            <FormField
                              control={form.control}
                              name={`items.${index}.product_id`}
                              render={({ field }) => (
                                <FormItem>
                                  <Popover open={productOpenIndex === index} onOpenChange={(open) => setProductOpenIndex(open ? index : null)}>
                                    <PopoverTrigger asChild>
                                      <FormControl>
                                        <Button 
                                          variant="outline" 
                                          role="combobox" 
                                          className="w-full justify-between"
                                          disabled={loadingProducts || availableProducts.length === 0}
                                        >
                                          {field.value 
                                            ? availableProducts.find((p) => p.product_id.toString() === field.value)?.product?.name || "Select product..." 
                                            : loadingProducts ? "Loading products..." : "Select product..."}
                                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                      </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                                      <Command>
                                        <CommandInput placeholder="Search product..." />
                                        <CommandEmpty>No product found.</CommandEmpty>
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
                                              <Check className={`mr-2 h-4 w-4 ${field.value === item.product_id.toString() ? "opacity-100" : "opacity-0"}`} />
                                              <div className="flex-1">
                                                <div className="font-medium">{item.product?.name}</div>
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                  <span>{item.product?.sku}</span>
                                                  <span>•</span>
                                                  <span>Stock: {item.quantity}</span>
                                                  {item.shelf_location && (
                                                    <>
                                                      <span>•</span>
                                                      <span>Loc: {item.shelf_location}</span>
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
                          <TableCell className="text-center">
                            {selectedProduct ? (
                              <span className={availableStock <= 0 ? 'text-red-500' : ''}>
                                {availableStock}
                              </span>
                            ) : '-'}
                          </TableCell>
                          <TableCell>
                            <FormField
                              control={form.control}
                              name={`items.${index}.quantity_requested`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      min="1"
                                      max={availableStock || undefined}
                                      className={isOverStock ? 'border-red-500' : ''}
                                      {...field}
                                      onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                                    />
                                  </FormControl>
                                  {isOverStock && (
                                    <p className="text-xs text-red-500">Exceeds stock</p>
                                  )}
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => remove(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <ArrowRightLeft className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-2 text-lg font-medium">No items added</h3>
                  <p className="mt-1 text-muted-foreground">
                    Click "Add Item" to start adding products to this transfer.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(`/stock-transfers/${id}`)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || fields.length === 0}
              className="flex-1"
            >
              {submitting ? 'Updating...' : 'Update Stock Transfer'}
            </Button>
          </div>
            </form>
          </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
