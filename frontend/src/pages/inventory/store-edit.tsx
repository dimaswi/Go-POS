import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
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
import { ArrowLeft, Save, Package, Store, Loader2, Check, ChevronsUpDown, X } from 'lucide-react'
import { inventoryApi, storageLocationsApi, type StorageLocation } from '@/lib/api'
import { setPageTitle } from '@/lib/page-title'
import { cn } from '@/lib/utils'

interface StoreInventory {
  id: number
  product_id: number
  product?: {
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
  shelf_location?: string
  section?: string
  display_area?: string
  last_updated: string
}

const formSchema = z.object({
  shelf_location: z.string().max(50, 'Maksimal 50 karakter').optional(),
  section: z.string().max(50, 'Maksimal 50 karakter').optional(),
  display_area: z.string().max(50, 'Maksimal 50 karakter').optional(),
  min_stock: z.number().min(0, 'Tidak boleh negatif').optional(),
  max_stock: z.number().min(0, 'Tidak boleh negatif').optional(),
})

type FormData = z.infer<typeof formSchema>

export default function StoreInventoryEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  
  const [inventory, setInventory] = useState<StoreInventory | null>(null)
  const [storageLocations, setStorageLocations] = useState<StorageLocation[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Popover states
  const [sectionOpen, setSectionOpen] = useState(false)
  const [shelfOpen, setShelfOpen] = useState(false)
  const [displayOpen, setDisplayOpen] = useState(false)

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      shelf_location: '',
      section: '',
      display_area: '',
      min_stock: 0,
      max_stock: 0,
    },
  })

  useEffect(() => {
    setPageTitle('Edit Lokasi Inventory Toko')
    fetchData()
  }, [id])

  const fetchData = async () => {
    try {
      setLoading(true)
      const response = await inventoryApi.getStoreInventoryById(Number(id))
      const data = response.data.data
      setInventory(data)
      
      // Load storage locations for this store
      if (data.store_id) {
        try {
          const locationsRes = await storageLocationsApi.getByStore(data.store_id)
          setStorageLocations(locationsRes.data.data || [])
        } catch {
          console.log('No storage locations found for store')
          setStorageLocations([])
        }
      }
      
      // Set form values
      form.reset({
        shelf_location: data.shelf_location || '',
        section: data.section || '',
        display_area: data.display_area || '',
        min_stock: data.min_stock || 0,
        max_stock: data.max_stock || 0,
      })
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

  // Filter locations by type
  const getLocationsByType = (locationType: string) => {
    return storageLocations.filter(loc => loc.location_type === locationType && loc.is_active)
  }

  const sections = getLocationsByType('section')
  const shelves = getLocationsByType('shelf')
  const displayAreas = getLocationsByType('display_area')

  const onSubmit = async (data: FormData) => {
    // Validate min/max stock
    if (data.min_stock && data.max_stock && data.min_stock > data.max_stock) {
      toast({
        title: 'Error',
        description: 'Stok minimum tidak boleh lebih besar dari stok maksimum',
        variant: 'destructive',
      })
      return
    }

    setSaving(true)
    try {
      await inventoryApi.updateStoreInventory(Number(id), data)
      toast({
        title: 'Berhasil',
        description: 'Lokasi inventory toko berhasil diperbarui',
      })
      navigate(`/store-inventory/${id}`)
    } catch (error) {
      console.error('Error updating store inventory:', error)
      toast({
        title: 'Error',
        description: 'Gagal memperbarui lokasi inventory toko',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-muted-foreground">Memuat data...</p>
      </div>
    )
  }

  if (!inventory) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 lg:p-6">
        <div className="text-center">
          <p className="text-muted-foreground">Inventory toko tidak ditemukan</p>
          <Button variant="outline" className="mt-4" asChild>
            <Link to="/inventory">Kembali ke Inventory</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 lg:p-6">
      <Card className="shadow-md">
        <CardHeader className="border-b bg-muted/50">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate(`/store-inventory/${id}`)} className="h-8 w-8 p-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <CardTitle className="text-base font-semibold">Edit Lokasi Inventory Toko</CardTitle>
              <CardDescription>Perbarui informasi lokasi dan stok produk di toko</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 lg:p-6">
          {/* Product Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-start gap-3">
              <Package className="h-5 w-5 mt-0.5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Produk</p>
                <p className="font-medium">{inventory.product?.name}</p>
                <p className="text-sm text-muted-foreground font-mono">{inventory.product?.sku}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Store className="h-5 w-5 mt-0.5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Toko</p>
                <p className="font-medium">{inventory.store?.name}</p>
                <p className="text-sm text-muted-foreground">{inventory.store?.address}</p>
              </div>
            </div>
          </div>

          {storageLocations.length === 0 && (
            <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                Belum ada lokasi penyimpanan untuk toko ini. 
                <Link to="/storage-locations/create" className="underline ml-1 font-medium">
                  Tambahkan lokasi penyimpanan
                </Link>
              </p>
            </div>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Location Fields */}
              <div>
                <h3 className="text-sm font-medium mb-4">Informasi Lokasi</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    control={form.control}
                    name="section"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Seksi/Area</FormLabel>
                        <Popover open={sectionOpen} onOpenChange={setSectionOpen}>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={sectionOpen}
                                className={cn(
                                  "w-full justify-between font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value
                                  ? sections.find((loc) => loc.name === field.value)?.name || field.value
                                  : "Pilih seksi..."}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                            <Command>
                              <CommandInput placeholder="Cari seksi..." />
                              <CommandList>
                                <CommandEmpty>Seksi tidak ditemukan</CommandEmpty>
                                <CommandGroup>
                                  <CommandItem
                                    value="__clear__"
                                    onSelect={() => {
                                      field.onChange('')
                                      setSectionOpen(false)
                                    }}
                                  >
                                    <X className="mr-2 h-4 w-4" />
                                    Hapus pilihan
                                  </CommandItem>
                                  {sections.map((loc) => (
                                    <CommandItem
                                      key={loc.id}
                                      value={loc.name}
                                      onSelect={() => {
                                        field.onChange(loc.name)
                                        setSectionOpen(false)
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          field.value === loc.name ? "opacity-100" : "opacity-0"
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
                          Area atau seksi di toko
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="shelf_location"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Lokasi Rak</FormLabel>
                        <Popover open={shelfOpen} onOpenChange={setShelfOpen}>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={shelfOpen}
                                className={cn(
                                  "w-full justify-between font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value
                                  ? shelves.find((loc) => loc.name === field.value)?.name || field.value
                                  : "Pilih rak..."}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                            <Command>
                              <CommandInput placeholder="Cari rak..." />
                              <CommandList>
                                <CommandEmpty>Rak tidak ditemukan</CommandEmpty>
                                <CommandGroup>
                                  <CommandItem
                                    value="__clear__"
                                    onSelect={() => {
                                      field.onChange('')
                                      setShelfOpen(false)
                                    }}
                                  >
                                    <X className="mr-2 h-4 w-4" />
                                    Hapus pilihan
                                  </CommandItem>
                                  {shelves.map((loc) => (
                                    <CommandItem
                                      key={loc.id}
                                      value={loc.name}
                                      onSelect={() => {
                                        field.onChange(loc.name)
                                        setShelfOpen(false)
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          field.value === loc.name ? "opacity-100" : "opacity-0"
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
                          Identifikasi rak di toko
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="display_area"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Area Display</FormLabel>
                        <Popover open={displayOpen} onOpenChange={setDisplayOpen}>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={displayOpen}
                                className={cn(
                                  "w-full justify-between font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value
                                  ? displayAreas.find((loc) => loc.name === field.value)?.name || field.value
                                  : "Pilih area display..."}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                            <Command>
                              <CommandInput placeholder="Cari area display..." />
                              <CommandList>
                                <CommandEmpty>Area display tidak ditemukan</CommandEmpty>
                                <CommandGroup>
                                  <CommandItem
                                    value="__clear__"
                                    onSelect={() => {
                                      field.onChange('')
                                      setDisplayOpen(false)
                                    }}
                                  >
                                    <X className="mr-2 h-4 w-4" />
                                    Hapus pilihan
                                  </CommandItem>
                                  {displayAreas.map((loc) => (
                                    <CommandItem
                                      key={loc.id}
                                      value={loc.name}
                                      onSelect={() => {
                                        field.onChange(loc.name)
                                        setDisplayOpen(false)
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          field.value === loc.name ? "opacity-100" : "opacity-0"
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
                          Area display khusus jika ada
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Stock Threshold Fields */}
              <div>
                <h3 className="text-sm font-medium mb-4">Pengaturan Stok</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
                  <FormField
                    control={form.control}
                    name="min_stock"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stok Minimum</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field} 
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            placeholder="0" 
                          />
                        </FormControl>
                        <FormDescription>
                          Peringatan akan muncul jika stok di bawah nilai ini
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="max_stock"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stok Maksimum</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field} 
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            placeholder="0" 
                          />
                        </FormControl>
                        <FormDescription>
                          Kapasitas maksimum stok di toko
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Location Preview */}
              <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                  Preview Lokasi Lengkap:
                </p>
                <p className="text-blue-900 dark:text-blue-100 font-mono">
                  {[
                    form.watch('section') && `Seksi ${form.watch('section')}`,
                    form.watch('shelf_location') && `Rak ${form.watch('shelf_location')}`,
                    form.watch('display_area') && `Display ${form.watch('display_area')}`,
                  ].filter(Boolean).join(' → ') || 'Belum ada lokasi yang dipilih'}
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => navigate(`/store-inventory/${id}`)}>
                  Batal
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Simpan Perubahan
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
