import type { RouteObject } from 'react-router-dom';
import { lazy } from 'react';

const SuppliersPage = lazy(() => import('../pages/suppliers'));
const CreateSupplierPage = lazy(() => import('../pages/suppliers/create'));
const ShowSupplierPage = lazy(() => import('../pages/suppliers/show'));
const EditSupplierPage = lazy(() => import('../pages/suppliers/edit'));

export const SupplierRoutes: RouteObject[] = [
  {
    path: '/suppliers',
    element: <SuppliersPage />,
  },
  {
    path: '/suppliers/create',
    element: <CreateSupplierPage />,
  },
  {
    path: '/suppliers/:id',
    element: <ShowSupplierPage />,
  },
  {
    path: '/suppliers/:id/edit',
    element: <EditSupplierPage />,
  },
];
