import { Routes, Route } from 'react-router-dom';
import { ProtectedRoute as PermissionGuard } from '@/components/ProtectedRoute';
import { lazy } from 'react';

// Lazy load components
const PermissionsIndex = lazy(() => import('@/pages/permissions/index'));
const PermissionsShow = lazy(() => import('@/pages/permissions/show'));
const PermissionsCreate = lazy(() => import('@/pages/permissions/create'));
const PermissionsEdit = lazy(() => import('@/pages/permissions/edit'));

export function PermissionRoutes() {
  return (
    <Routes>
      <Route path="/" element={<PermissionsIndex />} />
      <Route path="/create" element={
        <PermissionGuard permission="permissions.create">
          <PermissionsCreate />
        </PermissionGuard>
      } />
      <Route path="/:id" element={<PermissionsShow />} />
      <Route path="/:id/edit" element={
        <PermissionGuard permission="permissions.update">
          <PermissionsEdit />
        </PermissionGuard>
      } />
    </Routes>
  );
}