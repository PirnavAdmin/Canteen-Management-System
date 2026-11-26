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
  if (raw === null || raw === undefined || raw === 'all' || raw === 'ALL' || raw === '') return undefined;
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

  if (order.completedAt) {
    return isSameIstDate(order.completedAt);
  }

  if (order.updatedAt) {
    return isSameIstDate(order.updatedAt);
  }

  if (Array.isArray(order.timeline)) {
    const entry = order.timeline.find((t) => isStatusCompleted(t.status));
    if (entry?.date) return isSameIstDate(entry.date);
    if (entry?.fullTimestamp) return isSameIstDate(entry.fullTimestamp);
    if (entry?.createdAt) return isSameIstDate(entry.createdAt);
  }

  const ordDate = order.orderDate || order.createdAt;
  if (ordDate && isSameIstDate(ordDate)) {
    return true;
  }

  return false;
};

/**
 * Normalizes backend order payload into consistent shape expected by UI components.
 * Supports both PascalCase (.NET DTOs) and camelCase properties.
 */
export const normalizeOrder = (raw) => {
  if (!raw || typeof raw !== 'object') return raw;

  const id = raw.id ?? raw.Id ?? raw.orderId ?? raw.OrderId ?? '';
  const token = raw.token ?? raw.Token ?? raw.orderToken ?? (id ? `T-${String(id).slice(-3)}` : '');
  const orderNumber = raw.orderNumber ?? raw.OrderNumber ?? raw.orderCode ?? (id ? `ORD-${id}` : '');
  const status = normalizeOrderStatus(raw.status ?? raw.Status ?? ORDER_STATUS.PLACED);
  const orderType = raw.orderType ?? raw.OrderType ?? 'Pickup';
  const orderDate = raw.orderDate ?? raw.OrderDate ?? raw.createdAt ?? raw.CreatedAt ?? null;
  const createdAt = raw.createdAt ?? raw.CreatedAt ?? orderDate;

  const rawCustomer = raw.customer ?? raw.Customer ?? {};
  const customer = {
    name: rawCustomer.name ?? rawCustomer.fullName ?? raw.customerName ?? raw.CustomerName ?? 'Customer',
    role: rawCustomer.role ?? raw.customerRole ?? raw.CustomerRole ?? '',
    rollNo: rawCustomer.rollNo ?? rawCustomer.rollNumber ?? raw.rollNo ?? raw.rollNumber ?? raw.RollNo ?? '—',
    phone: rawCustomer.phone ?? raw.customerPhone ?? raw.CustomerPhone ?? raw.phone ?? '—',
    email: rawCustomer.email ?? raw.customerEmail ?? raw.CustomerEmail ?? raw.email ?? '—'
  };

  const rawItems = raw.items ?? raw.Items ?? raw.orderItems ?? raw.OrderItems ?? [];
  const items = (Array.isArray(rawItems) ? rawItems : []).map((item) => ({
    id: item.id ?? item.Id ?? item.itemId ?? item.menuItemId,
    name: item.name ?? item.Name ?? item.itemName ?? item.ItemName ?? 'Food Item',
    imageUrl: item.imageUrl ?? item.ImageUrl ?? item.image ?? item.Image ?? item.photoUrl ?? item.photo ?? null,
    menuItemId: item.menuItemId ?? item.MenuItemId ?? item.itemId ?? item.id ?? null,
    quantity: Number(item.quantity ?? item.Quantity ?? item.qty ?? item.Qty ?? 1),
    price: Number(item.price ?? item.Price ?? item.unitPrice ?? item.UnitPrice ?? 0),
    variant: item.variant ?? item.Variant ?? item.variantName ?? item.notes ?? '',
    category: item.category ?? item.Category ?? '',
    categoryId: item.categoryId ?? item.CategoryId ?? null,
    stationId: item.stationId ?? item.StationId ?? null
  }));

  const rawTimeline = raw.timeline ?? raw.Timeline ?? raw.orderTimelines ?? raw.OrderTimelines ?? [];
  const timeline = Array.isArray(rawTimeline) && rawTimeline.length > 0
    ? rawTimeline.map((tl) => ({
      status: normalizeOrderStatus(tl.status ?? tl.Status ?? status),
      timestamp: tl.timestamp ?? tl.Timestamp ?? (tl.createdAt ? new Date(tl.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'),
      note: tl.note ?? tl.Note ?? '',
      operator: tl.operator ?? tl.Operator ?? 'Staff',
      fullTimestamp: tl.fullTimestamp ?? tl.createdAt ?? null
    }))
    : createdAt
      ? [
        {
          status,
          timestamp: new Date(createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          note: `Order ${status}`,
          operator: 'System'
        }
      ]
      : [];

  const totalAmount = Number(raw.totalAmount ?? raw.TotalAmount ?? raw.total ?? 0);
  const rawPayment = raw.payment ?? raw.Payment ?? {};
  const paymentStatus = raw.paymentStatus ?? raw.PaymentStatus ?? rawPayment.status ?? '—';
  const paymentMethod = raw.paymentMethod ?? raw.PaymentMethod ?? rawPayment.method ?? '—';
  const payment = {
    method: paymentMethod,
    status: paymentStatus
  };

  let completedAt = raw.completedAt ?? raw.CompletedAt ?? null;
  if (!completedAt && isStatusCompleted(status)) {
    if (raw.updatedAt && isSameIstDate(raw.updatedAt)) {
      completedAt = raw.updatedAt;
    } else if (orderDate && isSameIstDate(orderDate)) {
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

  let acceptedAt = raw.acceptedAt ?? raw.AcceptedAt ?? null;
  if (!acceptedAt && Array.isArray(timeline)) {
    for (const t of timeline) {
      if (t.note && t.note.includes('ORDER_ACCEPTED:')) {
        const m = t.note.match(/ORDER_ACCEPTED:([^\s;]+)/);
        if (m && m[1]) {
          acceptedAt = m[1];
          break;
        }
      }
      if (String(t.status).toLowerCase() === 'accepted' && (t.fullTimestamp || t.timestamp)) {
        acceptedAt = t.fullTimestamp || t.timestamp;
      }
    }
  }

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

  if (prepDurationSeconds > 0 && !prepDurationFormatted) {
    const mins = Math.floor(prepDurationSeconds / 60);
    const secs = prepDurationSeconds % 60;
    prepDurationFormatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  const resolvedOutletId = cleanOutletId(raw.outletId ?? raw.OutletId) ?? raw.outletId ?? raw.OutletId ?? null;

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
    payment,
    paymentStatus,
    paymentMethod,
    outletId: resolvedOutletId,
    outletName: raw.outletName ?? raw.OutletName ?? '',
    notes: raw.notes ?? raw.Notes ?? '',
    acceptedAt,
    preparingAt: raw.preparingAt ?? raw.PreparingAt ?? null,
    readyAt: raw.readyAt ?? raw.ReadyAt ?? null,
    completedAt,
    collectedAt,
    cancelledAt: raw.cancelledAt ?? raw.CancelledAt ?? null,
    prepStartedAt,
    prepCompletedAt,
    prepDurationSeconds,
    prepDurationFormatted
  };
};

export const staffOrderService = {
  /**
   * GET /api/v1/canteen-orders
   * Retrieve all canteen orders from live backend API.
   * Propagates errors instead of returning empty fallback data.
   */
  getAllOrders: async (params = {}) => {
    const response = await apiClient.get(API_ENDPOINTS.ORDERS.BASE, params);
    const raw = response?.data ?? response;
    const list = Array.isArray(raw)
      ? raw
      : (Array.isArray(raw?.items) ? raw.items : (Array.isArray(raw?.orders) ? raw.orders : []));
    return list.map(normalizeOrder);
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
    const response = await apiClient.get(API_ENDPOINTS.ORDERS.KDS, params);
    const raw = response?.data ?? response;
    const list = Array.isArray(raw)
      ? raw
      : (Array.isArray(raw?.items) ? raw.items : (Array.isArray(raw?.orders) ? raw.orders : []));
    return list.map(normalizeOrder);
  },

  /**
   * GET /api/v1/canteen-categories & GET /api/v1/canteen-menu
   * Backend OrdersController does not define /canteen-orders/stations (which previously
   * matched /canteen-orders/{id} with id="stations"). Derive live kitchen prep stations
   * directly from active database food categories and outlet menu items.
   */
  getKitchenStationData: async (params = {}) => {
    const cleanOutId = cleanOutletId(params.outletId);
    const menuParams = cleanOutId ? { outletId: cleanOutId } : {};

    const [catResponse, menuResponse] = await Promise.all([
      apiClient.get(API_ENDPOINTS.CATEGORIES.BASE),
      apiClient.get(API_ENDPOINTS.MENU.BASE, menuParams)
    ]);

    const rawCategories = catResponse?.data ?? catResponse;
    const categoryList = Array.isArray(rawCategories)
      ? rawCategories
      : (Array.isArray(rawCategories?.items) ? rawCategories.items : (Array.isArray(rawCategories?.categories) ? rawCategories.categories : []));

    const rawMenu = menuResponse?.data ?? menuResponse;
    const menuList = Array.isArray(rawMenu)
      ? rawMenu
      : (Array.isArray(rawMenu?.items) ? rawMenu.items : []);

    const byMenuItemId = {};
    const byItemName = {};
    const outletCategoryIds = new Set();

    menuList.forEach((m) => {
      const catId = m.categoryId ?? m.CategoryId;
      const itemId = m.id ?? m.Id ?? m.menuItemId;
      const itemName = (m.name ?? m.Name ?? '').trim().toLowerCase();
      if (catId !== undefined && catId !== null) {
        const strCatId = String(catId);
        outletCategoryIds.add(strCatId);
        if (itemId !== undefined && itemId !== null) {
          byMenuItemId[String(itemId)] = strCatId;
        }
        if (itemName) {
          byItemName[itemName] = strCatId;
        }
      }
    });

    const activeCategories = categoryList
      .filter((c) => !c.status || String(c.status).toLowerCase() === 'active')
      .sort((a, b) => Number(a.displayOrder ?? 999) - Number(b.displayOrder ?? 999));

    const scopedCategories = (cleanOutId && outletCategoryIds.size > 0)
      ? activeCategories.filter((c) => outletCategoryIds.has(String(c.id ?? c.categoryId)))
      : activeCategories;

    const stations = (scopedCategories.length > 0 ? scopedCategories : activeCategories)
      .map((c) => ({
        id: String(c.id ?? c.categoryId ?? ''),
        name: c.name ?? c.categoryName ?? ''
      }))
      .filter((s) => s.id && s.name);

    stations.unshift({ id: 'all', name: 'All Kitchen Stations' });

    return {
      stations,
      itemStationMap: { byMenuItemId, byItemName }
    };
  },

  /**
   * Retrieve configured kitchen preparation stations from live backend
   */
  getKitchenStations: async (params = {}) => {
    const { stations } = await staffOrderService.getKitchenStationData(params);
    return stations;
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

    if (isStatusCompleted(normalized.status)) {
      throw new Error(`Order #${normalized.token || normalized.id} has ALREADY been collected and completed! Duplicate pickup blocked.`);
    }

    if (isStatusCancelled(normalized.status)) {
      throw new Error(`Order #${normalized.token || normalized.id} was cancelled/refunded and cannot be collected.`);
    }

    return normalized;
  },

  /**
   * PATCH /api/v1/canteen-orders/{id}/status
   * Update order milestone status on live backend API
   */
  updateOrderStatus: async (orderId, newStatus, staffNote = '', operatorName = 'Staff') => {
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

    window.dispatchEvent(new CustomEvent('cms:order_status_updated', {
      detail: { orderId, newStatus: canonicalStatus, updatedOrder }
    }));
    window.dispatchEvent(new CustomEvent('cms:order_updated', {
      detail: updatedOrder
    }));

    return updatedOrder;
  },

  /**
   * Order Workflow Shortcuts
   */
  acceptOrder: async (orderId, operatorName = 'Staff') => {
    const acceptedAt = new Date().toISOString();
    const updated = await staffOrderService.updateOrderStatus(
      orderId,
      ORDER_STATUS.ACCEPTED,
      `ORDER_ACCEPTED:${acceptedAt} by ${operatorName}`,
      operatorName
    );
    updated.acceptedAt = acceptedAt;
    return updated;
  },

  startPreparation: async (orderId, operatorName = 'Kitchen Staff') => {
    const prepStartedAt = new Date().toISOString();
    const updated = await staffOrderService.updateOrderStatus(
      orderId,
      ORDER_STATUS.PREPARING,
      `PREP_STARTED:${prepStartedAt} by ${operatorName}`,
      operatorName
    );
    updated.prepStartedAt = prepStartedAt;
    return updated;
  },

  markReadyForPickup: async (orderId, operatorName = 'Kitchen Staff') => {
    const prepCompletedAt = new Date().toISOString();
    const note = `PREP_COMPLETED:end=${prepCompletedAt} by ${operatorName}`;

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

    updated.status = ORDER_STATUS.READY_FOR_PICKUP;
    updated.prepCompletedAt = prepCompletedAt;
    return updated;
  },

  rejectOrder: async (orderId, reason = 'Item unavailable', operatorName = 'Staff') => {
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
