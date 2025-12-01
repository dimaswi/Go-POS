import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DataTable } from '@/components/ui/data-table'
import { useToast } from '@/hooks/use-toast'
import { Plus, MapPin, Warehouse, Store } from 'lucide-react'
import { storageLocationsApi, warehousesApi, storesApi, type StorageLocation, type Warehouse as WarehouseType, type Store as StoreType } from '@/lib/api'
import { setPageTitle } from '@/lib/page-title'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { createStorageLocationColumns } from './storage-location-columns'

export default function StorageLocationsPage() {
  const { toast } = useToast()
  const [locations, setLocations] = useState<StorageLocation[]>([])
  const [warehouses, setWarehouses] = useState<WarehouseType[]>([])
  const [stores, setStores] = useState<StoreType[]>([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [warehouseFilter, setWarehouseFilter] = useState<string>('all')
  const [storeFilter, setStoreFilter] = useState<string>('all')
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  })

  const columns = useMemo(() => createStorageLocationColumns(setDeleteId), [])

  useEffect(() => {
    setPageTitle('Master Lokasi Penyimpanan')
    loadData()
  }, [])

  useEffect(() => {
    loadLocations()
  }, [typeFilter, warehouseFilter, storeFilter])

  const loadData = async () => {
    try {
      const [warehousesRes, storesRes] = await Promise.all([
        warehousesApi.getAll(),
        storesApi.getAll(),
      ])
      setWarehouses(warehousesRes.data.data || warehousesRes.data || [])
      setStores(storesRes.data.data || storesRes.data || [])
    } catch (error) {
      console.error('Failed to load data:', error)
    }
  }

  const loadLocations = async (page = 1) => {
    try {
      setLoading(true)
      const params: Record<string, any> = {
        page,
        limit: pagination.limit,
      }
      if (typeFilter !== 'all') params.type = typeFilter
      if (warehouseFilter !== 'all') params.warehouse_id = warehouseFilter
      if (storeFilter !== 'all') params.store_id = storeFilter

      const response = await storageLocationsApi.getAll(params)
      setLocations(response.data.data || [])
      if (response.data.pagination) {
        setPagination({
          page: response.data.pagination.current_page || page,
          limit: response.data.pagination.per_page || 10,
          total: response.data.pagination.total || 0,
          totalPages: response.data.pagination.total_pages || 1,
        })
      }
    } catch (error) {
      console.error('Failed to load locations:', error)
      toast({ title: 'Error', description: 'Gagal memuat data lokasi', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await storageLocationsApi.delete(deleteId)
      toast({ title: 'Berhasil', description: 'Lokasi berhasil dihapus' })
      loadLocations()
    } catch (error: any) {
      toast({ 
        title: 'Error', 
        description: error.response?.data?.error || 'Gagal menghapus lokasi', 
        variant: 'destructive' 
      })
    } finally {
      setDeleteId(null)
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-3 p-3 sm:p-4 lg:p-6">
      <Card className="shadow-md">
        <CardHeader className="border-b bg-muted/50 p-3 sm:p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex items-center gap-2">
              <MapPin className="h-4 w-4 shrink-0" />
              <div className="min-w-0">
                <CardTitle className="text-sm font-semibold truncate">Lokasi Penyimpanan</CardTitle>
                <CardDescription className="text-xs hidden sm:block">Kelola lokasi penyimpanan produk</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button asChild variant="outline" size="sm" className="h-8 text-xs shrink-0">
                <Link to="/storage-locations/visual">
                  <MapPin className="h-3.5 w-3.5 sm:mr-1" />
                  <span className="hidden sm:inline">Visual</span>
                </Link>
              </Button>
              <Button asChild size="sm" className="h-8 text-xs shrink-0">
                <Link to="/storage-locations/create">
                  <Plus className="h-3.5 w-3.5 sm:mr-1" />
                  <span className="hidden sm:inline">Tambah</span>
                </Link>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 space-y-3">
          {/* Filter Section */}
          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2">
            <div className="flex items-center gap-1 bg-muted rounded-md p-0.5">
              <Button
                variant={typeFilter === 'all' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => {
                  setTypeFilter('all')
                  setWarehouseFilter('all')
                  setStoreFilter('all')
                }}
                className="h-7 text-xs px-2"
              >
                Semua
              </Button>
              <Button
                variant={typeFilter === 'warehouse' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => {
                  setTypeFilter('warehouse')
                  setStoreFilter('all')
                }}
                className="h-7 text-xs px-2"
              >
                <Warehouse className="h-3 w-3 mr-1" />
                Gudang
              </Button>
              <Button
                variant={typeFilter === 'store' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => {
                  setTypeFilter('store')
                  setWarehouseFilter('all')
                }}
                className="h-7 text-xs px-2"
              >
                <Store className="h-3 w-3 mr-1" />
                Toko
              </Button>
            </div>

            {typeFilter === 'warehouse' && (
              <Select value={warehouseFilter} onValueChange={setWarehouseFilter}>
                <SelectTrigger className="w-full sm:w-[150px] h-8 text-xs">
                  <SelectValue placeholder="Pilih Gudang" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Gudang</SelectItem>
                  {warehouses.map((wh) => (
                    <SelectItem key={wh.id} value={wh.id.toString()}>
                      {wh.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {typeFilter === 'store' && (
              <Select value={storeFilter} onValueChange={setStoreFilter}>
                <SelectTrigger className="w-full sm:w-[150px] h-8 text-xs">
                  <SelectValue placeholder="Pilih Toko" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Toko</SelectItem>
                  {stores.map((st) => (
                    <SelectItem key={st.id} value={st.id.toString()}>
                      {st.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            
            <div className="sm:ml-auto text-xs text-muted-foreground">
              {loading ? 'Memuat...' : `${locations.length} lokasi`}
            </div>
          </div>

          {/* Data Table */}
          <DataTable
            columns={columns}
            data={locations}
            searchPlaceholder="Cari..."
            pageSize={10}
            mobileHiddenColumns={["warehouse", "store", "capacity", "created_at", "select"]}
            serverPagination={{
              page: pagination.page,
              totalPages: pagination.totalPages,
              total: pagination.total,
              onPageChange: (newPage) => loadLocations(newPage)
            }}
          />
        </CardContent>
      </Card>

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={() => setDeleteId(null)}
        title="Hapus Lokasi"
        description="Apakah Anda yakin ingin menghapus lokasi ini? Tindakan ini tidak dapat dibatalkan."
        onConfirm={handleDelete}
      />
    </div>
  )
}
