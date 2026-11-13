import React, { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { NotFoundPage } from '../components/common/NotFoundPage';
import { ProtectedRoute } from '../modules/auth/components/ProtectedRoute';

// Lazy-loaded Auth Pages
const LoginPage = lazy(() => import('../modules/auth/pages/LoginPage'));
const RegisterPage = lazy(() => import('../modules/auth/pages/RegisterPage'));

// Lazy-loaded Admin Modules
const DashboardPage = lazy(() => import('../modules/admin/dashboard/pages/DashboardPage'));
const MenuListPage = lazy(() => import('../modules/admin/menu/pages/MenuListPage'));
const OrderListPage = lazy(() => import('../modules/admin/orders/pages/OrderListPage'));
const SlotListPage = lazy(() => import('../modules/admin/slots/pages/SlotListPage'));
const InventoryPage = lazy(() => import('../modules/admin/inventory/pages/InventoryPage'));
const ReportsPage = lazy(() => import('../modules/admin/reports/pages/ReportsPage'));
const FeedbackPage = lazy(() => import('../modules/admin/feedback/pages/FeedbackPage'));
const CanteenListPage = lazy(() => import('../modules/admin/outlets/pages/CanteenListPage'));
const AddCanteenPage = lazy(() => import('../modules/admin/outlets/pages/AddCanteenPage'));
const EditCanteenPage = lazy(() => import('../modules/admin/outlets/pages/EditCanteenPage'));
const CanteenDetailsPage = lazy(() => import('../modules/admin/outlets/pages/CanteenDetailsPage'));
const CategoryListPage = lazy(() => import('../modules/admin/categories/pages/CategoryListPage'));
const AddCategoryPage = lazy(() => import('../modules/admin/categories/pages/AddCategoryPage'));
const EditCategoryPage = lazy(() => import('../modules/admin/categories/pages/EditCategoryPage'));
const CategoryDetailsPage = lazy(() => import('../modules/admin/categories/pages/CategoryDetailsPage'));
const SettingsPage = lazy(() => import('../modules/admin/settings/pages/SettingsPage'));

const LazyRoute = ({ children }) => (
  <Suspense fallback={null}>
    {children}
  </Suspense>
);

export const router = createBrowserRouter([
  // Public Authentication Routes
  {
    path: '/login',
    element: (
      <LazyRoute>
        <LoginPage />
      </LazyRoute>
    )
  },
  {
    path: '/register',
    element: (
      <LazyRoute>
        <RegisterPage />
      </LazyRoute>
    )
  },

  // Protected App & Administration Routes
  {
    path: '/',
    element: (
      <ProtectedRoute allowedRoles={['Admin', 'Staff']}>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/admin/dashboard" replace />
      },
      {
        path: 'admin',
        children: [
          {
            index: true,
            element: <Navigate to="/admin/dashboard" replace />
          },
          {
            path: 'dashboard',
            element: <LazyRoute><DashboardPage /></LazyRoute>
          },
          {
            path: 'menu',
            element: <LazyRoute><MenuListPage /></LazyRoute>
          },
          {
            path: 'orders',
            element: <LazyRoute><OrderListPage /></LazyRoute>
          },
          {
            path: 'slots',
            element: <LazyRoute><SlotListPage /></LazyRoute>
          },
          {
            path: 'inventory',
            element: <LazyRoute><InventoryPage /></LazyRoute>
          },
          {
            path: 'reports',
            element: <LazyRoute><ReportsPage /></LazyRoute>
          },
          {
            path: 'feedback',
            element: <LazyRoute><FeedbackPage /></LazyRoute>
          },
          // Outlet Management Routes (First Domain Module)
          {
            path: 'outlets',
            children: [
              {
                index: true,
                element: <LazyRoute><CanteenListPage /></LazyRoute>
              },
              {
                path: 'create',
                element: <LazyRoute><AddCanteenPage /></LazyRoute>
              },
              {
                path: ':id',
                element: <LazyRoute><CanteenDetailsPage /></LazyRoute>
              },
              {
                path: ':id/edit',
                element: <LazyRoute><EditCanteenPage /></LazyRoute>
              }
            ]
          },
          // Category Management Routes
          {
            path: 'categories',
            children: [
              {
                index: true,
                element: <LazyRoute><CategoryListPage /></LazyRoute>
              },
              {
                path: 'create',
                element: <LazyRoute><AddCategoryPage /></LazyRoute>
              },
              {
                path: ':id',
                element: <LazyRoute><CategoryDetailsPage /></LazyRoute>
              },
              {
                path: ':id/edit',
                element: <LazyRoute><EditCategoryPage /></LazyRoute>
              }
            ]
          },
          // Settings & Privacy Routes
          {
            path: 'settings',
            element: <LazyRoute><SettingsPage /></LazyRoute>
          }
        ]
      },

      // Compatibility routes for /canteen
      {
        path: 'canteen',
        children: [
          {
            index: true,
            element: <LazyRoute><CanteenListPage /></LazyRoute>
          },
          {
            path: 'create',
            element: <LazyRoute><AddCanteenPage /></LazyRoute>
          },
          {
            path: ':id',
            element: <LazyRoute><CanteenDetailsPage /></LazyRoute>
          },
          {
            path: ':id/edit',
            element: <LazyRoute><EditCanteenPage /></LazyRoute>
          }
        ]
      },

      // Compatibility routes for /categories
      {
        path: 'categories',
        children: [
          {
            index: true,
            element: <LazyRoute><CategoryListPage /></LazyRoute>
          },
          {
            path: 'create',
            element: <LazyRoute><AddCategoryPage /></LazyRoute>
          },
          {
            path: ':id',
            element: <LazyRoute><CategoryDetailsPage /></LazyRoute>
          },
          {
            path: ':id/edit',
            element: <LazyRoute><EditCategoryPage /></LazyRoute>
          }
        ]
      },

      // 404 Fallback within Layout
      {
        path: '*',
        element: <NotFoundPage />
      }
    ]
  },

  // Catch-all route outside layout
  {
    path: '*',
    element: <NotFoundPage />
  }
]);

export default router;
