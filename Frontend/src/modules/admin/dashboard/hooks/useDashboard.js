import { useState, useEffect, useCallback } from 'react';
import { dashboardService } from '../services/dashboardService';
import { orderService } from '../../orders/services/orderService';
import { useToast } from '../../../../app/providers/ToastProvider';
import { useAuth } from '../../../../app/providers/AuthProvider';

export const useDashboard = (selectedOutlet = 'ALL') => {
  const { role } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState(null);
  const [salesData, setSalesData] = useState({
    thisWeek: [],
    lastWeek: [],
    orders: []
  });
  const [liveOrders, setLiveOrders] = useState([]);
  const [topSelling, setTopSelling] = useState([]);
  const [stockAlerts, setStockAlerts] = useState([]);
  const [outletSales, setOutletSales] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(new Date());
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
      const outletParams = selectedOutlet && selectedOutlet !== 'ALL' ? { outletId: Number(selectedOutlet) } : {};
      
      const [sum, live, top, alerts, outlets, allOrdersRaw] = await Promise.all([
        dashboardService.getSummary(selectedOutlet).catch(() => ({})),
        dashboardService.getLiveOrders(selectedOutlet).catch(() => []),
        dashboardService.getTopSelling(selectedOutlet).catch(() => []),
        dashboardService.getStockAlerts().catch(() => []),
        dashboardService.getOutletSales().catch(() => []),
        orderService.getAll(outletParams).catch(() => [])
      ]);

      const rawOrders = Array.isArray(allOrdersRaw)
        ? allOrdersRaw
        : (Array.isArray(allOrdersRaw?.items)
            ? allOrdersRaw.items
            : (Array.isArray(allOrdersRaw?.data)
                ? allOrdersRaw.data
                : []));

      const matchesOutlet = (o) => {
        if (!selectedOutlet || selectedOutlet === 'ALL') return true;
        const oOutletId = o.outletId ?? o.OutletId;
        return Number(oOutletId) === Number(selectedOutlet);
      };

      // Filter non-cancelled orders for sales graphs
      const validOrders = rawOrders.filter(o => {
        if (!matchesOutlet(o)) return false;
        const s = String(o?.status ?? o?.Status ?? '').toLowerCase();
        return s !== 'cancelled';
      });

      const getMetrics = (o) => {
        const amount = Number(o.totalAmount ?? o.TotalAmount ?? o.total ?? o.Total ?? 0);
        const itemsCount = (Array.isArray(o.items) && o.items.length > 0)
          ? o.items.reduce((acc, it) => acc + (Number(it.quantity ?? it.Quantity ?? it.qty ?? it.Qty ?? 1) || 1), 0)
          : (Number(o.itemCount ?? o.ItemCount ?? 1) || 1);
        return { amount, itemsCount };
      };

      const today = new Date();
      const todayDateStr = today.toDateString();
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();

      // Compute Today's counts and Monthly Revenue directly for the KPI cards
      let todayOrdersCount = 0;
      let todayPending = 0;
      let todayAccepted = 0;
      let todayPreparing = 0;
      let todayReady = 0;
      let todayCompleted = 0;
      let todayCancelled = 0;
      let todayRevenue = 0;
      let monthlyRevenue = 0;

      rawOrders.forEach(o => {
        if (!matchesOutlet(o)) return;
        const oDate = new Date(o.orderDate || o.OrderDate || o.createdAt || o.CreatedAt || 0);
        if (isNaN(oDate.getTime())) return;

        const isToday = oDate.toDateString() === todayDateStr;
        const isThisMonth = oDate.getMonth() === currentMonth && oDate.getFullYear() === currentYear;
        const status = String(o?.status ?? o?.Status ?? '').trim().toLowerCase();
        const amount = Number(o.totalAmount ?? o.TotalAmount ?? o.total ?? o.Total ?? 0);

        // Monthly sales revenue (current month non-cancelled orders)
        if (isThisMonth && status !== 'cancelled') {
          monthlyRevenue += amount;
        }

        // Today's orders breakdown
        if (isToday) {
          todayOrdersCount += 1;
          if (status !== 'cancelled') {
            todayRevenue += amount;
          }

          if (status === 'placed' || status === 'new' || status === 'pending') {
            todayPending += 1;
          } else if (status === 'accepted') {
            todayAccepted += 1;
          } else if (status === 'preparing' || status === 'cooking' || status === 'in_progress') {
            todayPreparing += 1;
          } else if (status === 'ready for pickup' || status === 'ready') {
            todayReady += 1;
          } else if (status === 'completed' || status === 'collected') {
            todayCompleted += 1;
          } else if (status === 'cancelled') {
            todayCancelled += 1;
          }
        }
      });

      // Synchronize with backend summary if present
      if (sum) {
        if (Number(sum.todayRevenue || 0) > 0) {
          todayRevenue = Math.max(todayRevenue, Number(sum.todayRevenue));
        }
        if (monthlyRevenue === 0 && Number(sum.totalSales || 0) > 0) {
          monthlyRevenue = Number(sum.totalSales);
        }
      }

      const enrichedSummary = {
        ...(sum || {}),
        todayOrders: todayOrdersCount,
        todayPending,
        todayAccepted,
        todayPreparing,
        todayReady,
        todayCompleted,
        todayCancelled,
        todayRevenue,
        monthlyRevenue
      };

      // 1. THIS WEEK'S SALES (Monday through Sunday of current week)
      const currentDayOfWeek = today.getDay(); // Sunday = 0, Monday = 1 ... Saturday = 6
      const diffToMonday = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;
      const monday = new Date(today);
      monday.setDate(today.getDate() + diffToMonday);
      monday.setHours(0, 0, 0, 0);

      const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const thisWeek = dayNames.map((dayName, idx) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + idx);
        const dateKey = d.toDateString();
        const shortDate = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
        const fullLabel = d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
        const isToday = dateKey === today.toDateString();

        let daySales = 0;
        let dayItems = 0;
        let dayOrders = 0;

        validOrders.forEach(o => {
          const oDate = new Date(o.orderDate || o.OrderDate || o.createdAt || o.CreatedAt || 0);
          if (!isNaN(oDate.getTime()) && oDate.toDateString() === dateKey) {
            const { amount, itemsCount } = getMetrics(o);
            daySales += amount;
            dayItems += itemsCount;
            dayOrders += 1;
          }
        });

        if (isToday && todayRevenue > 0) {
          daySales = Math.max(daySales, todayRevenue);
        }

        return {
          day: dayName,
          label: dayName,
          shortDate,
          fullLabel,
          sales: daySales,
          items: dayItems,
          orders: dayOrders,
          isToday,
          isPastOrToday: d <= today
        };
      });

      // 2. LAST WEEK'S SALES (Monday through Sunday of the previous week)
      const lastMonday = new Date(monday);
      lastMonday.setDate(monday.getDate() - 7);
      const lastWeek = dayNames.map((dayName, idx) => {
        const d = new Date(lastMonday);
        d.setDate(lastMonday.getDate() + idx);
        const dateKey = d.toDateString();
        const shortDate = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
        const fullLabel = d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

        let daySales = 0;
        let dayItems = 0;
        let dayOrders = 0;

        validOrders.forEach(o => {
          const oDate = new Date(o.orderDate || o.OrderDate || o.createdAt || o.CreatedAt || 0);
          if (!isNaN(oDate.getTime()) && oDate.toDateString() === dateKey) {
            const { amount, itemsCount } = getMetrics(o);
            daySales += amount;
            dayItems += itemsCount;
            dayOrders += 1;
          }
        });

        return {
          day: dayName,
          label: dayName,
          shortDate,
          fullLabel,
          sales: daySales,
          items: dayItems,
          orders: dayOrders,
          isToday: false,
          isPastOrToday: true
        };
      });

      setSummary(enrichedSummary);
      setSalesData({
        thisWeek,
        lastWeek,
        orders: validOrders
      });
      setLiveOrders(live);
      setTopSelling(top);
      setStockAlerts(alerts);
      setOutletSales(outlets);
      setLastUpdated(new Date());
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
    salesData,
    liveOrders,
    topSelling,
    stockAlerts,
    outletSales,
    lastUpdated,
    refreshDashboard: fetchDashboardData
  };
};

export default useDashboard;
