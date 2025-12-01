import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './lib/store';
import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute as PermissionGuard } from './components/ProtectedRoute';
import { Toaster } from '@/components/ui/toaster';
import { AIChatBubble } from '@/components/AIChatBubble';
import { Loader2 } from 'lucide-react';

// Lazy load pages
const LoginPage = lazy(() => import('./pages/LoginPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const AccountPage = lazy(() => import('./pages/account/index'));
const SettingsPage = lazy(() => import('./pages/settings/index'));

// Users
const UsersIndex = lazy(() => import('./pages/users/index'));
const UsersCreate = lazy(() => import('./pages/users/create'));
const UsersEdit = lazy(() => import('./pages/users/edit'));
const UsersShow = lazy(() => import('./pages/users/show'));

// Roles
const RolesIndex = lazy(() => import('./pages/roles/index'));
const RolesCreate = lazy(() => import('./pages/roles/create'));
const RolesEdit = lazy(() => import('./pages/roles/edit'));
const RolesShow = lazy(() => import('./pages/roles/show'));

// Permissions
const PermissionsIndex = lazy(() => import('./pages/permissions/index'));
const PermissionsCreate = lazy(() => import('./pages/permissions/create'));
const PermissionsEdit = lazy(() => import('./pages/permissions/edit'));
const PermissionsShow = lazy(() => import('./pages/permissions/show'));

// Stores
const StoresIndex = lazy(() => import('./pages/stores/index'));
const StoresCreate = lazy(() => import('./pages/stores/create'));
const StoresEdit = lazy(() => import('./pages/stores/edit'));
const StoresShow = lazy(() => import('./pages/stores/show'));

// Products
const ProductsIndex = lazy(() => import('./pages/products/index'));
const ProductsCreate = lazy(() => import('./pages/products/create'));
const ProductsEdit = lazy(() => import('./pages/products/edit'));
const ProductsShow = lazy(() => import('./pages/products/show'));

// Warehouses
const WarehousesIndex = lazy(() => import('./pages/warehouses/index'));
const WarehousesCreate = lazy(() => import('./pages/warehouses/create'));
const WarehousesEdit = lazy(() => import('./pages/warehouses/edit'));
const WarehousesShow = lazy(() => import('./pages/warehouses/show'));

// Categories
const CategoriesIndex = lazy(() => import('./pages/categories/index'));
const CategoriesCreate = lazy(() => import('./pages/categories/create'));
const CategoriesEdit = lazy(() => import('./pages/categories/edit'));
const CategoriesShow = lazy(() => import('./pages/categories/show'));

// Inventory
const InventoryIndex = lazy(() => import('./pages/inventory/index'));
const InventoryShow = lazy(() => import('./pages/inventory/show'));
const InventoryEdit = lazy(() => import('./pages/inventory/edit'));
const InventoryAdjust = lazy(() => import('./pages/inventory/adjust'));
const StoreInventoryShow = lazy(() => import('./pages/inventory/store-show'));
const StoreInventoryEdit = lazy(() => import('./pages/inventory/store-edit'));
const StoreInventoryAdjust = lazy(() => import('./pages/inventory/store-adjust'));

// Purchase Orders
const PurchaseOrdersIndex = lazy(() => import('./pages/purchase-orders/index'));
const PurchaseOrdersCreate = lazy(() => import('./pages/purchase-orders/create'));
const PurchaseOrdersShow = lazy(() => import('./pages/purchase-orders/show'));
const PurchaseOrdersEdit = lazy(() => import('./pages/purchase-orders/edit'));
const PurchaseOrdersReceive = lazy(() => import('./pages/purchase-orders/receive'));

// Stock Transfers
const StockTransfersIndex = lazy(() => import('./pages/stock-transfers/index'));
const StockTransfersCreate = lazy(() => import('./pages/stock-transfers/create'));
const StockTransfersShow = lazy(() => import('./pages/stock-transfers/show'));
const StockTransfersEdit = lazy(() => import('./pages/stock-transfers/edit'));

// Suppliers
const SuppliersIndex = lazy(() => import('./pages/suppliers/index'));
const SuppliersCreate = lazy(() => import('./pages/suppliers/create'));
const SuppliersShow = lazy(() => import('./pages/suppliers/show'));
const SuppliersEdit = lazy(() => import('./pages/suppliers/edit'));

// Customers
const CustomersIndex = lazy(() => import('./pages/customers/index'));
const CustomersCreate = lazy(() => import('./pages/customers/create'));
const CustomersShow = lazy(() => import('./pages/customers/show'));
const CustomersEdit = lazy(() => import('./pages/customers/edit'));

// Storage Locations
const StorageLocationsIndex = lazy(() => import('./pages/storage-locations/index'));
const StorageLocationsCreate = lazy(() => import('./pages/storage-locations/create'));
const StorageLocationsShow = lazy(() => import('./pages/storage-locations/show'));
const StorageLocationsEdit = lazy(() => import('./pages/storage-locations/edit'));
const StorageLocationsVisual = lazy(() => import('./pages/storage-locations/visual'));

// Sales
const SalesIndex = lazy(() => import('./pages/sales/index'));
const SalesShow = lazy(() => import('./pages/sales/show'));

// POS
const POSPage = lazy(() => import('./pages/pos/index'));
const POSHistoryPage = lazy(() => import('./pages/pos/history'));

// Discounts
const DiscountsIndex = lazy(() => import('./pages/discounts/index'));
const DiscountsCreate = lazy(() => import('./pages/discounts/create'));
const DiscountsShow = lazy(() => import('./pages/discounts/show'));
const DiscountsEdit = lazy(() => import('./pages/discounts/edit'));

// Reports
const SalesReportPage = lazy(() => import('./pages/reports/sales/index'));
const InventoryReportPage = lazy(() => import('./pages/reports/inventory/index'));
const UserSalesReportPage = lazy(() => import('./pages/reports/users/index'));

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center h-screen">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <AppLayout>{children}</AppLayout>;
}

function App() {
  // Load theme on app start
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/account" element={<ProtectedRoute><AccountPage /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
          
          {/* Users */}
          <Route path="/users" element={<ProtectedRoute><UsersIndex /></ProtectedRoute>} />
          <Route path="/users/create" element={
            <ProtectedRoute>
              <PermissionGuard permission="users.create">
                <UsersCreate />
              </PermissionGuard>
            </ProtectedRoute>
          } />
          <Route path="/users/:id" element={<ProtectedRoute><UsersShow /></ProtectedRoute>} />
          <Route path="/users/:id/edit" element={
            <ProtectedRoute>
              <PermissionGuard permission="users.update">
                <UsersEdit />
              </PermissionGuard>
            </ProtectedRoute>
          } />
          
          {/* Roles */}
          <Route path="/roles" element={<ProtectedRoute><RolesIndex /></ProtectedRoute>} />
          <Route path="/roles/create" element={
            <ProtectedRoute>
              <PermissionGuard permission="roles.create">
                <RolesCreate />
              </PermissionGuard>
            </ProtectedRoute>
          } />
          <Route path="/roles/:id" element={<ProtectedRoute><RolesShow /></ProtectedRoute>} />
          <Route path="/roles/:id/edit" element={
            <ProtectedRoute>
              <PermissionGuard permission="roles.update">
                <RolesEdit />
              </PermissionGuard>
            </ProtectedRoute>
          } />
          
          {/* Permissions */}
          <Route path="/permissions" element={<ProtectedRoute><PermissionsIndex /></ProtectedRoute>} />
          <Route path="/permissions/create" element={
            <ProtectedRoute>
              <PermissionGuard permission="permissions.create">
                <PermissionsCreate />
              </PermissionGuard>
            </ProtectedRoute>
          } />
          <Route path="/permissions/:id" element={<ProtectedRoute><PermissionsShow /></ProtectedRoute>} />
          <Route path="/permissions/:id/edit" element={
            <ProtectedRoute>
              <PermissionGuard permission="permissions.update">
                <PermissionsEdit />
              </PermissionGuard>
            </ProtectedRoute>
          } />
          
          {/* Stores */}
          <Route path="/stores" element={<ProtectedRoute><StoresIndex /></ProtectedRoute>} />
          <Route path="/stores/create" element={
            <ProtectedRoute>
              <PermissionGuard permission="stores.create">
                <StoresCreate />
              </PermissionGuard>
            </ProtectedRoute>
          } />
          <Route path="/stores/:id/edit" element={
            <ProtectedRoute>
              <PermissionGuard permission="stores.update">
                <StoresEdit />
              </PermissionGuard>
            </ProtectedRoute>
          } />
          <Route path="/stores/:id" element={<ProtectedRoute><StoresShow /></ProtectedRoute>} />
          
          {/* Products */}
          <Route path="/products" element={<ProtectedRoute><ProductsIndex /></ProtectedRoute>} />
          <Route path="/products/create" element={
            <ProtectedRoute>
              <PermissionGuard permission="products.create">
                <ProductsCreate />
              </PermissionGuard>
            </ProtectedRoute>
          } />
          <Route path="/products/:id/edit" element={
            <ProtectedRoute>
              <PermissionGuard permission="products.update">
                <ProductsEdit />
              </PermissionGuard>
            </ProtectedRoute>
          } />
          <Route path="/products/:id" element={<ProtectedRoute><ProductsShow /></ProtectedRoute>} />
          
          {/* Warehouses */}
          <Route path="/warehouses" element={<ProtectedRoute><WarehousesIndex /></ProtectedRoute>} />
          <Route path="/warehouses/create" element={
            <ProtectedRoute>
              <PermissionGuard permission="warehouses.create">
                <WarehousesCreate />
              </PermissionGuard>
            </ProtectedRoute>
          } />
          <Route path="/warehouses/:id/edit" element={
            <ProtectedRoute>
              <PermissionGuard permission="warehouses.update">
                <WarehousesEdit />
              </PermissionGuard>
            </ProtectedRoute>
          } />
          <Route path="/warehouses/:id" element={<ProtectedRoute><WarehousesShow /></ProtectedRoute>} />
          
          {/* Categories */}
          <Route path="/categories" element={<ProtectedRoute><CategoriesIndex /></ProtectedRoute>} />
          <Route path="/categories/create" element={
            <ProtectedRoute>
              <PermissionGuard permission="categories.create">
                <CategoriesCreate />
              </PermissionGuard>
            </ProtectedRoute>
          } />
          <Route path="/categories/:id/edit" element={
            <ProtectedRoute>
              <PermissionGuard permission="categories.update">
                <CategoriesEdit />
              </PermissionGuard>
            </ProtectedRoute>
          } />
          <Route path="/categories/:id" element={<ProtectedRoute><CategoriesShow /></ProtectedRoute>} />
          
          {/* Inventory */}
          <Route path="/inventory" element={<ProtectedRoute><InventoryIndex /></ProtectedRoute>} />
          <Route path="/inventory/:id" element={<ProtectedRoute><InventoryShow /></ProtectedRoute>} />
          <Route path="/inventory/:id/edit" element={
            <ProtectedRoute>
              <PermissionGuard permission="inventory.update">
                <InventoryEdit />
              </PermissionGuard>
            </ProtectedRoute>
          } />
          <Route path="/inventory/:id/adjust" element={
            <ProtectedRoute>
              <PermissionGuard permission="inventory.update">
                <InventoryAdjust />
              </PermissionGuard>
            </ProtectedRoute>
          } />
          
          {/* Store Inventory */}
          <Route path="/store-inventory/:id" element={<ProtectedRoute><StoreInventoryShow /></ProtectedRoute>} />
          <Route path="/store-inventory/:id/edit" element={
            <ProtectedRoute>
              <PermissionGuard permission="inventory.update">
                <StoreInventoryEdit />
              </PermissionGuard>
            </ProtectedRoute>
          } />
          <Route path="/store-inventory/:id/adjust" element={
            <ProtectedRoute>
              <PermissionGuard permission="inventory.update">
                <StoreInventoryAdjust />
              </PermissionGuard>
            </ProtectedRoute>
          } />
          
          {/* Purchase Orders */}
          <Route path="/purchase-orders" element={<ProtectedRoute><PurchaseOrdersIndex /></ProtectedRoute>} />
          <Route path="/purchase-orders/create" element={
            <ProtectedRoute>
              <PermissionGuard permission="purchase_orders.create">
                <PurchaseOrdersCreate />
              </PermissionGuard>
            </ProtectedRoute>
          } />
          <Route path="/purchase-orders/:id" element={<ProtectedRoute><PurchaseOrdersShow /></ProtectedRoute>} />
          <Route path="/purchase-orders/:id/edit" element={
            <ProtectedRoute>
              <PermissionGuard permission="purchase_orders.update">
                <PurchaseOrdersEdit />
              </PermissionGuard>
            </ProtectedRoute>
          } />
          <Route path="/purchase-orders/:id/receive" element={
            <ProtectedRoute>
              <PermissionGuard permission="purchase_orders.update">
                <PurchaseOrdersReceive />
              </PermissionGuard>
            </ProtectedRoute>
          } />
          
          {/* Stock Transfers */}
          <Route path="/stock-transfers" element={<ProtectedRoute><StockTransfersIndex /></ProtectedRoute>} />
          <Route path="/stock-transfers/create" element={
            <ProtectedRoute>
              <PermissionGuard permission="stock_transfers.create">
                <StockTransfersCreate />
              </PermissionGuard>
            </ProtectedRoute>
          } />
          <Route path="/stock-transfers/:id" element={<ProtectedRoute><StockTransfersShow /></ProtectedRoute>} />
          <Route path="/stock-transfers/:id/edit" element={
            <ProtectedRoute>
              <PermissionGuard permission="stock_transfers.update">
                <StockTransfersEdit />
              </PermissionGuard>
            </ProtectedRoute>
          } />
          
          {/* Suppliers */}
          <Route path="/suppliers" element={<ProtectedRoute><SuppliersIndex /></ProtectedRoute>} />
          <Route path="/suppliers/create" element={
            <ProtectedRoute>
              <PermissionGuard permission="suppliers.create">
                <SuppliersCreate />
              </PermissionGuard>
            </ProtectedRoute>
          } />
          <Route path="/suppliers/:id" element={<ProtectedRoute><SuppliersShow /></ProtectedRoute>} />
          <Route path="/suppliers/:id/edit" element={
            <ProtectedRoute>
              <PermissionGuard permission="suppliers.update">
                <SuppliersEdit />
              </PermissionGuard>
            </ProtectedRoute>
          } />
          
          {/* Customers */}
          <Route path="/customers" element={<ProtectedRoute><CustomersIndex /></ProtectedRoute>} />
          <Route path="/customers/create" element={
            <ProtectedRoute>
              <PermissionGuard permission="customers.create">
                <CustomersCreate />
              </PermissionGuard>
            </ProtectedRoute>
          } />
          <Route path="/customers/:id" element={<ProtectedRoute><CustomersShow /></ProtectedRoute>} />
          <Route path="/customers/:id/edit" element={
            <ProtectedRoute>
              <PermissionGuard permission="customers.update">
                <CustomersEdit />
              </PermissionGuard>
            </ProtectedRoute>
          } />
          
          {/* Storage Locations */}
          <Route path="/storage-locations" element={<ProtectedRoute><StorageLocationsIndex /></ProtectedRoute>} />
          <Route path="/storage-locations/visual" element={<ProtectedRoute><StorageLocationsVisual /></ProtectedRoute>} />
          <Route path="/storage-locations/create" element={
            <ProtectedRoute>
              <PermissionGuard permission="storage_locations.create">
                <StorageLocationsCreate />
              </PermissionGuard>
            </ProtectedRoute>
          } />
          <Route path="/storage-locations/:id" element={<ProtectedRoute><StorageLocationsShow /></ProtectedRoute>} />
          <Route path="/storage-locations/:id/edit" element={
            <ProtectedRoute>
              <PermissionGuard permission="storage_locations.update">
                <StorageLocationsEdit />
              </PermissionGuard>
            </ProtectedRoute>
          } />
          
          {/* Sales */}
          <Route path="/sales" element={<ProtectedRoute><SalesIndex /></ProtectedRoute>} />
          <Route path="/sales/:id" element={<ProtectedRoute><SalesShow /></ProtectedRoute>} />
          
          {/* Discounts */}
          <Route path="/discounts" element={<ProtectedRoute><DiscountsIndex /></ProtectedRoute>} />
          <Route path="/discounts/create" element={
            <ProtectedRoute>
              <PermissionGuard permission="discounts.create">
                <DiscountsCreate />
              </PermissionGuard>
            </ProtectedRoute>
          } />
          <Route path="/discounts/:id" element={<ProtectedRoute><DiscountsShow /></ProtectedRoute>} />
          <Route path="/discounts/:id/edit" element={
            <ProtectedRoute>
              <PermissionGuard permission="discounts.update">
                <DiscountsEdit />
              </PermissionGuard>
            </ProtectedRoute>
          } />
          
          {/* Reports */}
          <Route path="/reports/sales" element={<ProtectedRoute><SalesReportPage /></ProtectedRoute>} />
          <Route path="/reports/inventory" element={<ProtectedRoute><InventoryReportPage /></ProtectedRoute>} />
          <Route path="/reports/users" element={<ProtectedRoute><UserSalesReportPage /></ProtectedRoute>} />
          
          {/* POS - Fullscreen without layout */}
          <Route path="/pos" element={
            <PermissionGuard permission="pos.view">
              <POSPage />
            </PermissionGuard>
          } />
          <Route path="/pos/history" element={
            <PermissionGuard permission="pos.view">
              <POSHistoryPage />
            </PermissionGuard>
          } />
          
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
      <Toaster />
      <AIChatBubble />
    </BrowserRouter>
  );
}

export default App;
