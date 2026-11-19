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

// Customer / Student / Faculty Modules
import {
  CustomerLayout,
  CustomerProtectedRoute,
  CustomerLoginPage,
  CustomerDashboardPage,
  CustomerMenuPage,
  ItemDetailsPage,
  CartPage,
  CheckoutPage,
  PaymentPage,
  MyOrdersPage,
  OrderHistoryPage,
  RateAndPrivacyPage
} from '../modules/customer';

// Canteen Staff Operations Modules
import {
  StaffLayout,
  StaffProtectedRoute,
  StaffDashboardPage,
  StaffOrderBoardPage,
  KitchenDisplayPage,
  VerifyPickupPage,
  StaffInventoryPage,
  StaffStockDetailsPage,
  StaffExpiryTrackingPage,
  StaffStockAlertsPage,
  StaffProfilePage,
  StaffLoginPage
} from '../modules/canteen-staff';

export const router = createBrowserRouter([
  // Public Staff Authentication Route
  {
    path: '/staff/login',
    element: <StaffLoginPage />
  },

  // Protected Canteen Staff Operations Portal Routes
  {
    path: '/staff',
    element: (
      <StaffProtectedRoute>
        <StaffLayout />
      </StaffProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/staff/dashboard" replace />
      },
      {
        path: 'dashboard',
        element: <StaffDashboardPage />
      },
      {
        path: 'board',
        element: <StaffOrderBoardPage />
      },
      {
        path: 'order-board',
        element: <Navigate to="/staff/board" replace />
      },
      {
        path: 'kitchen',
        element: <KitchenDisplayPage />
      },
      {
        path: 'kitchen-display',
        element: <Navigate to="/staff/kitchen" replace />
      },
      {
        path: 'verify',
        element: <VerifyPickupPage />
      },
      {
        path: 'verify-pickup',
        element: <Navigate to="/staff/verify" replace />
      },
      {
        path: 'inventory',
        element: <StaffInventoryPage />
      },
      {
        path: 'inventory/:itemId',
        element: <StaffStockDetailsPage />
      },
      {
        path: 'inventory/expiry',
        element: <StaffExpiryTrackingPage />
      },
      {
        path: 'expiry',
        element: <Navigate to="/staff/inventory/expiry" replace />
      },
      {
        path: 'alerts',
        element: <StaffStockAlertsPage />
      },
      {
        path: 'inventory/alerts',
        element: <Navigate to="/staff/alerts" replace />
      },
      {
        path: 'stock-requests',
        element: <Navigate to="/staff/inventory?view=request" replace />
      },
      {
        path: 'stock-requests/history',
        element: <Navigate to="/staff/inventory?view=history" replace />
      },
      {
        path: 'profile',
        element: <StaffProfilePage />
      }
    ]
  },

  // Compatibility redirect for /canteen-staff
  {
    path: '/canteen-staff',
    element: <Navigate to="/staff/dashboard" replace />
  },
  {
    path: '/canteen-staff/*',
    element: <Navigate to="/staff/dashboard" replace />
  },
  // Public Customer Authentication Route
  {
    path: '/customer/login',
    element: <CustomerLoginPage />
  },

  // Protected Customer / Student / Faculty Dining Portal Routes
  {
    path: '/customer',
    element: (
      <CustomerProtectedRoute>
        <CustomerLayout />
      </CustomerProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/customer/dashboard" replace />
      },
      {
        path: 'dashboard',
        element: <CustomerDashboardPage />
      },
      {
        path: 'menu',
        element: <CustomerMenuPage />
      },
      {
        path: 'item/:itemId',
        element: <ItemDetailsPage />
      },
      {
        path: 'cart',
        element: <CartPage />
      },
      {
        path: 'checkout',
        element: <CheckoutPage />
      },
      {
        path: 'payment',
        element: <PaymentPage />
      },
      {
        path: 'orders',
        element: <MyOrdersPage />
      },
      {
        path: 'order-history',
        element: <OrderHistoryPage />
      },
      {
        path: 'feedback',
        element: <RateAndPrivacyPage />
      }
    ]
  },

  // Public Admin Authentication Routes
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
        path: 'dashboard',
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
            element: <LazyRoute><CanteenListPage /></LazyRoute>
          },
          {
            path: 'outlets/create',
            element: <LazyRoute><AddCanteenPage /></LazyRoute>
          },
          {
            path: 'outlets/:id',
            element: <LazyRoute><CanteenDetailsPage /></LazyRoute>
          },
          {
            path: 'outlets/:id/edit',
            element: <LazyRoute><EditCanteenPage /></LazyRoute>
          },
          // Category Management Routes
          {
            path: 'categories',
            element: <LazyRoute><CategoryListPage /></LazyRoute>
          },
          {
            path: 'categories/create',
            element: <LazyRoute><AddCategoryPage /></LazyRoute>
          },
          {
            path: 'categories/:id',
            element: <LazyRoute><CategoryDetailsPage /></LazyRoute>
          },
          {
            path: 'categories/:id/edit',
            element: <LazyRoute><EditCategoryPage /></LazyRoute>
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
        element: <LazyRoute><CanteenListPage /></LazyRoute>
      },
      {
        path: 'canteen/create',
        element: <LazyRoute><AddCanteenPage /></LazyRoute>
      },
      {
        path: 'canteen/:id',
        element: <LazyRoute><CanteenDetailsPage /></LazyRoute>
      },
      {
        path: 'canteen/:id/edit',
        element: <LazyRoute><EditCanteenPage /></LazyRoute>
      },

      // Compatibility routes for /categories
      {
        path: 'categories',
        element: <LazyRoute><CategoryListPage /></LazyRoute>
      },
      {
        path: 'categories/create',
        element: <LazyRoute><AddCategoryPage /></LazyRoute>
      },
      {
        path: 'categories/:id',
        element: <LazyRoute><CategoryDetailsPage /></LazyRoute>
      },
      {
        path: 'categories/:id/edit',
        element: <LazyRoute><EditCategoryPage /></LazyRoute>
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
