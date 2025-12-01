import { Routes, Route } from 'react-router-dom';
import { ProtectedRoute as PermissionGuard } from '@/components/ProtectedRoute';
import { lazy } from 'react';

// Lazy load components
const RolesIndex = lazy(() => import('@/pages/roles/index'));
const RolesShow = lazy(() => import('@/pages/roles/show'));
const RolesCreate = lazy(() => import('@/pages/roles/create'));
const RolesEdit = lazy(() => import('@/pages/roles/edit'));

export function RoleRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RolesIndex />} />
      <Route path="/create" element={
        <PermissionGuard permission="roles.create">
          <RolesCreate />
        </PermissionGuard>
      } />
      <Route path="/:id" element={<RolesShow />} />
      <Route path="/:id/edit" element={
        <PermissionGuard permission="roles.update">
          <RolesEdit />
        </PermissionGuard>
      } />
    </Routes>
  );
}