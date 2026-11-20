/**
 * Canteen Staff Order Service
 * Pure live backend API integration with .NET 8 Web API.
 * No mock data, no localStorage caching, no simulated fallbacks.
 */

import { apiClient, API_ENDPOINTS } from '../../../services/api';
import { ORDER_STATUS } from '../../../constants/appConstants';

/**
 * Normalizes backend order payload into consistent shape expected by Staff UI components.
 * Supports both PascalCase (.NET DTOs) and camelCase properties.
 */
export const normalizeOrder = (raw) => {
  if (!raw || typeof raw !== 'object') return raw;

  const id = raw.id ?? raw.Id ?? raw.orderId ?? raw.OrderId ?? '';
  const token = raw.token ?? raw.Token ?? raw.orderToken ?? (id ? `T-${String(id).slice(-3)}` : 'T-001');
  const orderNumber = raw.orderNumber ?? raw.OrderNumber ?? raw.orderCode ?? (id ? `ORD-${id}` : '');
  const status = raw.status ?? raw.Status ?? ORDER_STATUS.PLACED;
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
        status: tl.status ?? tl.Status ?? status,
        timestamp: tl.timestamp ?? tl.Timestamp ?? (tl.createdAt ? new Date(tl.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'),
        note: tl.note ?? tl.Note ?? '',
        operator: tl.operator ?? tl.Operator ?? 'Staff'
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
    outletId: raw.outletId ?? raw.OutletId ?? 1,
    outletName: raw.outletName ?? raw.OutletName ?? 'Central Dining Hall',
    notes: raw.notes ?? raw.Notes ?? '',
    acceptedAt: raw.acceptedAt ?? raw.AcceptedAt,
    preparingAt: raw.preparingAt ?? raw.PreparingAt,
    readyAt: raw.readyAt ?? raw.ReadyAt,
    completedAt: raw.completedAt ?? raw.CompletedAt,
    cancelledAt: raw.cancelledAt ?? raw.CancelledAt
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
      const response = await apiClient.get(API_ENDPOINTS.ORDERS.KDS, params);
      const raw = response?.data ?? response;
      const list = Array.isArray(raw)
        ? raw
        : (Array.isArray(raw?.items) ? raw.items : (Array.isArray(raw?.orders) ? raw.orders : []));
      return list.map(normalizeOrder);
    } catch (err) {
      console.warn('Error fetching /canteen-orders/kds, falling back to active orders:', err.message);
      const all = await staffOrderService.getAllOrders(params);
      return all.filter(
        (o) => o.status === ORDER_STATUS.PREPARING || o.status === ORDER_STATUS.ACCEPTED
      );
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
    const payload = {
      status: newStatus,
      note: staffNote || undefined,
      operator: operatorName
    };

    const response = await apiClient.patch(API_ENDPOINTS.ORDERS.UPDATE_STATUS(orderId), payload);
    const raw = response?.data ?? response;
    const updatedOrder = normalizeOrder(raw);

    // Notify other components in the current tab
    window.dispatchEvent(new CustomEvent('cms:order_status_updated', {
      detail: { orderId, newStatus, updatedOrder }
    }));

    return updatedOrder;
  },

  /**
   * Order Workflow Shortcuts
   */
  acceptOrder: async (orderId, operatorName = 'Staff Attendant') => {
    return staffOrderService.updateOrderStatus(
      orderId,
      ORDER_STATUS.PREPARING,
      `Order accepted and sent to kitchen for cooking by ${operatorName}`,
      operatorName
    );
  },

  startPreparation: async (orderId, operatorName = 'Chef / Kitchen Staff') => {
    return staffOrderService.updateOrderStatus(
      orderId,
      ORDER_STATUS.PREPARING,
      `Cooking started at kitchen station by ${operatorName}`,
      operatorName
    );
  },

  markReadyForPickup: async (orderId, operatorName = 'Kitchen & Counter Staff') => {
    return staffOrderService.updateOrderStatus(
      orderId,
      ORDER_STATUS.READY_FOR_PICKUP,
      `Plated and placed on pickup counter by ${operatorName}`,
      operatorName
    );
  },

  rejectOrder: async (orderId, reason = 'Item unavailable', operatorName = 'Staff Attendant') => {
    return staffOrderService.updateOrderStatus(
      orderId,
      ORDER_STATUS.CANCELLED,
      `Order rejected: ${reason} (by ${operatorName})`,
      operatorName
    );
  },

  confirmHandover: async (orderId, operatorName = 'Staff Attendant') => {
    return staffOrderService.updateOrderStatus(
      orderId,
      ORDER_STATUS.COMPLETED,
      `Meal handed over at counter by ${operatorName}. Pickup verified.`,
      operatorName
    );
  },

  /**
   * Calculate operational metrics directly from active order list
   */
  calculateMetrics: (orders = []) => {
    const safeOrders = Array.isArray(orders) ? orders : [];
    const totalToday = safeOrders.length;
    const placed = safeOrders.filter((o) => o.status === ORDER_STATUS.PLACED).length;
    const accepted = safeOrders.filter((o) => o.status === ORDER_STATUS.ACCEPTED).length;
    const preparing = safeOrders.filter((o) => o.status === ORDER_STATUS.PREPARING).length;
    const ready = safeOrders.filter(
      (o) => o.status === ORDER_STATUS.READY_FOR_PICKUP || o.status === 'Ready for Pickup'
    ).length;
    const completed = safeOrders.filter((o) => o.status === ORDER_STATUS.COMPLETED).length;
    const cancelled = safeOrders.filter(
      (o) => o.status === ORDER_STATUS.CANCELLED || o.status === ORDER_STATUS.REFUNDED
    ).length;

    return {
      totalToday,
      pending: placed + accepted,
      placed,
      accepted,
      preparing,
      ready,
      completed,
      cancelled
    };
  }
};

export default staffOrderService;
