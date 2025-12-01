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
import { ArrowLeft, Package, Plus, Trash2, Check, ChevronsUpDown } from 'lucide-react';
import {
  purchaseOrdersApi,
  productsApi,
  warehousesApi,
  suppliersApi,
  type PurchaseOrder,
  type Product,
  type Warehouse,
  type Supplier,
} from '@/lib/api';
import { setPageTitle } from '@/lib/page-title';
import { usePermission } from '@/hooks/usePermission';

const purchaseOrderSchema = z.object({
  supplier_id: z.string().optional(),
  supplier_name: z.string().min(1, 'Supplier name is required'),
  supplier_contact: z.string().optional(),
  warehouse_id: z.string().min(1, 'Warehouse is required'),
  expected_date: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(z.object({
    product_id: z.string().min(1, 'Product is required'),
    quantity_ordered: z.number().min(1, 'Quantity must be at least 1'),
    unit_cost: z.number().min(0, 'Unit cost must be positive'),
  })).min(1, 'At least one item is required'),
});

type PurchaseOrderFormData = z.infer<typeof purchaseOrderSchema>;

export default function PurchaseOrderEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { hasPermission } = usePermission();
  const [purchaseOrder, setPurchaseOrder] = useState<PurchaseOrder | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [supplierOpen, setSupplierOpen] = useState(false);
  const [warehouseOpen, setWarehouseOpen] = useState(false);
  const [productOpenIndex, setProductOpenIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<PurchaseOrderFormData>({
    resolver: zodResolver(purchaseOrderSchema),
    defaultValues: {
      supplier_id: '',
      supplier_name: '',
      supplier_contact: '',
      warehouse_id: '',
      expected_date: '',
      notes: '',
      items: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  useEffect(() => {
    if (!hasPermission('purchase_orders.update')) {
      navigate('/purchase-orders');
      return;
    }

    if (!id) {
      navigate('/purchase-orders');
      return;
    }
    
    setPageTitle('Edit Purchase Order');
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [poResponse, productsResponse, warehousesResponse, suppliersResponse] = await Promise.all([
        purchaseOrdersApi.getById(parseInt(id!)),
        productsApi.getAll(),
        warehousesApi.getAll(),
        suppliersApi.getAll(),
      ]);
      
      const po = poResponse.data.data;
      setPurchaseOrder(po);
      setProducts(productsResponse.data.data);
      setWarehouses(warehousesResponse.data.data);
      setSuppliers(suppliersResponse.data.data || suppliersResponse.data);

      // Check if PO can be edited
      if (po.status !== 'draft' && po.status !== 'pending') {
        toast({
          variant: "destructive",
          title: "Cannot Edit!",
          description: "Only draft or pending purchase orders can be edited.",
        });
        navigate(`/purchase-orders/${id}`);
        return;
      }

      // Populate form with existing data
      form.reset({
        supplier_id: po.supplier_id ? po.supplier_id.toString() : '',
        supplier_name: po.supplier_name,
        supplier_contact: po.supplier_contact || '',
        warehouse_id: po.warehouse_id.toString(),
        expected_date: po.expected_date ? po.expected_date.split('T')[0] : '',
        notes: po.notes || '',
        items: po.items?.map((item: any) => ({
          product_id: item.product_id.toString(),
          quantity_ordered: item.quantity_ordered,
          unit_cost: item.unit_cost,
        })) || [],
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: "Failed to load purchase order details.",
      });
      navigate('/purchase-orders');
    } finally {
      setLoading(false);
    }
  };

  const addItem = () => {
    append({
      product_id: '',
      quantity_ordered: 1,
      unit_cost: 0,
    });
  };

  const calculateItemTotal = (quantity: number, unitCost: number) => {
    return quantity * unitCost;
  };

  const calculateGrandTotal = () => {
    const items = form.watch('items');
    return items.reduce((total, item) => {
      return total + calculateItemTotal(item.quantity_ordered, item.unit_cost);
    }, 0);
  };

  const onSubmit = async (data: PurchaseOrderFormData) => {
    try {
      setSubmitting(true);
      
      const payload = {
        ...data,
        supplier_id: data.supplier_id ? parseInt(data.supplier_id) : null,
        warehouse_id: parseInt(data.warehouse_id),
        items: data.items.map(item => ({
          ...item,
          product_id: parseInt(item.product_id),
          total_cost: calculateItemTotal(item.quantity_ordered, item.unit_cost),
        })),
        total_amount: calculateGrandTotal(),
      };

      await purchaseOrdersApi.update(parseInt(id!), payload);
      
      toast({
        variant: "default",
        title: "Success!",
        description: "Purchase order updated successfully.",
      });
      
      navigate(`/purchase-orders/${id}`);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: "Failed to update purchase order.",
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

  if (!purchaseOrder) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <Package className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-lg font-medium">Purchase order not found</h3>
              <p className="mt-1 text-muted-foreground">
                The purchase order you're trying to edit doesn't exist.
              </p>
              <Button onClick={() => navigate('/purchase-orders')} className="mt-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Purchase Orders
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
                onClick={() => navigate(`/purchase-orders/${id}`)}
                className="h-8 w-8 p-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <CardTitle className="text-base font-semibold">
                  Edit Purchase Order #{purchaseOrder.purchase_number}
                </CardTitle>
                <CardDescription>
                  Modify purchase order details and items
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
                <Package className="h-5 w-5" />
                Purchase Order Details
              </CardTitle>
              <CardDescription>
                Update supplier information and warehouse destination
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="supplier_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Supplier *</FormLabel>
                      <Popover open={supplierOpen} onOpenChange={setSupplierOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={supplierOpen}
                              className="w-full justify-between"
                            >
                              {field.value
                                ? suppliers.find((supplier) => supplier.id.toString() === field.value)?.name
                                : "Select supplier..."}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                          <Command>
                            <CommandInput placeholder="Search supplier..." />
                            <CommandEmpty>No supplier found.</CommandEmpty>
                            <CommandGroup>
                              {suppliers.filter(supplier => supplier.id).map((supplier) => (
                                <CommandItem
                                  key={supplier.id}
                                  value={`${supplier.name} ${supplier.code}`}
                                  onSelect={() => {
                                    field.onChange(supplier.id.toString());
                                    form.setValue('supplier_name', supplier.name);
                                    form.setValue('supplier_contact', supplier.phone || supplier.email || '');
                                    setSupplierOpen(false);
                                  }}
                                >
                                  <Check
                                    className={`mr-2 h-4 w-4 ${
                                      field.value === supplier.id.toString() ? "opacity-100" : "opacity-0"
                                    }`}
                                  />
                                  <div>
                                    <div className="font-medium">{supplier.name}</div>
                                    <div className="text-sm text-muted-foreground">{supplier.code}</div>
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
                  name="supplier_contact"
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
                  name="warehouse_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Warehouse *</FormLabel>
                      <Popover open={warehouseOpen} onOpenChange={setWarehouseOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={warehouseOpen}
                              className="w-full justify-between"
                            >
                              {field.value
                                ? warehouses.find((warehouse) => warehouse.id.toString() === field.value)?.name
                                : "Select warehouse..."}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                          <Command>
                            <CommandInput placeholder="Search warehouse..." />
                            <CommandEmpty>No warehouse found.</CommandEmpty>
                            <CommandGroup>
                              {warehouses.filter(warehouse => warehouse.id).map((warehouse) => (
                                <CommandItem
                                  key={warehouse.id}
                                  value={`${warehouse.name} ${warehouse.code}`}
                                  onSelect={() => {
                                    field.onChange(warehouse.id.toString());
                                    setWarehouseOpen(false);
                                  }}
                                >
                                  <Check
                                    className={`mr-2 h-4 w-4 ${
                                      field.value === warehouse.id.toString() ? "opacity-100" : "opacity-0"
                                    }`}
                                  />
                                  <div>
                                    <div className="font-medium">{warehouse.name}</div>
                                    <div className="text-sm text-muted-foreground">{warehouse.code}</div>
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

                <FormField
                  control={form.control}
                  name="expected_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expected Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
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
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Additional notes..." {...field} />
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
                Order Items
                <Button type="button" onClick={addItem} size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Item
                </Button>
              </CardTitle>
              <CardDescription>
                Products to include in this purchase order
              </CardDescription>
            </CardHeader>
            <CardContent>
              {fields.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Unit Cost</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead className="w-12">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fields.map((field, index) => (
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
                                        aria-expanded={productOpenIndex === index}
                                        className="w-full justify-between"
                                      >
                                        {field.value
                                          ? products.find((product) => product.id.toString() === field.value)?.name
                                          : "Select product..."}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                      </Button>
                                    </FormControl>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                                    <Command>
                                      <CommandInput placeholder="Search product..." />
                                      <CommandEmpty>No product found.</CommandEmpty>
                                      <CommandGroup>
                                        {products.filter(product => product.id).map((product) => (
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
                                            <div>
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
                        <TableCell>
                          <FormField
                            control={form.control}
                            name={`items.${index}.quantity_ordered`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input
                                    type="number"
                                    min="1"
                                    {...field}
                                    onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
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
                              <FormItem>
                                <FormControl>
                                  <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    {...field}
                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="font-mono">
                            {new Intl.NumberFormat('id-ID', {
                              style: 'currency',
                              currency: 'IDR',
                            }).format(
                              calculateItemTotal(
                                form.watch(`items.${index}.quantity_ordered`),
                                form.watch(`items.${index}.unit_cost`)
                              )
                            )}
                          </div>
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
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <Package className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-2 text-lg font-medium">No items added</h3>
                  <p className="mt-1 text-muted-foreground">
                    Click "Add Item" to start adding products to this purchase order.
                  </p>
                </div>
              )}

              {fields.length > 0 && (
                <div className="border-t pt-4 mt-4">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Grand Total:</span>
                    <span className="text-xl font-bold">
                      {new Intl.NumberFormat('id-ID', {
                        style: 'currency',
                        currency: 'IDR',
                      }).format(calculateGrandTotal())}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(`/purchase-orders/${id}`)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || fields.length === 0}
              className="flex-1"
            >
              {submitting ? 'Updating...' : 'Update Purchase Order'}
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
