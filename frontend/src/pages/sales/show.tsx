import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
  type Sale,
} from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { setPageTitle } from "@/lib/page-title";
import { 
  ArrowLeft,
  Loader2,
  Store as StoreIcon,
  User,
  CreditCard,
  Banknote,
  Wallet,
  Package,
  Printer,
  Hash,
  Phone,
  Mail,
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

export default function SalesShowPage() {
  const navigate = useNavigate();
  const { id: saleId } = useParams<{ id: string }>();
  const { toast } = useToast();

  const [sale, setSale] = useState<Sale | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (saleId) {
      loadSale(parseInt(saleId));
    }
  }, [saleId]);

  const loadSale = async (id: number) => {
    setLoading(true);
    try {
      const response = await salesApi.getById(id);
      setSale(response.data.data);
      setPageTitle(`Penjualan #${response.data.data.sale_number}`);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: "Gagal memuat detail penjualan.",
      });
      navigate("/sales");
    } finally {
      setLoading(false);
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
      return format(new Date(dateString), "EEEE, dd MMMM yyyy 'pukul' HH:mm", { locale: id });
    } catch {
      return dateString;
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 sm:h-full">
        <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!sale) {
    return null;
  }

  const PaymentIcon = paymentMethodLabels[sale.payment_method]?.icon || CreditCard;

  return (
    <div className="flex flex-1 flex-col gap-3 sm:gap-4 p-3 sm:p-4 lg:p-6">
      <div className="grid gap-3 sm:gap-4">
        <Card className="shadow-md">
          <CardHeader className="border-b bg-muted/50 p-3 sm:p-4 lg:p-6">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 sm:gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => navigate("/sales")}
                  className="h-7 w-7 sm:h-9 sm:w-9"
                >
                  <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </Button>
                <div className="min-w-0">
                  <CardTitle className="text-sm sm:text-base font-semibold">
                    Detail Penjualan
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm truncate">
                    {sale.sale_number}
                  </CardDescription>
                </div>
              </div>
              <div className="flex gap-1.5">
                <Button variant="outline" size="sm" onClick={handlePrint} className="h-7 sm:h-9 text-xs sm:text-sm">
                  <Printer className="h-3.5 w-3.5 sm:mr-1.5" />
                  <span className="hidden sm:inline">Cetak</span>
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6 p-3 sm:p-4 lg:p-6">
          {/* Status Badges */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <Badge 
              variant="secondary" 
              className={cn("text-[10px] sm:text-sm px-2 sm:px-3 py-0.5 sm:py-1", statusColors[sale.sale_status])}
            >
              {sale.sale_status === "completed" ? "Selesai" : 
               sale.sale_status === "cancelled" ? "Batal" :
               sale.sale_status === "refunded" ? "Refund" :
               sale.sale_status === "draft" ? "Draft" :
               sale.sale_status}
            </Badge>
            <Badge 
              variant="secondary" 
              className={cn("text-[10px] sm:text-sm px-2 sm:px-3 py-0.5 sm:py-1", paymentStatusColors[sale.payment_status])}
            >
              {sale.payment_status === "paid" ? "Lunas" :
               sale.payment_status === "pending" ? "Pending" :
               sale.payment_status === "partial" ? "Sebagian" :
               sale.payment_status}
            </Badge>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
            {/* Transaction Info */}
            <Card className="shadow-sm">
              <CardHeader className="pb-2 sm:pb-3 border-b bg-muted/50 p-2 sm:p-4">
                <CardTitle className="text-xs sm:text-base flex items-center gap-1.5 sm:gap-2">
                  <Hash className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  Info Transaksi
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 sm:space-y-3 p-2 sm:p-4">
                <div className="flex justify-between">
                  <span className="text-xs sm:text-sm text-muted-foreground">No. Transaksi</span>
                  <span className="text-xs sm:text-sm font-mono font-medium truncate ml-2">{sale.sale_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs sm:text-sm text-muted-foreground">Tanggal</span>
                  <span className="text-xs sm:text-sm text-right">{formatDate(sale.created_at)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs sm:text-sm text-muted-foreground">Bayar</span>
                  <div className="flex items-center gap-1">
                    <PaymentIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="text-xs sm:text-sm font-medium">
                      {paymentMethodLabels[sale.payment_method]?.label || sale.payment_method}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Store Info */}
            <Card className="shadow-sm">
              <CardHeader className="pb-2 sm:pb-3 border-b bg-muted/50 p-2 sm:p-4">
                <CardTitle className="text-xs sm:text-base flex items-center gap-1.5 sm:gap-2">
                  <StoreIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  Info Toko
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 sm:space-y-3 p-2 sm:p-4">
                <div className="flex justify-between">
                  <span className="text-xs sm:text-sm text-muted-foreground">Nama Toko</span>
                  <span className="text-xs sm:text-sm font-medium truncate ml-2">{sale.store?.name || "-"}</span>
                </div>
                {sale.store?.address && (
                  <div className="flex justify-between">
                    <span className="text-xs sm:text-sm text-muted-foreground">Alamat</span>
                    <span className="text-xs sm:text-sm text-right max-w-[100px] sm:max-w-[150px] truncate">{sale.store.address}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-xs sm:text-sm text-muted-foreground">Kasir</span>
                  <span className="text-xs sm:text-sm font-medium truncate ml-2">
                    {sale.cashier?.full_name || sale.cashier?.username || "-"}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Customer Info */}
            <Card className="shadow-sm">
              <CardHeader className="pb-2 sm:pb-3 border-b bg-muted/50 p-2 sm:p-4">
                <CardTitle className="text-xs sm:text-base flex items-center gap-1.5 sm:gap-2">
                  <User className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  Info Pelanggan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 sm:space-y-3 p-2 sm:p-4">
                <div className="flex justify-between">
                  <span className="text-xs sm:text-sm text-muted-foreground">Nama</span>
                  <span className="text-xs sm:text-sm font-medium truncate ml-2">
                    {sale.customer?.name || "Walk-in"}
                  </span>
                </div>
                {sale.customer?.phone && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs sm:text-sm text-muted-foreground">Telp</span>
                    <div className="flex items-center gap-1">
                      <Phone className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                      <span className="text-xs sm:text-sm">{sale.customer.phone}</span>
                    </div>
                  </div>
                )}
                {sale.customer?.email && (
                  <div className="flex justify-between items-center">
                    <span className="text-xs sm:text-sm text-muted-foreground">Email</span>
                    <div className="flex items-center gap-1">
                      <Mail className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                      <span className="text-xs sm:text-sm truncate max-w-[120px]">{sale.customer.email}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Separator />

          {/* Items */}
          <div>
            <h3 className="text-sm sm:text-lg font-semibold mb-2 sm:mb-4 flex items-center gap-1.5 sm:gap-2">
              <Package className="h-4 w-4 sm:h-5 sm:w-5" />
              Item Pembelian
            </h3>
            <div className="border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[30px] sm:w-[50px] text-xs">No</TableHead>
                    <TableHead className="text-xs">Produk</TableHead>
                    <TableHead className="text-center w-[50px] sm:w-[100px] text-xs">Qty</TableHead>
                    <TableHead className="text-right w-[80px] sm:w-[150px] text-xs hidden sm:table-cell">Harga</TableHead>
                    <TableHead className="text-right w-[80px] sm:w-[120px] text-xs hidden sm:table-cell">Diskon</TableHead>
                    <TableHead className="text-right w-[90px] sm:w-[150px] text-xs">Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sale.items?.map((item, index) => (
                    <TableRow key={item.id}>
                      <TableCell className="text-[10px] sm:text-sm text-muted-foreground p-2">{index + 1}</TableCell>
                      <TableCell className="p-2">
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-medium truncate">{item.product?.name || `Product #${item.product_id}`}</p>
                          {item.product?.sku && (
                            <p className="text-[10px] sm:text-xs text-muted-foreground">
                              SKU: {item.product.sku}
                            </p>
                          )}
                          {item.product_variant && (
                            <p className="text-[10px] sm:text-xs text-muted-foreground">
                              {item.product_variant.name}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center text-xs sm:text-sm font-medium p-2">{item.quantity}</TableCell>
                      <TableCell className="text-right text-xs sm:text-sm p-2 hidden sm:table-cell">
                        {formatCurrency(item.unit_price)}
                      </TableCell>
                      <TableCell className="text-right text-xs sm:text-sm text-red-600 p-2 hidden sm:table-cell">
                        {item.discount_amount > 0 ? `-${formatCurrency(item.discount_amount)}` : "-"}
                      </TableCell>
                      <TableCell className="text-right text-xs sm:text-sm font-medium p-2">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
            {/* Payment Methods */}
            {sale.payments && sale.payments.length > 0 && (
              <Card className="shadow-sm">
                <CardHeader className="pb-2 sm:pb-3 border-b bg-muted/50 p-2 sm:p-4">
                  <CardTitle className="text-xs sm:text-base flex items-center gap-1.5 sm:gap-2">
                    <CreditCard className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    Metode Pembayaran
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 sm:space-y-3 p-2 sm:p-4">
                  {sale.payments.map((payment) => {
                    const PIcon = paymentMethodLabels[payment.payment_method]?.icon || CreditCard;
                    return (
                      <div 
                        key={payment.id} 
                        className="flex items-center justify-between p-2 sm:p-3 bg-muted/50 rounded-lg"
                      >
                        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                          <PIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                          <div className="min-w-0">
                            <span className="text-xs sm:text-sm font-medium">
                              {paymentMethodLabels[payment.payment_method]?.label || payment.payment_method}
                            </span>
                            {payment.reference_number && (
                              <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                                Ref: {payment.reference_number}
                              </p>
                            )}
                          </div>
                        </div>
                        <span className="text-xs sm:text-sm font-semibold">{formatCurrency(payment.amount)}</span>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            {/* Summary */}
            <Card className="shadow-sm">
              <CardHeader className="pb-2 sm:pb-3 border-b bg-muted/50 p-2 sm:p-4">
                <CardTitle className="text-xs sm:text-base">Ringkasan Pembayaran</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 sm:space-y-3 p-2 sm:p-4">
                <div className="flex justify-between">
                  <span className="text-xs sm:text-sm text-muted-foreground">Subtotal</span>
                  <span className="text-xs sm:text-sm">{formatCurrency(sale.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs sm:text-sm text-muted-foreground">Pajak (11%)</span>
                  <span className="text-xs sm:text-sm">{formatCurrency(sale.tax_amount)}</span>
                </div>
                {sale.discount_amount > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span className="text-xs sm:text-sm">Diskon</span>
                    <span className="text-xs sm:text-sm">-{formatCurrency(sale.discount_amount)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-sm sm:text-lg font-bold">
                  <span>Total</span>
                  <span>{formatCurrency(sale.total_amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs sm:text-sm text-muted-foreground">Dibayar</span>
                  <span className="text-xs sm:text-sm font-medium">{formatCurrency(sale.paid_amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs sm:text-sm text-muted-foreground">Kembalian</span>
                  <span className="text-xs sm:text-sm font-medium text-green-600">{formatCurrency(sale.change_amount)}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Notes */}
          {sale.notes && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm sm:text-lg font-semibold mb-2">Catatan</h3>
                <p className="text-xs sm:text-sm text-muted-foreground bg-muted/50 p-3 sm:p-4 rounded-lg">
                  {sale.notes}
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
    </div>
  );
}
