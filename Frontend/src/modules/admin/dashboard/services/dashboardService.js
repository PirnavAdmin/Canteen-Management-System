/**
 * Dashboard API Service
 * Pure live integration with .NET 8 Web API (Hostinger Cloud MySQL DB).
 * No mock data, no localStorage caching, no simulated fallbacks.
 */

import { apiClient, API_ENDPOINTS } from '../../../../services/api';

export const dashboardService = {
  getSummary: async (outletId = 'ALL') => {
    const params = outletId && outletId !== 'ALL' ? { outletId: Number(outletId) } : {};
    const response = await apiClient.get(API_ENDPOINTS.DASHBOARD.SUMMARY, params);
    return response?.data ?? response;
  },

  getHourlySales: async (outletId = 'ALL') => {
    const params = outletId && outletId !== 'ALL' ? { outletId: Number(outletId) } : {};
    const response = await apiClient.get(API_ENDPOINTS.DASHBOARD.HOURLY_SALES, params);
    return response?.data ?? response;
  },

  getLiveOrders: async (outletId = 'ALL') => {
    const params = outletId && outletId !== 'ALL' ? { outletId: Number(outletId) } : {};
    const response = await apiClient.get(API_ENDPOINTS.DASHBOARD.LIVE_ORDERS, params);
    return response?.data ?? response;
  },

  getTopSelling: async (outletId = 'ALL') => {
    const params = outletId && outletId !== 'ALL' ? { outletId: Number(outletId) } : {};
    const response = await apiClient.get(API_ENDPOINTS.DASHBOARD.TOP_SELLING, params);
    return response?.data ?? response;
  },

  getStockAlerts: async () => {
    const response = await apiClient.get(API_ENDPOINTS.DASHBOARD.STOCK_ALERTS);
    return response?.data ?? response;
  },

  getOutletSales: async () => {
    const response = await apiClient.get(API_ENDPOINTS.DASHBOARD.OUTLET_SALES);
    return response?.data ?? response;
  }
};

export default dashboardService;
