import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { warehousesApi, inventoryApi, type Inventory } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Edit,
  Loader2,
  Warehouse,
  MapPin,
  Phone,
  Store,
  User,
  Calendar,
  CheckCircle,
  XCircle,
  Hash,
  Package,
  Search,
  AlertTriangle,
  Pencil,
  Check,
  X,
} from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { setPageTitle } from "@/lib/page-title";
import { type Warehouse as WarehouseType } from "./columns";

export default function WarehouseShow() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [warehouse, setWarehouse] = useState<WarehouseType | null>(null);
  
  // Inventory state
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [inventorySearch, setInventorySearch] = useState('');
  const [inventoryPage, setInventoryPage] = useState(1);
  const [inventoryTotal, setInventoryTotal] = useState(0);
  const [editingStock, setEditingStock] = useState<{id: number, field: 'min' | 'max', value: string} | null>(null);
  const [savingStock, setSavingStock] = useState(false);
  const inventoryLimit = 10;

  useEffect(() => {
    setPageTitle("Detail Gudang");
    loadWarehouse();
  }, [id]);

  useEffect(() => {
    if (id) {
      loadInventory();
    }
  }, [id, inventorySearch, inventoryPage]);

  const loadWarehouse = async () => {
    if (!id) return;

    try {
      const response = await warehousesApi.getById(parseInt(id));
      setWarehouse(response.data.data);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: error.response?.data?.error || "Gagal memuat data gudang.",
      });
      navigate("/warehouses");
    } finally {
      setLoading(false);
    }
  };

  const loadInventory = async () => {
    if (!id) return;
    
    setInventoryLoading(true);
    try {
      const response = await warehousesApi.getInventory(parseInt(id), {
        search: inventorySearch,
        page: inventoryPage,
        limit: inventoryLimit
      });
      setInventory(response.data.data || []);
      setInventoryTotal(response.data.pagination?.total || 0);
    } catch (error) {
      console.error('Failed to load inventory:', error);
    } finally {
      setInventoryLoading(false);
    }
  };

  const handleSaveStock = async (inventoryId: number, field: 'min' | 'max', value: string) => {
    setSavingStock(true);
    try {
      const numValue = parseFloat(value) || 0;
      const updateData = field === 'min' ? { min_stock: numValue } : { max_stock: numValue };
      
      await inventoryApi.updateWarehouseInventory(inventoryId, updateData);
      
      // Update local state
      setInventory(prev => prev.map(item => 
        item.id === inventoryId 
          ? { ...item, [field === 'min' ? 'min_stock' : 'max_stock']: numValue }
          : item
      ));
      
      toast({
        variant: "success",
        title: "Berhasil!",
        description: `${field === 'min' ? 'Min' : 'Max'} stock berhasil diupdate.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: "Gagal mengupdate stock.",
      });
    } finally {
      setSavingStock(false);
      setEditingStock(null);
    }
  };

  const totalPages = Math.ceil(inventoryTotal / inventoryLimit);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 sm:h-full">
        <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!warehouse) {
    return (
      <div className="flex items-center justify-center h-64 sm:h-full">
        <div className="text-center px-4">
          <Warehouse className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
          <h3 className="text-sm sm:text-lg font-semibold">Gudang tidak ditemukan</h3>
          <p className="text-xs sm:text-sm text-muted-foreground">Gudang yang diminta tidak dapat ditemukan.</p>
        </div>
      </div>
    );
  }

  const getTypeLabel = (type: string) => {
    const labels = {
      main: "Gudang Utama",
      central: "Gudang Pusat",
      branch: "Gudang Cabang", 
      store: "Gudang Toko",
      virtual: "Gudang Virtual"
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getTypeBadgeVariant = (type: string) => {
    const variants = {
      main: "default",
      central: "default",
      branch: "secondary",
      store: "secondary",
      virtual: "outline"
    } as const;
    return variants[type as keyof typeof variants] || "secondary";
  };

  return (
    <div className="flex flex-1 flex-col gap-3 p-3 sm:p-4 lg:p-6">
      <div className="grid gap-3">
        <Card className="shadow-md">
          <CardHeader className="border-b bg-muted/50 p-3 sm:p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => navigate("/warehouses")}
                  className="h-8 w-8 shrink-0"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="min-w-0">
                  <CardTitle className="text-sm font-semibold truncate">
                    {warehouse.name}
                  </CardTitle>
                  <CardDescription className="text-xs hidden sm:block">
                    Detail informasi warehouse
                  </CardDescription>
                </div>
              </div>
              <Button
                onClick={() => navigate(`/warehouses/${warehouse.id}/edit`)}
                className="h-8 text-xs"
              >
                <Edit className="h-3.5 w-3.5 sm:mr-1" />
                <span className="hidden sm:inline">Edit</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="grid gap-4">
              {/* Basic Information */}
              <div className="grid gap-3">
                <div className="flex items-center gap-2">
                  <Warehouse className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-xs font-medium">Basic Information</h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Warehouse className="h-3 w-3" />
                      Nama
                    </p>
                    <p className="text-xs sm:text-sm font-semibold">{warehouse.name}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Hash className="h-3 w-3" />
                      Kode
                    </p>
                    <p className="text-xs sm:text-sm">{warehouse.code}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Tipe</p>
                    <Badge variant={getTypeBadgeVariant(warehouse.type)} className="text-[10px]">
                      {getTypeLabel(warehouse.type)}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      Telepon
                    </p>
                    <p className="text-xs sm:text-sm">{warehouse.phone || "-"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Status</p>
                    <Badge
                      variant={warehouse.status === "active" ? "default" : "secondary"}
                      className="text-[10px]"
                    >
                      {warehouse.status === "active" ? (
                        <CheckCircle className="mr-0.5 h-2.5 w-2.5" />
                      ) : (
                        <XCircle className="mr-0.5 h-2.5 w-2.5" />
                      )}
                      {warehouse.status === "active" ? "Aktif" : "Nonaktif"}
                    </Badge>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Address */}
              {warehouse.address && (
                <>
                  <div className="grid gap-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <h3 className="text-xs font-medium">Alamat</h3>
                    </div>
                    <div className="bg-muted/30 p-2 sm:p-3 rounded-md">
                      <p className="text-xs sm:text-sm text-muted-foreground whitespace-pre-wrap">
                        {warehouse.address}
                      </p>
                    </div>
                  </div>
                  <Separator />
                </>
              )}

              {/* Store & Manager */}
              <div className="grid gap-3">
                <div className="flex items-center gap-2">
                  <Store className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-xs font-medium">Toko & Manager</h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Store className="h-3 w-3" />
                      Toko
                    </p>
                    {warehouse.store ? (
                      <div>
                        <Badge variant="secondary" className="text-[10px]">
                          {warehouse.store.name}
                        </Badge>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {warehouse.store.code}
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">-</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <User className="h-3 w-3" />
                      Manager
                    </p>
                    {warehouse.manager ? (
                      <div>
                        <p className="text-xs sm:text-sm font-medium">{warehouse.manager.full_name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{warehouse.manager.email}</p>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">-</p>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Meta Information */}
              <div className="grid gap-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-xs font-medium">Informasi Waktu</h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Dibuat</p>
                    <p className="text-xs sm:text-sm">
                      {format(new Date(warehouse.created_at), "dd MMM yyyy, HH:mm", {
                        locale: idLocale,
                      })}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Diupdate</p>
                    <p className="text-xs sm:text-sm">
                      {format(new Date(warehouse.updated_at), "dd MMM yyyy, HH:mm", {
                        locale: idLocale,
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Warehouse Inventory Section */}
        <Card className="shadow-md">
          <CardHeader className="border-b bg-muted/50 p-3 sm:p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Package className="h-4 w-4 text-primary shrink-0" />
                <div className="min-w-0">
                  <CardTitle className="text-sm font-semibold truncate">Produk di Gudang</CardTitle>
                  <CardDescription className="text-xs hidden sm:block">Daftar produk tersimpan</CardDescription>
                </div>
              </div>
              <Badge variant="secondary" className="text-xs shrink-0">
                {inventoryTotal} Produk
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-3 sm:p-4">
            {/* Search */}
            <div className="mb-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari produk..."
                  value={inventorySearch}
                  onChange={(e) => {
                    setInventorySearch(e.target.value);
                    setInventoryPage(1);
                  }}
                  className="pl-8 h-8 text-sm"
                />
              </div>
            </div>

            {/* Inventory Table */}
            {inventoryLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : inventory.length === 0 ? (
              <div className="text-center py-6 sm:py-8">
                <Package className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <h3 className="text-sm font-semibold">Belum ada produk</h3>
                <p className="text-xs text-muted-foreground">Gudang ini belum memiliki stok produk.</p>
              </div>
            ) : (
              <>
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Produk</TableHead>
                        <TableHead className="text-xs hidden sm:table-cell">SKU</TableHead>
                        <TableHead className="text-xs text-right">Stok</TableHead>
                        <TableHead className="text-xs text-right hidden sm:table-cell">Dipesan</TableHead>
                        <TableHead className="text-xs text-right hidden md:table-cell">Min</TableHead>
                        <TableHead className="text-xs text-right hidden md:table-cell">Max</TableHead>
                        <TableHead className="text-xs text-right hidden lg:table-cell">Harga</TableHead>
                        <TableHead className="text-xs">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {inventory.map((item) => {
                        const minStock = item.min_stock || 0;
                        const maxStock = item.max_stock || 0;
                        const isLowStock = minStock > 0 && item.quantity <= minStock;
                        const isOverStock = maxStock > 0 && item.quantity > maxStock;
                        const isEditingMin = editingStock?.id === item.id && editingStock?.field === 'min';
                        const isEditingMax = editingStock?.id === item.id && editingStock?.field === 'max';
                        
                        return (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium text-xs sm:text-sm py-2">
                              {item.product?.name || '-'}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-xs hidden sm:table-cell py-2">
                              {item.product?.sku || '-'}
                            </TableCell>
                            <TableCell className="text-right font-medium text-xs sm:text-sm py-2">
                              {item.quantity.toLocaleString('id-ID')}
                            </TableCell>
                            <TableCell className="text-right text-muted-foreground text-xs hidden sm:table-cell py-2">
                              {(item.reserved_quantity || 0).toLocaleString('id-ID')}
                            </TableCell>
                            <TableCell className="text-right text-muted-foreground text-xs hidden md:table-cell py-2">
                              {isEditingMin ? (
                                <div className="flex items-center justify-end gap-1">
                                  <Input
                                    type="number"
                                    value={editingStock.value}
                                    onChange={(e) => setEditingStock({ ...editingStock, value: e.target.value })}
                                    className="w-16 h-6 text-xs text-right"
                                    autoFocus
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleSaveStock(item.id, 'min', editingStock.value);
                                      if (e.key === 'Escape') setEditingStock(null);
                                    }}
                                  />
                                  <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => handleSaveStock(item.id, 'min', editingStock.value)} disabled={savingStock}>
                                    <Check className="h-3 w-3 text-green-600" />
                                  </Button>
                                  <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => setEditingStock(null)}>
                                    <X className="h-3 w-3 text-red-600" />
                                  </Button>
                                </div>
                              ) : (
                                <span 
                                  className="cursor-pointer hover:text-primary hover:underline inline-flex items-center gap-1"
                                  onClick={() => setEditingStock({ id: item.id, field: 'min', value: String(minStock) })}
                                >
                                  {minStock.toLocaleString('id-ID')}
                                  <Pencil className="h-2.5 w-2.5 opacity-50" />
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="text-right text-muted-foreground text-xs hidden md:table-cell py-2">
                              {isEditingMax ? (
                                <div className="flex items-center justify-end gap-1">
                                  <Input
                                    type="number"
                                    value={editingStock.value}
                                    onChange={(e) => setEditingStock({ ...editingStock, value: e.target.value })}
                                    className="w-16 h-6 text-xs text-right"
                                    autoFocus
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleSaveStock(item.id, 'max', editingStock.value);
                                      if (e.key === 'Escape') setEditingStock(null);
                                    }}
                                  />
                                  <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => handleSaveStock(item.id, 'max', editingStock.value)} disabled={savingStock}>
                                    <Check className="h-3 w-3 text-green-600" />
                                  </Button>
                                  <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => setEditingStock(null)}>
                                    <X className="h-3 w-3 text-red-600" />
                                  </Button>
                                </div>
                              ) : (
                                <span 
                                  className="cursor-pointer hover:text-primary hover:underline inline-flex items-center gap-1"
                                  onClick={() => setEditingStock({ id: item.id, field: 'max', value: String(maxStock) })}
                                >
                                  {maxStock.toLocaleString('id-ID')}
                                  <Pencil className="h-2.5 w-2.5 opacity-50" />
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="text-right text-xs hidden lg:table-cell py-2">
                              Rp {(item.product?.selling_price || 0).toLocaleString('id-ID')}
                            </TableCell>
                            <TableCell className="py-2">
                              {isLowStock ? (
                                <Badge variant="destructive" className="text-[10px] px-1.5">
                                  <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />
                                  Low
                                </Badge>
                              ) : isOverStock ? (
                                <Badge variant="outline" className="text-[10px] px-1.5 bg-orange-500 text-white border-orange-500">
                                  <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />
                                  Over
                                </Badge>
                              ) : (
                                <Badge variant="default" className="text-[10px] px-1.5">OK</Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mt-3">
                    <p className="text-xs text-muted-foreground">
                      Halaman {inventoryPage} dari {totalPages}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => setInventoryPage((p) => Math.max(1, p - 1))}
                        disabled={inventoryPage === 1}
                      >
                        Sebelumnya
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => setInventoryPage((p) => Math.min(totalPages, p + 1))}
                        disabled={inventoryPage === totalPages}
                      >
                        Selanjutnya
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
