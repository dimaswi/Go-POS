import { Routes, Route } from 'react-router-dom';
import { lazy } from 'react';

// Lazy load components
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const AccountPage = lazy(() => import('@/pages/account/index'));
const SettingsPage = lazy(() => import('@/pages/settings/index'));

export function PublicRoutes() {
  return (
    <Routes>
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/account" element={<AccountPage />} />
      <Route path="/settings" element={<SettingsPage />} />
    </Routes>
  );
}