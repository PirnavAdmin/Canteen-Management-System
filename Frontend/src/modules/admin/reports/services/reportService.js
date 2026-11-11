/**
 * Reports & Analytics API Service
 */

import { apiClient, API_ENDPOINTS } from '../../../../services/api';
import { INITIAL_REPORT_DATA } from '../constants/reportConstants';

export const reportService = {
  getReportData: async (reportType, filters = {}) => {
    try {
      const endpoint = API_ENDPOINTS.REPORTS[reportType.toUpperCase()] || API_ENDPOINTS.REPORTS.SALES;
      return await apiClient.get(endpoint, { ...filters, reportType });
    } catch {
      return INITIAL_REPORT_DATA[reportType] || INITIAL_REPORT_DATA.sales_summary;
    }
  }
};

export default reportService;
