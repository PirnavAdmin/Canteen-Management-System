import { useState, useEffect, useCallback } from 'react';
import { reportService } from '../services/reportService';
import { useToast } from '../../../../app/providers/ToastProvider';

export const useReports = (reportType = 'sales_summary', filters = {}) => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { error: toastError } = useToast();

  const { outlet, dateRange, payment, campus } = filters;

  const loadReport = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await reportService.getReportData(reportType, { outlet, dateRange, payment, campus });
      setReportData(data);
    } catch (err) {
      console.error('Failed to load report:', err);
      setError(err.message || 'Error loading report');
      toastError('Report Error', 'Could not compile statistical report.');
    } finally {
      setLoading(false);
    }
  }, [reportType, outlet, dateRange, payment, campus, toastError]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  return {
    reportData,
    loading,
    error,
    refreshReport: loadReport
  };
};

export default useReports;
