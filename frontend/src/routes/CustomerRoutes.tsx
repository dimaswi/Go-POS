import type { RouteObject } from 'react-router-dom';
import { lazy } from 'react';

const CustomersPage = lazy(() => import('../pages/customers'));
const CreateCustomerPage = lazy(() => import('../pages/customers/create'));
const ShowCustomerPage = lazy(() => import('../pages/customers/show'));
const EditCustomerPage = lazy(() => import('../pages/customers/edit'));

export const CustomerRoutes: RouteObject[] = [
  {
    path: '/customers',
    element: <CustomersPage />,
  },
  {
    path: '/customers/create',
    element: <CreateCustomerPage />,
  },
  {
    path: '/customers/:id',
    element: <ShowCustomerPage />,
  },
  {
    path: '/customers/:id/edit',
    element: <EditCustomerPage />,
  },
];

