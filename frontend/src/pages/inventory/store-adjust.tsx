import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { api } from '@/lib/api'
import { ArrowLeft, Package, Save } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface StoreInventory {
  id: number
  product_id: number
  product?: {
    id: number
    name: string
    sku: string
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
  min_stock: number
  max_stock: number
  last_updated: string
}

interface AdjustmentForm {
  quantity: number
  reason: string
}

export default function StoreInventoryAdjustPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [inventory, setInventory] = useState<StoreInventory | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AdjustmentForm>()

  const watchedQuantity = watch('quantity')

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        setLoading(true)
        // Get store inventory detail
        const response = await api.get(`/store-inventory/${id}`)
        
        if (response.data.data) {
          setInventory(response.data.data)
          setValue('quantity', response.data.data.quantity)
        }
      } catch (error) {
        console.error('Error fetching store inventory:', error)
        toast({
          title: 'Error',
          description: 'Gagal memuat data inventory toko',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchInventory()
    }
  }, [id, setValue])

  const onSubmit = async (data: AdjustmentForm) => {
    if (!inventory) return

    try {
      setSubmitting(true)
      
      await api.post('/store-inventory/adjust', {
        product_id: inventory.product_id,
        product_variant_id: inventory.product_variant_id,
        store_id: inventory.store_id,
        quantity: data.quantity,
        reason: data.reason,
      })

      toast({
        title: 'Berhasil',
        description: 'Adjustment inventory toko berhasil disimpan',
      })

      navigate(`/store-inventory/${id}`)
    } catch (error) {
      console.error('Error adjusting store inventory:', error)
      toast({
        title: 'Error',
        description: 'Gagal menyimpan adjustment inventory toko',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

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

  const currentStock = inventory.quantity
  const newStock = watchedQuantity || 0
  const adjustment = newStock - currentStock

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 lg:p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link to={`/store-inventory/${id}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Kembali
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Adjustment Inventory Toko</h1>
            <p className="text-muted-foreground">
              Sesuaikan stok produk di toko
            </p>
          </div>
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
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Toko</label>
                <p className="text-base font-medium">{inventory.store?.name}</p>
                <p className="text-sm text-muted-foreground">{inventory.store?.address}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader className="bg-muted/50 rounded-t-lg">
            <CardTitle>Informasi Stok Saat Ini</CardTitle>
          </CardHeader>
          <CardContent className="p-4 lg:p-6">
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Stok Saat Ini</label>
                  <p className="text-2xl font-bold">{currentStock.toFixed(2)}</p>
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
              
              {watchedQuantity !== undefined && (
                <div className="pt-4 border-t">
                  <label className="text-sm font-medium text-muted-foreground">Adjustment</label>
                  <p className={`text-xl font-bold ${
                    adjustment > 0 ? 'text-green-600' : adjustment < 0 ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {adjustment > 0 ? '+' : ''}{adjustment.toFixed(2)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Stok setelah adjustment: {newStock.toFixed(2)}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-md">
        <CardHeader className="bg-muted/50 rounded-t-lg">
          <CardTitle>Form Adjustment</CardTitle>
        </CardHeader>
        <CardContent className="p-4 lg:p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="quantity">Stok Baru</Label>
              <Input
                id="quantity"
                type="number"
                step="0.01"
                min="0"
                placeholder="Masukkan jumlah stok baru"
                {...register('quantity', {
                  required: 'Stok baru harus diisi',
                  min: { value: 0, message: 'Stok tidak boleh negatif' },
                  valueAsNumber: true,
                })}
              />
              {errors.quantity && (
                <p className="text-sm text-red-600">{errors.quantity.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Alasan Adjustment</Label>
              <Textarea
                id="reason"
                placeholder="Masukkan alasan adjustment stok"
                rows={4}
                {...register('reason', {
                  required: 'Alasan adjustment harus diisi',
                })}
              />
              {errors.reason && (
                <p className="text-sm text-red-600">{errors.reason.message}</p>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" asChild>
                <Link to={`/store-inventory/${id}`}>
                  Batal
                </Link>
              </Button>
              <Button type="submit" disabled={submitting}>
                <Save className="mr-2 h-4 w-4" />
                {submitting ? 'Menyimpan...' : 'Simpan Adjustment'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
