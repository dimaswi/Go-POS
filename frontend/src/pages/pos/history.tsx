import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  salesApi,
  storesApi,
  type Sale,
  type Store,
} from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { ReceiptPrintDialog } from "@/components/ReceiptPrint";
import { 
  Search, 
  ArrowLeft,
  Receipt,
  Loader2,
  Eye,
  Store as StoreIcon,
  User,
  CreditCard,
  Banknote,
  Wallet,
  Clock,
  Package,
  ChevronLeft,
  ChevronRight,
  Printer,
} from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

const paymentMethodLabels: Record<string, { label: string; icon: React.ElementType }> = {
  cash: { label: "Tunai", icon: Banknote },
  card: { label: "Kartu", icon: CreditCard },
  digital_wallet: { label: "E-Wallet", icon: Wallet },
  credit: { label: "Kredit", icon: CreditCard },
  multiple: { label: "Multiple", icon: CreditCard },
};

const statusColors: Record<string, string> = {
  completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  refunded: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  draft: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
};

const paymentStatusColors: Record<string, string> = {
  paid: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  partial: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  refunded: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
};

export default function POSHistoryPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { toast } = useToast();

  const [sales, setSales] = useState<Sale[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStore, setSelectedStore] = useState<string>("all");
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  
  // Receipt print dialog
  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const pageSize = 20;

  // Check authentication
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  // Load stores
  useEffect(() => {
    loadStores();
  }, []);

  // Load sales when filters change
  useEffect(() => {
    loadSales();
  }, [currentPage, selectedStore]);

  const loadStores = async () => {
    try {
      const response = await storesApi.getAll();
      setStores(response.data.data || []);
    } catch (error) {
      console.error("Failed to load stores:", error);
    }
  };

  const loadSales = async () => {
    setLoading(true);
    try {
      const params: any = {
        page: currentPage,
        limit: pageSize,
        sort: "-created_at",
      };
      
      if (selectedStore !== "all") {
        params.store_id = parseInt(selectedStore);
      }
      
      if (searchQuery) {
        params.search = searchQuery;
      }
      
      const response = await salesApi.getAll(params);
      setSales(response.data.data || []);
      
      if (response.data.pagination) {
        setTotalPages(response.data.pagination.total_pages || 1);
        setTotalItems(response.data.pagination.total || 0);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: "Failed to load sales history.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    loadSales();
  };

  const viewSaleDetail = async (sale: Sale) => {
    setDetailLoading(true);
    setDetailDialogOpen(true);
    
    try {
      const response = await salesApi.getById(sale.id);
      setSelectedSale(response.data.data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: "Failed to load sale details.",
      });
      setDetailDialogOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd MMM yyyy, HH:mm", { locale: id });
    } catch {
      return dateString;
    }
  };

  const formatShortDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yy HH:mm");
    } catch {
      return dateString;
    }
  };

  if (loading && sales.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 sm:h-screen bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 sm:h-12 sm:w-12 animate-spin text-primary mx-auto" />
          <p className="mt-4 text-sm sm:text-base text-muted-foreground">Loading sales history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-muted/30">
      {/* Header */}
      <div className="bg-background border-b px-3 sm:px-4 py-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate("/pos")}
              className="h-8 w-8 sm:h-9 sm:w-9"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <Receipt className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              <div>
                <h1 className="text-lg sm:text-xl font-bold">Sales History</h1>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {totalItems} transaksi
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            {/* Store Filter */}
            <Select value={selectedStore} onValueChange={(value) => {
              setSelectedStore(value);
              setCurrentPage(1);
            }}>
              <SelectTrigger className="w-full sm:w-[180px] h-8 sm:h-9 text-xs sm:text-sm">
                <StoreIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
                <SelectValue placeholder="Semua Toko" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Toko</SelectItem>
                {stores.map((store) => (
                  <SelectItem key={store.id} value={store.id.toString()}>
                    {store.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* Search */}
            <div className="flex gap-2">
              <Input
                placeholder="Cari nomor transaksi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="flex-1 sm:w-[200px] lg:w-[250px] h-8 sm:h-9 text-xs sm:text-sm"
              />
              <Button onClick={handleSearch} variant="secondary" size="sm" className="h-8 sm:h-9">
                <Search className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-3 sm:p-4 overflow-hidden">
        <Card className="h-full flex flex-col">
          <CardContent className="flex-1 p-0 overflow-hidden">
            <ScrollArea className="h-full">
              {/* Mobile Card View */}
              <div className="block sm:hidden space-y-2 p-3">
                {loading ? (
                  <div className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                  </div>
                ) : sales.length === 0 ? (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    Tidak ada data transaksi
                  </div>
                ) : (
                  sales.map((sale) => {
                    const PaymentIcon = paymentMethodLabels[sale.payment_method]?.icon || CreditCard;
                    return (
                      <Card key={sale.id} className="cursor-pointer hover:bg-muted/50" onClick={() => viewSaleDetail(sale)}>
                        <CardContent className="p-3">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-mono font-medium text-sm">{sale.sale_number}</p>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                                <Clock className="h-3 w-3" />
                                {formatShortDate(sale.created_at)}
                              </div>
                            </div>
                            <Badge 
                              variant="secondary" 
                              className={cn("text-[10px]", statusColors[sale.sale_status])}
                            >
                              {sale.sale_status === "completed" ? "Selesai" : 
                               sale.sale_status === "cancelled" ? "Batal" :
                               sale.sale_status === "refunded" ? "Refund" :
                               sale.sale_status === "draft" ? "Draft" :
                               sale.sale_status}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <p className="text-xs text-muted-foreground">
                                {sale.store?.name || "-"}
                              </p>
                              <div className="flex items-center gap-1 text-xs">
                                <User className="h-3 w-3 text-muted-foreground" />
                                {sale.customer?.name || "Walk-in"}
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-sm">{formatCurrency(sale.total_amount)}</p>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <PaymentIcon className="h-3 w-3" />
                                {paymentMethodLabels[sale.payment_method]?.label || sale.payment_method}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>

              {/* Desktop Table View */}
              <Table className="hidden sm:table">
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead className="w-[130px] lg:w-[150px] text-xs lg:text-sm">No. Transaksi</TableHead>
                    <TableHead className="w-[120px] lg:w-[150px] text-xs lg:text-sm">Tanggal</TableHead>
                    <TableHead className="hidden lg:table-cell text-xs lg:text-sm">Toko</TableHead>
                    <TableHead className="text-xs lg:text-sm">Pelanggan</TableHead>
                    <TableHead className="hidden lg:table-cell text-xs lg:text-sm">Kasir</TableHead>
                    <TableHead className="text-right text-xs lg:text-sm">Total</TableHead>
                    <TableHead className="w-[90px] lg:w-[100px] text-xs lg:text-sm">Pembayaran</TableHead>
                    <TableHead className="w-[80px] lg:w-[100px] text-xs lg:text-sm">Status</TableHead>
                    <TableHead className="w-[60px] lg:w-[80px] text-center text-xs lg:text-sm">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  ) : sales.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground text-sm">
                        Tidak ada data transaksi
                      </TableCell>
                    </TableRow>
                  ) : (
                    sales.map((sale) => {
                      const PaymentIcon = paymentMethodLabels[sale.payment_method]?.icon || CreditCard;
                      return (
                        <TableRow key={sale.id} className="hover:bg-muted/50">
                          <TableCell className="font-mono font-medium text-xs lg:text-sm">
                            {sale.sale_number}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-xs lg:text-sm">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatShortDate(sale.created_at)}
                            </div>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell text-xs lg:text-sm">
                            {sale.store?.name || "-"}
                          </TableCell>
                          <TableCell className="text-xs lg:text-sm">
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3 text-muted-foreground" />
                              {sale.customer?.name || "Walk-in"}
                            </div>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell text-muted-foreground text-xs lg:text-sm">
                            {sale.cashier?.full_name || sale.cashier?.username || "-"}
                          </TableCell>
                          <TableCell className="text-right font-semibold text-xs lg:text-sm">
                            {formatCurrency(sale.total_amount)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <PaymentIcon className="h-3 w-3" />
                              <span className="text-xs lg:text-sm">
                                {paymentMethodLabels[sale.payment_method]?.label || sale.payment_method}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant="secondary" 
                              className={cn("text-[10px] lg:text-xs", statusColors[sale.sale_status])}
                            >
                              {sale.sale_status === "completed" ? "Selesai" : 
                               sale.sale_status === "cancelled" ? "Batal" :
                               sale.sale_status === "refunded" ? "Refund" :
                               sale.sale_status === "draft" ? "Draft" :
                               sale.sale_status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 lg:h-8 lg:w-8"
                                onClick={() => viewSaleDetail(sale)}
                              >
                                <Eye className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="border-t px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between">
              <p className="text-xs sm:text-sm text-muted-foreground">
                <span className="hidden sm:inline">Halaman </span>{currentPage}<span className="hidden sm:inline"> dari</span><span className="sm:hidden">/</span>{totalPages}
              </p>
              <div className="flex gap-1 sm:gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 sm:h-8 text-xs sm:text-sm"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-1" />
                  <span className="hidden sm:inline">Prev</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 sm:h-8 text-xs sm:text-sm"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:ml-1" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Sale Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Receipt className="h-4 w-4 sm:h-5 sm:w-5" />
              Detail Transaksi
            </DialogTitle>
          </DialogHeader>
          
          {detailLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-muted-foreground" />
            </div>
          ) : selectedSale ? (
            <div className="space-y-4 sm:space-y-6">
              {/* Transaction Info */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-0.5 sm:space-y-1">
                  <p className="text-xs sm:text-sm text-muted-foreground">No. Transaksi</p>
                  <p className="font-mono font-semibold text-sm sm:text-base">{selectedSale.sale_number}</p>
                </div>
                <div className="space-y-0.5 sm:space-y-1">
                  <p className="text-xs sm:text-sm text-muted-foreground">Tanggal</p>
                  <p className="font-medium text-sm sm:text-base">{formatDate(selectedSale.created_at)}</p>
                </div>
                <div className="space-y-0.5 sm:space-y-1">
                  <p className="text-xs sm:text-sm text-muted-foreground">Toko</p>
                  <p className="font-medium text-sm sm:text-base">{selectedSale.store?.name || "-"}</p>
                </div>
                <div className="space-y-0.5 sm:space-y-1">
                  <p className="text-xs sm:text-sm text-muted-foreground">Kasir</p>
                  <p className="font-medium text-sm sm:text-base">
                    {selectedSale.cashier?.full_name || selectedSale.cashier?.username || "-"}
                  </p>
                </div>
                <div className="space-y-0.5 sm:space-y-1">
                  <p className="text-xs sm:text-sm text-muted-foreground">Pelanggan</p>
                  <p className="font-medium text-sm sm:text-base">{selectedSale.customer?.name || "Walk-in Customer"}</p>
                </div>
                <div className="space-y-0.5 sm:space-y-1">
                  <p className="text-xs sm:text-sm text-muted-foreground">Status</p>
                  <div className="flex gap-1 sm:gap-2 flex-wrap">
                    <Badge 
                      variant="secondary" 
                      className={cn("text-[10px] sm:text-xs", statusColors[selectedSale.sale_status])}
                    >
                      {selectedSale.sale_status}
                    </Badge>
                    <Badge 
                      variant="secondary" 
                      className={cn("text-[10px] sm:text-xs", paymentStatusColors[selectedSale.payment_status])}
                    >
                      {selectedSale.payment_status}
                    </Badge>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Items */}
              <div>
                <h4 className="font-semibold mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
                  <Package className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  Item Pembelian
                </h4>
                <div className="border rounded-lg overflow-hidden">
                  {/* Mobile Items List */}
                  <div className="block sm:hidden divide-y">
                    {selectedSale.items?.map((item) => (
                      <div key={item.id} className="p-3 space-y-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-sm">{item.product?.name || `Product #${item.product_id}`}</p>
                            {item.product?.sku && (
                              <p className="text-xs text-muted-foreground">SKU: {item.product.sku}</p>
                            )}
                          </div>
                          <p className="font-medium text-sm">{formatCurrency(item.total_price)}</p>
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{item.quantity} × {formatCurrency(item.unit_price)}</span>
                          {item.discount_amount > 0 && (
                            <span className="text-red-600">-{formatCurrency(item.discount_amount)}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Desktop Table */}
                  <Table className="hidden sm:table">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs sm:text-sm">Produk</TableHead>
                        <TableHead className="text-center w-[60px] lg:w-[80px] text-xs sm:text-sm">Qty</TableHead>
                        <TableHead className="text-right w-[100px] lg:w-[120px] text-xs sm:text-sm">Harga</TableHead>
                        <TableHead className="text-right w-[80px] lg:w-[100px] text-xs sm:text-sm">Diskon</TableHead>
                        <TableHead className="text-right w-[110px] lg:w-[130px] text-xs sm:text-sm">Subtotal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedSale.items?.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium text-sm">{item.product?.name || `Product #${item.product_id}`}</p>
                              {item.product?.sku && (
                                <p className="text-xs text-muted-foreground">
                                  SKU: {item.product.sku}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center text-sm">{item.quantity}</TableCell>
                          <TableCell className="text-right text-sm">
                            {formatCurrency(item.unit_price)}
                          </TableCell>
                          <TableCell className="text-right text-red-600 text-sm">
                            {item.discount_amount > 0 ? `-${formatCurrency(item.discount_amount)}` : "-"}
                          </TableCell>
                          <TableCell className="text-right font-medium text-sm">
                            {formatCurrency(item.total_price)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <Separator />

              {/* Payment Summary */}
              <div className="space-y-1.5 sm:space-y-2">
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(selectedSale.subtotal)}</span>
                </div>
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-muted-foreground">Pajak (PPN 11%)</span>
                  <span>{formatCurrency(selectedSale.tax_amount)}</span>
                </div>
                {selectedSale.discount_amount > 0 && (
                  <div className="flex justify-between text-xs sm:text-sm text-red-600">
                    <span>Diskon</span>
                    <span>-{formatCurrency(selectedSale.discount_amount)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-bold text-base sm:text-lg">
                  <span>Total</span>
                  <span>{formatCurrency(selectedSale.total_amount)}</span>
                </div>
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-muted-foreground">Dibayar</span>
                  <span>{formatCurrency(selectedSale.paid_amount)}</span>
                </div>
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-muted-foreground">Kembalian</span>
                  <span>{formatCurrency(selectedSale.change_amount)}</span>
                </div>
              </div>

              {/* Payment Methods */}
              {selectedSale.payments && selectedSale.payments.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-semibold mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
                      <CreditCard className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      Metode Pembayaran
                    </h4>
                    <div className="space-y-2">
                      {selectedSale.payments.map((payment) => {
                        const PaymentIcon = paymentMethodLabels[payment.payment_method]?.icon || CreditCard;
                        return (
                          <div 
                            key={payment.id} 
                            className="flex items-center justify-between p-2 sm:p-3 bg-muted/50 rounded-lg"
                          >
                            <div className="flex items-center gap-2">
                              <PaymentIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                              <span className="font-medium text-sm">
                                {paymentMethodLabels[payment.payment_method]?.label || payment.payment_method}
                              </span>
                              {payment.reference_number && (
                                <span className="text-xs text-muted-foreground hidden sm:inline">
                                  (Ref: {payment.reference_number})
                                </span>
                              )}
                            </div>
                            <span className="font-semibold text-sm">{formatCurrency(payment.amount)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

              {/* Notes */}
              {selectedSale.notes && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-semibold mb-2 text-sm sm:text-base">Catatan</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground bg-muted/50 p-2 sm:p-3 rounded-lg">
                      {selectedSale.notes}
                    </p>
                  </div>
                </>
              )}

              {/* Print Button */}
              <Separator />
              <div className="flex justify-end">
                <Button
                  onClick={() => setPrintDialogOpen(true)}
                  className="w-full sm:w-auto h-9 sm:h-10 text-sm"
                >
                  <Printer className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
                  Cetak Struk
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Receipt Print Dialog */}
      {selectedSale && (
        <ReceiptPrintDialog
          sale={selectedSale}
          open={printDialogOpen}
          onOpenChange={setPrintDialogOpen}
        />
      )}
    </div>
  );
}
