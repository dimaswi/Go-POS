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
  inventoryApi,
  storesApi,
  warehousesApi,
  type StoreInventory,
  type Inventory,
  type Store,
  type Warehouse,
} from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { setPageTitle } from "@/lib/page-title";
import { 
  Loader2,
  Store as StoreIcon,
  Warehouse as WarehouseIcon,
  Package,
  AlertTriangle,
  FileDown,
  BarChart3,
  Filter,
  RefreshCw,
  Search,
  PackageX,
  PackageCheck,
} from "lucide-react";

interface InventorySummary {
  totalProducts: number;
  totalStock: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalValue: number;
}

export default function InventoryReportPage() {
  const { toast } = useToast();

  const [storeInventory, setStoreInventory] = useState<StoreInventory[]>([]);
  const [warehouseInventory, setWarehouseInventory] = useState<Inventory[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState<string>("all");
  const [locationType, setLocationType] = useState<string>("store");
  const [searchQuery, setSearchQuery] = useState("");
  const [stockFilter, setStockFilter] = useState<string>("all");
  const [summary, setSummary] = useState<InventorySummary>({
    totalProducts: 0,
    totalStock: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    totalValue: 0,
  });

  useEffect(() => {
    setPageTitle("Laporan Inventori");
    loadLocations();
  }, []);

  useEffect(() => {
    loadInventory();
  }, [selectedLocation, locationType]);

  const loadLocations = async () => {
    try {
      const [storesRes, warehousesRes] = await Promise.all([
        storesApi.getAll(),
        warehousesApi.getAll(),
      ]);
      setStores(storesRes.data.data || []);
      setWarehouses(warehousesRes.data.data || []);
    } catch (error) {
      console.error("Failed to load locations:", error);
    }
  };

  const loadInventory = async () => {
    setLoading(true);
    try {
      if (locationType === 'store') {
        const params: any = { limit: 1000 };
        if (selectedLocation !== "all") {
          params.store_id = parseInt(selectedLocation);
        }
        const response = await inventoryApi.getStoreInventory(params);
        const inventory = response.data.data || [];
        setStoreInventory(inventory);
        setWarehouseInventory([]);
        calculateStoreSummary(inventory);
      } else {
        const params: any = { limit: 1000 };
        if (selectedLocation !== "all") {
          params.warehouse_id = parseInt(selectedLocation);
        }
        const response = await inventoryApi.getWarehouseInventory(params);
        const inventory = response.data.data || [];
        setWarehouseInventory(inventory);
        setStoreInventory([]);
        calculateWarehouseSummary(inventory);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: "Gagal memuat data inventori.",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateStoreSummary = (inventory: StoreInventory[]) => {
    const totalProducts = inventory.length;
    const totalStock = inventory.reduce((sum, item) => sum + item.quantity, 0);
    const lowStockCount = inventory.filter(item => item.quantity > 0 && item.quantity <= item.min_stock).length;
    const outOfStockCount = inventory.filter(item => item.quantity === 0).length;
    const totalValue = inventory.reduce((sum, item) => sum + (item.quantity * (item.product?.selling_price || 0)), 0);

    setSummary({
      totalProducts,
      totalStock,
      lowStockCount,
      outOfStockCount,
      totalValue,
    });
  };

  const calculateWarehouseSummary = (inventory: Inventory[]) => {
    const totalProducts = inventory.length;
    const totalStock = inventory.reduce((sum, item) => sum + item.quantity, 0);
    const lowStockCount = inventory.filter(item => item.quantity > 0 && item.quantity <= (item.min_stock || 10)).length;
    const outOfStockCount = inventory.filter(item => item.quantity === 0).length;
    const totalValue = inventory.reduce((sum, item) => sum + (item.quantity * (item.product?.selling_price || 0)), 0);

    setSummary({
      totalProducts,
      totalStock,
      lowStockCount,
      outOfStockCount,
      totalValue,
    });
  };

  const getFilteredInventory = () => {
    let items: any[] = locationType === 'store' ? storeInventory : warehouseInventory;

    // Filter by search
    if (searchQuery) {
      items = items.filter(item => 
        item.product?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.product?.sku?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by stock status
    switch (stockFilter) {
      case 'low':
        items = items.filter(item => item.quantity > 0 && item.quantity <= (item.min_stock || 10));
        break;
      case 'out':
        items = items.filter(item => item.quantity === 0);
        break;
      case 'normal':
        items = items.filter(item => item.quantity > (item.min_stock || 10));
        break;
    }

    return items;
  };

  const exportToCSV = () => {
    const items = getFilteredInventory();
    const headers = ['No', 'SKU', 'Produk', 'Lokasi', 'Stok', 'Min Stok', 'Status', 'Nilai'];
    const rows = items.map((item, index) => [
      index + 1,
      item.product?.sku || '-',
      item.product?.name || '-',
      locationType === 'store' ? item.store?.name : item.warehouse?.name,
      item.quantity,
      item.min_stock || 10,
      item.quantity === 0 ? 'Habis' : item.quantity <= item.min_stock ? 'Rendah' : 'Normal',
      item.quantity * (item.product?.selling_price || 0),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `laporan-inventori-${locationType}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const filteredInventory = getFilteredInventory();

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 lg:p-6">
      <div className="grid gap-4">
        {/* Header Card */}
        <Card className="shadow-md">
          <CardHeader className="p-4 lg:p-6 border-b bg-muted/50">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Package className="h-6 w-6 text-primary" />
                <div>
                  <CardTitle className="text-lg lg:text-xl">Laporan Inventori</CardTitle>
                  <CardDescription>
                    Ringkasan stok dan status inventori
                  </CardDescription>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={loadInventory} disabled={loading}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={exportToCSV} disabled={filteredInventory.length === 0}>
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
              
              <Select value={locationType} onValueChange={(v) => {
                setLocationType(v);
                setSelectedLocation("all");
              }}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Tipe Lokasi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="store">
                    <div className="flex items-center gap-2">
                      <StoreIcon className="h-4 w-4" />
                      Toko
                    </div>
                  </SelectItem>
                  <SelectItem value="warehouse">
                    <div className="flex items-center gap-2">
                      <WarehouseIcon className="h-4 w-4" />
                      Gudang
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger className="w-[180px]">
                  {locationType === 'store' ? (
                    <StoreIcon className="h-4 w-4 mr-2" />
                  ) : (
                    <WarehouseIcon className="h-4 w-4 mr-2" />
                  )}
                  <SelectValue placeholder="Semua Lokasi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua {locationType === 'store' ? 'Toko' : 'Gudang'}</SelectItem>
                  {(locationType === 'store' ? stores : warehouses).map((loc) => (
                    <SelectItem key={loc.id} value={loc.id.toString()}>
                      {loc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={stockFilter} onValueChange={setStockFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status Stok" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="normal">
                    <div className="flex items-center gap-2">
                      <PackageCheck className="h-4 w-4 text-green-500" />
                      Normal
                    </div>
                  </SelectItem>
                  <SelectItem value="low">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      Stok Rendah
                    </div>
                  </SelectItem>
                  <SelectItem value="out">
                    <div className="flex items-center gap-2">
                      <PackageX className="h-4 w-4 text-red-500" />
                      Habis
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>

              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari produk atau SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              <Card className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Produk</p>
                    <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                      {summary.totalProducts.toLocaleString('id-ID')}
                    </p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center">
                    <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </Card>

              <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Stok</p>
                    <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                      {summary.totalStock.toLocaleString('id-ID')}
                    </p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-800 flex items-center justify-center">
                    <PackageCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </Card>

              <Card className="p-4 bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border-yellow-200 dark:border-yellow-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Stok Rendah</p>
                    <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">
                      {summary.lowStockCount.toLocaleString('id-ID')}
                    </p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-yellow-100 dark:bg-yellow-800 flex items-center justify-center">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                  </div>
                </div>
              </Card>

              <Card className="p-4 bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border-red-200 dark:border-red-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Stok Habis</p>
                    <p className="text-2xl font-bold text-red-700 dark:text-red-400">
                      {summary.outOfStockCount.toLocaleString('id-ID')}
                    </p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-800 flex items-center justify-center">
                    <PackageX className="h-5 w-5 text-red-600 dark:text-red-400" />
                  </div>
                </div>
              </Card>

              <Card className="p-4 bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 border-purple-200 dark:border-purple-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Nilai Inventori</p>
                    <p className="text-xl font-bold text-purple-700 dark:text-purple-400">
                      Rp {(summary.totalValue / 1000000).toFixed(1)}M
                    </p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-800 flex items-center justify-center">
                    <BarChart3 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              </Card>
            </div>

            {/* Inventory Table */}
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span>Memuat data...</span>
              </div>
            ) : filteredInventory.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Tidak ada data inventori</p>
              </div>
            ) : (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-[50px]">No</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Produk</TableHead>
                      <TableHead>Lokasi</TableHead>
                      <TableHead className="text-right">Stok</TableHead>
                      <TableHead className="text-right">Min Stok</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Nilai</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInventory.slice(0, 100).map((item, index) => {
                      const minStock = item.min_stock || 10;
                      const stockStatus = item.quantity === 0 ? 'out' : item.quantity <= minStock ? 'low' : 'normal';
                      return (
                        <TableRow key={item.id}>
                          <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                          <TableCell className="font-mono text-sm">{item.product?.sku || '-'}</TableCell>
                          <TableCell className="font-medium">{item.product?.name || '-'}</TableCell>
                          <TableCell>
                            {locationType === 'store' ? item.store?.name : item.warehouse?.name}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {item.quantity.toLocaleString('id-ID')}
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            {minStock.toLocaleString('id-ID')}
                          </TableCell>
                          <TableCell>
                            {stockStatus === 'out' && (
                              <Badge variant="destructive" className="gap-1">
                                <PackageX className="h-3 w-3" />
                                Habis
                              </Badge>
                            )}
                            {stockStatus === 'low' && (
                              <Badge variant="outline" className="gap-1 text-yellow-600 border-yellow-300 bg-yellow-50">
                                <AlertTriangle className="h-3 w-3" />
                                Rendah
                              </Badge>
                            )}
                            {stockStatus === 'normal' && (
                              <Badge variant="outline" className="gap-1 text-green-600 border-green-300 bg-green-50">
                                <PackageCheck className="h-3 w-3" />
                                Normal
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            Rp {(item.quantity * (item.product?.selling_price || 0)).toLocaleString('id-ID')}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                {filteredInventory.length > 100 && (
                  <div className="p-3 text-center text-sm text-muted-foreground bg-muted/30">
                    Menampilkan 100 dari {filteredInventory.length} item. Export ke CSV untuk melihat semua data.
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
