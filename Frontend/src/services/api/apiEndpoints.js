/**
 * Centralized API Endpoint Definitions
 * Master registry for all Canteen Management System backend routes.
 */

export const API_ENDPOINTS = {
  // Authentication & Session
  AUTH: {
    ME: '/auth/me',
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH_TOKEN: '/auth/refresh',
    PERMISSIONS: '/auth/permissions'
  },

  // Admin Dashboard
  DASHBOARD: {
    SUMMARY: '/admin/dashboard/summary',
    HOURLY_SALES: '/admin/dashboard/hourly-sales',
    LIVE_ORDERS: '/admin/dashboard/live-orders',
    TOP_SELLING: '/admin/dashboard/top-selling',
    STOCK_ALERTS: '/admin/dashboard/stock-alerts',
    OUTLET_SALES: '/admin/dashboard/outlet-sales'
  },

  // Outlets (Canteen)
  OUTLETS: {
    BASE: '/admin/outlets',
    BY_ID: (id) => `/admin/outlets/${id}`,
    TOGGLE_STATUS: (id) => `/admin/outlets/${id}/status`,
    STAFF: (id) => `/admin/outlets/${id}/staff`,
    REMOVE_STAFF: (canteenId, staffId) => `/admin/outlets/${canteenId}/staff/${staffId}`
  },

  // Food Categories
  CATEGORIES: {
    BASE: '/admin/categories',
    BY_ID: (id) => `/admin/categories/${id}`,
    TOGGLE_STATUS: (id) => `/admin/categories/${id}/status`
  },

  // Menu Management
  MENU: {
    BASE: '/admin/menu',
    BY_ID: (id) => `/admin/menu/${id}`,
    TOGGLE_STATUS: (id) => `/admin/menu/${id}/status`,
    TOGGLE_PUBLISH: (id) => `/admin/menu/${id}/publish`
  },

  // Order Management
  ORDERS: {
    BASE: '/admin/orders',
    BY_ID: (id) => `/admin/orders/${id}`,
    UPDATE_STATUS: (id) => `/admin/orders/${id}/status`,
    PROCESS_REFUND: (id) => `/admin/orders/${id}/refund`,
    LIVE_QUEUE: '/admin/orders/live-queue'
  },

  // Slot Management
  SLOTS: {
    BASE: '/admin/slots',
    BY_ID: (id) => `/admin/slots/${id}`,
    UPDATE_CAPACITY: (id) => `/admin/slots/${id}/capacity`,
    TOGGLE_STATUS: (id) => `/admin/slots/${id}/status`
  },

  // Inventory Management
  INVENTORY: {
    ITEMS: '/admin/inventory/items',
    ITEM_BY_ID: (id) => `/admin/inventory/items/${id}`,
    STOCK_MOVEMENT: '/admin/inventory/stock-movement',
    LEDGER: '/admin/inventory/ledger',
    PURCHASE_ORDERS: '/admin/inventory/purchase-orders',
    PO_BY_ID: (id) => `/admin/inventory/purchase-orders/${id}`,
    PO_UPDATE_STATUS: (id) => `/admin/inventory/purchase-orders/${id}/status`,
    SUPPLIERS: '/admin/inventory/suppliers',
    SUPPLIER_BY_ID: (id) => `/admin/inventory/suppliers/${id}`
  },

  // Reports & Analytics
  REPORTS: {
    SALES: '/admin/reports/sales',
    ITEM_WISE: '/admin/reports/item-wise',
    CATEGORY_WISE: '/admin/reports/category-wise',
    OUTLET_WISE: '/admin/reports/outlet-wise',
    TAX_SUMMARY: '/admin/reports/tax-summary',
    CANCELLATIONS_REFUNDS: '/admin/reports/cancellations-refunds',
    WASTAGE: '/admin/reports/wastage',
    INVENTORY: '/admin/reports/inventory',
    SLOT_UTILIZATION: '/admin/reports/slot-utilization',
    EXPORT: '/admin/reports/export'
  },

  // Feedback & Grievances
  FEEDBACK: {
    BASE: '/admin/feedback',
    BY_ID: (id) => `/admin/feedback/${id}`,
    RESOLVE: (id) => `/admin/feedback/${id}/resolve`
  },

  // Settings & Privacy
  SETTINGS: {
    OUTLET: '/admin/settings/outlet',
    PAYMENTS: '/admin/settings/payments',
    RULES: '/admin/settings/rules',
    PRIVACY: '/admin/settings/privacy',
    PRIVACY_REQUESTS: '/admin/settings/privacy/requests',
    UPDATE_REQUEST_STATUS: (id) => `/admin/settings/privacy/requests/${id}/status`
  }
};

export default API_ENDPOINTS;

