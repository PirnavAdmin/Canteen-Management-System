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

  // Slots
  SLOTS: {
    BASE: '/canteen-slots',
    BY_ID: (id) => `/canteen-slots/${id}`
  },

  // Orders
  ORDERS: {
    BASE: '/canteen-orders',
    BY_ID: (id) => `/canteen-orders/${id}`,
    VERIFY_PICKUP: '/canteen-orders/verify-pickup',
    STATIONS: '/canteen-orders/stations',
    KDS: '/canteen-orders/kds',
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
    ITEM_BY_ID: (id) => `/canteen-inventory/items/${id}`,
    BATCHES: '/canteen-inventory/batches',
    STOCK_MOVEMENT: '/canteen-inventory/movements',
    LEDGER: '/canteen-inventory/ledger',
    STOCK_REQUESTS: '/canteen-inventory/stock-requests',
    STOCK_REQUEST_BY_ID: (id) => `/canteen-inventory/stock-requests/${id}`,
    STOCK_REQUEST_DISPATCH: (id) => `/canteen-inventory/stock-requests/${id}/dispatch`,
    STOCK_REQUEST_RECEIVED: (id) => `/canteen-inventory/stock-requests/${id}/received`,
    STOCK_REQUEST_REJECT: (id) => `/canteen-inventory/stock-requests/${id}/reject`,
    PURCHASE_ORDERS: '/canteen-inventory/purchase-orders',
    PO_UPDATE_STATUS: (id) => `/canteen-inventory/purchase-orders/${id}/status`,
    SUPPLIERS: '/canteen-inventory/suppliers',
    SUPPLIER_BY_ID: (id) => `/canteen-inventory/suppliers/${id}`,
    SUPPLIER_STATUS: (id) => `/canteen-inventory/suppliers/${id}/status`
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

  // System Settings
  SETTINGS: {
    BASE: '/canteen-settings',
    PUBLIC_PAYMENT_CONFIG: '/canteen-settings/public-payment-config',
    PAYMENTS: '/canteen-settings/payments',
    RULES: '/canteen-settings/rules'
  },

  // Payment Gateway & Transactions
  PAYMENTS: {
    CONFIG: '/payments/config',
    CREATE_INTENT: '/payments/create-intent',
    STATUS: (orderId) => `/payments/status/${orderId}`,
    VERIFY: '/payments/verify',
    WEBHOOK: '/payments/webhook'
  }
};

export default API_ENDPOINTS;
