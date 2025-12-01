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
  Store,
  Calendar,
  Edit,
  MapPin,
} from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'

interface StoreInventory {
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
  store_id: number
  store?: {
    id: number
    name: string
    address: string
  }
  quantity: number
  reserved_quantity?: number
  min_stock: number
  max_stock: number
  shelf_location?: string
  section?: string
  display_area?: string
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

export default function StoreInventoryShowPage() {
  const { id } = useParams<{ id: string }>()
  const [inventory, setInventory] = useState<StoreInventory | null>(null)
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // Fetch store inventory detail
        const inventoryResponse = await api.get(`/store-inventory/${id}`)
        setInventory(inventoryResponse.data.data || null)

        // Fetch transactions for this store inventory
        if (inventoryResponse.data.data) {
          const transactionParams = new URLSearchParams({
            product_id: inventoryResponse.data.data.product_id.toString(),
            store_id: inventoryResponse.data.data.store_id.toString(),
          })
          
          const transactionsResponse = await api.get(
            `/inventory/transactions?${transactionParams}`
          )
          setTransactions(transactionsResponse.data.data || [])
        }
      } catch (error) {
        console.error('Error fetching store inventory detail:', error)
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
      <div className="flex flex-1 flex-col gap-4 p-4 lg:p-6">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  if (!inventory) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 lg:p-6">
        <div className="text-center">Store inventory tidak ditemukan</div>
      </div>
    )
  }

  const stockStatus = inventory.quantity <= 0 
    ? 'Out of Stock' 
    : inventory.quantity <= inventory.min_stock 
      ? 'Low Stock' 
      : 'In Stock'
  const statusColor = inventory.quantity <= 0 
    ? 'destructive' 
    : inventory.quantity <= inventory.min_stock 
      ? 'secondary' 
      : 'default'

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 lg:p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link to="/inventory">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Kembali
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Detail Inventory Toko</h1>
            <p className="text-muted-foreground">
              Informasi lengkap stok produk di toko
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link to={`/store-inventory/${id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Lokasi
            </Link>
          </Button>
          <Button asChild>
            <Link to={`/store-inventory/${id}/adjust`}>
              <Edit className="mr-2 h-4 w-4" />
              Adjustment Stok
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="shadow-md">
          <CardHeader className="bg-muted/50 rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Informasi Produk
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 lg:p-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Nama Produk</label>
                <p className="text-base font-medium">{inventory.product?.name}</p>
              </div>
              
              {inventory.product_variant && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Varian</label>
                  <p className="text-base">{inventory.product_variant.name}</p>
                </div>
              )}
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">SKU</label>
                <p className="text-base font-mono">
                  {inventory.product_variant?.sku || inventory.product?.sku}
                </p>
              </div>
              
              {inventory.product?.description && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Deskripsi</label>
                  <p className="text-base">{inventory.product.description}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader className="bg-muted/50 rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5" />
              Informasi Toko & Stok
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 lg:p-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Toko</label>
                <p className="text-base font-medium">{inventory.store?.name}</p>
                <p className="text-sm text-muted-foreground">{inventory.store?.address}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Status Stok</label>
                <div className="mt-1">
                  <Badge variant={statusColor}>{stockStatus}</Badge>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Stok Saat Ini</label>
                  <p className="text-2xl font-bold">{inventory.quantity.toFixed(2)}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Min Stok</label>
                  <p className="text-2xl font-bold text-orange-600">{inventory.min_stock}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Max Stok</label>
                  <p className="text-2xl font-bold text-blue-600">{inventory.max_stock}</p>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Terakhir Update</label>
                <p className="text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {new Date(inventory.last_updated).toLocaleString('id-ID')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Location Information */}
      {(inventory.section || inventory.shelf_location || inventory.display_area) && (
        <Card className="shadow-md">
          <CardHeader className="bg-muted/50 rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Lokasi Penyimpanan
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 lg:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {inventory.section && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Seksi/Area</label>
                  <p className="text-base font-medium">{inventory.section}</p>
                </div>
              )}
              {inventory.shelf_location && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Lokasi Rak</label>
                  <p className="text-base font-medium">{inventory.shelf_location}</p>
                </div>
              )}
              {inventory.display_area && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Area Display</label>
                  <p className="text-base font-medium">{inventory.display_area}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="shadow-md">
        <CardHeader className="bg-muted/50 rounded-t-lg">
          <CardTitle>Riwayat Transaksi</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          {transactions.length > 0 ? (
            <div className="rounded-lg overflow-hidden">
              <DataTable
                columns={transactionColumns}
                data={transactions}
                showSearch={false}
                showColumnVisibility={false}
                pageSize={5}
              />
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Belum ada riwayat transaksi</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
