import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import { 
  purchaseOrdersApi, 
  type PurchaseOrder,
  type PurchaseOrderItem
} from "@/lib/api";
import { setPageTitle } from "@/lib/page-title";

const receiveSchema = z.object({
  items: z.array(z.object({
    item_id: z.string(),
    quantity_received: z.number().min(0),
  })),
});

type ReceiveFormData = z.infer<typeof receiveSchema>;

export default function ReceivePurchaseOrderPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [purchaseOrder, setPurchaseOrder] = useState<PurchaseOrder | null>(null);
  const [loading, setLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const form = useForm<ReceiveFormData>({
    resolver: zodResolver(receiveSchema),
    defaultValues: {
      items: [],
    },
  });

  useEffect(() => {
    if (!id) {
      navigate('/purchase-orders');
      return;
    }

    setPageTitle('Receive Purchase Order');
    loadPurchaseOrder();
  }, [id]);

  const loadPurchaseOrder = async () => {
    try {
      const response = await purchaseOrdersApi.getById(parseInt(id!));
      const po = response.data.data || response.data;
      setPurchaseOrder(po);

      // Initialize form with PO items
      if (po.items && po.items.length > 0) {
        const formItems = po.items.map((item: PurchaseOrderItem) => ({
          item_id: item.id.toString(),
          quantity_received: 0,
        }));
        form.reset({ items: formItems });
      }
    } catch (error) {
      console.error('Failed to load purchase order:', error);
      toast({
        title: 'Error',
        description: 'Failed to load purchase order',
        variant: 'destructive',
      });
      navigate('/purchase-orders');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: ReceiveFormData) => {
    setLoading(true);
    try {
      // Transform data to match backend expectation
      const payload = {
        items: data.items
          .filter(item => item.quantity_received > 0)
          .map(item => ({
            item_id: parseInt(item.item_id),
            quantity_received: item.quantity_received,
          })),
      };
      
      await purchaseOrdersApi.receive(parseInt(id!), payload);
      
      toast({
        title: 'Success',
        description: 'Purchase order received successfully',
      });
      
      navigate(`/purchase-orders/${id}`);
    } catch (error) {
      console.error('Failed to receive purchase order:', error);
      toast({
        title: 'Error',
        description: 'Failed to receive purchase order',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 sm:h-96">
        <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!purchaseOrder) {
    return (
      <div className="flex items-center justify-center h-64 sm:h-96">
        <div className="text-center px-4">
          <h3 className="mt-2 text-sm sm:text-lg font-medium">Purchase order not found</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-3 sm:gap-4 p-3 sm:p-4 lg:p-6">
      <div className="grid gap-3 sm:gap-4">
        <Card className="shadow-md">
          <CardHeader className="border-b bg-muted/50 p-3 sm:p-4 lg:p-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate("/purchase-orders")}
                className="h-7 w-7 sm:h-8 sm:w-8 p-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="min-w-0">
                <CardTitle className="text-sm sm:text-base font-semibold">
                  Receive PO
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm truncate">
                  {purchaseOrder.purchase_number} - {purchaseOrder.supplier_name}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6 p-3 sm:p-4 lg:p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
                <div className="space-y-3 sm:space-y-4 pt-2 sm:pt-4">
                  <div className="space-y-2 sm:space-y-3">
                    {purchaseOrder.items?.map((item: any, index: number) => (
                      <div key={item.id} className="grid gap-2 sm:gap-4 p-3 sm:p-4 border rounded-lg grid-cols-2 md:grid-cols-4">
                        <div className="space-y-1 col-span-2 md:col-span-1">
                          <label className="text-xs sm:text-sm font-medium">{item.product?.name}</label>
                          <p className="text-[10px] sm:text-xs text-muted-foreground">
                            SKU: {item.product?.sku}
                          </p>
                        </div>
                        
                        <div className="space-y-0.5">
                          <label className="text-[10px] sm:text-xs text-muted-foreground">Ord</label>
                          <p className="text-xs sm:text-sm font-medium">{item.quantity_ordered}</p>
                        </div>
                        
                        <div className="space-y-0.5">
                          <label className="text-[10px] sm:text-xs text-muted-foreground">Rcv</label>
                          <p className="text-xs sm:text-sm font-medium">{item.quantity_received || 0}</p>
                        </div>
                        
                        <FormField
                          control={form.control}
                          name={`items.${index}.quantity_received`}
                          render={({ field }) => (
                            <FormItem className="col-span-2 md:col-span-1">
                              <FormLabel className="text-xs">Qty Receive *</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min="0"
                                  max={item.quantity_ordered - (item.quantity_received || 0)}
                                  placeholder="0"
                                  className="h-8 text-xs sm:text-sm"
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                />
                              </FormControl>
                              <FormMessage className="text-[10px]" />
                            </FormItem>
                          )}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 sm:gap-3 pt-2 sm:pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate(`/purchase-orders/${id}`)}
                    disabled={loading}
                    className="h-8 sm:h-9 text-xs sm:text-sm"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading} className="h-8 sm:h-9 text-xs sm:text-sm">
                    <Check className="mr-1.5 h-3.5 w-3.5" />
                    {loading ? "Receiving..." : "Receive"}
                  </Button>
                </div>
              </form>
            </Form>
            
            {/* Purchase Order Details */}
            <div className="space-y-3 sm:space-y-4">
              <h3 className="text-xs sm:text-sm font-medium text-muted-foreground">
                PO Details
              </h3>
              <div className="grid gap-3 sm:gap-4 grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs sm:text-sm font-medium">PO Number</label>
                  <p className="text-xs sm:text-sm text-muted-foreground">{purchaseOrder.purchase_number}</p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs sm:text-sm font-medium">Status</label>
                  <Badge variant="outline" className="text-[10px] sm:text-xs">{purchaseOrder.status}</Badge>
                </div>

                <div className="space-y-1">
                  <label className="text-xs sm:text-sm font-medium">Supplier</label>
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">{purchaseOrder.supplier_name}</p>
                  {purchaseOrder.supplier_contact && (
                    <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                      {purchaseOrder.supplier_contact}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs sm:text-sm font-medium">Warehouse</label>
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">
                    {purchaseOrder.warehouse?.name} ({purchaseOrder.warehouse?.code})
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs sm:text-sm font-medium">Total</label>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {formatCurrency(purchaseOrder.total_amount || 0)}
                  </p>
                </div>

                {purchaseOrder.notes && (
                  <div className="col-span-2 space-y-1">
                    <label className="text-xs sm:text-sm font-medium">Notes</label>
                    <p className="text-xs sm:text-sm text-muted-foreground p-2 sm:p-3 border rounded-lg bg-muted/50">
                      {purchaseOrder.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
