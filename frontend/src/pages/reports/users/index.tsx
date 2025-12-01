import { useState, useEffect } from "react";
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
  salesApi,
  usersApi,
  storesApi,
  type Sale,
  type User,
  type Store,
} from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { setPageTitle } from "@/lib/page-title";
import { 
  Loader2,
  Store as StoreIcon,
  User as UserIcon,
  Users,
  DollarSign,
  ShoppingCart,
  Calendar,
  FileDown,
  Filter,
  RefreshCw,
  Award,
} from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths, startOfWeek, endOfWeek, startOfDay, endOfDay } from "date-fns";

interface UserSalesSummary {
  user_id: number;
  user_name: string;
  user_email: string;
  total_sales: number;
  total_transactions: number;
  average_transaction: number;
  total_items: number;
}

const dateRanges = [
  { value: 'today', label: 'Hari Ini' },
  { value: 'week', label: 'Minggu Ini' },
  { value: 'month', label: 'Bulan Ini' },
  { value: 'last_month', label: 'Bulan Lalu' },
  { value: 'custom', label: 'Kustom' },
];

export default function UserSalesReportPage() {
  const { toast } = useToast();

  const [users, setUsers] = useState<User[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStore, setSelectedStore] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<string>("all");
  const [dateRange, setDateRange] = useState<string>("month");
  const [startDate, setStartDate] = useState<string>(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState<string>(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [userSummaries, setUserSummaries] = useState<UserSalesSummary[]>([]);
  const [totalSummary, setTotalSummary] = useState({
    totalSales: 0,
    totalTransactions: 0,
    totalUsers: 0,
  });

  useEffect(() => {
    setPageTitle("Laporan Penjualan Per Kasir");
    loadInitialData();
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
  }, [selectedStore, selectedUser, startDate, endDate]);

  const loadInitialData = async () => {
    try {
      const [usersRes, storesRes] = await Promise.all([
        usersApi.getAll(),
        storesApi.getAll(),
      ]);
      setUsers(usersRes.data.data || []);
      setStores(storesRes.data.data || []);
    } catch (error) {
      console.error("Failed to load initial data:", error);
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
      let filteredSales = allSales.filter((sale: Sale) => {
        const saleDate = new Date(sale.sale_date);
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        return saleDate >= start && saleDate <= end;
      });

      // Filter by user if selected
      if (selectedUser !== "all") {
        filteredSales = filteredSales.filter((sale: Sale) => 
          sale.cashier_id === parseInt(selectedUser)
        );
      }

      calculateUserSummaries(filteredSales);

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

  const calculateUserSummaries = (salesData: Sale[]) => {
    // Group sales by cashier
    const userMap = new Map<number, UserSalesSummary>();

    salesData.forEach((sale) => {
      const cashierId = sale.cashier_id;
      const cashierName = sale.cashier?.full_name || sale.cashier?.username || `User #${cashierId}`;
      const cashierEmail = sale.cashier?.email || '-';

      if (!userMap.has(cashierId)) {
        userMap.set(cashierId, {
          user_id: cashierId,
          user_name: cashierName,
          user_email: cashierEmail,
          total_sales: 0,
          total_transactions: 0,
          average_transaction: 0,
          total_items: 0,
        });
      }

      const userSummary = userMap.get(cashierId)!;
      userSummary.total_sales += sale.total_amount;
      userSummary.total_transactions += 1;
      userSummary.total_items += sale.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
    });

    // Calculate averages and convert to array
    const summaries = Array.from(userMap.values()).map((summary) => ({
      ...summary,
      average_transaction: summary.total_transactions > 0 
        ? summary.total_sales / summary.total_transactions 
        : 0,
    }));

    // Sort by total sales descending
    summaries.sort((a, b) => b.total_sales - a.total_sales);

    setUserSummaries(summaries);
    setTotalSummary({
      totalSales: summaries.reduce((sum, s) => sum + s.total_sales, 0),
      totalTransactions: summaries.reduce((sum, s) => sum + s.total_transactions, 0),
      totalUsers: summaries.length,
    });
  };

  const exportToCSV = () => {
    const headers = ['Peringkat', 'Kasir', 'Email', 'Total Penjualan', 'Jumlah Transaksi', 'Rata-rata Transaksi', 'Total Item'];
    const rows = userSummaries.map((summary, index) => [
      index + 1,
      summary.user_name,
      summary.user_email,
      summary.total_sales,
      summary.total_transactions,
      Math.round(summary.average_transaction),
      summary.total_items,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `laporan-penjualan-kasir-${startDate}-${endDate}.csv`;
    link.click();
  };

  const getRankBadge = (index: number) => {
    if (index === 0) return <Badge className="bg-yellow-500 hover:bg-yellow-600"><Award className="h-3 w-3 mr-1" />1st</Badge>;
    if (index === 1) return <Badge className="bg-gray-400 hover:bg-gray-500"><Award className="h-3 w-3 mr-1" />2nd</Badge>;
    if (index === 2) return <Badge className="bg-amber-600 hover:bg-amber-700"><Award className="h-3 w-3 mr-1" />3rd</Badge>;
    return <span className="text-muted-foreground">#{index + 1}</span>;
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 lg:p-6">
      <div className="grid gap-4">
        {/* Header Card */}
        <Card className="shadow-md">
          <CardHeader className="p-4 lg:p-6 border-b bg-muted/50">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Users className="h-6 w-6 text-primary" />
                <div>
                  <CardTitle className="text-lg lg:text-xl">Laporan Penjualan Per Kasir</CardTitle>
                  <CardDescription>
                    Performa penjualan setiap kasir
                  </CardDescription>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={loadSales} disabled={loading}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={exportToCSV} disabled={userSummaries.length === 0}>
                  <FileDown className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 lg:p-6">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 mb-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Filter:</span>
              </div>
              
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-[150px]">
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Periode" />
                </SelectTrigger>
                <SelectContent>
                  {dateRanges.map((range) => (
                    <SelectItem key={range.value} value={range.value}>
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
                    className="w-[150px]"
                  />
                  <span className="text-muted-foreground">s/d</span>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-[150px]"
                  />
                </>
              )}

              <Select value={selectedStore} onValueChange={setSelectedStore}>
                <SelectTrigger className="w-[180px]">
                  <StoreIcon className="h-4 w-4 mr-2" />
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

              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger className="w-[180px]">
                  <UserIcon className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Semua Kasir" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kasir</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.full_name || user.username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Penjualan</p>
                    <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                      Rp {totalSummary.totalSales.toLocaleString('id-ID')}
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
                      {totalSummary.totalTransactions.toLocaleString('id-ID')}
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
                    <p className="text-sm text-muted-foreground">Jumlah Kasir Aktif</p>
                    <p className="text-2xl font-bold text-purple-700 dark:text-purple-400">
                      {totalSummary.totalUsers}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-800 flex items-center justify-center">
                    <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              </Card>
            </div>

            {/* Top 3 Performers */}
            {userSummaries.length >= 3 && (
              <div className="mb-6">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Award className="h-5 w-5 text-yellow-500" />
                  Top Performers
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {userSummaries.slice(0, 3).map((summary, index) => (
                    <Card key={summary.user_id} className={`p-4 ${
                      index === 0 ? 'bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border-yellow-300' :
                      index === 1 ? 'bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-900/20 dark:to-slate-900/20 border-gray-300' :
                      'bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border-orange-300'
                    }`}>
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                          index === 0 ? 'bg-yellow-200 dark:bg-yellow-800' :
                          index === 1 ? 'bg-gray-200 dark:bg-gray-700' :
                          'bg-orange-200 dark:bg-orange-800'
                        }`}>
                          <Award className={`h-5 w-5 ${
                            index === 0 ? 'text-yellow-600' :
                            index === 1 ? 'text-gray-600' :
                            'text-orange-600'
                          }`} />
                        </div>
                        <div>
                          <p className="font-semibold">{summary.user_name}</p>
                          <p className="text-xs text-muted-foreground">{summary.user_email}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-muted-foreground">Penjualan</p>
                          <p className="font-bold">Rp {(summary.total_sales / 1000).toFixed(0)}K</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Transaksi</p>
                          <p className="font-bold">{summary.total_transactions}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* User Sales Table */}
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span>Memuat data...</span>
              </div>
            ) : userSummaries.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Tidak ada data penjualan untuk periode ini</p>
              </div>
            ) : (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-[80px]">Peringkat</TableHead>
                      <TableHead>Kasir</TableHead>
                      <TableHead className="text-right">Total Penjualan</TableHead>
                      <TableHead className="text-right">Jumlah Transaksi</TableHead>
                      <TableHead className="text-right">Rata-rata Transaksi</TableHead>
                      <TableHead className="text-right">Total Item</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userSummaries.map((summary, index) => (
                      <TableRow key={summary.user_id}>
                        <TableCell className="text-center">
                          {getRankBadge(index)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <UserIcon className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{summary.user_name}</p>
                              <p className="text-xs text-muted-foreground">{summary.user_email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-bold text-green-600">
                          Rp {summary.total_sales.toLocaleString('id-ID')}
                        </TableCell>
                        <TableCell className="text-right">
                          {summary.total_transactions.toLocaleString('id-ID')}
                        </TableCell>
                        <TableCell className="text-right">
                          Rp {Math.round(summary.average_transaction).toLocaleString('id-ID')}
                        </TableCell>
                        <TableCell className="text-right">
                          {summary.total_items.toLocaleString('id-ID')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
