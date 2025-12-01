import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/components/ui/data-table'
import { api } from '@/lib/api'
import {
  ArrowLeft,
  Package,
  Warehouse,
  Calendar,
  Edit,
  MapPin,
} from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'

interface Inventory {
  id: number
  product_id: number
  product?: {
    id: number
    name: string
    sku: string
    description?: string
  }
  product_variant_id?: number
  product_variant?: {
    id: number
    name: string
    sku: string
  }
  warehouse_id: number
  warehouse?: {
    id: number
    name: string
    location: string
  }
  quantity: number
  reserved_quantity: number
  shelf_location?: string
  bin_location?: string
  zone?: string
  aisle?: string
  level?: string
  last_updated: string
  created_at: string
}

interface InventoryTransaction {
  id: number
  transaction_type: string
  quantity: number
  unit_cost: number
  reference_type: string
  reference_id?: number
  notes: string
  created_by: number
  created_by_user?: {
    full_name: string
    email: string
  }
  created_at: string
}

const transactionColumns: ColumnDef<InventoryTransaction>[] = [
  {
    accessorKey: 'transaction_type',
    header: 'Tipe',
    size: 120,
    cell: ({ row }) => {
      const type = row.getValue('transaction_type') as string
      let variant: 'default' | 'secondary' | 'destructive' | 'outline' = 'default'
      
      switch (type) {
        case 'in':
          variant = 'default'
          break
        case 'out':
          variant = 'destructive'
          break
        case 'adjustment':
          variant = 'secondary'
          break
        case 'transfer':
          variant = 'outline'
          break
      }
      
      return <Badge variant={variant}>{type.toUpperCase()}</Badge>
    },
  },
  {
    accessorKey: 'quantity',
    header: 'Kuantitas',
    size: 100,
    cell: ({ row }) => {
      const quantity = row.getValue('quantity') as number
      const isPositive = quantity > 0
      
      return (
        <span className={`font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {isPositive ? '+' : ''}{quantity.toFixed(2)}
        </span>
      )
    },
  },
  {
    accessorKey: 'reference_type',
    header: 'Referensi',
    size: 120,
    cell: ({ row }) => {
      const refType = row.getValue('reference_type') as string
      
      return <span className="capitalize">{refType}</span>
    },
  },
  {
    accessorKey: 'notes',
    header: 'Catatan',
    size: 200,
    cell: ({ row }) => {
      const notes = row.getValue('notes') as string
      return (
        <div className="max-w-[200px] truncate" title={notes}>
          {notes || '-'}
        </div>
      )
    },
  },
  {
    accessorKey: 'created_by',
    header: 'Oleh',
    size: 150,
    cell: ({ row }) => {
      const user = row.original.created_by_user
      const userId = row.original.created_by
      return user?.full_name || `User #${userId}`
    },
  },
  {
    accessorKey: 'created_at',
    header: 'Tanggal',
    size: 130,
    cell: ({ row }) => {
      const date = new Date(row.getValue('created_at'))
      return (
        <div className="text-sm">
          <div>{date.toLocaleDateString('id-ID')}</div>
          <div className="text-xs text-muted-foreground">
            {date.toLocaleTimeString('id-ID')}
          </div>
        </div>
      )
    },
  },
]

export default function InventoryShowPage() {
  const { id } = useParams<{ id: string }>()
  const [inventory, setInventory] = useState<Inventory | null>(null)
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // Fetch inventory detail
        const inventoryResponse = await api.get(`/inventory/${id}`)
        setInventory(inventoryResponse.data.data || null)

        // Fetch transactions for this inventory
        if (inventoryResponse.data.data) {
          const transactionParams = new URLSearchParams({
            product_id: inventoryResponse.data.data.product_id.toString(),
            warehouse_id: inventoryResponse.data.data.warehouse_id.toString(),
          })
          
          const transactionsResponse = await api.get(
            `/inventory/transactions?${transactionParams}`
          )
          setTransactions(transactionsResponse.data.data || [])
        }
      } catch (error) {
        console.error('Error fetching inventory detail:', error)
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchData()
    }
  }, [id])

  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-3 sm:gap-4 p-3 sm:p-4 lg:p-6">
        <div className="text-center text-sm sm:text-base">Loading...</div>
      </div>
    )
  }

  if (!inventory) {
    return (
      <div className="flex flex-1 flex-col gap-3 sm:gap-4 p-3 sm:p-4 lg:p-6">
        <div className="text-center text-sm sm:text-base">Inventory tidak ditemukan</div>
      </div>
    )
  }

  const availableStock = inventory.quantity - inventory.reserved_quantity
  const stockStatus = availableStock <= 0 ? 'Out of Stock' : availableStock <= 10 ? 'Low Stock' : 'In Stock'
  const statusColor = availableStock <= 0 ? 'destructive' : availableStock <= 10 ? 'secondary' : 'default'

  return (
    <div className="flex flex-1 flex-col gap-3 sm:gap-4 p-3 sm:p-4 lg:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2 sm:gap-4">
          <Button variant="outline" size="sm" asChild className="h-7 sm:h-8 text-xs sm:text-sm">
            <Link to="/inventory">
              <ArrowLeft className="h-3.5 w-3.5 sm:mr-1.5" />
              <span className="hidden sm:inline">Kembali</span>
            </Link>
          </Button>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-3xl font-bold tracking-tight">Detail Inventory</h1>
            <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
              Informasi lengkap stok produk
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Button variant="outline" asChild className="h-7 sm:h-8 text-xs">
            <Link to={`/inventory/${id}/edit`}>
              <Edit className="h-3.5 w-3.5 sm:mr-1.5" />
              <span className="hidden sm:inline">Lokasi</span>
            </Link>
          </Button>
          <Button asChild className="h-7 sm:h-8 text-xs">
            <Link to={`/inventory/${id}/adjust`}>
              <Edit className="h-3.5 w-3.5 sm:mr-1.5" />
              <span className="hidden sm:inline">Adjust</span>
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
        <Card className="shadow-md">
          <CardHeader className="bg-muted/50 rounded-t-lg p-3 sm:p-4">
            <CardTitle className="flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base">
              <Package className="h-4 w-4 sm:h-5 sm:w-5" />
              Info Produk
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="text-xs sm:text-sm font-medium text-muted-foreground">Nama Produk</label>
                <p className="text-sm sm:text-base font-medium">{inventory.product?.name}</p>
              </div>
              
              {inventory.product_variant && (
                <div>
                  <label className="text-xs sm:text-sm font-medium text-muted-foreground">Varian</label>
                  <p className="text-sm sm:text-base">{inventory.product_variant.name}</p>
                </div>
              )}
              
              <div>
                <label className="text-xs sm:text-sm font-medium text-muted-foreground">SKU</label>
                <p className="text-xs sm:text-base font-mono">
                  {inventory.product_variant?.sku || inventory.product?.sku}
                </p>
              </div>
              
              {inventory.product?.description && (
                <div>
                  <label className="text-xs sm:text-sm font-medium text-muted-foreground">Deskripsi</label>
                  <p className="text-xs sm:text-base">{inventory.product.description}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader className="bg-muted/50 rounded-t-lg p-3 sm:p-4">
            <CardTitle className="flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base">
              <Warehouse className="h-4 w-4 sm:h-5 sm:w-5" />
              Gudang & Stok
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="text-xs sm:text-sm font-medium text-muted-foreground">Gudang</label>
                <p className="text-sm sm:text-base font-medium">{inventory.warehouse?.name}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">{inventory.warehouse?.location}</p>
              </div>
              
              <div>
                <label className="text-xs sm:text-sm font-medium text-muted-foreground">Status Stok</label>
                <div className="mt-1">
                  <Badge variant={statusColor} className="text-[10px] sm:text-xs">{stockStatus}</Badge>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="text-xs sm:text-sm font-medium text-muted-foreground">Total Stok</label>
                  <p className="text-lg sm:text-2xl font-bold">{inventory.quantity.toFixed(2)}</p>
                </div>
                
                <div>
                  <label className="text-xs sm:text-sm font-medium text-muted-foreground">Reservasi</label>
                  <p className="text-lg sm:text-2xl font-bold text-orange-600">{inventory.reserved_quantity.toFixed(2)}</p>
                </div>
              </div>
              
              <div>
                <label className="text-xs sm:text-sm font-medium text-muted-foreground">Tersedia</label>
                <p className="text-lg sm:text-2xl font-bold text-green-600">{availableStock.toFixed(2)}</p>
              </div>
              
              <div>
                <label className="text-xs sm:text-sm font-medium text-muted-foreground">Update</label>
                <p className="text-xs sm:text-base flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  {new Date(inventory.last_updated).toLocaleString('id-ID')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Location Information */}
      {(inventory.zone || inventory.aisle || inventory.shelf_location || inventory.level || inventory.bin_location) && (
        <Card className="shadow-md">
          <CardHeader className="bg-muted/50 rounded-t-lg p-3 sm:p-4">
            <CardTitle className="flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base">
              <MapPin className="h-4 w-4 sm:h-5 sm:w-5" />
              Lokasi Penyimpanan
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
              {inventory.zone && (
                <div>
                  <label className="text-xs sm:text-sm font-medium text-muted-foreground">Zona</label>
                  <p className="text-sm sm:text-base font-medium">{inventory.zone}</p>
                </div>
              )}
              {inventory.aisle && (
                <div>
                  <label className="text-xs sm:text-sm font-medium text-muted-foreground">Lorong</label>
                  <p className="text-sm sm:text-base font-medium">{inventory.aisle}</p>
                </div>
              )}
              {inventory.shelf_location && (
                <div>
                  <label className="text-xs sm:text-sm font-medium text-muted-foreground">Rak</label>
                  <p className="text-sm sm:text-base font-medium">{inventory.shelf_location}</p>
                </div>
              )}
              {inventory.level && (
                <div>
                  <label className="text-xs sm:text-sm font-medium text-muted-foreground">Level</label>
                  <p className="text-sm sm:text-base font-medium">{inventory.level}</p>
                </div>
              )}
              {inventory.bin_location && (
                <div>
                  <label className="text-xs sm:text-sm font-medium text-muted-foreground">Bin</label>
                  <p className="text-sm sm:text-base font-medium">{inventory.bin_location}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="shadow-md">
        <CardHeader className="bg-muted/50 rounded-t-lg p-3 sm:p-4">
          <CardTitle className="text-sm sm:text-base">Riwayat Transaksi</CardTitle>
        </CardHeader>
        <CardContent className="p-2 sm:p-4">
          {transactions.length > 0 ? (
            <div className="rounded-lg overflow-x-auto">
              <DataTable
                columns={transactionColumns}
                data={transactions}
                showSearch={false}
                showColumnVisibility={false}
                pageSize={5}
                mobileHiddenColumns={["notes", "created_by"]}
              />
            </div>
          ) : (
            <div className="text-center py-6 sm:py-8 text-muted-foreground">
              <Package className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-2 opacity-50" />
              <p className="text-xs sm:text-sm">Belum ada riwayat transaksi</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
