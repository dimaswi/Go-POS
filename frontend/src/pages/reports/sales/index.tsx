import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useToast } from "@/hooks/use-toast";
import { setPageTitle } from "@/lib/page-title";
import { 
  Loader2,
  Store as StoreIcon,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Calendar,
  FileDown,
  BarChart3,
  Filter,
  RefreshCw,
} from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths, startOfWeek, endOfWeek, startOfDay, endOfDay } from "date-fns";
import { id } from "date-fns/locale";

interface SalesSummary {
  totalSales: number;
  totalTransactions: number;
  averageTransaction: number;
  totalItems: number;
}

const dateRanges = [
  { value: 'today', label: 'Hari Ini' },
  { value: 'week', label: 'Minggu Ini' },
  { value: 'month', label: 'Bulan Ini' },
  { value: 'last_month', label: 'Bulan Lalu' },
  { value: 'custom', label: 'Kustom' },
];

export default function SalesReportPage() {
  const { toast } = useToast();

  const [sales, setSales] = useState<Sale[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStore, setSelectedStore] = useState<string>("all");
  const [dateRange, setDateRange] = useState<string>("month");
  const [startDate, setStartDate] = useState<string>(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState<string>(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [summary, setSummary] = useState<SalesSummary>({
    totalSales: 0,
    totalTransactions: 0,
    averageTransaction: 0,
    totalItems: 0,
  });

  useEffect(() => {
    setPageTitle("Laporan Penjualan");
    loadStores();
  }, []);

  useEffect(() => {
    // Update date range based on selection
    const now = new Date();
    switch (dateRange) {
      case 'today':
        setStartDate(format(startOfDay(now), 'yyyy-MM-dd'));
        setEndDate(format(endOfDay(now), 'yyyy-MM-dd'));
        break;
      case 'week':
        setStartDate(format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'));
        setEndDate(format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'));
        break;
      case 'month':
        setStartDate(format(startOfMonth(now), 'yyyy-MM-dd'));
        setEndDate(format(endOfMonth(now), 'yyyy-MM-dd'));
        break;
      case 'last_month':
        const lastMonth = subMonths(now, 1);
        setStartDate(format(startOfMonth(lastMonth), 'yyyy-MM-dd'));
        setEndDate(format(endOfMonth(lastMonth), 'yyyy-MM-dd'));
        break;
    }
  }, [dateRange]);

  useEffect(() => {
    loadSales();
  }, [selectedStore, startDate, endDate]);

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
        limit: 1000,
        status: 'completed',
      };
      
      if (selectedStore !== "all") {
        params.store_id = parseInt(selectedStore);
      }

      const response = await salesApi.getAll(params);
      const allSales = response.data.data || [];
      
      // Filter by date range
      const filteredSales = allSales.filter((sale: Sale) => {
        const saleDate = new Date(sale.sale_date);
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        return saleDate >= start && saleDate <= end;
      });

      setSales(filteredSales);

      // Calculate summary
      const totalSales = filteredSales.reduce((sum: number, sale: Sale) => sum + sale.total_amount, 0);
      const totalTransactions = filteredSales.length;
      const totalItems = filteredSales.reduce((sum: number, sale: Sale) => 
        sum + (sale.items?.reduce((itemSum, item) => itemSum + item.quantity, 0) || 0), 0);

      setSummary({
        totalSales,
        totalTransactions,
        averageTransaction: totalTransactions > 0 ? totalSales / totalTransactions : 0,
        totalItems,
      });

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

  const exportToCSV = () => {
    const headers = ['No', 'Tanggal', 'No. Transaksi', 'Toko', 'Pelanggan', 'Subtotal', 'Pajak', 'Diskon', 'Total'];
    const rows = sales.map((sale, index) => [
      index + 1,
      format(new Date(sale.sale_date), 'dd/MM/yyyy HH:mm'),
      sale.sale_number,
      sale.store?.name || '-',
      sale.customer?.name || 'Umum',
      sale.subtotal,
      sale.tax_amount,
      sale.discount_amount,
      sale.total_amount,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `laporan-penjualan-${startDate}-${endDate}.csv`;
    link.click();
  };

  // Group sales by date for chart-like display
  const groupedByDate = sales.reduce((acc: Record<string, { count: number; total: number }>, sale) => {
    const date = format(new Date(sale.sale_date), 'yyyy-MM-dd');
    if (!acc[date]) {
      acc[date] = { count: 0, total: 0 };
    }
    acc[date].count++;
    acc[date].total += sale.total_amount;
    return acc;
  }, {});

  return (
    <div className="flex flex-1 flex-col gap-3 sm:gap-4 p-3 sm:p-4 lg:p-6">
      <div className="grid gap-3 sm:gap-4">
        {/* Header Card */}
        <Card className="shadow-md">
          <CardHeader className="p-3 sm:p-4 lg:p-6 border-b bg-muted/50">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <BarChart3 className="h-4 w-4 sm:h-6 sm:w-6 text-primary" />
                <div className="min-w-0">
                  <CardTitle className="text-sm sm:text-lg lg:text-xl">Laporan Penjualan</CardTitle>
                  <CardDescription className="text-[10px] sm:text-xs hidden sm:block">
                    Ringkasan dan detail penjualan
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Button variant="outline" size="sm" className="h-7 sm:h-8 text-xs" onClick={loadSales} disabled={loading}>
                  <RefreshCw className={`h-3.5 w-3.5 sm:mr-1.5 ${loading ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Refresh</span>
                </Button>
                <Button variant="outline" size="sm" className="h-7 sm:h-8 text-xs" onClick={exportToCSV} disabled={sales.length === 0}>
                  <FileDown className="h-3.5 w-3.5 sm:mr-1.5" />
                  <span className="hidden sm:inline">Export</span>
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 lg:p-6">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs sm:text-sm font-medium">Filter:</span>
              </div>
              
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-full sm:w-[150px] h-8 text-xs">
                  <Calendar className="h-3.5 w-3.5 mr-1.5" />
                  <SelectValue placeholder="Periode" />
                </SelectTrigger>
                <SelectContent>
                  {dateRanges.map((range) => (
                    <SelectItem key={range.value} value={range.value} className="text-xs">
                      {range.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {dateRange === 'custom' && (
                <>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full sm:w-[140px] h-8 text-xs"
                  />
                  <span className="text-xs text-muted-foreground hidden sm:inline">s/d</span>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full sm:w-[140px] h-8 text-xs"
                  />
                </>
              )}

              <Select value={selectedStore} onValueChange={setSelectedStore}>
                <SelectTrigger className="w-full sm:w-[160px] h-8 text-xs">
                  <StoreIcon className="h-3.5 w-3.5 mr-1.5" />
                  <SelectValue placeholder="Semua Toko" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">Semua Toko</SelectItem>
                  {stores.map((store) => (
                    <SelectItem key={store.id} value={store.id.toString()} className="text-xs">
                      {store.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Penjualan</p>
                    <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                      Rp {summary.totalSales.toLocaleString('id-ID')}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-800 flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </Card>

              <Card className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Transaksi</p>
                    <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                      {summary.totalTransactions.toLocaleString('id-ID')}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center">
                    <ShoppingCart className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </Card>

              <Card className="p-4 bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 border-purple-200 dark:border-purple-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Rata-rata Transaksi</p>
                    <p className="text-2xl font-bold text-purple-700 dark:text-purple-400">
                      Rp {Math.round(summary.averageTransaction).toLocaleString('id-ID')}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-800 flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              </Card>

              <Card className="p-4 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border-orange-200 dark:border-orange-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Item Terjual</p>
                    <p className="text-2xl font-bold text-orange-700 dark:text-orange-400">
                      {summary.totalItems.toLocaleString('id-ID')}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-orange-100 dark:bg-orange-800 flex items-center justify-center">
                    <BarChart3 className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                  </div>
                </div>
              </Card>
            </div>

            {/* Daily Summary */}
            {Object.keys(groupedByDate).length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold mb-3">Ringkasan Harian</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                  {Object.entries(groupedByDate)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .slice(-7)
                    .map(([date, data]) => (
                    <Card key={date} className="p-3 text-center">
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(date), 'dd MMM', { locale: id })}
                      </p>
                      <p className="font-bold text-sm">
                        Rp {(data.total / 1000).toFixed(0)}K
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {data.count} trx
                      </p>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Sales Table */}
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span>Memuat data...</span>
              </div>
            ) : sales.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Tidak ada data penjualan untuk periode ini</p>
              </div>
            ) : (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-[50px]">No</TableHead>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>No. Transaksi</TableHead>
                      <TableHead>Toko</TableHead>
                      <TableHead>Pelanggan</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                      <TableHead className="text-right">Pajak</TableHead>
                      <TableHead className="text-right">Diskon</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sales.slice(0, 50).map((sale, index) => (
                      <TableRow key={sale.id}>
                        <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                        <TableCell>
                          {format(new Date(sale.sale_date), 'dd/MM/yyyy HH:mm', { locale: id })}
                        </TableCell>
                        <TableCell className="font-mono text-sm">{sale.sale_number}</TableCell>
                        <TableCell>{sale.store?.name || '-'}</TableCell>
                        <TableCell>{sale.customer?.name || 'Umum'}</TableCell>
                        <TableCell className="text-right">
                          Rp {sale.subtotal.toLocaleString('id-ID')}
                        </TableCell>
                        <TableCell className="text-right">
                          Rp {sale.tax_amount.toLocaleString('id-ID')}
                        </TableCell>
                        <TableCell className="text-right text-green-600">
                          {sale.discount_amount > 0 ? `-Rp ${sale.discount_amount.toLocaleString('id-ID')}` : '-'}
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          Rp {sale.total_amount.toLocaleString('id-ID')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {sales.length > 50 && (
                  <div className="p-3 text-center text-sm text-muted-foreground bg-muted/30">
                    Menampilkan 50 dari {sales.length} transaksi. Export ke CSV untuk melihat semua data.
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
