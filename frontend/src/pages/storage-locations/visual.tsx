import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  Warehouse,
  Store,
  MapPin,
  Package,
  ChevronRight,
  ArrowLeft,
  Loader2,
  Layers,
  Box,
  Grid3X3,
  Search,
  FolderOpen,
  AlertTriangle,
} from 'lucide-react';
import { setPageTitle } from '@/lib/page-title';
import {
  warehousesApi,
  storesApi,
  storageLocationsApi,
  type Warehouse as WarehouseType,
  type Store as StoreType,
  type StorageLocation,
  type Inventory,
  type StoreInventory,
} from '@/lib/api';

// Location type icons and colors
const locationTypeConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  zone: { icon: Layers, color: 'bg-blue-500', label: 'Zona' },
  aisle: { icon: Grid3X3, color: 'bg-purple-500', label: 'Lorong' },
  shelf: { icon: Box, color: 'bg-green-500', label: 'Rak' },
  level: { icon: Layers, color: 'bg-orange-500', label: 'Level' },
  bin: { icon: Package, color: 'bg-red-500', label: 'Bin' },
  section: { icon: Grid3X3, color: 'bg-indigo-500', label: 'Seksi' },
  display_area: { icon: MapPin, color: 'bg-pink-500', label: 'Display' },
};

