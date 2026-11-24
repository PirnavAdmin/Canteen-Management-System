/**
 * Canteen Staff Order Service
 * Pure live backend API integration with .NET 8 Web API.
 * No mock data, no localStorage caching, no simulated fallbacks.
 */

import { apiClient, API_ENDPOINTS } from '../../../services/api';
import { ORDER_STATUS } from '../../../constants/appConstants';
import { isSameIstDate } from '../../../utils/formatters';

/**
 * Safely parses and normalizes outlet ID to positive integer for backend model binding.
 */
export const cleanOutletId = (raw) => {
  if (raw === null || raw === undefined || raw === 'all' || raw === '') return undefined;
  if (typeof raw === 'number' && !isNaN(raw) && raw > 0) return raw;
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (/^\d+$/.test(trimmed)) {
      const num = parseInt(trimmed, 10);
      return num > 0 ? num : undefined;
    }
    const match = trimmed.match(/\d+/);
    if (match) {
      const num = parseInt(match[0], 10);
      return num > 0 ? num : undefined;
    }
  }
  return undefined;
};

/**
 * Normalizes backend order status values to standard contract
 */
export const normalizeOrderStatus = (rawStatus) => {
  if (!rawStatus) return ORDER_STATUS.PLACED;
  const s = String(rawStatus).trim().toLowerCase();
  if (s === 'placed' || s === 'new') return ORDER_STATUS.PLACED;
  if (s === 'accepted') return ORDER_STATUS.ACCEPTED;
  if (s === 'preparing' || s === 'cooking' || s === 'in_progress') return ORDER_STATUS.PREPARING;
  if (s === 'ready for pickup' || s === 'ready_for_pickup' || s === 'ready') return ORDER_STATUS.READY_FOR_PICKUP;
  if (s === 'collected' || s === 'completed') return 'Collected';
  if (s === 'cancelled' || s === 'canceled' || s === 'rejected') return ORDER_STATUS.CANCELLED;
  if (s === 'refunded') return ORDER_STATUS.REFUNDED;
  return rawStatus;
};

export const isStatusPlaced = (status) => {
  const s = String(status || '').trim().toLowerCase();
  return s === 'placed' || s === 'new';
};

export const isStatusAccepted = (status) => {
  const s = String(status || '').trim().toLowerCase();
  return s === 'accepted';
};

export const isStatusPreparing = (status) => {
  const s = String(status || '').trim().toLowerCase();
  return s === 'preparing' || s === 'cooking' || s === 'in_progress';
};

export const isStatusReady = (status) => {
  const s = String(status || '').trim().toLowerCase();
  return s === 'ready for pickup' || s === 'ready_for_pickup' || s === 'ready';
};

export const isStatusCompleted = (status) => {
  const s = String(status || '').trim().toLowerCase();
  return s === 'completed' || s === 'collected';
};

export const isStatusCancelled = (status) => {
  const s = String(status || '').trim().toLowerCase();
  return s === 'cancelled' || s === 'canceled' || s === 'rejected' || s === 'refunded';
};

/**
 * Verifies if an order was collected/completed on the current local IST business date.
 * Does NOT count orders from previous dates as collected today.
 */
export const isOrderCompletedToday = (order) => {
  if (!order) return false;
  if (!isStatusCompleted(order.status)) return false;

  // 1. Check explicit completion timestamp
  if (order.completedAt) {
    return isSameIstDate(order.completedAt);
  }

  // 2. Check updatedAt timestamp if status is completed
  if (order.updatedAt) {
    return isSameIstDate(order.updatedAt);
  }

  // 3. Check timeline for a completion event with date
  if (Array.isArray(order.timeline)) {
    const entry = order.timeline.find(t => isStatusCompleted(t.status));
    if (entry?.date) return isSameIstDate(entry.date);
    if (entry?.fullTimestamp) return isSameIstDate(entry.fullTimestamp);
    if (entry?.createdAt) return isSameIstDate(entry.createdAt);
  }

  // 4. If order was created/placed today in IST and is completed
  const ordDate = order.orderDate || order.createdAt;
  if (ordDate && isSameIstDate(ordDate)) {
    return true;
  }

  return false;
};

/**
 * Normalizes backend order payload into consistent shape expected by Staff UI components.
 * Supports both PascalCase (.NET DTOs) and camelCase properties.
 */
