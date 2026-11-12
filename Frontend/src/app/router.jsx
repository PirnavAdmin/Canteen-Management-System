import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { NotFoundPage } from '../components/common/NotFoundPage';
import { ProtectedRoute } from '../modules/auth/components/ProtectedRoute';

// Auth Pages
import { LoginPage } from '../modules/auth/pages/LoginPage';
import { RegisterPage } from '../modules/auth/pages/RegisterPage';

// Admin Modules
import { DashboardPage } from '../modules/admin/dashboard';
import { MenuListPage } from '../modules/admin/menu';
import { OrderListPage } from '../modules/admin/orders';
import { SlotListPage } from '../modules/admin/slots';
import { InventoryPage } from '../modules/admin/inventory';
import { ReportsPage } from '../modules/admin/reports';
import { FeedbackPage } from '../modules/admin/feedback';
import {
  CanteenListPage,
  AddCanteenPage,
  EditCanteenPage,
  CanteenDetailsPage
} from '../modules/admin/outlets';
import {
  CategoryListPage,
  AddCategoryPage,
  EditCategoryPage,
  CategoryDetailsPage
} from '../modules/admin/categories';
import { SettingsPage } from '../modules/admin/settings';

export const router = createBrowserRouter([
  // Public Authentication Routes
  {
    path: '/login',
    element: <LoginPage />
  },
  {
    path: '/register',
    element: <RegisterPage />
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
            element: <DashboardPage />
          },
          {
            path: 'menu',
            element: <MenuListPage />
          },
          {
            path: 'orders',
            element: <OrderListPage />
          },
          {
            path: 'slots',
            element: <SlotListPage />
          },
          {
            path: 'inventory',
            element: <InventoryPage />
          },
          {
            path: 'reports',
            element: <ReportsPage />
          },
          {
            path: 'feedback',
            element: <FeedbackPage />
          },
          // Outlet Management Routes (First Domain Module)
          {
            path: 'outlets',
            children: [
              {
                index: true,
                element: <CanteenListPage />
              },
              {
                path: 'create',
                element: <AddCanteenPage />
              },
              {
                path: ':id',
                element: <CanteenDetailsPage />
              },
              {
                path: ':id/edit',
                element: <EditCanteenPage />
              }
            ]
          },
          // Category Management Routes
          {
            path: 'categories',
            children: [
              {
                index: true,
                element: <CategoryListPage />
              },
              {
                path: 'create',
                element: <AddCategoryPage />
              },
              {
                path: ':id',
                element: <CategoryDetailsPage />
              },
              {
                path: ':id/edit',
                element: <EditCategoryPage />
              }
            ]
          },
          // Settings & Privacy Routes
          {
            path: 'settings',
            element: <SettingsPage />
          }
        ]
      },

      // Compatibility routes for /canteen
      {
        path: 'canteen',
        children: [
          {
            index: true,
            element: <CanteenListPage />
          },
          {
            path: 'create',
            element: <AddCanteenPage />
          },
          {
            path: ':id',
            element: <CanteenDetailsPage />
          },
          {
            path: ':id/edit',
            element: <EditCanteenPage />
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
