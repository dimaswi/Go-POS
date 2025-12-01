import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardTitle, CardHeader, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { storesApi, inventoryApi, type StoreInventory } from '@/lib/api';
import { usePermission } from '@/hooks/usePermission';
import { useToast } from '@/hooks/use-toast';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { 
  ArrowLeft, 
  Loader2, 
  Edit, 
  Trash2,
  Store,
  MapPin,
  Phone,
  Mail,
  User,
  Package,
  Search,
  AlertTriangle,
  Pencil,
  Check,
  X
} from 'lucide-react';
import { setPageTitle } from '@/lib/page-title';

export default function StoreShow() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const { hasPermission } = usePermission();
  const [store, setStore] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  // Inventory state
  const [inventory, setInventory] = useState<StoreInventory[]>([]);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [inventorySearch, setInventorySearch] = useState('');
  const [inventoryPage, setInventoryPage] = useState(1);
  const [inventoryTotal, setInventoryTotal] = useState(0);
  const [editingStock, setEditingStock] = useState<{id: number, field: 'min' | 'max', value: string} | null>(null);
  const [savingStock, setSavingStock] = useState(false);
  const inventoryLimit = 10;

  useEffect(() => {
    setPageTitle('Detail Toko');
    loadStore();
  }, [id]);

  useEffect(() => {
    if (id) {
      loadInventory();
    }
  }, [id, inventorySearch, inventoryPage]);

  const loadStore = async () => {
    try {
      const response = await storesApi.getById(Number(id));
      setStore(response.data.data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: "Gagal memuat data toko.",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadInventory = async () => {
    setInventoryLoading(true);
    try {
      const response = await inventoryApi.getStoreInventory({
        store_id: id,
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
      
      await inventoryApi.updateStoreInventory(inventoryId, updateData);
      
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

  const handleDelete = async () => {
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!store?.id) return;

    setDeleting(true);
    try {
      await storesApi.delete(store.id);
      toast({
        variant: "success",
        title: "Berhasil!",
        description: "Toko berhasil dihapus.",
      });
      navigate('/stores');
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error!",
        description: "Gagal menghapus toko.",
      });
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
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

  if (!store) {
    return (
      <div className="flex flex-1 flex-col gap-3 sm:gap-4 p-3 sm:p-4 lg:p-6">
        <div className="text-center px-4">
          <h1 className="text-lg sm:text-2xl font-bold">Toko tidak ditemukan</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-2">Toko yang Anda cari tidak ada.</p>
          <Button onClick={() => navigate('/stores')} className="mt-3 sm:mt-4 h-8 text-xs sm:text-sm">
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
            Kembali
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-3 p-3 sm:p-4 lg:p-6">
      <Card className="shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-4 border-b bg-muted/50">
          <div className="flex items-center gap-2 sm:gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate("/stores")}
              className="h-8 w-8 shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                <Store className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0">
                <CardTitle className="text-sm font-semibold truncate">{store.name}</CardTitle>
                <p className="text-xs text-muted-foreground">{store.code}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            {hasPermission('stores.update') && (
              <Button
                size="sm"
                onClick={() => navigate(`/stores/${store.id}/edit`)}
                className="h-8 text-xs"
              >
                <Edit className="h-3.5 w-3.5 sm:mr-1" />
                <span className="hidden sm:inline">Edit</span>
              </Button>
            )}
            {hasPermission('stores.delete') && (
              <Button
                size="sm"
                variant="destructive"
                onClick={handleDelete}
                disabled={deleting}
                className="h-8 text-xs"
              >
                {deleting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <>
                    <Trash2 className="h-3.5 w-3.5 sm:mr-1" />
                    <span className="hidden sm:inline">Hapus</span>
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        <CardContent className="p-3 sm:p-4 lg:p-6">
          <div className="grid gap-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Store className="h-3 w-3" /> Nama
                </p>
                <p className="text-sm font-medium">{store.name}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Store className="h-3 w-3" /> Kode
                </p>
                <p className="text-sm font-medium">{store.code}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Status</p>
                <Badge variant={store.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                  {store.status === 'active' ? 'Aktif' : 'Nonaktif'}
                </Badge>
              </div>
              <div className="space-y-1 col-span-2 sm:col-span-1">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> Alamat
                </p>
                <p className="text-xs sm:text-sm">{store.address || '-'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Phone className="h-3 w-3" /> Telepon
                </p>
                <p className="text-xs sm:text-sm">{store.phone || '-'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Mail className="h-3 w-3" /> Email
                </p>
                <p className="text-xs sm:text-sm truncate">{store.email || '-'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <User className="h-3 w-3" /> Manager
                </p>
                <p className="text-xs sm:text-sm">{store.manager?.full_name || '-'}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Store Inventory Section */}
      <Card className="shadow-md">
        <CardHeader className="border-b bg-muted/50 p-3 sm:p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Package className="h-4 w-4 text-primary shrink-0" />
              <div className="min-w-0">
                <CardTitle className="text-sm font-semibold truncate">Produk di Toko</CardTitle>
                <CardDescription className="text-xs hidden sm:block">Daftar produk tersedia</CardDescription>
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
              <p className="text-xs text-muted-foreground">Toko ini belum memiliki stok produk.</p>
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
                      <TableHead className="text-xs text-right hidden sm:table-cell">Min</TableHead>
                      <TableHead className="text-xs text-right hidden sm:table-cell">Max</TableHead>
                      <TableHead className="text-xs text-right hidden md:table-cell">Harga</TableHead>
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
                          <TableCell className="text-right text-muted-foreground text-xs hidden sm:table-cell py-2">
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
                          <TableCell className="text-right text-xs hidden md:table-cell py-2">
                            Rp {(item.selling_price || item.product?.selling_price || 0).toLocaleString('id-ID')}
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

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="Hapus Toko"
        description={`Apakah Anda yakin ingin menghapus "${store.name}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Hapus"
        cancelText="Batal"
        variant="destructive"
      />
    </div>
  );
}
