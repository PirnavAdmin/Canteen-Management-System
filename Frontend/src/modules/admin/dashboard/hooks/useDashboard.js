import { useState, useEffect, useCallback } from 'react';
import { dashboardService } from '../services/dashboardService';
import { orderService } from '../../orders/services/orderService';
import { inventoryService } from '../../inventory/services/inventoryService';
import { canteenService } from '../../outlets/services/canteenService';
import { feedbackService } from '../../feedback/services/feedbackService';
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
  const [kitchenRequests, setKitchenRequests] = useState([]);
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
      const isAllOutlets = !selectedOutlet || selectedOutlet === 'ALL';
      const outletParams = !isAllOutlets ? { outletId: Number(selectedOutlet) } : {};
      
      // When 'ALL' is selected in navbar, query all inventory stock across all outlets.
      // When a specific outlet is selected, query that specific outlet's inventory with outletId.
      const inventoryParams = isAllOutlets
        ? {}
        : { outletId: Number(selectedOutlet) };

      // For stock requests:
      // When all outlets selected, query all stock requests; when a specific outlet selected, query for that outlet.
      const requestParams = isAllOutlets ? {} : { outletId: Number(selectedOutlet) };

      const feedbackParams = (selectedOutlet && selectedOutlet !== 'ALL') ? { outletId: Number(selectedOutlet) } : {};

      const [sum, live, top, outlets, allOrdersRaw, allInventoryRaw, allCanteensRaw, allStockRequestsRaw, allFeedbacksRaw] = await Promise.all([
        dashboardService.getSummary(selectedOutlet).catch(() => ({})),
        dashboardService.getLiveOrders(selectedOutlet).catch(() => []),
        dashboardService.getTopSelling(selectedOutlet).catch(() => []),
        dashboardService.getOutletSales().catch(() => []),
        orderService.getAll(outletParams).catch(() => []),
        inventoryService.getItems(inventoryParams).catch(() => []),
        canteenService.getAll().catch(() => []),
        inventoryService.getStockRequests(requestParams).catch(() => []),
        feedbackService.getAll(feedbackParams).catch(() => [])
      ]);

      const rawOrders = Array.isArray(allOrdersRaw)
        ? allOrdersRaw
        : (Array.isArray(allOrdersRaw?.items)
            ? allOrdersRaw.items
            : (Array.isArray(allOrdersRaw?.data)
                ? allOrdersRaw.data
                : []));

      // Build an outlet map to ensure accurate outlet naming across campus
      const outletMap = new Map();
      const canteensList = Array.isArray(allCanteensRaw) ? allCanteensRaw : (allCanteensRaw?.data || []);
      canteensList.forEach(c => {
        const cid = Number(c.id || c.outletId);
        if (cid) outletMap.set(cid, c.name || c.outletName || `Outlet #${cid}`);
      });
      const outletsList = Array.isArray(outlets) ? outlets : (outlets?.data || []);
      outletsList.forEach(o => {
        const oid = Number(o.id || o.outletId);
        if (oid && !outletMap.has(oid)) outletMap.set(oid, o.name || o.outletName || `Outlet #${oid}`);
      });

      const matchesOutlet = (o) => {
        if (!selectedOutlet || selectedOutlet === 'ALL') return true;
        const oOutletId = o.outletId ?? o.OutletId;
        if (oOutletId) return Number(oOutletId) === Number(selectedOutlet);
        const oName = String(o.outletName || o.outlet || '').toLowerCase();
        const targetName = String(outletMap.get(Number(selectedOutlet)) || '').toLowerCase();
        return Boolean(oName && targetName && (oName.includes(targetName) || targetName.includes(oName)));
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

      // Process recent kitchen stock request for the KPI card
      const rawStockRequests = Array.isArray(allStockRequestsRaw)
        ? allStockRequestsRaw
        : (Array.isArray(allStockRequestsRaw?.data)
            ? allStockRequestsRaw.data
            : (Array.isArray(allStockRequestsRaw?.requests)
                ? allStockRequestsRaw.requests
                : []));

      const outletStockRequests = isAllOutlets
        ? rawStockRequests
        : rawStockRequests.filter(r => {
            const oid = Number(r.outletId ?? r.OutletId);
            if (oid) return oid === Number(selectedOutlet);
            const rName = String(r.outletName || r.outlet || '').toLowerCase();
            const targetName = String(outletMap.get(Number(selectedOutlet)) || '').toLowerCase();
            if (rName && targetName && (rName.includes(targetName) || targetName.includes(rName))) {
              return true;
            }
            return false;
          });

      // Show ONLY kitchen requests which are not accepted or issued (exclude issued, dispatched, approved, accepted, received, completed, rejected)
      const requestedStockRequests = outletStockRequests.filter(r => {
        const s = String(r.status || 'Pending').toLowerCase();
        const isIssued = s.includes('issued') || s.includes('dispatch') || s.includes('approved') || s.includes('accept');
        const isCompleted = s.includes('received') || s.includes('collected') || s.includes('fulfilled') || s.includes('completed');
        const isRejected = s.includes('reject');
        return !isIssued && !isCompleted && !isRejected;
      });

      const sortedStockRequests = [...requestedStockRequests]
        .map(r => {
          let status = r.status || 'Pending';
          const s = String(status).toLowerCase();
          if (s.includes('pending review') || s.includes('review') || s === 'pending' || s === 'requested') {
            status = 'Pending';
          }
          return {
            ...r,
            status
          };
        })
        .sort((a, b) => {
          const dateA = new Date(a.createdAt || a.requestDate || a.date || 0).getTime();
          const dateB = new Date(b.createdAt || b.requestDate || b.date || 0).getTime();
          return dateB - dateA;
        });

      const recentKitchenRequest = sortedStockRequests[0] || null;
      setKitchenRequests(sortedStockRequests);

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
        monthlyRevenue,
        recentKitchenRequest
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
      
      const feedbacksList = Array.isArray(allFeedbacksRaw)
        ? allFeedbacksRaw
        : (Array.isArray(allFeedbacksRaw?.data) ? allFeedbacksRaw.data : []);

      // 1. Analyze actual customer orders to identify which items have been ordered
      const liveOrderItemsMap = new Map();
      validOrders.forEach(o => {
        const oItems = Array.isArray(o.items) ? o.items : (Array.isArray(o.Items) ? o.Items : []);
        oItems.forEach(it => {
          const rawName = it.name || it.Name || it.itemName || '';
          const nameTrimmed = String(rawName).trim();
          if (!nameTrimmed) return;
          const key = nameTrimmed.toLowerCase();
          const qty = Number(it.quantity ?? it.Quantity ?? it.qty ?? 1) || 1;
          const price = Number(it.price ?? it.Price ?? 0);
          const total = Number(it.total ?? it.Total ?? (price * qty)) || 0;
          const itemId = it.menuItemId ?? it.MenuItemId ?? it.id;

          if (!liveOrderItemsMap.has(key)) {
            liveOrderItemsMap.set(key, {
              id: itemId,
              menuItemId: itemId,
              name: nameTrimmed,
              code: it.code || '',
              category: it.category || 'Executive Lunch & Thali Meals',
              foodType: it.foodType || (key.includes('chicken') || key.includes('meat') || key.includes('egg') || key.includes('biryani') ? 'Non-veg' : 'Veg'),
              liveQtySold: qty,
              liveOrderCount: 1,
              revenue: total
            });
          } else {
            const entry = liveOrderItemsMap.get(key);
            entry.liveQtySold += qty;
            entry.liveOrderCount += 1;
            entry.revenue += total;
            if (!entry.id && itemId) entry.id = itemId;
          }
        });
      });

      // 2. Merge with items from getTopSelling endpoint
      const rawTopList = Array.isArray(top) ? top : (Array.isArray(top?.data) ? top.data : []);
      const mergedItemsMap = new Map();

      liveOrderItemsMap.forEach((val, key) => {
        mergedItemsMap.set(key, { ...val, count: val.liveQtySold, qtySold: val.liveQtySold });
      });

      rawTopList.forEach(t => {
        const nameTrimmed = String(t.name || '').trim();
        if (!nameTrimmed) return;
        const key = nameTrimmed.toLowerCase();
        const topQty = Number(t.count ?? t.qtySold ?? t.orders ?? 0);
        if (mergedItemsMap.has(key)) {
          const existing = mergedItemsMap.get(key);
          existing.qtySold = Math.max(existing.qtySold, topQty);
          existing.count = existing.qtySold;
          if (t.id && !existing.id) existing.id = t.id;
          if (t.foodType) existing.foodType = t.foodType;
          if (t.category) existing.category = t.category;
        } else {
          mergedItemsMap.set(key, {
            ...t,
            name: nameTrimmed,
            liveQtySold: 0,
            liveOrderCount: 0,
            count: topQty,
            qtySold: topQty
          });
        }
      });

      // 3. Match genuine feedback and ratings for each dish
      const processedTopSelling = Array.from(mergedItemsMap.values()).map(item => {
        const nameLower = (item.name || '').trim().toLowerCase();
        const itemNorm = nameLower.replace(/[^a-z0-9]/g, '');
        const itemIdStr = String(item.id || item.menuItemId || item.code || '').trim();

        // Find genuine feedback reviews matching this dish
        const dishFeedbacks = feedbacksList.filter(f => {
          if (!f) return false;
          const ratingVal = Number(f.rating);
          if (isNaN(ratingVal) || ratingVal <= 0) return false;

          const fCat = String(f.complaintCategory || '').trim().toLowerCase();
          const fCatNorm = fCat.replace(/[^a-z0-9]/g, '');
          const fComments = String(f.comments || '').trim().toLowerCase();
          const fItemId = String(f.itemId || f.menuItemId || '').trim();

          // 1. Direct item ID match
          if (itemIdStr && fItemId && fItemId === itemIdStr) return true;

          // 2. Exact match on complaintCategory (e.g. "khaidi chicken dum biryani", "dosa", "chicken 65")
          if (fCat && (fCat === nameLower || fCatNorm === itemNorm)) return true;

          // 3. Comments contains exact dish name or "dish: <name>"
          if (nameLower && (
            fComments.includes(`dish: ${nameLower}`) ||
            fComments.includes(`dish: [${nameLower}]`) ||
            fComments.includes(`(${nameLower})`)
          )) {
            return true;
          }

          // 4. Normalized containment if string is reasonably specific (>= 5 chars)
          if (itemNorm.length >= 5 && fCatNorm.length >= 5 && (fCatNorm.includes(itemNorm) || itemNorm.includes(fCatNorm))) {
            return true;
          }

          return false;
        });

        const liveReviewsCount = dishFeedbacks.length;
        const liveRatingSum = dishFeedbacks.reduce((acc, f) => acc + Number(f.rating || 0), 0);

        // Pure genuine rating: average rating = sum of all ratings / total number of all ratings
        // If the dish has no ratings, show 0 rating
        const averageRating = liveReviewsCount > 0
          ? (liveRatingSum / liveReviewsCount).toFixed(1)
          : '0';

        return {
          ...item,
          averageRating,
          rating: averageRating,
          reviewCount: liveReviewsCount
        };
      });

      // 4. Sort: Highly ordered food and highest rating at the top
      processedTopSelling.sort((a, b) => {
        const liveA = Number(a.liveQtySold || 0);
        const liveB = Number(b.liveQtySold || 0);
        const ratingA = Number(a.averageRating || 0);
        const ratingB = Number(b.averageRating || 0);
        const reviewsA = Number(a.reviewCount || 0);
        const reviewsB = Number(b.reviewCount || 0);
        const totalQtyA = Number(a.qtySold || a.count || 0);
        const totalQtyB = Number(b.qtySold || b.count || 0);

        // Dishes with both actual orders and ratings rank first
        const hasLiveAndRatingA = (liveA > 0 || totalQtyA > 0) && reviewsA > 0;
        const hasLiveAndRatingB = (liveB > 0 || totalQtyB > 0) && reviewsB > 0;
        if (hasLiveAndRatingA && !hasLiveAndRatingB) return -1;
        if (!hasLiveAndRatingA && hasLiveAndRatingB) return 1;

        if (hasLiveAndRatingA && hasLiveAndRatingB) {
          if (ratingB !== ratingA) return ratingB - ratingA;
          return totalQtyB - totalQtyA;
        }

        // Dishes with live orders
        if (liveA > 0 && liveB <= 0) return -1;
        if (liveB > 0 && liveA <= 0) return 1;
        if (liveA > 0 && liveB > 0) {
          if (ratingB !== ratingA) return ratingB - ratingA;
          return liveB - liveA;
        }

        // Dishes with reviews
        if (reviewsA > 0 && reviewsB <= 0) return -1;
        if (reviewsB > 0 && reviewsA <= 0) return 1;
        if (reviewsA > 0 && reviewsB > 0) {
          if (ratingB !== ratingA) return ratingB - ratingA;
          return reviewsB - reviewsA;
        }

        return totalQtyB - totalQtyA;
      });

      setTopSelling(processedTopSelling.slice(0, 5));

      // Identify Central Warehouse outlet
      const warehouseOutlet = canteensList.find(c => c.code === 'WH-01' || (c.name || '').toLowerCase().includes('warehouse') || Number(c.outletId || c.id) === 4);
      const warehouseOutletId = warehouseOutlet ? Number(warehouseOutlet.outletId || warehouseOutlet.id) : 4;

      const isWarehouseItem = (item) => {
        const itemOid = item.outletId ?? item.OutletId;
        return (
          item.storeType === 'CentralWarehouse' ||
          Boolean(item.warehouseId) ||
          Number(itemOid) === warehouseOutletId ||
          (!itemOid && !item.outletId)
        );
      };

      // Process low stock items strictly from live inventory
      const rawInventory = Array.isArray(allInventoryRaw) ? allInventoryRaw : (allInventoryRaw?.data || []);
      const finalAlerts = rawInventory
        .filter(item => {
          const isWH = isWarehouseItem(item);
          if (!isAllOutlets) {
            // When a specific outlet is selected in navbar, show that specific outlet's items
            const targetOid = Number(selectedOutlet);
            const itemOid = item.outletId ?? item.OutletId;
            if (itemOid !== undefined && itemOid !== null) {
              if (Number(itemOid) !== targetOid) return false;
            } else if (isWH) {
              if (targetOid !== warehouseOutletId) return false;
            } else {
              return false;
            }
          }
          // When isAllOutlets is true, show items across ALL outlets and warehouse

          const qty = Number(item.availableQuantity ?? item.quantity ?? 0);
          const reorder = Number(item.reorderLevel ?? 0);
          const status = (item.status || '').toLowerCase();
          const isExp = item.expiryDate && new Date(item.expiryDate) < new Date();
          return qty <= reorder || status === 'low stock' || status === 'out of stock' || status === 'expired' || isExp;
        })
        .map(item => {
          const itemOid = item.outletId ?? item.OutletId ?? (isWarehouseItem(item) ? warehouseOutletId : null);
          const resolvedOutletId = itemOid || (!isAllOutlets ? Number(selectedOutlet) : null);
          const displayOutletName = item.outletName || item.warehouseName || (itemOid ? outletMap.get(Number(itemOid)) : null) || (isWarehouseItem(item) ? 'Central Procurement Warehouse (Admin Master Store)' : (itemOid ? `Outlet #${itemOid}` : 'Kitchen Outlet'));

          const qty = Number(item.availableQuantity ?? item.quantity ?? 0);
          const reorder = Number(item.reorderLevel ?? 0);
          let status = item.status || 'Low Stock';
          if (item.expiryDate && new Date(item.expiryDate) < new Date()) {
            status = 'Expired';
          } else if (qty <= 0 || (item.status || '').toLowerCase() === 'out of stock') {
            status = 'Out of Stock';
          } else if (qty <= reorder || (item.status || '').toLowerCase() === 'low stock') {
            status = 'Low Stock';
          }
          return {
            id: item.id || item.itemId || item.ItemId,
            itemId: item.itemId || item.ItemId || item.id,
            ingredient: item.ingredientName || item.name || 'Item',
            ingredientName: item.ingredientName || item.name || 'Item',
            outletId: resolvedOutletId,
            outlet: displayOutletName,
            outletName: displayOutletName,
            availableQuantity: qty,
            available: `${qty} ${item.unit || 'kg'}`,
            unit: item.unit || 'kg',
            reorderLevel: reorder,
            status
          };
        })
        .sort((a, b) => {
          const getPriority = (st) => {
            const s = (st || '').toLowerCase();
            if (s === 'expired') return 1;
            if (s === 'out of stock') return 2;
            if (s === 'low stock') return 3;
            return 4;
          };
          const pDiff = getPriority(a.status) - getPriority(b.status);
          if (pDiff !== 0) return pDiff;
          return Number(a.availableQuantity || 0) - Number(b.availableQuantity || 0);
        });

      setStockAlerts(finalAlerts);

      // Build outlet-wise sales data accurately obeying navbar selection
      const rawOutletsList = Array.isArray(outlets)
        ? outlets
        : (Array.isArray(outlets?.data)
            ? outlets.data
            : (Array.isArray(outlets?.items)
                ? outlets.items
                : []));

      // Active non-warehouse canteens
      const activeCanteens = (Array.isArray(canteensList) ? canteensList : [])
        .filter(c => {
          const cid = Number(c.id || c.outletId);
          const cName = (c.name || c.outletName || '').toLowerCase();
          const cCode = (c.code || '').toUpperCase();
          return cid !== 4 && cCode !== 'WH-01' && !cName.includes('warehouse');
        });

      // Index backend sales by outletId
      const backendSalesMap = new Map();
      rawOutletsList.forEach(o => {
        const oid = Number(o.outletId || o.id);
        if (oid) backendSalesMap.set(oid, o);
      });

      // Compute today's completed/non-cancelled orders & revenue per outlet from rawOrders
      const liveOutletSalesMap = new Map();
      rawOrders.forEach(o => {
        const oDate = new Date(o.orderDate || o.OrderDate || o.createdAt || o.CreatedAt || 0);
        if (isNaN(oDate.getTime()) || oDate.toDateString() !== todayDateStr) return;
        const status = String(o?.status ?? o?.Status ?? '').trim().toLowerCase();
        if (status === 'cancelled') return;
        const oOid = Number(o.outletId ?? o.OutletId);
        if (!oOid) return;
        const amt = Number(o.totalAmount ?? o.TotalAmount ?? o.total ?? o.Total ?? 0);
        if (!liveOutletSalesMap.has(oOid)) {
          liveOutletSalesMap.set(oOid, { orders: 0, revenue: 0 });
        }
        const m = liveOutletSalesMap.get(oOid);
        m.orders += 1;
        m.revenue += amt;
      });

      // Merge backend sales data with known active canteens
      const baseOutlets = activeCanteens.length > 0 ? activeCanteens : rawOutletsList;
      const combinedOutletSales = baseOutlets
        .map(outlet => {
          const oid = Number(outlet.id || outlet.outletId);
          const bData = backendSalesMap.get(oid) || {};
          const lData = liveOutletSalesMap.get(oid) || { orders: 0, revenue: 0 };
          const orders = Math.max(Number(bData.orders || 0), lData.orders);
          const revenue = Math.max(Number(bData.revenue ?? bData.grossSales ?? 0), lData.revenue);
          const name = outlet.name || outlet.outletName || bData.name || bData.outletName || outletMap.get(oid) || `Outlet #${oid}`;

          return {
            outletId: oid,
            id: oid,
            name,
            outletName: name,
            orders,
            revenue,
            grossSales: revenue,
            netSales: revenue
          };
        })
        .filter(o => {
          const oid = Number(o.outletId || o.id);
          const name = (o.name || o.outletName || '').toLowerCase();
          return oid !== 4 && !name.includes('warehouse');
        });

      // Proportional percentages
      const totalOutletsRevenue = combinedOutletSales.reduce((acc, o) => acc + (o.revenue || 0), 0);
      const outletSalesWithPercentage = combinedOutletSales.map(o => ({
        ...o,
        percentage: totalOutletsRevenue > 0 ? Math.round((o.revenue / totalOutletsRevenue) * 100) : 0
      }));

      // Obey navbar outlet selection: show all if All Campus Outlets, or single outlet if specific outlet selected
      const finalOutletSales = !isAllOutlets
        ? outletSalesWithPercentage.filter(o => Number(o.outletId || o.id) === Number(selectedOutlet))
        : outletSalesWithPercentage;

      setOutletSales(finalOutletSales);
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

    const handleFeedbackUpdate = () => {
      fetchDashboardData();
    };
    window.addEventListener('cms:feedback_created', handleFeedbackUpdate);

    return () => {
      clearInterval(timer);
      window.removeEventListener('cms:feedback_created', handleFeedbackUpdate);
    };
  }, [fetchDashboardData]);

  return {
    loading,
    error,
    summary,
    salesData,
    liveOrders,
    topSelling,
    stockAlerts,
    kitchenRequests,
    outletSales,
    lastUpdated,
    recentKitchenRequest: summary?.recentKitchenRequest || null,
    refreshDashboard: fetchDashboardData
  };
};

export default useDashboard;
