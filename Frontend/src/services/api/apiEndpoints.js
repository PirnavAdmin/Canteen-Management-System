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
    STATS: '/canteen-categories/stats',
    TOGGLE_STATUS: (id) => `/canteen-categories/${id}/status`,
    LOOKUP: '/canteen-categories/lookup'
  },

  // Menu Management
  MENU: {
    BASE: '/canteen-menu',
    BY_ID: (id) => `/canteen-menu/${id}`,
    TOGGLE_STATUS: (id) => `/canteen-menu/${id}/status`
  },

  // Orders
  ORDERS: {
    BASE: '/canteen-orders',
    BY_ID: (id) => `/canteen-orders/${id}`,
    UPDATE_STATUS: (id) => `/canteen-orders/${id}/status`,
    LIVE_QUEUE: '/canteen-orders/live-queue'
  },

  // Slots
  SLOTS: {
    BASE: '/canteen-slots',
    BY_ID: (id) => `/canteen-slots/${id}`
  },

  // Reports
  REPORTS: {
    SALES: '/canteen-reports/sales',
    EXPORT: '/canteen-reports/export'
  }
};

export default API_ENDPOINTS;
