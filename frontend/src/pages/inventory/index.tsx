import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DataTable } from '@/components/ui/data-table';
import { inventoryColumns } from './inventory-columns';
import { storeInventoryColumns } from './store-inventory-columns';
import { inventoryApi, storesApi, warehousesApi, type Inventory, type StoreInventory, type Store, type Warehouse } from '@/lib/api';
import { Package, Store as StoreIcon } from 'lucide-react';
import { setPageTitle } from '@/lib/page-title';

export default function InventoryPage() {
  const [warehouseInventory, setWarehouseInventory] = useState<Inventory[]>([]);
  const [storeInventory, setStoreInventory] = useState<StoreInventory[]>([]);
  const [activeTab, setActiveTab] = useState('store');
  
  // Filter states
  const [stores, setStores] = useState<Store[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [selectedStore, setSelectedStore] = useState<string>('all');
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('all');
  
  // Pagination states
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    setPageTitle('Manajemen Inventori');
    loadFilters();
  }, []);

  useEffect(() => {
    loadData();
  }, [selectedStore, selectedWarehouse, activeTab]);

  const loadFilters = async () => {
    try {
      const [storesRes, warehousesRes] = await Promise.all([
        storesApi.getAll({ limit: 100 }),
        warehousesApi.getAll({ limit: 100 }),
      ]);
      setStores(storesRes.data.data || []);
      setWarehouses(warehousesRes.data.data || []);
    } catch (error) {
      console.error('Failed to load filters:', error);
    }
  };

  const loadData = async (page = 1) => {
    try {
      if (activeTab === 'store') {
        const params: any = { page, limit: pagination.limit };
        if (selectedStore !== 'all') {
          params.store_id = selectedStore;
        }
        const storeRes = await inventoryApi.getStoreInventory(params);
        setStoreInventory(storeRes.data.data || []);
        if (storeRes.data.pagination) {
          setPagination({
            page: storeRes.data.pagination.current_page || page,
            limit: storeRes.data.pagination.per_page || 10,
            total: storeRes.data.pagination.total || 0,
            totalPages: storeRes.data.pagination.total_pages || 1,
          });
        }
      } else {
        const params: any = { page, limit: pagination.limit };
        if (selectedWarehouse !== 'all') {
          params.warehouse_id = selectedWarehouse;
        }
        const warehouseRes = await inventoryApi.getWarehouseInventory(params);
        setWarehouseInventory(warehouseRes.data.data || []);
        if (warehouseRes.data.pagination) {
          setPagination({
            page: warehouseRes.data.pagination.current_page || page,
            limit: warehouseRes.data.pagination.per_page || 10,
            total: warehouseRes.data.pagination.total || 0,
            totalPages: warehouseRes.data.pagination.total_pages || 1,
          });
        }
      }
    } catch (error) {
      console.error('Failed to load inventory:', error);
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-3 p-3 sm:p-4 lg:p-6">
      <Card className="shadow-md">
        <CardHeader className="border-b bg-muted/50 p-3 sm:p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <CardTitle className="text-sm font-semibold truncate">Inventori</CardTitle>
              <CardDescription className="text-xs hidden sm:block">Kelola stok</CardDescription>
            </div>
            <div className="flex items-center gap-1 bg-muted rounded-md p-0.5">
              <Button
                variant={activeTab === 'warehouse' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('warehouse')}
                className="h-7 text-xs px-2"
              >
                <Package className="h-3 w-3 sm:mr-1" />
                <span className="hidden sm:inline">Gudang</span>
              </Button>
              <Button
                variant={activeTab === 'store' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('store')}
                className="h-7 text-xs px-2"
              >
                <StoreIcon className="h-3 w-3 sm:mr-1" />
                <span className="hidden sm:inline">Toko</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 space-y-3">
          {/* Filter Section */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground hidden sm:inline">Filter:</span>
              
            {activeTab === 'store' ? (
              <Select value={selectedStore} onValueChange={setSelectedStore}>
                <SelectTrigger className="w-full sm:w-[150px] h-8 text-xs">
                  <SelectValue placeholder="Pilih Toko" />
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
            ) : (
              <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
                <SelectTrigger className="w-full sm:w-[150px] h-8 text-xs">
                  <SelectValue placeholder="Pilih Gudang" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Gudang</SelectItem>
                  {warehouses.map((warehouse) => (
                    <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                      {warehouse.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            
            <div className="sm:ml-auto text-xs text-muted-foreground">
              {activeTab === 'store' 
                ? `${storeInventory.length} item`
                : `${warehouseInventory.length} item`
              }
            </div>
          </div>

          {activeTab === 'warehouse' ? (
            <DataTable
              columns={inventoryColumns}
              data={warehouseInventory}
              searchPlaceholder="Cari..."
              pageSize={10}
              mobileHiddenColumns={["warehouse", "min_stock", "max_stock", "updated_at", "select"]}
              serverPagination={{
                page: pagination.page,
                totalPages: pagination.totalPages,
                total: pagination.total,
                onPageChange: (newPage) => loadData(newPage)
              }}
            />
          ) : (
            <DataTable
              columns={storeInventoryColumns}
              data={storeInventory}
              searchPlaceholder="Cari..."
              pageSize={10}
              mobileHiddenColumns={["store", "min_stock", "max_stock", "updated_at", "select"]}
              serverPagination={{
                page: pagination.page,
                totalPages: pagination.totalPages,
                total: pagination.total,
                onPageChange: (newPage) => loadData(newPage)
              }}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
