import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
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
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft, Save, Loader2, Check, ChevronsUpDown, X } from 'lucide-react'
import { 
  storageLocationsApi, 
  warehousesApi, 
  storesApi,
  type Warehouse,
  type Store,
  type StorageLocation,
} from '@/lib/api'
import { setPageTitle } from '@/lib/page-title'
import { cn } from '@/lib/utils'

const formSchema = z.object({
  code: z.string().min(1, 'Kode lokasi wajib diisi').max(50),
  name: z.string().min(1, 'Nama lokasi wajib diisi').max(100),
  type: z.enum(['warehouse', 'store']),
  location_type: z.string().min(1, 'Jenis lokasi wajib diisi'),
  warehouse_id: z.string().optional(),
  store_id: z.string().optional(),
  parent_id: z.string().optional(),
  description: z.string().max(255).optional(),
  capacity: z.number().min(0).optional(),
  sort_order: z.number().min(0).optional(),
}).refine(
  (data) => {
    if (data.type === 'warehouse' && !data.warehouse_id) return false
    if (data.type === 'store' && !data.store_id) return false
    return true
  },
  { message: 'Pilih gudang atau toko sesuai tipe lokasi', path: ['warehouse_id'] }
)

type FormData = z.infer<typeof formSchema>

const warehouseLocationTypes = [
  { value: 'zone', label: 'Zona' },
  { value: 'aisle', label: 'Lorong (Aisle)' },
  { value: 'shelf', label: 'Rak' },
  { value: 'level', label: 'Level/Tingkat' },
  { value: 'bin', label: 'Bin/Container' },
]

const storeLocationTypes = [
  { value: 'section', label: 'Seksi/Area' },
  { value: 'shelf', label: 'Rak' },
  { value: 'display_area', label: 'Area Display' },
]

export default function CreateStorageLocationPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [stores, setStores] = useState<Store[]>([])
  const [parentLocations, setParentLocations] = useState<StorageLocation[]>([])
  const [saving, setSaving] = useState(false)
  const [parentOpen, setParentOpen] = useState(false)

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: '',
      name: '',
      type: 'warehouse',
      location_type: '',
      warehouse_id: '',
      store_id: '',
      parent_id: '',
      description: '',
      capacity: 0,
      sort_order: 0,
    },
  })

  const selectedType = form.watch('type')
  const selectedWarehouseId = form.watch('warehouse_id')
  const selectedStoreId = form.watch('store_id')

  useEffect(() => {
    setPageTitle('Tambah Lokasi Penyimpanan')
    loadData()
  }, [])

  useEffect(() => {
    // Reset dependent fields when type changes
    form.setValue('location_type', '')
    form.setValue('warehouse_id', '')
    form.setValue('store_id', '')
    form.setValue('parent_id', '')
    setParentLocations([])
  }, [selectedType])

  useEffect(() => {
    // Load parent locations when warehouse/store changes
    loadParentLocations()
  }, [selectedWarehouseId, selectedStoreId])

  const loadData = async () => {
    try {
      const [warehousesRes, storesRes] = await Promise.all([
        warehousesApi.getAll(),
        storesApi.getAll(),
      ])
      setWarehouses(warehousesRes.data.data || warehousesRes.data)
      setStores(storesRes.data.data || storesRes.data)
    } catch (error) {
      console.error('Failed to load data:', error)
    }
  }

  const loadParentLocations = async () => {
    try {
      const params: any = { limit: 100, is_active: 'true' }
      if (selectedType === 'warehouse' && selectedWarehouseId) {
        params.type = 'warehouse'
        params.warehouse_id = selectedWarehouseId
      } else if (selectedType === 'store' && selectedStoreId) {
        params.type = 'store'
        params.store_id = selectedStoreId
      } else {
        setParentLocations([])
        return
      }
      
      const response = await storageLocationsApi.getAll(params)
      setParentLocations(response.data.data || [])
    } catch (error) {
      console.error('Failed to load parent locations:', error)
    }
  }

  const onSubmit = async (data: FormData) => {
    setSaving(true)
    try {
      const payload: any = {
        code: data.code,
        name: data.name,
        type: data.type,
        location_type: data.location_type,
        description: data.description || '',
        capacity: data.capacity || 0,
        sort_order: data.sort_order || 0,
      }

      if (data.type === 'warehouse') {
        payload.warehouse_id = parseInt(data.warehouse_id!)
      } else {
        payload.store_id = parseInt(data.store_id!)
      }

      if (data.parent_id) {
        payload.parent_id = parseInt(data.parent_id)
      }

      await storageLocationsApi.create(payload)
      toast({ title: 'Berhasil', description: 'Lokasi penyimpanan berhasil ditambahkan' })
      navigate('/storage-locations')
    } catch (error: any) {
      toast({ 
        title: 'Error', 
        description: error.response?.data?.error || 'Gagal menambahkan lokasi', 
        variant: 'destructive' 
      })
    } finally {
      setSaving(false)
    }
  }

  const locationTypes = selectedType === 'warehouse' ? warehouseLocationTypes : storeLocationTypes

  return (
    <div className="flex flex-1 flex-col gap-3 p-3 sm:p-4 lg:p-6">
      <Card className="shadow-md max-w-full">
        <CardHeader className="border-b bg-muted/50 p-3 sm:p-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate('/storage-locations')} className="h-8 w-8 p-0 shrink-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-0">
              <CardTitle className="text-sm font-semibold truncate">Tambah Lokasi Penyimpanan</CardTitle>
              <CardDescription className="text-xs hidden sm:block">Buat lokasi baru untuk menyimpan produk</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 lg:p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kode Lokasi *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Contoh: WH-A1-01" />
                      </FormControl>
                      <FormDescription>Kode unik untuk lokasi ini</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama Lokasi *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Contoh: Rak A Tingkat 1" />
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
                    <FormLabel>Tipe *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih tipe lokasi" />
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

              {selectedType === 'warehouse' ? (
                <FormField
                  control={form.control}
                  name="warehouse_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gudang *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih gudang" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {warehouses.map((wh) => (
                            <SelectItem key={wh.id} value={wh.id.toString()}>
                              {wh.name} ({wh.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <FormField
                  control={form.control}
                  name="store_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Toko *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih toko" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {stores.map((st) => (
                            <SelectItem key={st.id} value={st.id.toString()}>
                              {st.name} ({st.code})
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
                    <FormLabel>Jenis Lokasi *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih jenis lokasi" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {locationTypes.map((lt) => (
                          <SelectItem key={lt.value} value={lt.value}>
                            {lt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {parentLocations.length > 0 && (
                <FormField
                  control={form.control}
                  name="parent_id"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Lokasi Induk</FormLabel>
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
                      <FormDescription>Pilih jika lokasi ini berada di dalam lokasi lain</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deskripsi</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Deskripsi lokasi (opsional)" rows={2} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="capacity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kapasitas</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field} 
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          placeholder="0" 
                        />
                      </FormControl>
                      <FormDescription>Kapasitas maksimum (opsional)</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sort_order"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Urutan</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field} 
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          placeholder="0" 
                        />
                      </FormControl>
                      <FormDescription>Urutan tampil</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4 border-t">
                <Button type="button" variant="outline" size="sm" onClick={() => navigate('/storage-locations')} className="text-xs">
                  Batal
                </Button>
                <Button type="submit" disabled={saving} size="sm" className="text-xs">
                  {saving ? (
                    <>
                      <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save className="mr-1 h-3.5 w-3.5" />
                      Simpan
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
