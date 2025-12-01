import type { RouteObject } from 'react-router-dom';
import { lazy } from 'react';

const InventoryPage = lazy(() => import('../pages/inventory'));
const InventoryShowPage = lazy(() => import('../pages/inventory/show'));
const InventoryAdjustPage = lazy(() => import('../pages/inventory/adjust'));
const StoreInventoryShowPage = lazy(() => import('../pages/inventory/store-show'));
const StoreInventoryAdjustPage = lazy(() => import('../pages/inventory/store-adjust'));

// Purchase Orders
const PurchaseOrdersPage = lazy(() => import('../pages/purchase-orders'));
const CreatePurchaseOrderPage = lazy(() => import('../pages/purchase-orders/create'));
const ShowPurchaseOrderPage = lazy(() => import('../pages/purchase-orders/show'));
const EditPurchaseOrderPage = lazy(() => import('../pages/purchase-orders/edit'));
const ReceivePurchaseOrderPage = lazy(() => import('../pages/purchase-orders/receive'));

// Stock Transfers  
const StockTransfersPage = lazy(() => import('../pages/stock-transfers'));
const CreateStockTransferPage = lazy(() => import('../pages/stock-transfers/create'));
const ShowStockTransferPage = lazy(() => import('../pages/stock-transfers/show'));
const EditStockTransferPage = lazy(() => import('../pages/stock-transfers/edit'));

export const InventoryRoutes: RouteObject[] = [
  {
    path: '/inventory',
    element: <InventoryPage />,
  },
  {
    path: '/inventory/:id',
    element: <InventoryShowPage />,
  },
  {
    path: '/inventory/:id/adjust',
    element: <InventoryAdjustPage />,
  },
  // Store Inventory
  {
    path: '/store-inventory/:id',
    element: <StoreInventoryShowPage />,
  },
  {
    path: '/store-inventory/:id/adjust',
    element: <StoreInventoryAdjustPage />,
  },
  // Purchase Orders
  {
    path: '/purchase-orders',
    element: <PurchaseOrdersPage />,
  },
  {
    path: '/purchase-orders/create',
    element: <CreatePurchaseOrderPage />,
  },
  {
    path: '/purchase-orders/:id',
    element: <ShowPurchaseOrderPage />,
  },
  {
    path: '/purchase-orders/:id/edit',
    element: <EditPurchaseOrderPage />,
  },
  {
    path: '/purchase-orders/receive/:id',
    element: <ReceivePurchaseOrderPage />,
  },
  // Stock Transfers
  {
    path: '/stock-transfers',
    element: <StockTransfersPage />,
  },
  {
    path: '/stock-transfers/create',
    element: <CreateStockTransferPage />,
  },
  {
    path: '/stock-transfers/:id',
    element: <ShowStockTransferPage />,
  },
  {
    path: '/stock-transfers/:id/edit',
    element: <EditStockTransferPage />,
  },
];