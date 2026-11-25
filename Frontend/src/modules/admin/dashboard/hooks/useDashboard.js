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

      // Filter & merge live orders to only include orders placed today (both active and today's orders)
      const liveList = Array.isArray(live) ? live : (Array.isArray(live?.data) ? live.data : []);
      const orderDateMap = new Map();
      rawOrders.forEach(o => {
        const id = o.id || o.orderId || o.OrderId || o.order_id;
        const oDate = new Date(o.orderDate || o.OrderDate || o.createdAt || o.CreatedAt || 0);
        if (id && !isNaN(oDate.getTime())) {
          orderDateMap.set(String(id), oDate);
        }
      });
      const todayMinutesSinceMidnight = today.getHours() * 60 + today.getMinutes();

      const todayOrdersList = [];
      const seenOrderIds = new Set();

      // 1. Process active live orders from liveList (ensuring they belong to today and match outlet)
      liveList.forEach(o => {
        if (!matchesOutlet(o)) return;
        const id = String(o.id || o.orderId || '');
        const directDate = o.orderDate || o.createdAt || o.date;
        let isToday = false;

        if (id && orderDateMap.has(id)) {
          isToday = orderDateMap.get(id).toDateString() === todayDateStr;
        } else if (directDate) {
          const d = new Date(directDate);
          isToday = !isNaN(d.getTime()) && d.toDateString() === todayDateStr;
        } else if (o.elapsedTime) {
          if (!/d|day/i.test(o.elapsedTime)) {
            const match = String(o.elapsedTime).match(/(\d+)\s*m/i);
            if (match) {
              const mins = parseInt(match[1], 10);
              isToday = mins <= (todayMinutesSinceMidnight + 30);
            }
          }
        } else {
          isToday = true;
        }

        if (isToday) {
          if (id) seenOrderIds.add(id);
          todayOrdersList.push({
            ...o,
            id: o.id || o.orderId,
            orderId: o.orderId || o.id,
            token: o.token || 'TKN',
            customer: o.customer || o.customerName || 'Customer',
            customerName: typeof o.customer === 'object' ? (o.customer?.name || o.customer?.fullName || 'Customer') : (o.customer || o.customerName || 'Customer'),
            customerRole: typeof o.customer === 'object' ? (o.customer?.role || 'Student') : (o.customerRole || 'Student'),
            outletName: o.outletName || o.OutletName || 'Main Canteen',
            outletCode: o.outletCode || o.OutletCode || '',
            items: o.items || [],
            total: Number(o.total ?? o.totalAmount ?? 0),
            totalAmount: Number(o.totalAmount ?? o.total ?? 0),
            status: o.status || 'Preparing',
            elapsedTime: o.elapsedTime || 'Live',
            orderTime: o.orderTime || '',
            orderDate: o.orderDate || (id && orderDateMap.has(id) ? orderDateMap.get(id).toISOString() : null)
          });
        }
      });

      // 2. Process today's orders from rawOrders (handles completed orders or orders not returned by liveList)
      rawOrders.forEach(o => {
        if (!matchesOutlet(o)) return;
        const oDate = new Date(o.orderDate || o.OrderDate || o.createdAt || o.CreatedAt || 0);
        if (isNaN(oDate.getTime()) || oDate.toDateString() !== todayDateStr) return;

        const id = String(o.id || o.orderId || o.OrderId || '');
        if (id && seenOrderIds.has(id)) return;
        if (id) seenOrderIds.add(id);

        const statusStr = String(o.status || o.Status || '').toLowerCase();
        if (statusStr === 'cancelled') return;

        const diffMs = Math.max(0, today.getTime() - oDate.getTime());
        const diffMins = Math.floor(diffMs / 60000);
        const orderTimeStr = oDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

        todayOrdersList.push({
          id: o.id || o.orderId,
          orderId: o.orderId || o.id,
          token: o.token || 'TKN',
          customer: o.customer || o.customerName || 'Customer',
          customerName: typeof o.customer === 'object' ? (o.customer?.name || o.customer?.fullName || 'Customer') : (o.customer || o.customerName || 'Customer'),
          customerRole: typeof o.customer === 'object' ? (o.customer?.role || 'Student') : (o.customerRole || 'Student'),
          outletId: o.outletId || o.OutletId,
          outletName: o.outletName || o.OutletName || 'Main Canteen',
          outletCode: o.outletCode || o.OutletCode || '',
          items: Array.isArray(o.items) ? o.items.map(it => ({
            name: it.name || it.itemName || 'Item',
            qty: it.quantity || it.qty || 1,
            price: it.price || 0
          })) : [],
          itemCount: Array.isArray(o.items) ? o.items.length : (o.itemCount || 1),
          total: Number(o.totalAmount ?? o.TotalAmount ?? o.total ?? 0),
          totalAmount: Number(o.totalAmount ?? o.TotalAmount ?? o.total ?? 0),
          status: o.status || o.Status || 'Preparing',
          elapsedTime: `${diffMins}m`,
          orderTime: orderTimeStr,
          orderDate: o.orderDate || o.OrderDate || o.createdAt
        });
      });

      // 3. Sort orders: active statuses (Preparing, Ready, Accepted, Placed) first, then Completed/Collected, most recent first
      const statusPriority = {
        'preparing': 1,
        'ready for pickup': 2,
        'ready': 2,
        'accepted': 3,
        'placed': 4,
        'new': 4,
        'completed': 5,
        'collected': 5
      };

      todayOrdersList.sort((a, b) => {
        const sA = statusPriority[String(a.status || '').toLowerCase()] || 99;
        const sB = statusPriority[String(b.status || '').toLowerCase()] || 99;
        if (sA !== sB) return sA - sB;
        const tA = new Date(a.orderDate || a.createdAt || 0).getTime();
        const tB = new Date(b.orderDate || b.createdAt || 0).getTime();
        return tB - tA;
      });

      setLiveOrders(todayOrdersList);
      
      const sortedTop = (Array.isArray(top) ? top : (Array.isArray(top?.data) ? top.data : []))
        .slice()
        .sort((a, b) => {
          const countA = Number(a.count ?? a.qtySold ?? a.orders ?? 0);
          const countB = Number(b.count ?? b.qtySold ?? b.orders ?? 0);
          return countB - countA;
        });
      setTopSelling(sortedTop);
      setStockAlerts(alerts);
      const filteredOutletSales = (Array.isArray(outlets) ? outlets : []).filter(o => {
        const oid = Number(o.outletId || o.id);
        const name = (o.name || o.outletName || '').toLowerCase();
        const code = (o.code || '').toUpperCase();
        return oid !== 4 && code !== 'WH-01' && !name.includes('warehouse');
      });
      setOutletSales(filteredOutletSales);
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
    // Auto-refresh periodically (every 60s) so live queue stays updated and day rollover is handled
    const timer = setInterval(() => {
      fetchDashboardData();
    }, 60000);
    return () => clearInterval(timer);
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
