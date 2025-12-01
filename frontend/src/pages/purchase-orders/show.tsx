import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Package, Edit, Loader2 } from 'lucide-react';
import { purchaseOrdersApi, type PurchaseOrder } from '@/lib/api';
import { setPageTitle } from '@/lib/page-title';
import { usePermission } from '@/hooks/usePermission';

export default function PurchaseOrderShowPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { hasPermission } = usePermission();

  const [purchaseOrder, setPurchaseOrder] = useState<PurchaseOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      navigate('/purchase-orders');
      return;
    }
    
    setPageTitle('Purchase Order Details');
    loadPurchaseOrder();
  }, [id]);

  const loadPurchaseOrder = async () => {
    try {
      const response = await purchaseOrdersApi.getById(parseInt(id!));
      setPurchaseOrder(response.data.data || response.data);
    } catch (error) {
      console.error('Failed to load purchase order:', error);
      toast({
        title: 'Error',
        description: 'Failed to load purchase order details',
        variant: 'destructive',
      });
      navigate('/purchase-orders');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'outline';
      case 'received':
        return 'secondary';
      case 'partial':
        return 'default';
      case 'cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const canReceive = () => {
    // Allow receive for draft, pending, or partial status
    return (purchaseOrder?.status === 'draft' || purchaseOrder?.status === 'pending' || purchaseOrder?.status === 'partial') && hasPermission('inventory.update');
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
          <h3 className="mt-2 text-base sm:text-lg font-medium">Purchase order not found</h3>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            The purchase order you're looking for doesn't exist.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-3 sm:gap-4 p-3 sm:p-4 lg:p-6">
      <div className="grid gap-3 sm:gap-4">
        <Card className="shadow-md">
          <CardHeader className="border-b bg-muted/50 p-3 sm:p-4 lg:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-2 sm:gap-3">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => navigate('/purchase-orders')}
                  className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-sm sm:text-base font-semibold truncate">
                    PO #{purchaseOrder.purchase_number}
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm hidden sm:block">
                    View purchase order details and manage receiving
                  </CardDescription>
                </div>
              </div>
              
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <Badge variant={getStatusColor(purchaseOrder.status)} className="text-[10px] sm:text-xs">
                  {purchaseOrder.status.charAt(0).toUpperCase() + purchaseOrder.status.slice(1)}
                </Badge>
                
                {hasPermission('purchase_orders.update') && (purchaseOrder.status === 'draft' || purchaseOrder.status === 'pending') && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => navigate(`/purchase-orders/${id}/edit`)}
                    className="h-7 sm:h-8 text-xs"
                  >
                    <Edit className="h-3.5 w-3.5 sm:mr-1.5" />
                    <span className="hidden sm:inline">Edit</span>
                  </Button>
                )}
                {canReceive() && (
                  <Button 
                    onClick={() => navigate(`/purchase-orders/${id}/receive`)}
                    size="sm"
                    className="h-7 sm:h-8 text-xs"
                  >
                    <Package className="h-3.5 w-3.5 sm:mr-1.5" />
                    <span className="hidden sm:inline">Receive</span>
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6 p-3 sm:p-4 lg:p-6">
            {/* Purchase Order Information */}
            <div className="space-y-3 sm:space-y-4 pt-2 sm:pt-4">
              <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-3">
                <div className="space-y-1">
                  <label className="text-xs sm:text-sm font-medium">Warehouse</label>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {purchaseOrder.warehouse?.name || 'Unknown'}
                  </p>
                </div>
                
                <div className="space-y-1">
                  <label className="text-xs sm:text-sm font-medium">Supplier</label>
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">
                    {purchaseOrder.supplier_name}
                  </p>
                </div>
                
                <div className="space-y-1">
                  <label className="text-xs sm:text-sm font-medium">Order Date</label>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {formatDate(purchaseOrder.created_at)}
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs sm:text-sm font-medium">Expected</label>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {purchaseOrder.expected_date ? formatDate(purchaseOrder.expected_date) : '-'}
                  </p>
                </div>
                
                <div className="space-y-1">
                  <label className="text-xs sm:text-sm font-medium">Total</label>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {formatCurrency(purchaseOrder.total_amount || 0)}
                  </p>
                </div>
                
                <div className="space-y-1">
                  <label className="text-xs sm:text-sm font-medium">Created By</label>
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">
                    {purchaseOrder.created_by_user?.full_name || 'Unknown'}
                  </p>
                </div>
              </div>
              
              {purchaseOrder.notes && (
                <div className="space-y-1">
                  <label className="text-xs sm:text-sm font-medium">Notes</label>
                  <p className="text-xs sm:text-sm text-muted-foreground p-2 sm:p-3 border rounded-lg bg-muted/50">
                    {purchaseOrder.notes}
                  </p>
                </div>
              )}
            </div>
            
            {/* Order Items */}
            <div className="space-y-3 sm:space-y-4">
              <h3 className="text-xs sm:text-sm font-medium text-muted-foreground">
                Order Items
              </h3>
              <div className="border rounded-lg overflow-x-auto">
                {purchaseOrder.items && purchaseOrder.items.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Product</TableHead>
                        <TableHead className="text-xs">Ord</TableHead>
                        <TableHead className="text-xs hidden sm:table-cell">Rcv</TableHead>
                        <TableHead className="text-xs text-right hidden sm:table-cell">Unit</TableHead>
                        <TableHead className="text-xs text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {purchaseOrder.items.map((item: any) => (
                        <TableRow key={item.id}>
                          <TableCell className="p-2 sm:p-4">
                            <div className="min-w-0">
                              <p className="text-xs sm:text-sm font-medium truncate">{item.product?.name || 'Unknown'}</p>
                              <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{item.product?.sku}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs sm:text-sm p-2 sm:p-4">{item.quantity_ordered}</TableCell>
                          <TableCell className="text-xs sm:text-sm p-2 sm:p-4 hidden sm:table-cell">{item.quantity_received || 0}</TableCell>
                          <TableCell className="text-xs sm:text-sm text-right p-2 sm:p-4 hidden sm:table-cell">
                            {formatCurrency(item.unit_cost)}
                          </TableCell>
                          <TableCell className="text-xs sm:text-sm text-right p-2 sm:p-4">
                            {formatCurrency(item.total_cost)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="flex items-center justify-center h-24 sm:h-32 text-center">
                    <div>
                      <Package className="mx-auto h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
                      <h3 className="mt-2 text-sm sm:text-lg font-medium">No items</h3>
                      <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                        This PO has no items.
                      </p>
                    </div>
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
