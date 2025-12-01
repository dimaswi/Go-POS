import type { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Eye, Pencil, Trash2, Warehouse, Store } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { StorageLocation } from '@/lib/api'

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

export const createStorageLocationColumns = (
  onDelete: (id: number) => void
): ColumnDef<StorageLocation>[] => [
  {
    accessorKey: 'code',
    header: 'Kode',
    cell: ({ row }) => (
      <span className="font-mono font-medium">{row.getValue('code')}</span>
    ),
  },
  {
    accessorKey: 'name',
    header: 'Nama Lokasi',
    cell: ({ row }) => {
      const location = row.original
      return (
        <div className="flex items-center gap-2">
          {location.type === 'warehouse' ? (
            <Warehouse className="h-4 w-4 text-muted-foreground" />
          ) : (
            <Store className="h-4 w-4 text-muted-foreground" />
          )}
          <div>
            <p className="font-medium">{location.name}</p>
            <p className="text-sm text-muted-foreground">
              {location.warehouse?.name || location.store?.name}
            </p>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: 'type',
    header: 'Tipe',
    cell: ({ row }) => {
      const type = row.getValue('type') as string
      return (
        <Badge variant={type === 'warehouse' ? 'default' : 'secondary'}>
          {type === 'warehouse' ? 'Gudang' : 'Toko'}
        </Badge>
      )
    },
    filterFn: (row, id, value) => {
      if (value === 'all') return true
      return row.getValue(id) === value
    },
  },
  {
    accessorKey: 'location_type',
    header: 'Jenis Lokasi',
    cell: ({ row }) => getLocationTypeLabel(row.getValue('location_type')),
  },
  {
    accessorKey: 'parent',
    header: 'Lokasi Induk',
    cell: ({ row }) => {
      const parent = row.original.parent
      return parent ? (
        <span>{parent.name} ({parent.code})</span>
      ) : (
        <span className="text-muted-foreground">-</span>
      )
    },
  },
  {
    accessorKey: 'capacity',
    header: 'Kapasitas',
    cell: ({ row }) => {
      const capacity = row.original.capacity
      return capacity ? capacity.toString() : '-'
    },
  },
  {
    accessorKey: 'is_active',
    header: 'Status',
    cell: ({ row }) => {
      const isActive = row.getValue('is_active') as boolean
      return (
        <Badge variant={isActive ? 'default' : 'outline'}>
          {isActive ? 'Aktif' : 'Nonaktif'}
        </Badge>
      )
    },
  },
  {
    id: 'actions',
    header: () => <div className="text-center">Aksi</div>,
    cell: ({ row }) => {
      const location = row.original
      return (
        <div className="text-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link to={`/storage-locations/${location.id}`}>
                  <Eye className="mr-2 h-4 w-4" />
                  Lihat Detail
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to={`/storage-locations/${location.id}/edit`}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => onDelete(location.id)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Hapus
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )
    },
  },
]
