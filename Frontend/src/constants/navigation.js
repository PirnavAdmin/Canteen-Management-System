/**
 * Central Navigation and Application Configuration
 */

import { PERMISSIONS } from './permissions';

export const ADMIN_NAV_CONFIG = [
  {
    group: 'Overview',
    items: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        path: '/admin/dashboard',
        icon: 'LayoutDashboard',
        permission: PERMISSIONS.DASHBOARD_VIEW,
        description: 'System-wide canteen overview, revenue & live order tracking'
      }
    ]
  },
  {
    group: 'Operations',
    items: [
      {
        id: 'menu',
        label: 'Menu Management',
        path: '/admin/menu',
        icon: 'UtensilsCrossed',
        permission: PERMISSIONS.MENU_VIEW,
        description: 'Configure food items, schedules, capacity & pricing'
      },
      {
        id: 'orders',
        label: 'Order Management',
        path: '/admin/orders',
        icon: 'ShoppingBag',
        permission: PERMISSIONS.ORDERS_VIEW,
        description: 'Live order tracking, status progression, cancellations & refunds'
      },
      {
        id: 'slots',
        label: 'Slot Management',
        path: '/admin/slots',
        icon: 'Clock',
        permission: PERMISSIONS.SLOTS_VIEW,
        description: 'Meal sessions, slot quotas, capacity throttling & cut-off rules'
      },
      {
        id: 'inventory',
        label: 'Inventory Management',
        path: '/admin/inventory',
        icon: 'Boxes',
        permission: PERMISSIONS.INVENTORY_VIEW,
        description: 'Ingredients, stock ledger, adjustments, POs & suppliers'
      }
    ]
  },
  {
    group: 'Analytics & Support',
    items: [
      {
        id: 'reports',
        label: 'Reports & Analytics',
        path: '/admin/reports',
        icon: 'BarChart3',
        permission: PERMISSIONS.REPORTS_VIEW,
        description: 'Financial, GST, category, item and wastage data exports'
      },
      {
        id: 'feedback',
        label: 'Feedback & Grievances',
        path: '/admin/feedback',
        icon: 'MessageSquareWarning',
        permission: PERMISSIONS.FEEDBACK_VIEW,
        description: 'Customer ratings, food quality reviews & grievance resolution'
      }
    ]
  },
  {
    group: 'Master Setup',
    items: [
      {
        id: 'outlets',
        label: 'Outlet Management',
        path: '/admin/outlets',
        icon: 'Store',
        permission: PERMISSIONS.OUTLETS_VIEW,
        description: 'Campus dining halls, operating hours, staff allocation & status'
      },
      {
        id: 'categories',
        label: 'Category Management',
        path: '/admin/categories',
        icon: 'Layers',
        permission: PERMISSIONS.CATEGORIES_VIEW,
        description: 'Menu classification taxonomy and display order hierarchy'
      },
      {
        id: 'settings',
        label: 'Settings & Privacy',
        path: '/admin/settings',
        icon: 'Settings',
        permission: PERMISSIONS.SETTINGS_VIEW,
        description: 'Order rules, payment gateways, FSSAI compliance & privacy DSAR'
      }
    ]
  }
];

export const APP_CONFIG = {
  institutionName: 'Apex Institute of Technology & Sciences',
  portalName: 'SMS / CMS Integrated Canteen Module',
  systemVersion: 'v1.1 (Admin Suite 2026)',
  currentUser: {
    name: 'Dr. Rajesh Sharma',
    role: 'Institution Administrator',
    roleCode: 'INSTITUTION_ADMIN',
    id: 'ADM-9024',
    email: 'admin.canteen@apexinstitute.edu',
    campus: 'Main Campus',
    avatar: 'RS'
  }
};
