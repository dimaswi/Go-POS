import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft, Edit, MapPin, Warehouse, Store, Package, Loader2, Hash, Tag, Layers, Box, Info, CheckCircle } from 'lucide-react'
import { storageLocationsApi, type StorageLocation } from '@/lib/api'
import { setPageTitle } from '@/lib/page-title'

interface InventoryItem {
  id: number
  product?: {
    id: number
    name: string
    sku: string
  }
  product_variant?: {
    id: number
    name: string
    sku: string
  }
  quantity: number
  reserved_quantity?: number
}

export default function StorageLocationShowPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  
  const [location, setLocation] = useState<StorageLocation | null>(null)
  const [products, setProducts] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setPageTitle('Detail Lokasi Penyimpanan')
    loadData()
  }, [id])

  const loadData = async () => {
    try {
      setLoading(true)
      const [locationRes, productsRes] = await Promise.all([
        storageLocationsApi.getById(Number(id)),
        storageLocationsApi.getProductsByLocation(Number(id)),
      ])
      setLocation(locationRes.data.data)
      setProducts(productsRes.data.data || [])
    } catch (error) {
      console.error('Failed to load data:', error)
      toast({ title: 'Error', description: 'Gagal memuat data lokasi', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const getLocationTypeLabel = (locationType: string) => {
    const labels: Record<string, string> = {
      zone: 'Zona',
      aisle: 'Lorong',
      shelf: 'Rak',
      level: 'Level',
      bin: 'Bin',
      section: 'Seksi',
      display_area: 'Area Display',
    }
    return labels[locationType] || locationType
  }

  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-3 p-3 sm:p-4 lg:p-6">
        <Card className="shadow-md">
          <CardContent className="flex items-center justify-center h-32">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2 text-sm">Memuat data lokasi...</span>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!location) {
    return (
      <div className="flex flex-1 flex-col gap-3 p-3 sm:p-4 lg:p-6">
        <Card className="shadow-md">
          <CardContent className="flex flex-col items-center justify-center h-32 gap-3">
            <p className="text-sm text-muted-foreground">Lokasi tidak ditemukan</p>
            <Button variant="outline" size="sm" onClick={() => navigate('/storage-locations')}>
              <ArrowLeft className="h-3.5 w-3.5 mr-1" />
              Kembali
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-3 p-3 sm:p-4 lg:p-6">
      <div className="grid gap-3">
        {/* Header Card */}
        <Card className="shadow-md">
          <CardHeader className="border-b bg-muted/50 p-3 sm:p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => navigate('/storage-locations')}
                  className="h-8 w-8 p-0 shrink-0"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-2 min-w-0">
                  <MapPin className="h-4 w-4 text-primary shrink-0" />
                  <div className="min-w-0">
                    <CardTitle className="text-sm font-semibold truncate">{location.name}</CardTitle>
                    <CardDescription className="text-xs hidden sm:block">Kode: {location.code}</CardDescription>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <Badge variant={location.is_active ? 'default' : 'secondary'} className="text-[10px]">
                  {location.is_active ? 'Aktif' : 'Nonaktif'}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/storage-locations/${id}/edit`)}
                  className="h-8 text-xs"
                >
                  <Edit className="h-3.5 w-3.5 sm:mr-1" />
                  <span className="hidden sm:inline">Edit</span>
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Basic Information */}
              <div className="space-y-3">
                <h3 className="font-semibold text-xs">Informasi Dasar</h3>
                
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <Hash className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] text-muted-foreground">Kode Lokasi</p>
                      <p className="text-xs font-medium font-mono">{location.code}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Tag className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] text-muted-foreground">Nama Lokasi</p>
                      <p className="text-xs font-medium truncate">{location.name}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Layers className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[10px] text-muted-foreground">Tipe</p>
                      <Badge variant={location.type === 'warehouse' ? 'default' : 'secondary'} className="text-[10px] mt-0.5">
                        {location.type === 'warehouse' ? 'Gudang' : 'Toko'}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Box className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[10px] text-muted-foreground">Jenis Lokasi</p>
                      <p className="text-xs font-medium">{getLocationTypeLabel(location.location_type)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Location Details */}
              <div className="space-y-3">
                <h3 className="font-semibold text-xs">Detail Lokasi</h3>
                
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    {location.type === 'warehouse' ? (
                      <Warehouse className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                    ) : (
                      <Store className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="text-[10px] text-muted-foreground">
                        {location.type === 'warehouse' ? 'Gudang' : 'Toko'}
                      </p>
                      <p className="text-xs font-medium truncate">
                        {location.warehouse?.name || location.store?.name || '-'}
                      </p>
                    </div>
                  </div>

                  {location.parent && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[10px] text-muted-foreground">Lokasi Induk</p>
                        <p className="text-xs font-medium truncate">{location.parent.name} ({location.parent.code})</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-2">
                    <Package className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[10px] text-muted-foreground">Kapasitas</p>
                      <p className="text-xs font-medium">{location.capacity || '-'}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[10px] text-muted-foreground">Status</p>
                      <Badge variant={location.is_active ? 'default' : 'outline'} className="text-[10px] mt-0.5">
                        {location.is_active ? 'Aktif' : 'Nonaktif'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {location.description && (
              <>
                <Separator className="my-4" />
                <div>
                  <h3 className="font-semibold text-xs mb-2 flex items-center gap-1">
                    <Info className="h-3.5 w-3.5" />
                    Deskripsi
                  </h3>
                  <div className="bg-muted/50 p-3 rounded-lg">
                    <p className="text-xs whitespace-pre-wrap">{location.description}</p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Products Card */}
        <Card className="shadow-md">
          <CardHeader className="border-b bg-muted/50 p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-primary shrink-0" />
              <div className="min-w-0">
                <CardTitle className="text-sm font-semibold">Produk di Lokasi Ini</CardTitle>
                <CardDescription className="text-xs">{products.length} produk tersedia</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-3 sm:p-4">
            {products.length > 0 ? (
              <div className="max-h-[300px] sm:max-h-[400px] overflow-auto space-y-2">
                {products.map((item) => (
                  <div 
                    key={item.id} 
                    className="flex items-center justify-between p-2 sm:p-3 bg-muted/30 rounded-lg border"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium truncate">{item.product?.name}</p>
                      {item.product_variant && (
                        <p className="text-[10px] text-muted-foreground truncate">{item.product_variant.name}</p>
                      )}
                      <p className="text-[10px] text-muted-foreground font-mono">
                        {item.product_variant?.sku || item.product?.sku}
                      </p>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <p className="text-sm font-semibold">{item.quantity}</p>
                      {item.reserved_quantity && item.reserved_quantity > 0 && (
                        <p className="text-[10px] text-muted-foreground">
                          ({item.reserved_quantity} reserved)
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 sm:py-8 text-muted-foreground">
                <Package className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-2 opacity-50" />
                <p className="text-xs sm:text-sm">Belum ada produk di lokasi ini</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
