import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft, Loader2, Save, Check, ChevronsUpDown, X } from 'lucide-react'
import { storageLocationsApi, warehousesApi, storesApi } from '@/lib/api'
import type { StorageLocation, Warehouse, Store } from '@/lib/api'
import { setPageTitle } from '@/lib/page-title'
import { cn } from '@/lib/utils'

const formSchema = z.object({
  code: z.string().min(1, 'Kode wajib diisi').max(50, 'Maksimal 50 karakter'),
  name: z.string().min(1, 'Nama wajib diisi').max(100, 'Maksimal 100 karakter'),
  type: z.enum(['warehouse', 'store']),
  warehouse_id: z.string().optional(),
  store_id: z.string().optional(),
  location_type: z.string().min(1, 'Jenis lokasi wajib dipilih'),
  parent_id: z.string().optional(),
  description: z.string().max(255, 'Maksimal 255 karakter').optional(),
  capacity: z.string().optional(),
  is_active: z.boolean(),
})

type FormData = z.infer<typeof formSchema>

export default function StorageLocationEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [stores, setStores] = useState<Store[]>([])
  const [parentLocations, setParentLocations] = useState<StorageLocation[]>([])
  const [parentOpen, setParentOpen] = useState(false)

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: '',
      name: '',
      type: 'warehouse',
      warehouse_id: '',
      store_id: '',
      location_type: '',
      parent_id: '',
      description: '',
      capacity: '',
      is_active: true,
    },
  })

  const watchType = form.watch('type')
  const watchWarehouseId = form.watch('warehouse_id')
  const watchStoreId = form.watch('store_id')

  useEffect(() => {
    setPageTitle('Edit Lokasi Penyimpanan')
    loadInitialData()
  }, [id])

  useEffect(() => {
    loadParentLocations()
  }, [watchType, watchWarehouseId, watchStoreId])

  const loadInitialData = async () => {
    try {
      setLoading(true)
      const [locationRes, warehousesRes, storesRes] = await Promise.all([
        storageLocationsApi.getById(Number(id)),
        warehousesApi.getAll(),
        storesApi.getAll(),
      ])

      const location = locationRes.data.data
      setWarehouses(warehousesRes.data.data || [])
      setStores(storesRes.data.data || [])

      // Set form values
      form.reset({
        code: location.code,
        name: location.name,
        type: location.type as 'warehouse' | 'store',
        warehouse_id: location.warehouse_id?.toString() || '',
        store_id: location.store_id?.toString() || '',
        location_type: location.location_type,
        parent_id: location.parent_id?.toString() || '',
        description: location.description || '',
        capacity: location.capacity?.toString() || '',
        is_active: location.is_active,
      })
    } catch (error) {
      console.error('Failed to load data:', error)
      toast({
        title: 'Error',
        description: 'Gagal memuat data lokasi',
        variant: 'destructive',
      })
      navigate('/storage-locations')
    } finally {
      setLoading(false)
    }
  }

  const loadParentLocations = async () => {
    try {
      if (watchType === 'warehouse' && watchWarehouseId) {
        const res = await storageLocationsApi.getByWarehouse(Number(watchWarehouseId))
        // Filter out current location from parent options
        setParentLocations((res.data.data || []).filter((loc: StorageLocation) => loc.id !== Number(id)))
      } else if (watchType === 'store' && watchStoreId) {
        const res = await storageLocationsApi.getByStore(Number(watchStoreId))
        setParentLocations((res.data.data || []).filter((loc: StorageLocation) => loc.id !== Number(id)))
      } else {
        setParentLocations([])
      }
    } catch (error) {
      console.error('Failed to load parent locations:', error)
    }
  }

  const onSubmit = async (data: FormData) => {
    try {
      setSaving(true)
      
      const payload = {
        code: data.code,
        name: data.name,
        type: data.type,
        warehouse_id: data.type === 'warehouse' && data.warehouse_id ? Number(data.warehouse_id) : undefined,
        store_id: data.type === 'store' && data.store_id ? Number(data.store_id) : undefined,
        location_type: data.location_type,
        parent_id: data.parent_id ? Number(data.parent_id) : undefined,
        description: data.description || '',
        capacity: data.capacity ? Number(data.capacity) : 0,
        is_active: data.is_active,
      }

      await storageLocationsApi.update(Number(id), payload)
      toast({
        title: 'Berhasil',
        description: 'Lokasi penyimpanan berhasil diperbarui',
      })
      navigate(`/storage-locations/${id}`)
    } catch (error: any) {
      console.error('Failed to update storage location:', error)
      toast({
        title: 'Gagal',
        description: error.response?.data?.error || 'Gagal memperbarui lokasi penyimpanan',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const warehouseLocationTypes = [
    { value: 'zone', label: 'Zona' },
    { value: 'aisle', label: 'Lorong' },
    { value: 'shelf', label: 'Rak' },
    { value: 'level', label: 'Level' },
    { value: 'bin', label: 'Bin' },
  ]

  const storeLocationTypes = [
    { value: 'section', label: 'Seksi' },
    { value: 'display_area', label: 'Area Display' },
    { value: 'shelf', label: 'Rak' },
  ]

  const locationTypes = watchType === 'warehouse' ? warehouseLocationTypes : storeLocationTypes

  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-3 p-3 sm:p-4 lg:p-6">
        <Card className="shadow-md">
          <CardContent className="flex items-center justify-center h-32">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2 text-sm">Memuat data...</span>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-3 p-3 sm:p-4 lg:p-6">
      <Card className="max-w-full shadow-md">
        <CardHeader className="border-b bg-muted/50 p-3 sm:p-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate(`/storage-locations/${id}`)} className="h-8 w-8 p-0 shrink-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-0">
              <CardTitle className="text-sm font-semibold truncate">Edit Lokasi Penyimpanan</CardTitle>
              <CardDescription className="text-xs hidden sm:block">Ubah data lokasi penyimpanan</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 lg:p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kode</FormLabel>
                      <FormControl>
                        <Input placeholder="LOC-001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama</FormLabel>
                      <FormControl>
                        <Input placeholder="Rak A1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipe</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih tipe" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="warehouse">Gudang</SelectItem>
                        <SelectItem value="store">Toko</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {watchType === 'warehouse' && (
                <FormField
                  control={form.control}
                  name="warehouse_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gudang</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih gudang" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {warehouses.map((warehouse) => (
                            <SelectItem key={warehouse.id} value={warehouse.id.toString()}>
                              {warehouse.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {watchType === 'store' && (
                <FormField
                  control={form.control}
                  name="store_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Toko</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih toko" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {stores.map((store) => (
                            <SelectItem key={store.id} value={store.id.toString()}>
                              {store.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="location_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jenis Lokasi</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih jenis lokasi" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {locationTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Jenis lokasi dalam hierarki penyimpanan
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="parent_id"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Lokasi Induk (Opsional)</FormLabel>
                    <Popover open={parentOpen} onOpenChange={setParentOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={parentOpen}
                            className={cn(
                              "w-full justify-between font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value
                              ? parentLocations.find((loc) => loc.id.toString() === field.value)?.name || "Pilih lokasi induk..."
                              : "Pilih lokasi induk..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Cari lokasi..." />
                          <CommandList>
                            <CommandEmpty>Lokasi tidak ditemukan</CommandEmpty>
                            <CommandGroup>
                              <CommandItem
                                value="__clear__"
                                onSelect={() => {
                                  field.onChange('')
                                  setParentOpen(false)
                                }}
                              >
                                <X className="mr-2 h-4 w-4" />
                                Hapus pilihan
                              </CommandItem>
                              {parentLocations.map((loc) => (
                                <CommandItem
                                  key={loc.id}
                                  value={loc.name}
                                  onSelect={() => {
                                    field.onChange(loc.id.toString())
                                    setParentOpen(false)
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      field.value === loc.id.toString() ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {loc.name} ({loc.code})
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      Lokasi induk untuk struktur hierarki (misal: Rak di dalam Zona)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deskripsi (Opsional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Deskripsi lokasi..."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="capacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kapasitas (Opsional)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0" {...field} />
                    </FormControl>
                    <FormDescription>
                      Kapasitas maksimum lokasi (dalam unit)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Status Aktif</FormLabel>
                      <FormDescription>
                        Lokasi aktif dapat digunakan untuk penempatan produk
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4 border-t">
                <Button type="button" variant="outline" size="sm" onClick={() => navigate(`/storage-locations/${id}`)} className="text-xs">
                  Batal
                </Button>
                <Button type="submit" disabled={saving} size="sm" className="text-xs">
                  {saving && <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />}
                  <Save className="mr-1 h-3.5 w-3.5" />
                  Simpan
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