export default function StorageLocationsVisualPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'warehouse' | 'store'>('warehouse');
  const [warehouses, setWarehouses] = useState<WarehouseType[]>([]);
  const [stores, setStores] = useState<StoreType[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Navigation state - breadcrumb like
  const [selectedWarehouse, setSelectedWarehouse] = useState<WarehouseType | null>(null);
  const [selectedStore, setSelectedStore] = useState<StoreType | null>(null);
  const [locations, setLocations] = useState<StorageLocation[]>([]);
  const [locationsLoading, setLocationsLoading] = useState(false);
  
  // Current path for breadcrumb
  const [currentPath, setCurrentPath] = useState<{ id: number; name: string; type: string }[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_currentParentId, setCurrentParentId] = useState<number | null>(null);
  
  // Inventory dialog
  const [inventoryDialogOpen, setInventoryDialogOpen] = useState(false);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [inventory, setInventory] = useState<(Inventory | StoreInventory)[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<StorageLocation | null>(null);
  const [inventorySearch, setInventorySearch] = useState('');

  useEffect(() => {
    setPageTitle('Visual Lokasi Penyimpanan');
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [warehousesRes, storesRes] = await Promise.all([
        warehousesApi.getAll({ status: 'active' }),
        storesApi.getAll({ status: 'active' }),
      ]);
      setWarehouses(warehousesRes.data.data || []);
      setStores(storesRes.data.data || []);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error!',
        description: 'Gagal memuat data.',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadLocations = async (type: 'warehouse' | 'store', id: number, parentId: number | null = null) => {
    setLocationsLoading(true);
    try {
      let response;
      if (type === 'warehouse') {
        response = await storageLocationsApi.getByWarehouse(id);
      } else {
        response = await storageLocationsApi.getByStore(id);
      }
      
      const allLocations = response.data.data || [];
      // Filter by parent
      const filtered = allLocations.filter(loc => 
        parentId === null ? !loc.parent_id : loc.parent_id === parentId
      );
      setLocations(filtered);
    } catch (error) {
      console.error('Failed to load locations:', error);
    } finally {
      setLocationsLoading(false);
    }
  };

  const handleSelectWarehouse = (warehouse: WarehouseType) => {
    setSelectedWarehouse(warehouse);
    setSelectedStore(null);
    setCurrentPath([]);
    setCurrentParentId(null);
    loadLocations('warehouse', warehouse.id, null);
  };

  const handleSelectStore = (store: StoreType) => {
    setSelectedStore(store);
    setSelectedWarehouse(null);
    setCurrentPath([]);
    setCurrentParentId(null);
    loadLocations('store', store.id, null);
  };

  const handleSelectLocation = async (location: StorageLocation) => {
    // Check if this location has children
    const type = selectedWarehouse ? 'warehouse' : 'store';
    const parentEntityId = selectedWarehouse?.id || selectedStore?.id;
    
    if (!parentEntityId) return;
    
    // Load children first to check
    const response = type === 'warehouse' 
      ? await storageLocationsApi.getByWarehouse(parentEntityId)
      : await storageLocationsApi.getByStore(parentEntityId);
    
    const allLocations = response.data.data || [];
    const children = allLocations.filter(loc => loc.parent_id === location.id);
    
    if (children.length > 0) {
      // Has children, navigate into it
      setCurrentPath(prev => [...prev, { id: location.id, name: location.name, type: location.location_type }]);
      setCurrentParentId(location.id);
      setLocations(children);
    } else {
      // No children, show inventory
      setSelectedLocation(location);
      setInventoryDialogOpen(true);
      loadInventory(location.id);
    }
  };

  const handleBreadcrumbClick = async (index: number) => {
    const type = selectedWarehouse ? 'warehouse' : 'store';
    const parentEntityId = selectedWarehouse?.id || selectedStore?.id;
    
    if (!parentEntityId) return;
    
    if (index === -1) {
      // Go back to root
      setCurrentPath([]);
      setCurrentParentId(null);
      loadLocations(type, parentEntityId, null);
    } else {
      // Go to specific level
      const newPath = currentPath.slice(0, index + 1);
      const parentId = newPath[newPath.length - 1]?.id || null;
      setCurrentPath(newPath);
      setCurrentParentId(parentId);
      loadLocations(type, parentEntityId, parentId);
    }
  };

  const loadInventory = async (locationId: number) => {
    setInventoryLoading(true);
    try {
      const response = await storageLocationsApi.getProductsByLocation(locationId);
      setInventory(response.data.data || []);
    } catch (error) {
      console.error('Failed to load inventory:', error);
    } finally {
      setInventoryLoading(false);
    }
  };

  const goBack = () => {
    if (currentPath.length > 0) {
      handleBreadcrumbClick(currentPath.length - 2);
    } else {
      setSelectedWarehouse(null);
      setSelectedStore(null);
      setLocations([]);
    }
  };

  const filteredInventory = inventory.filter(item => {
    const product = (item as any).product;
    if (!inventorySearch) return true;
    const search = inventorySearch.toLowerCase();
    return product?.name?.toLowerCase().includes(search) || 
           product?.sku?.toLowerCase().includes(search);
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Render warehouse/store selection
  const renderEntitySelection = () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
      {activeTab === 'warehouse' ? (
        warehouses.length === 0 ? (
          <div className="col-span-full text-center py-8 text-muted-foreground">
            <Warehouse className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Belum ada gudang</p>
          </div>
        ) : (
          warehouses.map(warehouse => (
            <Card
              key={warehouse.id}
              className="cursor-pointer hover:border-primary hover:shadow-md transition-all"
              onClick={() => handleSelectWarehouse(warehouse)}
            >
              <CardContent className="p-4 text-center">
                <div className="h-12 w-12 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center mx-auto mb-2">
                  <Warehouse className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="font-medium text-sm truncate">{warehouse.name}</h3>
                <p className="text-xs text-muted-foreground truncate">{warehouse.code}</p>
              </CardContent>
            </Card>
          ))
        )
      ) : (
        stores.length === 0 ? (
          <div className="col-span-full text-center py-8 text-muted-foreground">
            <Store className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Belum ada toko</p>
          </div>
        ) : (
          stores.map(store => (
            <Card
              key={store.id}
              className="cursor-pointer hover:border-primary hover:shadow-md transition-all"
              onClick={() => handleSelectStore(store)}
            >
              <CardContent className="p-4 text-center">
                <div className="h-12 w-12 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center mx-auto mb-2">
                  <Store className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="font-medium text-sm truncate">{store.name}</h3>
                <p className="text-xs text-muted-foreground truncate">{store.code}</p>
              </CardContent>
            </Card>
          ))
        )
      )}
    </div>
  );

  // Render locations grid
  const renderLocations = () => (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button variant="ghost" size="sm" className="h-7 px-2" onClick={goBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-1 text-sm flex-wrap">
          <Button
            variant="link"
            size="sm"
            className="h-auto p-0 text-sm"
            onClick={() => {
              setSelectedWarehouse(null);
              setSelectedStore(null);
              setLocations([]);
              setCurrentPath([]);
            }}
          >
            {activeTab === 'warehouse' ? 'Gudang' : 'Toko'}
          </Button>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <Button
            variant="link"
            size="sm"
            className="h-auto p-0 text-sm"
            onClick={() => handleBreadcrumbClick(-1)}
          >
            {selectedWarehouse?.name || selectedStore?.name}
          </Button>
          {currentPath.map((item, index) => (
            <div key={item.id} className="flex items-center gap-1">
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
              <Button
                variant="link"
                size="sm"
                className="h-auto p-0 text-sm"
                onClick={() => handleBreadcrumbClick(index)}
              >
                {item.name}
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Locations Grid */}
      {locationsLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : locations.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <FolderOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <h3 className="font-medium">Tidak ada lokasi</h3>
          <p className="text-sm mt-1">Lokasi belum ditambahkan di tingkat ini</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => navigate('/storage-locations/create')}
          >
            Tambah Lokasi
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {locations.map(location => {
            const config = locationTypeConfig[location.location_type] || {
              icon: MapPin,
              color: 'bg-gray-500',
              label: location.location_type,
            };
            const IconComponent = config.icon;

            return (
              <Card
                key={location.id}
                className="cursor-pointer hover:border-primary hover:shadow-md transition-all group"
                onClick={() => handleSelectLocation(location)}
              >
                <CardContent className="p-3 text-center">
                  <div className={`h-10 w-10 rounded-lg ${config.color} flex items-center justify-center mx-auto mb-2 text-white`}>
                    <IconComponent className="h-5 w-5" />
                  </div>
                  <h3 className="font-medium text-xs sm:text-sm truncate">{location.name}</h3>
                  <p className="text-[10px] text-muted-foreground truncate">{location.code}</p>
                  <Badge variant="secondary" className="mt-1.5 text-[10px]">
                    {config.label}
                  </Badge>
                  <ChevronRight className="h-4 w-4 mx-auto mt-2 text-muted-foreground group-hover:text-primary transition-colors" />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-1 flex-col gap-3 p-3 sm:p-4 lg:p-6">
      <Card className="shadow-md">
        <CardHeader className="border-b bg-muted/50 p-3 sm:p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <MapPin className="h-4 w-4 shrink-0 text-primary" />
              <div className="min-w-0">
                <CardTitle className="text-sm font-semibold">Visual Lokasi Penyimpanan</CardTitle>
                <CardDescription className="text-xs hidden sm:block">
                  Telusuri lokasi penyimpanan secara visual
                </CardDescription>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() => navigate('/storage-locations')}
            >
              Lihat Tabel
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-3 sm:p-4">
          {!selectedWarehouse && !selectedStore ? (
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'warehouse' | 'store')}>
              <TabsList className="mb-4">
                <TabsTrigger value="warehouse" className="text-xs sm:text-sm">
                  <Warehouse className="h-4 w-4 mr-1.5" />
                  Gudang
                </TabsTrigger>
                <TabsTrigger value="store" className="text-xs sm:text-sm">
                  <Store className="h-4 w-4 mr-1.5" />
                  Toko
                </TabsTrigger>
              </TabsList>
              <TabsContent value="warehouse" className="mt-0">
                {renderEntitySelection()}
              </TabsContent>
              <TabsContent value="store" className="mt-0">
                {renderEntitySelection()}
              </TabsContent>
            </Tabs>
          ) : (
            renderLocations()
          )}
        </CardContent>
      </Card>

      {/* Inventory Dialog */}
      <Dialog open={inventoryDialogOpen} onOpenChange={setInventoryDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm sm:text-base">
              <Package className="h-4 w-4 text-primary" />
              Produk di {selectedLocation?.name}
              <Badge variant="secondary" className="text-[10px] ml-2">
                {locationTypeConfig[selectedLocation?.location_type || '']?.label || selectedLocation?.location_type}
              </Badge>
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-auto">
            {/* Search */}
            <div className="relative mb-3">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari produk..."
                value={inventorySearch}
                onChange={(e) => setInventorySearch(e.target.value)}
                className="pl-8 h-8 text-sm"
              />
            </div>

            {inventoryLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : filteredInventory.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Tidak ada produk di lokasi ini</p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Produk</TableHead>
                      <TableHead className="text-xs hidden sm:table-cell">SKU</TableHead>
                      <TableHead className="text-xs text-right">Stok</TableHead>
                      <TableHead className="text-xs text-right hidden sm:table-cell">Min</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInventory.map((item: any) => {
                      const minStock = item.min_stock || 0;
                      const isLowStock = minStock > 0 && item.quantity <= minStock;
                      return (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium text-xs sm:text-sm py-2">
                            {item.product?.name || '-'}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-xs hidden sm:table-cell py-2">
                            {item.product?.sku || '-'}
                          </TableCell>
                          <TableCell className="text-right font-medium text-xs sm:text-sm py-2">
                            {item.quantity?.toLocaleString('id-ID') || 0}
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground text-xs hidden sm:table-cell py-2">
                            {minStock.toLocaleString('id-ID')}
                          </TableCell>
                          <TableCell className="py-2">
                            {isLowStock ? (
                              <Badge variant="destructive" className="text-[10px] px-1.5">
                                <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />
                                Low
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
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
