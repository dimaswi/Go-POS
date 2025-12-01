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
import { ArrowLeft, ArrowRight, Edit, Loader2 } from 'lucide-react';
import { stockTransfersApi, type StockTransfer } from '@/lib/api';
import { setPageTitle } from '@/lib/page-title';
import { usePermission } from '@/hooks/usePermission';

export default function StockTransferShowPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { hasPermission } = usePermission();

  const [stockTransfer, setStockTransfer] = useState<StockTransfer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [executing, setExecuting] = useState(false);

  useEffect(() => {
    if (!id) {
      navigate('/stock-transfers');
      return;
    }
    
    setPageTitle('Stock Transfer Details');
    loadStockTransfer();
  }, [id]);

  const loadStockTransfer = async () => {
    try {
      const response = await stockTransfersApi.getById(parseInt(id!));
      setStockTransfer(response.data.data || response.data);
    } catch (error) {
      console.error('Failed to load stock transfer:', error);
      toast({
        title: 'Error',
        description: 'Failed to load stock transfer details',
        variant: 'destructive',
      });
      navigate('/stock-transfers');
    } finally {
      setIsLoading(false);
    }
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
      case 'completed':
        return 'secondary';
      case 'in_progress':
        return 'default';
      case 'cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const formatStatus = (status: string) => {
    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const canExecute = () => {
    return stockTransfer?.status === 'pending' && hasPermission('stock_transfers.execute');
  };

  const handleExecuteTransfer = async () => {
    if (!stockTransfer || !canExecute()) return;
    
    setExecuting(true);
    try {
      await stockTransfersApi.execute(parseInt(id!));
      
      toast({
        title: 'Success',
        description: 'Stock transfer executed successfully',
      });
      
      // Reload transfer data
      loadStockTransfer();
    } catch (error) {
      console.error('Failed to execute transfer:', error);
      toast({
        title: 'Error',
        description: 'Failed to execute stock transfer',
        variant: 'destructive',
      });
    } finally {
      setExecuting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-3 p-3 sm:p-4 lg:p-6">
        <Card className="shadow-md">
          <CardContent className="flex items-center justify-center h-32">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2 text-sm">Memuat data...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!stockTransfer) {
    return (
      <div className="flex flex-1 flex-col gap-3 p-3 sm:p-4 lg:p-6">
        <Card className="shadow-md">
          <CardContent className="flex flex-col items-center justify-center h-32 gap-2">
            <h3 className="text-sm font-medium">Stock transfer not found</h3>
            <p className="text-xs text-muted-foreground">
              The stock transfer you're looking for doesn't exist.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-3 p-3 sm:p-4 lg:p-6">
      <div className="grid gap-3">
        <Card className="shadow-md">
          <CardHeader className="border-b bg-muted/50 p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => navigate('/stock-transfers')}
                  className="h-8 w-8 p-0 shrink-0"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="min-w-0">
                  <CardTitle className="text-sm font-semibold truncate">
                    Transfer #{stockTransfer.transfer_number}
                  </CardTitle>
                  <CardDescription className="text-xs hidden sm:block">
                    View transfer details and manage execution
                  </CardDescription>
                </div>
              </div>
              
              <div className="flex items-center gap-1.5 self-end sm:self-auto flex-wrap justify-end">
                <Badge variant={getStatusColor(stockTransfer.status)} className="text-[10px]">
                  {formatStatus(stockTransfer.status)}
                </Badge>
                
                {hasPermission('stock_transfers.update') && stockTransfer.status === 'pending' && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => navigate(`/stock-transfers/${id}/edit`)}
                    className="h-8 text-xs"
                  >
                    <Edit className="h-3.5 w-3.5 sm:mr-1" />
                    <span className="hidden sm:inline">Edit</span>
                  </Button>
                )}
                {canExecute() && (
                  <Button 
                    onClick={handleExecuteTransfer}
                    disabled={executing}
                    size="sm"
                    className="h-8 text-xs"
                  >
                    <ArrowRight className="h-3.5 w-3.5 sm:mr-1" />
                    <span className="hidden sm:inline">{executing ? 'Executing...' : 'Execute'}</span>
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 lg:p-6 space-y-4">
            {/* Transfer Information */}
            <div className="space-y-3">
              <h3 className="text-xs font-medium text-muted-foreground">
                Transfer Information
              </h3>
              <div className="grid gap-3 grid-cols-2 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-1">
                  <label className="text-[10px] sm:text-xs font-medium text-muted-foreground">From</label>
                  <p className="text-xs sm:text-sm font-medium truncate">
                    {stockTransfer.from_warehouse_id 
                      ? stockTransfer.from_warehouse?.name 
                      : stockTransfer.from_store?.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground capitalize">
                    {stockTransfer.from_warehouse_id ? 'Warehouse' : 'Store'}
                  </p>
                </div>
                
                <div className="space-y-1">
                  <label className="text-[10px] sm:text-xs font-medium text-muted-foreground">To</label>
                  <p className="text-xs sm:text-sm font-medium truncate">
                    {stockTransfer.to_warehouse_id 
                      ? stockTransfer.to_warehouse?.name 
                      : stockTransfer.to_store?.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground capitalize">
                    {stockTransfer.to_warehouse_id ? 'Warehouse' : 'Store'}
                  </p>
                </div>
                
                <div className="space-y-1">
                  <label className="text-[10px] sm:text-xs font-medium text-muted-foreground">Transfer Date</label>
                  <p className="text-xs sm:text-sm">
                    {formatDate(stockTransfer.created_at)}
                  </p>
                </div>
                
                <div className="space-y-1">
                  <label className="text-[10px] sm:text-xs font-medium text-muted-foreground">Created By</label>
                  <p className="text-xs sm:text-sm truncate">
                    {stockTransfer.requested_by_user?.full_name || 'Unknown'}
                  </p>
                </div>
                
                <div className="space-y-1">
                  <label className="text-[10px] sm:text-xs font-medium text-muted-foreground">Status</label>
                  <Badge variant={getStatusColor(stockTransfer.status)} className="text-[10px]">
                    {formatStatus(stockTransfer.status)}
                  </Badge>
                </div>
                
                {stockTransfer.received_at && (
                  <div className="space-y-1">
                    <label className="text-[10px] sm:text-xs font-medium text-muted-foreground">Executed Date</label>
                    <p className="text-xs sm:text-sm">
                      {formatDate(stockTransfer.received_at)}
                    </p>
                  </div>
                )}
              </div>
              
              {stockTransfer.notes && (
                <div className="space-y-1">
                  <label className="text-[10px] sm:text-xs font-medium text-muted-foreground">Notes</label>
                  <p className="text-xs p-2 sm:p-3 border rounded-lg bg-muted/50">
                    {stockTransfer.notes}
                  </p>
                </div>
              )}
            </div>
            
            {/* Transfer Items */}
            <div className="space-y-3">
              <h3 className="text-xs font-medium text-muted-foreground">
                Transfer Items
              </h3>
              <div className="border rounded-lg overflow-x-auto">
                {stockTransfer.items && stockTransfer.items.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Product</TableHead>
                        <TableHead className="text-center text-xs">Req</TableHead>
                        <TableHead className="text-center text-xs hidden sm:table-cell">Ship</TableHead>
                        <TableHead className="text-center text-xs hidden sm:table-cell">Rcv</TableHead>
                        <TableHead className="text-xs">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stockTransfer.items.map((item: any) => {
                        const isCompleted = item.quantity_received >= item.quantity_requested;
                        const isPartial = item.quantity_received > 0 && item.quantity_received < item.quantity_requested;
                        
                        return (
                          <TableRow key={item.id}>
                            <TableCell className="py-2">
                              <div className="min-w-0">
                                <p className="text-xs font-medium truncate max-w-[120px] sm:max-w-none">{item.product?.name || 'Unknown'}</p>
                                <p className="text-[10px] text-muted-foreground">{item.product?.sku}</p>
                              </div>
                            </TableCell>
                            <TableCell className="text-center text-xs py-2">{item.quantity_requested}</TableCell>
                            <TableCell className="text-center text-xs py-2 hidden sm:table-cell">{item.quantity_shipped || 0}</TableCell>
                            <TableCell className="text-center text-xs py-2 hidden sm:table-cell">{item.quantity_received || 0}</TableCell>
                            <TableCell className="py-2">
                              <Badge 
                                variant={isCompleted ? 'secondary' : isPartial ? 'default' : 'outline'}
                                className="text-[10px]"
                              >
                                {isCompleted ? 'Done' : isPartial ? 'Part' : 'Pend'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="flex items-center justify-center py-8 text-center">
                    <div>
                      <ArrowRight className="mx-auto h-6 w-6 text-muted-foreground" />
                      <h3 className="mt-2 text-sm font-medium">No items found</h3>
                      <p className="mt-1 text-xs text-muted-foreground">
                        This transfer has no items.
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
