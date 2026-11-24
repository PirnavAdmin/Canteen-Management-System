import { useState, useEffect, useCallback } from 'react';
import { dashboardService } from '../services/dashboardService';
import { useToast } from '../../../../app/providers/ToastProvider';
import { useAuth } from '../../../../app/providers/AuthProvider';

export const useDashboard = (selectedOutlet = 'ALL') => {
  const { role } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState(null);
  const [hourlySales, setHourlySales] = useState([]);
  const [liveOrders, setLiveOrders] = useState([]);
  const [topSelling, setTopSelling] = useState([]);
  const [stockAlerts, setStockAlerts] = useState([]);
  const [outletSales, setOutletSales] = useState([]);
  const { error: toastError } = useToast();

  const fetchDashboardData = useCallback(async () => {
    const roleStr = String(role || '').toUpperCase();
    if (roleStr && !roleStr.includes('ADMIN')) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const [sum, hourly, live, top, alerts, outlets] = await Promise.all([
        dashboardService.getSummary(selectedOutlet),
        dashboardService.getHourlySales(selectedOutlet),
        dashboardService.getLiveOrders(selectedOutlet),
        dashboardService.getTopSelling(selectedOutlet),
        dashboardService.getStockAlerts(),
        dashboardService.getOutletSales()
      ]);

      setSummary(sum);
      setHourlySales(hourly);
      setLiveOrders(live);
      setTopSelling(top);
      setStockAlerts(alerts);
      setOutletSales(outlets);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setError(err.message || 'Error loading dashboard metrics');
      const status = err?.status || err?.raw?.response?.status;
      if (status !== 401 && status !== 403) {
        toastError('Dashboard Error', 'Could not retrieve operational metrics.');
      }
    } finally {
      setLoading(false);
    }
  }, [selectedOutlet, toastError, role]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return {
    loading,
    error,
    summary,
    hourlySales,
    liveOrders,
    topSelling,
    stockAlerts,
    outletSales,
    refreshDashboard: fetchDashboardData
  };
};

export default useDashboard;
