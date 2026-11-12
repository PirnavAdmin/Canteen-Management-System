/**
 * Reports & Analytics API Service
 * Pure live integration with .NET 8 Web API (Hostinger Cloud MySQL DB).
 * No mock data, no localStorage caching, no simulated fallbacks.
 */

import { apiClient, API_ENDPOINTS } from '../../../../services/api';

export const reportService = {
  getReportData: async (reportType = 'sales_summary', filters = {}) => {
    const isItemWise = reportType === 'item_wise' || reportType === 'items';
    const endpoint = isItemWise ? API_ENDPOINTS.REPORTS.ITEMS : API_ENDPOINTS.REPORTS.SALES;
    const response = await apiClient.get(endpoint, { ...filters, reportType });
    return response?.data ?? response;
  },

  exportReport: async (reportType, format = 'csv', filters = {}) => {
    const response = await apiClient.get(API_ENDPOINTS.REPORTS.EXPORT, {
      ...filters,
      reportType,
      format
    });
    return response?.data ?? response;
  }
};

export default reportService;