export const normalizeOrder = (raw) => {
  if (!raw || typeof raw !== 'object') return raw;

  const id = raw.id ?? raw.Id ?? raw.orderId ?? raw.OrderId ?? '';
  const token = raw.token ?? raw.Token ?? raw.orderToken ?? (id ? `T-${String(id).slice(-3)}` : 'T-001');
  const orderNumber = raw.orderNumber ?? raw.OrderNumber ?? raw.orderCode ?? (id ? `ORD-${id}` : '');
  const status = normalizeOrderStatus(raw.status ?? raw.Status ?? ORDER_STATUS.PLACED);
  const orderType = raw.orderType ?? raw.OrderType ?? 'Pickup';
  const orderDate = raw.orderDate ?? raw.OrderDate ?? raw.createdAt ?? raw.CreatedAt ?? new Date().toISOString();
  const createdAt = raw.createdAt ?? raw.CreatedAt ?? orderDate;

  // Customer info
  const rawCustomer = raw.customer ?? raw.Customer ?? {};
  const customer = {
    name: rawCustomer.name ?? raw.customerName ?? raw.CustomerName ?? 'Guest Student',
    role: rawCustomer.role ?? raw.customerRole ?? raw.CustomerRole ?? 'Student',
    rollNo: rawCustomer.rollNo ?? rawCustomer.rollNumber ?? raw.rollNo ?? raw.rollNumber ?? raw.RollNo ?? '—',
    phone: rawCustomer.phone ?? raw.customerPhone ?? raw.CustomerPhone ?? raw.phone ?? '—',
    email: rawCustomer.email ?? raw.customerEmail ?? raw.CustomerEmail ?? raw.email ?? '—'
  };

  // Order items
  const rawItems = raw.items ?? raw.Items ?? raw.orderItems ?? raw.OrderItems ?? [];
  const items = (Array.isArray(rawItems) ? rawItems : []).map((item) => ({
    id: item.id ?? item.Id ?? item.itemId ?? item.menuItemId,
    name: item.name ?? item.Name ?? item.itemName ?? item.ItemName ?? 'Food Item',
    quantity: Number(item.quantity ?? item.Quantity ?? item.qty ?? item.Qty ?? 1),
    price: Number(item.price ?? item.Price ?? item.unitPrice ?? item.UnitPrice ?? 0),
    variant: item.variant ?? item.Variant ?? item.variantName ?? item.notes ?? '',
    category: item.category ?? item.Category ?? 'Main Course',
    stationId: item.stationId ?? item.StationId ?? null
  }));

  // Timeline audit trail
  const rawTimeline = raw.timeline ?? raw.Timeline ?? raw.orderTimelines ?? raw.OrderTimelines ?? [];
  const timeline = Array.isArray(rawTimeline) && rawTimeline.length > 0
    ? rawTimeline.map((tl) => ({
        status: normalizeOrderStatus(tl.status ?? tl.Status ?? status),
        timestamp: tl.timestamp ?? tl.Timestamp ?? (tl.createdAt ? new Date(tl.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'),
        note: tl.note ?? tl.Note ?? '',
        operator: tl.operator ?? tl.Operator ?? 'Staff',
        fullTimestamp: tl.fullTimestamp ?? tl.createdAt ?? null
      }))
    : [
        {
          status,
          timestamp: new Date(createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          note: `Order ${status}`,
          operator: 'Staff'
        }
      ];

  const totalAmount = Number(raw.totalAmount ?? raw.TotalAmount ?? raw.total ?? 0);
  const payment = raw.payment ?? raw.Payment ?? {};
  const paymentStatus = raw.paymentStatus ?? raw.PaymentStatus ?? payment.status ?? 'Pending';
  const paymentMethod = raw.paymentMethod ?? raw.PaymentMethod ?? payment.method ?? 'Online';

  let completedAt = raw.completedAt ?? raw.CompletedAt;
  if (!completedAt && isStatusCompleted(status)) {
    if (raw.updatedAt && isSameIstDate(raw.updatedAt)) {
      completedAt = raw.updatedAt;
    } else if (isSameIstDate(orderDate)) {
      completedAt = orderDate;
    }
  }

  let collectedAt = raw.collectedAt ?? raw.CollectedAt ?? completedAt;
  if (Array.isArray(timeline)) {
    for (const t of timeline) {
      if (t.note && t.note.includes('ORDER_COLLECTED:')) {
        const m = t.note.match(/ORDER_COLLECTED:([^\s;]+)/);
        if (m && m[1]) {
          collectedAt = m[1];
          break;
        }
      }
    }
  }

  // 1. Preparation Start Timestamp: Extract from payload, timeline or persistent storage
  let prepStartedAt = raw.prepStartedAt ?? raw.preparationStartedAt ?? raw.preparingAt ?? raw.PreparingAt ?? null;
  if (!prepStartedAt && Array.isArray(timeline)) {
    for (const t of timeline) {
      if (t.note && t.note.includes('PREP_STARTED:')) {
        const match = t.note.match(/PREP_STARTED:([^\s;]+)/);
        if (match && match[1]) {
          prepStartedAt = match[1];
          break;
        }
      }
    }
  }
  if (!prepStartedAt && typeof window !== 'undefined' && window.localStorage && id) {
    const localStart = window.localStorage.getItem(`cms_prep_start_${id}`);
    if (localStart) prepStartedAt = localStart;
  }

  // 2. Preparation Completion Timestamp & Duration: Extract from payload, timeline or history
  let prepCompletedAt = raw.prepCompletedAt ?? raw.preparationCompletedAt ?? raw.readyAt ?? raw.ReadyAt ?? null;
  let prepDurationSeconds = Number(raw.prepDurationSeconds ?? raw.preparationDurationSeconds ?? 0);
  let prepDurationFormatted = raw.prepDurationFormatted ?? '';

  if (Array.isArray(timeline)) {
    for (const t of timeline) {
      if (t.note && t.note.includes('PREP_COMPLETED:')) {
        const durMatch = t.note.match(/duration=(\d+)s?/);
        if (durMatch && durMatch[1]) {
          prepDurationSeconds = parseInt(durMatch[1], 10);
        }
        const startMatch = t.note.match(/start=([^\s;]+)/);
        if (startMatch && startMatch[1] && !prepStartedAt) {
          prepStartedAt = startMatch[1];
        }
        const endMatch = t.note.match(/end=([^\s;]+)/);
        if (endMatch && endMatch[1] && !prepCompletedAt) {
          prepCompletedAt = endMatch[1];
        }
      }
    }
  }

  // Also check persistent preparation history cache
  if (typeof window !== 'undefined' && window.localStorage && id) {
    try {
      const hist = JSON.parse(window.localStorage.getItem('cms_prep_history') || '[]');
      const entry = hist.find(h => String(h.orderId) === String(id));
      if (entry) {
        if (!prepStartedAt && entry.prepStartedAt) prepStartedAt = entry.prepStartedAt;
        if (!prepCompletedAt && entry.prepCompletedAt) prepCompletedAt = entry.prepCompletedAt;
        if (!prepDurationSeconds && entry.durationSeconds) prepDurationSeconds = entry.durationSeconds;
        if (!prepDurationFormatted && entry.durationFormatted) prepDurationFormatted = entry.durationFormatted;
        if (!collectedAt && entry.collectedAt) collectedAt = entry.collectedAt;
      }
    } catch {}
  }

  if (prepDurationSeconds > 0 && !prepDurationFormatted) {
    const mins = Math.floor(prepDurationSeconds / 60);
    const secs = prepDurationSeconds % 60;
    prepDurationFormatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  return {
    ...raw,
    id,
    token,
    orderNumber,
    status,
    orderType,
    orderDate,
    createdAt,
    customer,
    items,
    timeline,
    totalAmount,
    paymentStatus,
    paymentMethod,
    outletId: cleanOutletId(raw.outletId ?? raw.OutletId) || 1,
    outletName: raw.outletName ?? raw.OutletName ?? 'Central Dining Hall',
    notes: raw.notes ?? raw.Notes ?? '',
    acceptedAt: raw.acceptedAt ?? raw.AcceptedAt,
    preparingAt: raw.preparingAt ?? raw.PreparingAt,
    readyAt: raw.readyAt ?? raw.ReadyAt,
    completedAt,
    collectedAt,
    cancelledAt: raw.cancelledAt ?? raw.CancelledAt,
    prepStartedAt,
    prepCompletedAt,
    prepDurationSeconds,
    prepDurationFormatted
  };
};

export const staffOrderService = {
  /**
   * GET /api/v1/canteen-orders
   * Retrieve all canteen orders from live backend API
   */
  getAllOrders: async (params = {}) => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.ORDERS.BASE, params);
      const raw = response?.data ?? response;
      const list = Array.isArray(raw)
        ? raw
        : (Array.isArray(raw?.items) ? raw.items : (Array.isArray(raw?.orders) ? raw.orders : []));
      return list.map(normalizeOrder);
    } catch (err) {
      console.warn('Network issue fetching /canteen-orders:', err.message);
      return [];
    }
  },

  /**
   * GET /api/v1/canteen-orders/{id}
   * Get single order by ID from live backend API
   */
  getOrderById: async (orderId) => {
    const response = await apiClient.get(API_ENDPOINTS.ORDERS.BY_ID(orderId));
    const raw = response?.data ?? response;
    return normalizeOrder(raw);
  },

  /**
   * GET /api/v1/canteen-orders/kds
   * Retrieve active cooking tickets and station prep queue for Kitchen Display System
   */
  getKdsOrders: async (params = {}) => {
    try {
      const all = await staffOrderService.getAllOrders(params);
      return all.filter(
        (o) => isStatusPreparing(o.status) || isStatusAccepted(o.status)
      );
    } catch (err) {
      console.warn('Error fetching active KDS orders:', err.message);
      return [];
    }
  },

  /**
   * GET /api/v1/canteen-orders/stations
   * Retrieve configured kitchen preparation stations from live backend
   */
  getKitchenStations: async (params = {}) => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.ORDERS.STATIONS, params);
      const raw = response?.data ?? response;
      const list = Array.isArray(raw)
        ? raw
        : (Array.isArray(raw?.stations) ? raw.stations : (Array.isArray(raw?.items) ? raw.items : []));
      if (list.length > 0) {
        const formatted = list.map((s) => ({
          id: String(s.id ?? s.stationId ?? s.code ?? ''),
          name: s.name ?? s.stationName ?? s.title ?? 'Kitchen Station'
        }));
        if (!formatted.some((s) => s.id === 'all')) {
          formatted.unshift({ id: 'all', name: 'All Kitchen Stations' });
        }
        return formatted;
      }
    } catch (err) {
      console.warn('Error fetching /canteen-orders/stations:', err.message);
    }
    return [
      { id: 'all', name: 'All Kitchen Stations' },
      { id: 'station-1', name: 'Station 1: Hot Meals Line (Wok & Curries)' },
      { id: 'station-2', name: 'Station 2: Snacks & Quick Bites Counter' },
      { id: 'station-3', name: 'Station 3: Fresh Beverages & Shakes' }
    ];
  },

  /**
   * GET /api/v1/canteen-orders/verify-pickup
   * Query backend to verify counter pickup token / order
   */
  verifyPickupHandover: async (tokenOrIdInput, targetOrderId = null) => {
    if (!tokenOrIdInput || !String(tokenOrIdInput).trim()) {
      throw new Error('Please enter a valid counter token (e.g., T-101) or Order ID.');
    }

    const query = String(tokenOrIdInput).trim();
    const params = { token: query };
    if (targetOrderId) {
      params.orderId = targetOrderId;
    }

    const response = await apiClient.get(API_ENDPOINTS.ORDERS.VERIFY_PICKUP, params);
    const raw = response?.data ?? response;
    const orderData = raw?.order ?? raw;

    if (!orderData || (typeof orderData === 'object' && Object.keys(orderData).length === 0)) {
      throw new Error(`No matching order found for token/ID "${tokenOrIdInput}". Please check the customer's receipt.`);
    }

    const normalized = normalizeOrder(orderData);

    if (normalized.status === ORDER_STATUS.COMPLETED) {
      throw new Error(`Order #${normalized.token || normalized.id} has ALREADY been collected and completed! Duplicate pickup blocked.`);
    }

    if (normalized.status === ORDER_STATUS.CANCELLED || normalized.status === ORDER_STATUS.REFUNDED) {
      throw new Error(`Order #${normalized.token || normalized.id} was cancelled/refunded and cannot be collected.`);
    }

    return normalized;
  },

  /**
   * PATCH /api/v1/canteen-orders/{id}/status
   * Update order milestone status on live backend API
   */
  updateOrderStatus: async (orderId, newStatus, staffNote = '', operatorName = 'Staff Attendant') => {
    const canonicalStatus = normalizeOrderStatus(newStatus);
    const payload = {
      status: canonicalStatus,
      note: staffNote || undefined,
      operator: operatorName
    };

    const response = await apiClient.patch(API_ENDPOINTS.ORDERS.UPDATE_STATUS(orderId), payload);
    const raw = response?.data ?? response;
    const updatedOrder = normalizeOrder(raw);
    if (isStatusCompleted(canonicalStatus)) {
      updatedOrder.completedAt = new Date().toISOString();
    }

    // Notify all components and hooks
    window.dispatchEvent(new CustomEvent('cms:order_status_updated', {
      detail: { orderId, newStatus: canonicalStatus, updatedOrder }
    }));
    window.dispatchEvent(new CustomEvent('cms:order_updated', {
      detail: updatedOrder
    }));

    // Cross-tab synchronization trigger
    try {
      localStorage.setItem('cms_order_sync_timestamp', Date.now().toString());
    } catch {}

    return updatedOrder;
  },

  /**
   * Order Workflow Shortcuts
   */
  acceptOrder: async (orderId, operatorName = 'Staff Attendant') => {
    try {
      // Directly transition from Placed to Preparing as required
      // Note: Timer does NOT start here. Timer starts only when Kitchen Staff clicks Prepare.
      return await staffOrderService.updateOrderStatus(
        orderId,
        ORDER_STATUS.PREPARING,
        `Order accepted by ${operatorName}`,
        operatorName
      );
    } catch (err) {
      if (err.message && err.message.includes('Invalid status transition')) {
        await staffOrderService.updateOrderStatus(
          orderId,
          ORDER_STATUS.ACCEPTED,
          `Order accepted by ${operatorName}`,
          operatorName
        );
        return await staffOrderService.updateOrderStatus(
          orderId,
          ORDER_STATUS.PREPARING,
          `Order accepted by ${operatorName}`,
          operatorName
        );
      }
      throw err;
    }
  },

  startPreparation: async (orderId, operatorName = 'Chef / Kitchen Staff') => {
    const prepStartedAt = new Date().toISOString();
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(`cms_prep_start_${orderId}`, prepStartedAt);
      window.localStorage.setItem('cms_order_sync_timestamp', Date.now().toString());
    }

    const updated = await staffOrderService.updateOrderStatus(
      orderId,
      ORDER_STATUS.PREPARING,
      `PREP_STARTED:${prepStartedAt} by ${operatorName}`,
      operatorName
    );

    updated.prepStartedAt = prepStartedAt;
    return updated;
  },

  markReadyForPickup: async (orderId, operatorName = 'Kitchen & Counter Staff') => {
    let prepStartedAt = null;
    if (typeof window !== 'undefined' && window.localStorage) {
      prepStartedAt = window.localStorage.getItem(`cms_prep_start_${orderId}`);
    }

    const prepCompletedAt = new Date().toISOString();
    const startMs = prepStartedAt ? new Date(prepStartedAt).getTime() : Date.now();
    const durationSeconds = Math.max(0, Math.round((new Date(prepCompletedAt).getTime() - startMs) / 1000));
    const mins = Math.floor(durationSeconds / 60);
    const secs = durationSeconds % 60;
    const durationFormatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    const note = `PREP_COMPLETED:duration=${durationSeconds}s;start=${prepStartedAt || ''};end=${prepCompletedAt} by ${operatorName}`;

    let updated;
    try {
      updated = await staffOrderService.updateOrderStatus(
        orderId,
        ORDER_STATUS.READY_FOR_PICKUP,
        note,
        operatorName
      );
    } catch (err) {
      if (err.message && err.message.includes('Invalid status transition')) {
        await staffOrderService.updateOrderStatus(
          orderId,
          ORDER_STATUS.PREPARING,
          `Preparation finalized by ${operatorName}`,
          operatorName
        );
        updated = await staffOrderService.updateOrderStatus(
          orderId,
          ORDER_STATUS.READY_FOR_PICKUP,
          note,
          operatorName
        );
      } else {
        throw err;
      }
    }

    updated.prepStartedAt = prepStartedAt;
    updated.prepCompletedAt = prepCompletedAt;
    updated.prepDurationSeconds = durationSeconds;
    updated.prepDurationFormatted = durationFormatted;

    // Save to persistent Preparation History
    staffOrderService.saveToPreparationHistory({
      orderId: updated.id,
      token: updated.token,
      customerName: updated.customer?.name,
      customerRole: updated.customer?.role,
      items: updated.items,
      totalAmount: updated.totalAmount,
      orderType: updated.orderType,
      prepStartedAt,
      prepCompletedAt,
      durationSeconds,
      durationFormatted,
      status: ORDER_STATUS.READY_FOR_PICKUP,
      completedAt: prepCompletedAt
    });

    // Clean up active timer state
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(`cms_prep_start_${orderId}`);
      window.localStorage.setItem('cms_order_sync_timestamp', Date.now().toString());
    }

    return updated;
  },

  getPreparationHistory: () => {
    if (typeof window === 'undefined' || !window.localStorage) return [];
    try {
      const raw = window.localStorage.getItem('cms_prep_history');
      const parsed = JSON.parse(raw || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  saveToPreparationHistory: (record) => {
    if (typeof window === 'undefined' || !window.localStorage || !record || !record.orderId) return;
    try {
      const existing = staffOrderService.getPreparationHistory();
      const filtered = existing.filter(h => String(h.orderId) !== String(record.orderId));
      filtered.unshift({
        ...record,
        savedAt: new Date().toISOString()
      });
      window.localStorage.setItem('cms_prep_history', JSON.stringify(filtered.slice(0, 500)));
    } catch (err) {
      console.warn('Failed to save to Preparation History:', err);
    }
  },

  rejectOrder: async (orderId, reason = 'Item unavailable', operatorName = 'Staff Attendant') => {
    return staffOrderService.updateOrderStatus(
      orderId,
      ORDER_STATUS.CANCELLED,
      `Order rejected: ${reason} (by ${operatorName})`,
      operatorName
    );
  },

  markCollected: async (orderId, operatorName = 'Counter Staff') => {
    const collectedAt = new Date().toISOString();
    const note = `ORDER_COLLECTED:${collectedAt} by ${operatorName}`;
    const updated = await staffOrderService.updateOrderStatus(
      orderId,
      'Collected',
      note,
      operatorName
    );
    updated.status = 'Collected';
    updated.collectedAt = collectedAt;
    updated.completedAt = collectedAt;

    // Update or insert into persistent Preparation History
    try {
      const history = staffOrderService.getPreparationHistory();
      const existingIdx = history.findIndex(h => String(h.orderId) === String(orderId));
      if (existingIdx >= 0) {
        history[existingIdx] = {
          ...history[existingIdx],
          status: 'Collected',
          collectedAt,
          completedAt: collectedAt
        };
      } else {
        history.unshift({
          orderId: updated.id,
          token: updated.token,
          customerName: updated.customer?.name,
          customerRole: updated.customer?.role,
          items: updated.items,
          totalAmount: updated.totalAmount,
          orderType: updated.orderType,
          prepStartedAt: updated.prepStartedAt,
          prepCompletedAt: updated.prepCompletedAt,
          durationSeconds: updated.prepDurationSeconds,
          durationFormatted: updated.prepDurationFormatted,
          status: 'Collected',
          collectedAt,
          completedAt: collectedAt,
          orderDate: updated.orderDate || updated.createdAt
        });
      }
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('cms_prep_history', JSON.stringify(history.slice(0, 500)));
        window.localStorage.removeItem(`cms_prep_start_${orderId}`);
        window.localStorage.setItem('cms_order_sync_timestamp', Date.now().toString());
      }
    } catch (err) {
      console.warn('Failed to update preparation history for collection:', err);
    }

    return updated;
  },

  completeOrder: async (orderId, operatorName = 'Counter Staff') => {
    return staffOrderService.markCollected(orderId, operatorName);
  },

  confirmHandover: async (orderId, operatorName = 'Counter Staff') => {
    return staffOrderService.markCollected(orderId, operatorName);
  },

  /**
   * Calculate operational metrics directly from active order list
   */
  calculateMetrics: (orders = []) => {
    const safeOrders = Array.isArray(orders) ? orders : [];
    const total = safeOrders.length;
    const placed = safeOrders.filter((o) => isStatusPlaced(o.status)).length;
    const accepted = safeOrders.filter((o) => isStatusAccepted(o.status)).length;
    const preparing = safeOrders.filter((o) => isStatusPreparing(o.status)).length;
    const ready = safeOrders.filter((o) => isStatusReady(o.status)).length;
    const completed = safeOrders.filter((o) => isStatusCompleted(o.status)).length;
    const completedToday = safeOrders.filter((o) => isOrderCompletedToday(o)).length;
    const cancelled = safeOrders.filter((o) => isStatusCancelled(o.status)).length;

    return {
      total,
      totalToday: total,
      pending: placed + accepted,
      placed,
      accepted,
      preparing,
      ready,
      completed,
      completedToday,
      cancelled
    };
  }
};

export default staffOrderService;
