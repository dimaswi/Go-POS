import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/lib/store';
import { salesApi, productsApi, customersApi, storesApi } from '@/lib/api';
import { 
  ShoppingCart, 
  DollarSign, 
  TrendingUp, 
  Package, 
  Users, 
  Store, 
  Loader2,
  ArrowUpRight,
  Receipt,
  CreditCard,
  Banknote,
  Wallet,
  ChevronRight,
  LayoutDashboard,
  MapPin,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { setPageTitle } from '@/lib/page-title';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface SalesStats {
  total_sales: number;
  total_revenue: number;
  today_sales: number;
  today_revenue: number;
  average_sale: number;
}

interface RecentSale {
  id: number;
  sale_number: string;
  total_amount: number;
  payment_method: string;
  customer?: { name: string };
  store?: { name: string };
  created_at: string;
}

const paymentMethodIcons: Record<string, React.ElementType> = {
  cash: Banknote,
  card: CreditCard,
  digital_wallet: Wallet,
  credit: CreditCard,
  multiple: CreditCard,
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<SalesStats>({
    total_sales: 0,
    total_revenue: 0,
    today_sales: 0,
    today_revenue: 0,
    average_sale: 0,
  });
  const [recentSales, setRecentSales] = useState<RecentSale[]>([]);
  const [counts, setCounts] = useState({
    products: 0,
    customers: 0,
    stores: 0,
  });

  // Check if user is admin (can access all stores)
  const isAdmin = user?.role?.name?.toLowerCase().includes('admin') || 
                  user?.role?.name?.toLowerCase().includes('manager') ||
                  user?.role?.name?.toLowerCase().includes('super') ||
                  user?.role?.name?.toLowerCase().includes('owner');

  // Get user's assigned store
  const userStore = user?.store;

  useEffect(() => {
    setPageTitle('Beranda');
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Backend will auto-filter by user's store if not admin
      const [salesStatsRes, recentSalesRes, productsRes, customersRes, storesRes] = await Promise.all([
        salesApi.getStats(),
        salesApi.getAll({ limit: 5, sort: '-created_at' }),
        productsApi.getAll({ limit: 1 }),
        customersApi.getAll({ limit: 1 }),
        storesApi.getAll({ limit: 1 }),
      ]);

      setStats(salesStatsRes.data.data || {
        total_sales: 0,
        total_revenue: 0,
        today_sales: 0,
        today_revenue: 0,
        average_sale: 0,
      });

      setRecentSales(recentSalesRes.data.data || []);

      setCounts({
        products: (productsRes.data as any).pagination?.total || productsRes.data.data?.length || 0,
        customers: (customersRes.data as any).pagination?.total || customersRes.data.data?.length || 0,
        stores: (storesRes.data as any).pagination?.total || storesRes.data.data?.length || 0,
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd MMM, HH:mm", { locale: id });
    } catch {
      return dateString;
    }
  };

  const statCards = [
    { 
      title: 'Penjualan Hari Ini', 
      value: formatCurrency(stats.today_revenue), 
      subtitle: `${stats.today_sales} transaksi`,
      icon: DollarSign, 
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-950',
      trend: stats.today_sales > 0 ? 'up' : 'neutral',
    },
    { 
      title: 'Total Penjualan', 
      value: formatCurrency(stats.total_revenue), 
      subtitle: `${stats.total_sales} transaksi`,
      icon: TrendingUp, 
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-950',
      trend: 'up',
    },
    { 
      title: 'Rata-rata Transaksi', 
      value: formatCurrency(stats.average_sale), 
      subtitle: 'Per transaksi',
      icon: ShoppingCart, 
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-950',
      trend: 'neutral',
    },
    { 
      title: 'Total Produk', 
      value: counts.products.toString(), 
      subtitle: 'Produk aktif',
      icon: Package, 
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-50 dark:bg-orange-950',
      trend: 'neutral',
    },
  ];

  const quickLinks = [
    { title: 'Buka Kasir', path: '/pos', icon: ShoppingCart, color: 'bg-green-600 hover:bg-green-700' },
    { title: 'Penjualan', path: '/sales', icon: Receipt, color: 'bg-blue-600 hover:bg-blue-700' },
    { title: 'Produk', path: '/products', icon: Package, color: 'bg-purple-600 hover:bg-purple-700' },
    { title: 'Pelanggan', path: '/customers', icon: Users, color: 'bg-orange-600 hover:bg-orange-700' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 sm:h-full">
        <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-3 sm:gap-4 p-3 sm:p-4 lg:p-6">
      <div className="grid gap-3 sm:gap-4">       {/* Welcome Card */}
        <Card className="shadow-md">
          <CardHeader className="border-b bg-muted/50 p-3 sm:p-4 lg:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm sm:text-lg lg:text-xl font-bold flex-shrink-0">
                  {user?.full_name?.charAt(0) || 'U'}
                </div>
                <div className="min-w-0">
                  <CardTitle className="text-xs sm:text-sm lg:text-base font-semibold truncate">
                    Selamat datang, {user?.full_name}! 👋
                  </CardTitle>
                  <CardDescription className="text-[10px] sm:text-xs lg:text-sm">
                    <span className="truncate block">{format(new Date(), "EEEE, dd MMMM yyyy", { locale: id })} • {user?.role?.name || 'User'}</span>
                    {!isAdmin && userStore && (
                      <span className="flex items-center gap-1 mt-0.5 text-primary">
                        <MapPin className="h-3 w-3" />
                        {userStore.name}
                      </span>
                    )}
                    {isAdmin && (
                      <span className="flex items-center gap-1 mt-0.5 text-green-600 dark:text-green-400">
                        <Store className="h-3 w-3" />
                        Akses Semua Toko
                      </span>
                    )}
                  </CardDescription>
                </div>
              </div>
              <Button onClick={() => navigate('/pos')} className="h-9 text-sm gap-2 w-full sm:w-auto">
                <ShoppingCart className="h-4 w-4" />
                Buka Kasir
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Stats Grid */}
        <div className="grid gap-3 lg:gap-4 grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title} className="shadow-md">
                <CardContent className="p-3 lg:p-5">
                  <div className="flex items-center justify-between">
                    <div className={cn(stat.bgColor, "p-2 lg:p-2.5 rounded-lg")}>
                      <Icon className={cn("h-4 w-4 lg:h-5 lg:w-5", stat.color)} />
                    </div>
                    {stat.trend === 'up' && (
                      <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 text-[10px] lg:text-xs hidden sm:flex">
                        <ArrowUpRight className="h-3 w-3 mr-1" />
                        Naik
                      </Badge>
                    )}
                  </div>
                  <div className="mt-2 lg:mt-3">
                    <p className="text-xs lg:text-sm text-muted-foreground truncate">{stat.title}</p>
                    <p className="text-lg lg:text-2xl font-bold mt-0.5 lg:mt-1 truncate">{stat.value}</p>
                    <p className="text-[10px] lg:text-xs text-muted-foreground mt-0.5 lg:mt-1 truncate">{stat.subtitle}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Links */}
        <Card className="shadow-md">
          <CardHeader className="border-b bg-muted/50 py-3 px-4">
            <CardTitle className="text-sm lg:text-base font-semibold flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4" />
              Akses Cepat
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 lg:p-4">
            <div className="grid gap-2 lg:gap-3 grid-cols-2 md:grid-cols-4">
              {quickLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Button
                    key={link.path}
                    onClick={() => navigate(link.path)}
                    className={cn("h-auto py-2.5 lg:py-3 flex flex-col gap-1 lg:gap-1.5 text-white", link.color)}
                  >
                    <Icon className="h-4 w-4 lg:h-5 lg:w-5" />
                    <span className="text-xs lg:text-sm">{link.title}</span>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 lg:grid-cols-7">
          {/* Recent Sales */}
          <Card className="lg:col-span-4 shadow-md">
            <CardHeader className="border-b bg-muted/50 py-3 px-4">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <CardTitle className="text-sm lg:text-base font-semibold flex items-center gap-2">
                    <Receipt className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">Transaksi Terbaru</span>
                  </CardTitle>
                  <CardDescription className="text-xs mt-0.5 hidden sm:block">5 transaksi terakhir</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => navigate('/sales')} className="h-8 text-xs flex-shrink-0">
                  <span className="hidden sm:inline">Lihat Semua</span>
                  <ChevronRight className="h-3 w-3 sm:ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {recentSales.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Receipt className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Belum ada transaksi</p>
                </div>
              ) : (
                <div className="divide-y">
                  {recentSales.map((sale) => {
                    const PaymentIcon = paymentMethodIcons[sale.payment_method] || CreditCard;
                    return (
                      <div 
                        key={sale.id} 
                        className="flex items-center gap-2 lg:gap-3 p-3 hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => navigate(`/sales/${sale.id}`)}
                      >
                        <div className="w-8 h-8 lg:w-9 lg:h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <PaymentIcon className="h-3.5 w-3.5 lg:h-4 lg:w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1 lg:gap-2">
                            <p className="font-mono text-xs lg:text-sm font-medium truncate">
                              {sale.sale_number}
                            </p>
                            <Badge variant="secondary" className="text-[10px] lg:text-xs px-1 lg:px-1.5 py-0 hidden sm:inline-flex">
                              {sale.store?.name || 'Unknown'}
                            </Badge>
                          </div>
                          <p className="text-[10px] lg:text-xs text-muted-foreground truncate">
                            {sale.customer?.name || 'Walk-in'} • {formatDate(sale.created_at)}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-semibold text-green-600 text-xs lg:text-sm">
                            {formatCurrency(sale.total_amount)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="lg:col-span-3 shadow-md">
            <CardHeader className="border-b bg-muted/50 py-3 px-4">
              <CardTitle className="text-sm lg:text-base font-semibold">
                {isAdmin ? 'Ringkasan Bisnis' : 'Ringkasan Toko'}
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                {isAdmin ? 'Data keseluruhan' : userStore?.name || 'Toko Anda'}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-3 lg:p-4 space-y-2 lg:space-y-3">
              {/* User's assigned store info - only for non-admin */}
              {!isAdmin && userStore && (
                <div className="flex items-center justify-between p-2.5 lg:p-3 rounded-lg bg-primary/10 border border-primary/20">
                  <div className="flex items-center gap-2 lg:gap-3">
                    <div className="w-7 h-7 lg:w-8 lg:h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                      <MapPin className="h-3.5 w-3.5 lg:h-4 lg:w-4 text-primary" />
                    </div>
                    <span className="text-xs lg:text-sm font-medium">Toko Anda</span>
                  </div>
                  <span className="font-bold text-sm lg:text-base text-primary">{userStore.name}</span>
                </div>
              )}

              <div className="flex items-center justify-between p-2.5 lg:p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 lg:gap-3">
                  <div className="w-7 h-7 lg:w-8 lg:h-8 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                    <Package className="h-3.5 w-3.5 lg:h-4 lg:w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="text-xs lg:text-sm font-medium">Total Produk</span>
                </div>
                <span className="font-bold text-sm lg:text-base">{counts.products}</span>
              </div>

              <div className="flex items-center justify-between p-2.5 lg:p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 lg:gap-3">
                  <div className="w-7 h-7 lg:w-8 lg:h-8 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center">
                    <Users className="h-3.5 w-3.5 lg:h-4 lg:w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <span className="text-xs lg:text-sm font-medium">Total Pelanggan</span>
                </div>
                <span className="font-bold text-sm lg:text-base">{counts.customers}</span>
              </div>

              {/* Only show total stores for admin */}
              {isAdmin && (
                <div className="flex items-center justify-between p-2.5 lg:p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 lg:gap-3">
                    <div className="w-7 h-7 lg:w-8 lg:h-8 rounded-lg bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                      <Store className="h-3.5 w-3.5 lg:h-4 lg:w-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <span className="text-xs lg:text-sm font-medium">Total Toko</span>
                  </div>
                  <span className="font-bold text-sm lg:text-base">{counts.stores}</span>
                </div>
              )}

              <div className="flex items-center justify-between p-2.5 lg:p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 lg:gap-3">
                  <div className="w-7 h-7 lg:w-8 lg:h-8 rounded-lg bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
                    <Receipt className="h-3.5 w-3.5 lg:h-4 lg:w-4 text-orange-600 dark:text-orange-400" />
                  </div>
                  <span className="text-xs lg:text-sm font-medium">
                    {isAdmin ? 'Total Transaksi' : 'Transaksi Toko'}
                  </span>
                </div>
                <span className="font-bold text-sm lg:text-base">{stats.total_sales}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
