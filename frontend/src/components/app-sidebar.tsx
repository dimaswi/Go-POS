import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Shield, 
  LogOut,
  ChevronUp,
  ChevronRight,
  Lock,
  Building2,
  Settings,
  Store,
  Package,
  Warehouse,
  Layers3,
  Package2,
  ShoppingCart,
  ArrowRightLeft,
  Truck,
  UserCircle,
  MonitorSmartphone,
  MapPin,
  Receipt,
  Percent,
  BarChart3,
} from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { usePermission } from '@/hooks/usePermission';
import { getAppName, getAppSubtitle } from '@/lib/page-title';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

const menuItems = [
  // Dashboard - Main
  { 
    path: '/dashboard', 
    label: 'Beranda', 
    icon: LayoutDashboard, 
    permission: 'dashboard.view' 
  },
  
  // Point of Sale
  { 
    path: '/pos', 
    label: 'Kasir', 
    icon: MonitorSmartphone,
    permission: 'pos.view',
  },

  // Sales
  { 
    path: '/sales', 
    label: 'Penjualan', 
    icon: Receipt,
    permission: 'sales.view',
  },

  // Discounts
  { 
    path: '/discounts', 
    label: 'Diskon', 
    icon: Percent,
    permission: 'discounts.view',
  },

  // Master Data
  { 
    path: '/products', 
    label: 'Data Master', 
    icon: Package,
    permission: 'products.view',
    submenu: [
      { path: '/products', label: 'Produk', icon: Package, permission: 'products.view' },
      { path: '/categories', label: 'Kategori', icon: Layers3, permission: 'categories.view' },
      { path: '/suppliers', label: 'Pemasok', icon: Truck, permission: 'suppliers.view' },
      { path: '/customers', label: 'Pelanggan', icon: UserCircle, permission: 'customers.view' },
    ]
  },

  // Inventory & Stock
  { 
    path: '/inventory', 
    label: 'Inventori & Stok', 
    icon: Package2,
    permission: 'inventory.view',
    submenu: [
      { path: '/inventory', label: 'Ringkasan Stok', icon: Package2, permission: 'inventory.view' },
      { path: '/storage-locations', label: 'Lokasi Penyimpanan', icon: MapPin, permission: 'storage_locations.view' },
      { path: '/purchase-orders', label: 'Pesanan Pembelian', icon: ShoppingCart, permission: 'purchase_orders.view' },
      { path: '/stock-transfers', label: 'Transfer Stok', icon: ArrowRightLeft, permission: 'stock_transfers.view' },
    ]
  },

  // Location Management (Stores & Warehouses)
  { 
    path: '/stores', 
    label: 'Lokasi', 
    icon: Store,
    permission: 'stores.view',
    submenu: [
      { path: '/stores', label: 'Toko', icon: Store, permission: 'stores.view' },
      { path: '/warehouses', label: 'Gudang', icon: Warehouse, permission: 'warehouses.view' },
    ]
  },

  // User & Access Management
  { 
    path: '/users', 
    label: 'Pengguna & Akses', 
    icon: Users,
    permission: 'users.view',
    submenu: [
      { path: '/users', label: 'Pengguna', icon: Users, permission: 'users.view' },
      { path: '/roles', label: 'Peran', icon: Shield, permission: 'roles.view' },
      { path: '/permissions', label: 'Hak Akses', icon: Lock, permission: 'permissions.view' },
    ]
  },

  // Reports
  { 
    path: '/reports', 
    label: 'Laporan', 
    icon: BarChart3,
    permission: 'reports.view',
    submenu: [
      { path: '/reports/sales', label: 'Laporan Penjualan', icon: Receipt, permission: 'reports.sales' },
      { path: '/reports/inventory', label: 'Laporan Inventori', icon: Package, permission: 'reports.inventory' },
      { path: '/reports/users', label: 'Penjualan Per Kasir', icon: Users, permission: 'reports.users' },
    ]
  },
];

export function AppSidebar() {
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { hasPermission } = usePermission();
  const [appName, setAppName] = useState(getAppName());
  const [appSubtitle, setAppSubtitle] = useState(getAppSubtitle());

  // Listen for storage changes to update app name/subtitle in real-time
  useEffect(() => {
    const handleStorageChange = () => {
      setAppName(getAppName());
      setAppSubtitle(getAppSubtitle());
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  // Filter menu items based on permissions
  const visibleMenuItems = menuItems.filter(item => {
    if (!item.permission) return true;
    return hasPermission(item.permission);
  }).map(item => {
    if ('submenu' in item && item.submenu) {
      return {
        ...item,
        submenu: item.submenu.filter((sub: any) => {
          if (!sub.permission) return true;
          return hasPermission(sub.permission);
        })
      };
    }
    return item;
  });

  return (
    <Sidebar collapsible="icon" className="border-r-0" variant="inset">
      <SidebarHeader className="">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild className="data-[state=open]:bg-transparent">
              <a href="/" className="font-semibold">
                <div className="flex aspect-square size-7 items-center justify-center rounded bg-foreground text-background">
                  <Building2 className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold text-sm">{appName}</span>
                  <span className="text-xs text-muted-foreground">{appSubtitle}</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs text-muted-foreground font-medium">Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleMenuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path || 
                  ('submenu' in item && item.submenu && item.submenu.some((sub: any) => location.pathname === sub.path));
                
                // Menu with submenu
                if ('submenu' in item && item.submenu) {
                  // Always use collapsible for submenu (works on both mobile and desktop)
                  return (
                    <Collapsible key={item.path} asChild defaultOpen={isActive}>
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton isActive={isActive}>
                            <Icon className="h-4 w-4" />
                            <span>{item.label}</span>
                            <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {item.submenu.map((subItem: any) => {
                              const SubIcon = subItem.icon;
                              const isSubActive = location.pathname === subItem.path;
                              
                              return (
                                <SidebarMenuSubItem key={subItem.path}>
                                  <SidebarMenuSubButton asChild isActive={isSubActive}>
                                    <Link to={subItem.path}>
                                      <SubIcon className="h-4 w-4" />
                                      <span>{subItem.label}</span>
                                    </Link>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              );
                            })}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  );
                }
                
                // Simple menu item
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link to={item.path}>
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                    {user?.full_name?.charAt(0) || 'U'}
                  </div>
                  <div className="flex flex-col gap-0.5 leading-none">
                    <span className="font-medium">{user?.full_name}</span>
                    <span className="text-xs text-muted-foreground">{user?.email}</span>
                  </div>
                  <ChevronUp className="ml-auto" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" className="w-[--radix-popper-anchor-width]">
                <DropdownMenuItem asChild>
                  <Link to="/account">
                    <Shield className="mr-2 h-4 w-4" />
                    <span>Akun</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Pengaturan</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Keluar</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
