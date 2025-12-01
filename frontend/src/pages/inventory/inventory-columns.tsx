import type { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Edit, Package } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Inventory } from '@/lib/api'

export const inventoryColumns: ColumnDef<Inventory>[] = [
  {
    accessorKey: 'product',
    header: 'Produk',
    cell: ({ row }) => {
      const product = row.original.product
      const variant = row.original.product_variant
      return (
        <div className="flex flex-col">
          <div className="font-medium">{product?.name}</div>
          {variant && (
            <div className="text-sm text-muted-foreground">{variant.name}</div>
          )}
          <div className="text-xs text-muted-foreground">
            SKU: {variant?.sku || product?.sku}
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: 'warehouse',
    header: 'Gudang',
    cell: ({ row }) => {
      const warehouse = row.original.warehouse
      return (
        <div className="flex flex-col">
          <div className="font-medium">{warehouse?.name}</div>
          <div className="text-sm text-muted-foreground">{warehouse?.code}</div>
        </div>
      )
    },
  },
  {
    accessorKey: 'quantity',
    header: 'Stok Tersedia',
    cell: ({ row }) => {
      const quantity = row.getValue('quantity') as number
      const reserved = row.original.reserved_quantity
      const available = quantity - reserved
      
      let badgeVariant: 'default' | 'secondary' | 'destructive' | 'outline' = 'default'
      if (available <= 0) {
        badgeVariant = 'destructive'
      } else if (available <= 10) {
        badgeVariant = 'secondary'
      }
      
      return (
        <div className="flex flex-col gap-1">
          <Badge variant={badgeVariant}>
            {available.toFixed(2)}
          </Badge>
          <div className="text-xs text-muted-foreground">
            Total: {quantity.toFixed(2)}
          </div>
          {reserved > 0 && (
            <div className="text-xs text-orange-600">
              Reservasi: {reserved.toFixed(2)}
            </div>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: 'min_stock',
    header: 'Min Stok',
    cell: ({ row }) => {
      const minStock = row.original.product?.min_stock;
      return (
        <div className="text-center">
          {minStock || '-'}
        </div>
      )
    },
  },
  {
    accessorKey: 'last_updated',
    header: 'Terakhir Update',
    cell: ({ row }) => {
      const date = new Date(row.getValue('last_updated'))
      return (
        <div className="text-sm">
          {date.toLocaleDateString('id-ID')}
          <div className="text-xs text-muted-foreground">
            {date.toLocaleTimeString('id-ID')}
          </div>
        </div>
      )
    },
  },
  {
    id: 'actions',
    header: 'Aksi',
    cell: ({ row }) => {
      const inventory = row.original
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Buka menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link to={`/inventory/${inventory.id}`}>
                <Package className="mr-2 h-4 w-4" />
                Detail
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to={`/inventory/${inventory.id}/adjust`}>
                <Edit className="mr-2 h-4 w-4" />
                Adjustment
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
