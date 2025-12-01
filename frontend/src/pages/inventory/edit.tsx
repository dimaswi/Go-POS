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
import { ArrowLeft, Save, Package, MapPin, Loader2, Check, ChevronsUpDown, X } from 'lucide-react'
import { inventoryApi, storageLocationsApi, type StorageLocation } from '@/lib/api'
import { setPageTitle } from '@/lib/page-title'
import { cn } from '@/lib/utils'

interface Inventory {
  id: number
  product_id: number
  product?: {
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
}

const formSchema = z.object({
  shelf_location: z.string().max(50, 'Maksimal 50 karakter').optional(),
  bin_location: z.string().max(50, 'Maksimal 50 karakter').optional(),
  zone: z.string().max(50, 'Maksimal 50 karakter').optional(),
  aisle: z.string().max(50, 'Maksimal 50 karakter').optional(),
  level: z.string().max(20, 'Maksimal 20 karakter').optional(),
})

type FormData = z.infer<typeof formSchema>

export default function InventoryEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  
  const [inventory, setInventory] = useState<Inventory | null>(null)
  const [storageLocations, setStorageLocations] = useState<StorageLocation[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Popover states
  const [zoneOpen, setZoneOpen] = useState(false)
  const [aisleOpen, setAisleOpen] = useState(false)
  const [shelfOpen, setShelfOpen] = useState(false)
  const [levelOpen, setLevelOpen] = useState(false)
  const [binOpen, setBinOpen] = useState(false)

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      shelf_location: '',
      bin_location: '',
      zone: '',
      aisle: '',
      level: '',
    },
  })

  useEffect(() => {
    setPageTitle('Edit Lokasi Inventory')
    fetchData()
  }, [id])

  const fetchData = async () => {
    try {
      setLoading(true)
      const response = await inventoryApi.getWarehouseInventoryById(Number(id))
      const data = response.data.data
      setInventory(data)
      
      // Load storage locations for this warehouse
      if (data.warehouse_id) {
        try {
          const locationsRes = await storageLocationsApi.getByWarehouse(data.warehouse_id)
          setStorageLocations(locationsRes.data.data || [])
        } catch {
          console.log('No storage locations found for warehouse')
          setStorageLocations([])
        }
      }
      
      // Set form values
      form.reset({
        shelf_location: data.shelf_location || '',
        bin_location: data.bin_location || '',
        zone: data.zone || '',
        aisle: data.aisle || '',
        level: data.level || '',
      })
    } catch (error) {
      console.error('Error fetching inventory:', error)
      toast({
        title: 'Error',
        description: 'Gagal memuat data inventory',
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

  const zones = getLocationsByType('zone')
  const aisles = getLocationsByType('aisle')
  const shelves = getLocationsByType('shelf')
  const levels = getLocationsByType('level')
  const bins = getLocationsByType('bin')

  const onSubmit = async (data: FormData) => {
    setSaving(true)
    try {
      await inventoryApi.updateWarehouseInventory(Number(id), data)
      toast({
        title: 'Berhasil',
        description: 'Lokasi inventory berhasil diperbarui',
      })
      navigate(`/inventory/${id}`)
    } catch (error) {
      console.error('Error updating inventory:', error)
      toast({
        title: 'Error',
        description: 'Gagal memperbarui lokasi inventory',
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
          <p className="text-muted-foreground">Inventory tidak ditemukan</p>
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
            <Button variant="ghost" size="sm" onClick={() => navigate(`/inventory/${id}`)} className="h-8 w-8 p-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <CardTitle className="text-base font-semibold">Edit Lokasi Inventory</CardTitle>
              <CardDescription>Perbarui informasi lokasi penyimpanan produk di gudang</CardDescription>
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
              <MapPin className="h-5 w-5 mt-0.5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Gudang</p>
                <p className="font-medium">{inventory.warehouse?.name}</p>
                <p className="text-sm text-muted-foreground">{inventory.warehouse?.location}</p>
              </div>
            </div>
          </div>

          {storageLocations.length === 0 && (
            <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                Belum ada lokasi penyimpanan untuk gudang ini. 
                <Link to="/storage-locations/create" className="underline ml-1 font-medium">
                  Tambahkan lokasi penyimpanan
                </Link>
              </p>
            </div>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
                <FormField
                  control={form.control}
                  name="zone"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Zona</FormLabel>
                      <Popover open={zoneOpen} onOpenChange={setZoneOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={zoneOpen}
                              className={cn(
                                "w-full justify-between font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value
                                ? zones.find((loc) => loc.name === field.value)?.name || field.value
                                : "Pilih zona..."}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                          <Command>
                            <CommandInput placeholder="Cari zona..." />
                            <CommandList>
                              <CommandEmpty>Zona tidak ditemukan</CommandEmpty>
                              <CommandGroup>
                                <CommandItem
                                  value="__clear__"
                                  onSelect={() => {
                                    field.onChange('')
                                    setZoneOpen(false)
                                  }}
                                >
                                  <X className="mr-2 h-4 w-4" />
                                  Hapus pilihan
                                </CommandItem>
                                {zones.map((loc) => (
                                  <CommandItem
                                    key={loc.id}
                                    value={loc.name}
                                    onSelect={() => {
                                      field.onChange(loc.name)
                                      setZoneOpen(false)
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
                        Area atau zona penyimpanan di gudang
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="aisle"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Lorong (Aisle)</FormLabel>
                      <Popover open={aisleOpen} onOpenChange={setAisleOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={aisleOpen}
                              className={cn(
                                "w-full justify-between font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value
                                ? aisles.find((loc) => loc.name === field.value)?.name || field.value
                                : "Pilih lorong..."}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                          <Command>
                            <CommandInput placeholder="Cari lorong..." />
                            <CommandList>
                              <CommandEmpty>Lorong tidak ditemukan</CommandEmpty>
                              <CommandGroup>
                                <CommandItem
                                  value="__clear__"
                                  onSelect={() => {
                                    field.onChange('')
                                    setAisleOpen(false)
                                  }}
                                >
                                  <X className="mr-2 h-4 w-4" />
                                  Hapus pilihan
                                </CommandItem>
                                {aisles.map((loc) => (
                                  <CommandItem
                                    key={loc.id}
                                    value={loc.name}
                                    onSelect={() => {
                                      field.onChange(loc.name)
                                      setAisleOpen(false)
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
                        Nomor atau kode lorong
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
                        Identifikasi rak penyimpanan
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="level"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Level/Tingkat</FormLabel>
                      <Popover open={levelOpen} onOpenChange={setLevelOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={levelOpen}
                              className={cn(
                                "w-full justify-between font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value
                                ? levels.find((loc) => loc.name === field.value)?.name || field.value
                                : "Pilih level..."}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                          <Command>
                            <CommandInput placeholder="Cari level..." />
                            <CommandList>
                              <CommandEmpty>Level tidak ditemukan</CommandEmpty>
                              <CommandGroup>
                                <CommandItem
                                  value="__clear__"
                                  onSelect={() => {
                                    field.onChange('')
                                    setLevelOpen(false)
                                  }}
                                >
                                  <X className="mr-2 h-4 w-4" />
                                  Hapus pilihan
                                </CommandItem>
                                {levels.map((loc) => (
                                  <CommandItem
                                    key={loc.id}
                                    value={loc.name}
                                    onSelect={() => {
                                      field.onChange(loc.name)
                                      setLevelOpen(false)
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
                        Tingkat atau level pada rak
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bin_location"
                  render={({ field }) => (
                    <FormItem className="flex flex-col md:col-span-2">
                      <FormLabel>Lokasi Bin</FormLabel>
                      <Popover open={binOpen} onOpenChange={setBinOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={binOpen}
                              className={cn(
                                "w-full justify-between font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value
                                ? bins.find((loc) => loc.name === field.value)?.name || field.value
                                : "Pilih bin..."}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                          <Command>
                            <CommandInput placeholder="Cari bin..." />
                            <CommandList>
                              <CommandEmpty>Bin tidak ditemukan</CommandEmpty>
                              <CommandGroup>
                                <CommandItem
                                  value="__clear__"
                                  onSelect={() => {
                                    field.onChange('')
                                    setBinOpen(false)
                                  }}
                                >
                                  <X className="mr-2 h-4 w-4" />
                                  Hapus pilihan
                                </CommandItem>
                                {bins.map((loc) => (
                                  <CommandItem
                                    key={loc.id}
                                    value={loc.name}
                                    onSelect={() => {
                                      field.onChange(loc.name)
                                      setBinOpen(false)
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
                        Lokasi bin atau container spesifik untuk produk ini
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Location Preview */}
              <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                  Preview Lokasi Lengkap:
                </p>
                <p className="text-blue-900 dark:text-blue-100 font-mono">
                  {[
                    form.watch('zone') && `Zona ${form.watch('zone')}`,
                    form.watch('aisle') && `Lorong ${form.watch('aisle')}`,
                    form.watch('shelf_location') && `Rak ${form.watch('shelf_location')}`,
                    form.watch('level') && `Level ${form.watch('level')}`,
                    form.watch('bin_location') && `Bin ${form.watch('bin_location')}`,
                  ].filter(Boolean).join(' → ') || 'Belum ada lokasi yang dipilih'}
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => navigate(`/inventory/${id}`)}>
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
