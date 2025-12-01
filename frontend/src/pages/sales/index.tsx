import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  salesApi,
  storesApi,
  type Sale,
  type Store,
} from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { setPageTitle } from "@/lib/page-title";
import { 
  Search, 
  Loader2,
  Eye,
  MoreHorizontal,
  Store as StoreIcon,
  User,
  CreditCard,
  Banknote,
  Wallet,
  Clock,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Filter,
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

export default function SalesIndexPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [sales, setSales] = useState<Sale[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStore, setSelectedStore] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const pageSize = 15;

  useEffect(() => {
    setPageTitle("Penjualan");
    loadStores();
  }, []);

  useEffect(() => {
    loadSales();
  }, [currentPage, selectedStore, selectedStatus]);

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
      
      if (selectedStatus !== "all") {
        params.status = selectedStatus;
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
        description: "Gagal memuat data penjualan.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    loadSales();
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

  // Calculate summary
  const totalSalesAmount = sales.reduce((sum, sale) => sum + sale.total_amount, 0);

  return (
    <div className="flex flex-1 flex-col gap-3 sm:gap-4 p-3 sm:p-4 lg:p-6">
      <div className="grid gap-3 sm:gap-4">
        <Card className="shadow-md">
          <CardHeader className="border-b bg-muted/50 p-3 sm:p-4 lg:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3">
              <div className="min-w-0">
                <CardTitle className="text-xs sm:text-sm lg:text-base font-semibold">
                  Manajemen Penjualan
                </CardTitle>
                <CardDescription className="text-[10px] sm:text-xs lg:text-sm">
                  Kelola dan lihat semua transaksi penjualan
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={loadSales} className="h-8 sm:h-9 text-xs sm:text-sm">
                  <RefreshCw className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Refresh</span>
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-4 lg:p-6">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 sm:gap-3">
              {/* Search */}
              <div className="flex gap-2 flex-1 min-w-0">
                <Input
                  placeholder="Cari nomor transaksi..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="flex-1 h-8 sm:h-9 text-xs sm:text-sm"
                />
                <Button onClick={handleSearch} variant="secondary" size="icon" className="h-8 w-8 sm:h-9 sm:w-9">
                  <Search className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </Button>
              </div>
              
              {/* Store Filter */}
              <Select value={selectedStore} onValueChange={(value) => {
                setSelectedStore(value);
                setCurrentPage(1);
              }}>
                <SelectTrigger className="w-full sm:w-[180px] h-8 sm:h-9 text-xs sm:text-sm">
                  <StoreIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
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
              
              {/* Status Filter */}
              <Select value={selectedStatus} onValueChange={(value) => {
                setSelectedStatus(value);
                setCurrentPage(1);
              }}>
                <SelectTrigger className="w-full sm:w-[150px] h-8 sm:h-9 text-xs sm:text-sm">
                  <Filter className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="completed">Selesai</SelectItem>
                  <SelectItem value="cancelled">Batal</SelectItem>
                  <SelectItem value="refunded">Refund</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Summary */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 p-2.5 sm:p-3 lg:p-4 bg-muted/50 rounded-lg">
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 lg:gap-6">
                <div>
                  <p className="text-[10px] sm:text-xs lg:text-sm text-muted-foreground">Total Transaksi</p>
                  <p className="text-base sm:text-xl font-bold">{totalItems}</p>
                </div>
                <div className="h-6 sm:h-8 w-px bg-border" />
                <div>
                  <p className="text-[10px] sm:text-xs lg:text-sm text-muted-foreground">Total Penjualan (Halaman ini)</p>
                  <p className="text-base sm:text-xl font-bold text-green-600">{formatCurrency(totalSalesAmount)}</p>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs w-[120px] sm:w-[150px]">No. Transaksi</TableHead>
                    <TableHead className="text-xs w-[100px] sm:w-[160px] hidden sm:table-cell">Tanggal</TableHead>
                    <TableHead className="text-xs hidden lg:table-cell">Toko</TableHead>
                    <TableHead className="text-xs hidden md:table-cell">Pelanggan</TableHead>
                    <TableHead className="text-xs hidden lg:table-cell">Kasir</TableHead>
                    <TableHead className="text-xs text-right">Total</TableHead>
                    <TableHead className="text-xs w-[80px] sm:w-[100px] hidden sm:table-cell">Bayar</TableHead>
                    <TableHead className="text-xs w-[70px] sm:w-[100px]">Status</TableHead>
                    <TableHead className="text-xs w-[50px] sm:w-[80px] text-center">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-6 sm:py-8">
                        <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin mx-auto text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  ) : sales.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-6 sm:py-8 text-xs sm:text-sm text-muted-foreground">
                        Tidak ada data transaksi
                      </TableCell>
                    </TableRow>
                  ) : (
                    sales.map((sale) => {
                      const PaymentIcon = paymentMethodLabels[sale.payment_method]?.icon || CreditCard;
                      return (
                        <TableRow key={sale.id} className="hover:bg-muted/50">
                          <TableCell className="font-mono text-[10px] sm:text-xs font-medium p-2 sm:p-4">
                            <div>
                              {sale.sale_number}
                              <div className="sm:hidden text-[9px] text-muted-foreground mt-0.5">
                                {formatDate(sale.created_at)}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground p-2 sm:p-4 hidden sm:table-cell">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDate(sale.created_at)}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs p-2 sm:p-4 hidden lg:table-cell">
                            {sale.store?.name || "-"}
                          </TableCell>
                          <TableCell className="text-xs p-2 sm:p-4 hidden md:table-cell">
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3 text-muted-foreground" />
                              <span className="truncate max-w-[100px]">{sale.customer?.name || "Walk-in"}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground p-2 sm:p-4 hidden lg:table-cell">
                            {sale.cashier?.full_name || sale.cashier?.username || "-"}
                          </TableCell>
                          <TableCell className="text-right text-xs sm:text-sm font-semibold p-2 sm:p-4">
                            {formatCurrency(sale.total_amount)}
                          </TableCell>
                          <TableCell className="p-2 sm:p-4 hidden sm:table-cell">
                            <div className="flex items-center gap-1">
                              <PaymentIcon className="h-3 w-3" />
                              <span className="text-xs">
                                {paymentMethodLabels[sale.payment_method]?.label || sale.payment_method}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="p-2 sm:p-4">
                            <Badge 
                              variant="secondary" 
                              className={cn("text-[9px] sm:text-xs px-1.5 sm:px-2", statusColors[sale.sale_status])}
                            >
                              {sale.sale_status === "completed" ? "Selesai" : 
                               sale.sale_status === "cancelled" ? "Batal" :
                               sale.sale_status === "refunded" ? "Refund" :
                               sale.sale_status === "draft" ? "Draft" :
                               sale.sale_status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center p-1 sm:p-4">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8">
                                  <MoreHorizontal className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => navigate(`/sales/${sale.id}`)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Lihat Detail
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                <p className="text-[10px] sm:text-sm text-muted-foreground">
                  Halaman {currentPage} dari {totalPages} ({totalItems} transaksi)
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="h-7 sm:h-8 text-xs"
                  >
                    <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:mr-1" />
                    <span className="hidden sm:inline">Prev</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="h-7 sm:h-8 text-xs"
                  >
                    <span className="hidden sm:inline">Next</span>
                    <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 sm:ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
