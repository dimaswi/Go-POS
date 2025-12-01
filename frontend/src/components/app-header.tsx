import { useLocation, useNavigate } from 'react-router-dom';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

// Map path segments to readable labels
const pathLabelMap: Record<string, string> = {
  'store-inventory': 'Inventori Toko',
  'stock-transfers': 'Transfer Stok',
  'purchase-orders': 'Purchase Order',
  'create': 'Buat Baru',
  'edit': 'Edit',
  'adjust': 'Adjustment',
  'show': 'Detail',
  'receive': 'Terima',
  'inventory': 'Inventori',
  'products': 'Produk',
  'categories': 'Kategori',
  'warehouses': 'Gudang',
  'stores': 'Toko',
  'suppliers': 'Supplier',
  'customers': 'Pelanggan',
  'users': 'Pengguna',
  'roles': 'Role',
  'permissions': 'Permission',
  'settings': 'Pengaturan',
  'account': 'Akun',
  'pos': 'Point of Sale',
};

// Map paths that should redirect to different routes
const pathRedirectMap: Record<string, string> = {
  '/store-inventory': '/inventory',
};

// Function to format segment to readable label
const formatSegmentLabel = (segment: string): string => {
  // Check if segment is a number (ID)
  if (/^\d+$/.test(segment)) {
    return `#${segment}`;
  }
  // Check predefined labels
  if (pathLabelMap[segment]) {
    return pathLabelMap[segment];
  }
  // Default: capitalize and replace hyphens
  return segment
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export function AppHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Generate breadcrumb from current path
  const pathSegments = location.pathname.split('/').filter(Boolean);
  
  // If on dashboard or root path, just show "Home"
  const isDashboard = pathSegments.length === 0 || (pathSegments.length === 1 && pathSegments[0] === 'dashboard');
  
  const breadcrumbs = isDashboard 
    ? [{ label: 'Home', path: '/dashboard' }]
    : [
        { label: 'Home', path: '/dashboard' },
        ...pathSegments.map((segment, index) => {
          const path = `/${pathSegments.slice(0, index + 1).join('/')}`;
          return {
            label: formatSegmentLabel(segment),
            path: pathRedirectMap[path] || path,
          };
        }),
      ];

  const handleBreadcrumbClick = (e: React.MouseEvent, path: string) => {
    e.preventDefault();
    navigate(path);
  };

  return (
    <header className="rounded-t-xl sticky top-0 z-50 flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-3 sm:px-4">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <SidebarTrigger className="h-7 w-7 shrink-0" />
        <Separator orientation="vertical" className="h-4 hidden sm:block" />
        <Breadcrumb className="min-w-0 flex-1">
          <BreadcrumbList className="flex-wrap sm:flex-nowrap">
            {breadcrumbs.map((crumb, index) => (
              <div key={crumb.path} className={`flex items-center gap-2 ${index > 0 && index < breadcrumbs.length - 1 ? 'hidden sm:flex' : 'flex'}`}>
                {index > 0 && <BreadcrumbSeparator className={index < breadcrumbs.length - 1 ? 'hidden sm:block' : ''} />}
                <BreadcrumbItem className="min-w-0">
                  {index === breadcrumbs.length - 1 ? (
                    <BreadcrumbPage className="text-sm font-medium truncate max-w-[150px] sm:max-w-none">{crumb.label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink 
                      href={crumb.path}
                      onClick={(e) => handleBreadcrumbClick(e, crumb.path)}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {crumb.label}
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </div>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </header>
  );
}
