/**
 * Centralized API Endpoint Definitions
 * Maps to backend .NET 8 Web API routes (api/v1/...)
 */

export const API_ENDPOINTS = {
  // Authentication & Session
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    ME: '/auth/me'
  },

  // Outlets (Canteen Outlets)
  OUTLETS: {
    BASE: '/canteen-outlets',
    BY_ID: (id) => `/canteen-outlets/${id}`,
    STATS: '/canteen-outlets/stats',
    TOGGLE_STATUS: (id) => `/canteen-outlets/${id}/status`,
    SETTINGS: (id) => `/canteen-outlets/${id}/settings`
  },

  // Food Categories
  CATEGORIES: {
    BASE: '/canteen-categories',
    BY_ID: (id) => `/canteen-categories/${id}`,
    TOGGLE_STATUS: (id) => `/canteen-categories/${id}/status`
  },

  // Menu Management
  MENU: {
    BASE: '/canteen-menu',
    BY_ID: (id) => `/canteen-menu/${id}`,
    TOGGLE_STATUS: (id) => `/canteen-menu/${id}/status`,
    TOGGLE_PUBLISH: (id) => `/canteen-menu/${id}/publish`
  },

  // Time Slots
  SLOTS: {
    BASE: '/canteen-slots',
    BY_ID: (id) => `/canteen-slots/${id}`,
    UPDATE_CAPACITY: (id) => `/canteen-slots/${id}/capacity`,
    TOGGLE_STATUS: (id) => `/canteen-slots/${id}/status`
  },

  // Orders
  ORDERS: {
    BASE: '/canteen-orders',
    BY_ID: (id) => `/canteen-orders/${id}`,
    UPDATE_STATUS: (id) => `/canteen-orders/${id}/status`,
    CANCEL: (id) => `/canteen-orders/${id}/cancel`,
    REFUND: (id) => `/canteen-orders/${id}/refund`,
    PROCESS_REFUND: (id) => `/canteen-orders/${id}/refund`
  },

  // Dashboard & Analytics
  DASHBOARD: {
    SUMMARY: '/canteen-dashboard/summary',
    HOURLY_SALES: '/canteen-dashboard/hourly-sales',
    LIVE_ORDERS: '/canteen-dashboard/live-orders',
    TOP_SELLING: '/canteen-dashboard/top-selling',
    STOCK_ALERTS: '/canteen-dashboard/stock-alerts',
    OUTLET_SALES: '/canteen-dashboard/outlet-sales'
  },

  // Inventory
  INVENTORY: {
    ITEMS: '/canteen-inventory/items',
    STOCK_MOVEMENT: '/canteen-inventory/movements',
    LEDGER: '/canteen-inventory/ledger',
    PURCHASE_ORDERS: '/canteen-inventory/purchase-orders',
    PO_UPDATE_STATUS: (id) => `/canteen-inventory/purchase-orders/${id}/status`,
    SUPPLIERS: '/canteen-inventory/suppliers'
  },

  // Feedback & Grievances
  FEEDBACK: {
    BASE: '/canteen-feedback',
    BY_ID: (id) => `/canteen-feedback/${id}`,
    RESOLVE: (id) => `/canteen-feedback/${id}/resolve`
  },

  // Reports
  REPORTS: {
    SALES: '/canteen-reports/sales',
    ITEMS: '/canteen-reports/items',
    EXPORT: '/canteen-reports/export'
  },

  // Media Uploads
  MEDIA: {
    UPLOAD: '/media/upload',
    MENU_UPLOAD: '/canteen-menu/upload-image'
  },

  // System Settings & Privacy
  SETTINGS: {
    BASE: '/canteen-settings',
    OUTLET: '/canteen-settings/outlet',
    PAYMENTS: '/canteen-settings/payments',
    RULES: '/canteen-settings/rules',
    PRIVACY: '/canteen-settings/privacy',
    UPDATE_REQUEST_STATUS: (id) => `/canteen-settings/dsar/${id}`
  }
};

export default API_ENDPOINTS;
