import StoresPage from '@/pages/stores/index';
import StoreCreate from '@/pages/stores/create';
import StoreEdit from '@/pages/stores/edit';

export const StoreRoutes = [
  {
    path: '/stores',
    element: <StoresPage />,
    permission: 'stores.view'
  },
  {
    path: '/stores/create',
    element: <StoreCreate />,
    permission: 'stores.create'
  },
  {
    path: '/stores/:id/edit',
    element: <StoreEdit />,
    permission: 'stores.update'
  }
];