import { lazy, Suspense, type ReactNode } from 'react';
import { createBrowserRouter, Outlet } from 'react-router-dom';
import { AdminLayout } from './layouts/AdminLayout';
import { MemberLayout } from './layouts/MemberLayout';
import { ProviderLayout } from './layouts/ProviderLayout';
import { PublicLayout } from './layouts/PublicLayout';
import { RoleGuard } from './layouts/RoleGuard';

const L = (f: () => Promise<{ default: React.ComponentType }>) => {
  const C = lazy(f);
  return <C />;
};
const Fallback = ({ children }: { children?: ReactNode }) => (
  <Suspense fallback={<p className="p-6 text-text-secondary" role="status">Đang tải…</p>}>{children ?? <Outlet />}</Suspense>
);

export const router = createBrowserRouter([
  {
    element: <Fallback />,
    children: [
      { path: 'styleguide', element: L(() => import('./pages/Styleguide')) },
      {
        element: <PublicLayout />,
        children: [
          { path: 'login', element: L(() => import('./pages/Login')) },
          { path: 'register', element: L(() => import('./pages/Register')) },
          { index: true, element: L(() => import('./pages/Discover')) },
          { path: 'venues/:id', element: L(() => import('./pages/Venue')) },
          { path: 'join/:code', element: L(() => import('./pages/Join')) },
        ],
      },
      {
        element: <RoleGuard roles={['HOST', 'MEMBER']} />,
        children: [{
          element: <MemberLayout />,
          children: [
            { path: 'lobby/:code', element: L(() => import('./pages/Lobby')) },
            { path: 'lobby/:code/split', element: L(() => import('./pages/Split')) },
            { path: 'wallet', element: L(() => import('./pages/Wallet')) },
            { path: 'disputes', element: L(() => import('./pages/Disputes')) },
            { path: 'profile', element: L(() => import('./pages/Profile')) },
          ],
        }],
      },
      {
        path: 'provider',
        element: <RoleGuard roles={['PROVIDER']} />,
        children: [{ element: <ProviderLayout />, children: [{ path: '*', index: false, element: L(() => import('./pages/Provider')) }, { index: true, element: L(() => import('./pages/Provider')) }] }],
      },
      {
        path: 'admin',
        element: <RoleGuard roles={['ADMIN']} />,
        children: [{ element: <AdminLayout />, children: [{ path: '*', element: L(() => import('./pages/Admin')) }, { index: true, element: L(() => import('./pages/Admin')) }] }],
      },
    ],
  },
]);
