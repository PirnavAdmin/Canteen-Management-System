/**
 * Dashboard API Service
 */

import { apiClient, API_ENDPOINTS } from '../../../../services/api';
import {
  INITIAL_DASHBOARD_SUMMARY,
  INITIAL_HOURLY_SALES,
  INITIAL_LIVE_ORDERS,
  INITIAL_TOP_SELLING,
  INITIAL_STOCK_ALERTS,
  INITIAL_OUTLET_SALES
} from '../constants/dashboardConstants';

export const dashboardService = {
  getSummary: async (outletId = 'ALL') => {
    try {
      const data = await apiClient.get(API_ENDPOINTS.DASHBOARD.SUMMARY, { outletId });
      return data;
    } catch {
      // Graceful fallback for mock/offline presentation
      return INITIAL_DASHBOARD_SUMMARY;
    }
  },

  getHourlySales: async (outletId = 'ALL') => {
    try {
      const data = await apiClient.get(API_ENDPOINTS.DASHBOARD.HOURLY_SALES, { outletId });
      return data;
    } catch {
      return INITIAL_HOURLY_SALES;
    }
  },

  getLiveOrders: async (outletId = 'ALL') => {
    try {
      const data = await apiClient.get(API_ENDPOINTS.DASHBOARD.LIVE_ORDERS, { outletId });
      return data;
    } catch {
      return INITIAL_LIVE_ORDERS;
    }
  },

  getTopSelling: async (outletId = 'ALL') => {
    try {
      const data = await apiClient.get(API_ENDPOINTS.DASHBOARD.TOP_SELLING, { outletId });
      return data;
    } catch {
      return INITIAL_TOP_SELLING;
    }
  },

  getStockAlerts: async () => {
    try {
      const data = await apiClient.get(API_ENDPOINTS.DASHBOARD.STOCK_ALERTS);
      return data;
    } catch {
      return INITIAL_STOCK_ALERTS;
    }
  },

  getOutletSales: async () => {
    try {
      const data = await apiClient.get(API_ENDPOINTS.DASHBOARD.OUTLET_SALES);
      return data;
    } catch {
      return INITIAL_OUTLET_SALES;
    }
  }
};

export default dashboardService;
