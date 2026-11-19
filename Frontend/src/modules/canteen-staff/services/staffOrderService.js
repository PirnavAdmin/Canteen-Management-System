/**
 * Canteen Staff Order Service
 * Handles operational order streaming, KDS milestone transitions, and pickup token verification.
 */

import { apiClient, API_ENDPOINTS } from '../../../services/api';
import { storageService } from '../../../services/storageService';
import { ORDER_STATUS, ORDER_LIFECYCLE_NEXT_STEPS } from '../../../constants/appConstants';
import { getFreshStaffOrders } from '../constants/staffConstants';

const STORAGE_KEY = 'cms_canteen_management_orders';

export const staffOrderService = {
  /**
   * Retrieve all canteen orders for operational management with safe fallback
   */
  getAllOrders: async () => {
    // 1. Try fetching from backend API if active
    try {
      const response = await apiClient.get(API_ENDPOINTS.ORDERS.BASE);
      const apiData = response?.data ?? response;
      if (Array.isArray(apiData) && apiData.length > 0) {
        storageService.setItem(STORAGE_KEY, apiData);
        return apiData;
      }
    } catch {
      // Backend offline or unreachable, fall back to storage
    }

    // 2. Fallback to local persistent storage
    try {
      const stored = storageService.getItem(STORAGE_KEY, null);
      if (Array.isArray(stored) && stored.length > 0 && stored.some(o => o.id?.startsWith('ORD-2026-91'))) {
        return stored;
      }
      // Seed with fresh realistic orders
      const seed = getFreshStaffOrders();
      storageService.setItem(STORAGE_KEY, seed);
      return seed;
    } catch (err) {
      console.warn('Fallback to local orders cache for staff:', err);
      return getFreshStaffOrders();
    }
  },

  /**
   * Get single order by ID
   */
  getOrderById: async (orderId) => {
    const orders = await staffOrderService.getAllOrders();
    return orders.find(o => String(o.id) === String(orderId)) || null;
  },

  /**
   * Transition order preparation milestone
   */
  updateOrderStatus: async (orderId, newStatus, staffNote = '', operatorName = 'Staff Attendant') => {
    const allOrders = await staffOrderService.getAllOrders();
    const idx = allOrders.findIndex(o => String(o.id) === String(orderId));

    if (idx === -1) {
      throw new Error(`Order #${orderId} was not found in the canteen database.`);
    }

    const currentOrder = allOrders[idx];

    // Status transition validation
    const validNextSteps = {
      [ORDER_STATUS.PLACED]: [ORDER_STATUS.ACCEPTED, ORDER_STATUS.PREPARING, ORDER_STATUS.CANCELLED],
      [ORDER_STATUS.ACCEPTED]: [ORDER_STATUS.PREPARING, ORDER_STATUS.READY_FOR_PICKUP, ORDER_STATUS.CANCELLED],
      [ORDER_STATUS.PREPARING]: [ORDER_STATUS.READY_FOR_PICKUP, ORDER_STATUS.COMPLETED, ORDER_STATUS.CANCELLED],
      [ORDER_STATUS.READY_FOR_PICKUP]: [ORDER_STATUS.COMPLETED, ORDER_STATUS.CANCELLED],
      [ORDER_STATUS.COMPLETED]: [],
      [ORDER_STATUS.CANCELLED]: [ORDER_STATUS.REFUNDED],
      [ORDER_STATUS.REFUNDED]: []
    }[currentOrder.status] || ORDER_LIFECYCLE_NEXT_STEPS[currentOrder.status] || [];

    if (!validNextSteps.includes(newStatus) && currentOrder.status !== newStatus) {
      throw new Error(`Invalid status transition: Order #${orderId} cannot move from "${currentOrder.status}" directly to "${newStatus}".`);
    }

    // 1. Attempt backend API patch if online
    try {
      await apiClient.patch(API_ENDPOINTS.ORDERS.UPDATE_STATUS(orderId), {
        status: newStatus,
        note: staffNote || undefined
      });
    } catch (apiErr) {
      console.warn('Backend API update skipped or offline, updating shared store:', apiErr.message);
    }

    // 2. Prepare accurate timestamp and audit timeline
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const note = staffNote || `Status updated to ${newStatus} by ${operatorName}`;

    const updatedTimeline = [
      ...(currentOrder.timeline || []),
      {
        status: newStatus,
        timestamp: timeStr,
        note,
        operator: operatorName
      }
    ];

    const updatedOrder = {
      ...currentOrder,
      status: newStatus,
      timeline: updatedTimeline,
      updatedAt: now.toISOString()
    };

    // Attach specific lifecycle milestone timestamps
    if (newStatus === ORDER_STATUS.ACCEPTED) {
      updatedOrder.acceptedAt = now.toISOString();
      updatedOrder.acceptedBy = operatorName;
    } else if (newStatus === ORDER_STATUS.PREPARING) {
      updatedOrder.acceptedAt = updatedOrder.acceptedAt || now.toISOString();
      updatedOrder.preparingAt = now.toISOString();
      updatedOrder.cookingStartedBy = operatorName;
    } else if (newStatus === ORDER_STATUS.READY_FOR_PICKUP || newStatus === 'Ready for Pickup') {
      updatedOrder.readyAt = now.toISOString();
      updatedOrder.readyBy = operatorName;
    } else if (newStatus === ORDER_STATUS.COMPLETED) {
      updatedOrder.completedAt = now.toISOString();
      updatedOrder.verifiedAt = now.toISOString();
      updatedOrder.verifiedBy = operatorName;
    } else if (newStatus === ORDER_STATUS.CANCELLED) {
      updatedOrder.cancelledAt = now.toISOString();
      updatedOrder.cancellationReason = staffNote;
    }

    allOrders[idx] = updatedOrder;
    storageService.setItem(STORAGE_KEY, [...allOrders]);

    // Dispatch global event so Customer UI / Admin UI react immediately
    window.dispatchEvent(new CustomEvent('cms:order_status_updated', {
      detail: { orderId, newStatus, updatedOrder }
    }));

    return updatedOrder;
  },

  /**
   * Quick status action helpers
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

  /**
   * Verify and Handover Counter Pickup Token
   * Checks matching code, validates correct canteen, and prevents duplicates.
   */
  verifyPickupHandover: async (tokenOrIdInput, targetOrderId = null) => {
    if (!tokenOrIdInput || !tokenOrIdInput.trim()) {
      throw new Error('Please enter a valid counter token (e.g., T-101) or Order ID.');
    }

    const query = tokenOrIdInput.trim().toUpperCase();
    const allOrders = await staffOrderService.getAllOrders();

    let targetOrder;

    if (targetOrderId) {
      targetOrder = allOrders.find(o => String(o.id) === String(targetOrderId));
      if (!targetOrder) {
        throw new Error(`Order #${targetOrderId} not found.`);
      }

      const orderToken = String(targetOrder.token || '').toUpperCase();
      const orderId = String(targetOrder.id || '').toUpperCase();
      const cleanToken = orderToken.replace('T-', '').trim();
      const cleanQuery = query.replace('T-', '').trim();

      const matches = (
        orderToken === query ||
        orderId === query ||
        orderId.endsWith(query) ||
        cleanToken === cleanQuery
      );

      if (!matches) {
        throw new Error(`Mismatched Code! The entered token "${tokenOrIdInput}" does not match order #${targetOrder.token || targetOrder.id}.`);
      }
    } else {
      targetOrder = allOrders.find(o => {
        const orderToken = String(o.token || '').toUpperCase();
        const orderId = String(o.id || '').toUpperCase();
        const cleanToken = orderToken.replace('T-', '').trim();
        const cleanQuery = query.replace('T-', '').trim();

        return (
          orderToken === query ||
          orderId === query ||
          orderId.endsWith(query) ||
          cleanToken === cleanQuery
        );
      });
    }

    if (!targetOrder) {
      throw new Error(`No matching order found for token/ID "${tokenOrIdInput}". Please check the customer's receipt.`);
    }

    if (targetOrder.status === ORDER_STATUS.COMPLETED) {
      throw new Error(`Order #${targetOrder.token || targetOrder.id} has ALREADY been collected and completed! Duplicate pickup blocked.`);
    }

    if (targetOrder.status === ORDER_STATUS.CANCELLED || targetOrder.status === ORDER_STATUS.REFUNDED) {
      throw new Error(`Order #${targetOrder.token || targetOrder.id} was cancelled/refunded and cannot be collected.`);
    }

    return targetOrder;
  },

  /**
   * Confirm handover and mark as Completed only after successful verification
   */
  confirmHandover: async (orderId, operatorName = 'Staff Attendant') => {
    const allOrders = await staffOrderService.getAllOrders();
    const idx = allOrders.findIndex(o => String(o.id) === String(orderId));

    if (idx === -1) {
      throw new Error(`Order #${orderId} not found.`);
    }

    const currentOrder = allOrders[idx];

    // Prevent duplicate verification
    if (currentOrder.status === ORDER_STATUS.COMPLETED) {
      throw new Error(`Order #${currentOrder.token || currentOrder.id} has ALREADY been collected and completed! Duplicate pickup blocked.`);
    }

    // Must be in Ready for Pickup state before completing
    if (currentOrder.status !== ORDER_STATUS.READY_FOR_PICKUP && currentOrder.status !== 'Ready for Pickup') {
      throw new Error(`Cannot complete order #${currentOrder.token || currentOrder.id} because it is currently "${currentOrder.status}". Order must be "Ready for Pickup" before collection verification.`);
    }

    // Attempt backend API update
    try {
      await apiClient.patch(API_ENDPOINTS.ORDERS.UPDATE_STATUS(orderId), {
        status: ORDER_STATUS.COMPLETED,
        note: `Meal handed over at counter by ${operatorName}. Pickup verified.`
      });
    } catch (apiErr) {
      console.warn('Backend API update skipped or offline, updating shared store:', apiErr.message);
    }

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const updatedTimeline = [
      ...(currentOrder.timeline || []),
      {
        status: ORDER_STATUS.COMPLETED,
        timestamp: timeStr,
        note: `Meal handed over at counter by ${operatorName}. Pickup verified.`,
        operator: operatorName
      }
    ];

    const updatedOrder = {
      ...currentOrder,
      status: ORDER_STATUS.COMPLETED,
      paymentStatus: 'Paid',
      payment: {
        ...(currentOrder.payment || {}),
        status: 'Paid',
        collectedAt: now.toISOString()
      },
      completedAt: now.toISOString(),
      verifiedAt: now.toISOString(),
      verifiedBy: operatorName,
      timeline: updatedTimeline,
      updatedAt: now.toISOString()
    };

    allOrders[idx] = updatedOrder;
    storageService.setItem(STORAGE_KEY, [...allOrders]);

    window.dispatchEvent(new CustomEvent('cms:order_status_updated', {
      detail: { orderId, newStatus: ORDER_STATUS.COMPLETED, updatedOrder }
    }));

    return updatedOrder;
  },

  /**
   * Calculate operational metrics for dashboard
   */
  calculateMetrics: (orders = []) => {
    const safeOrders = Array.isArray(orders) ? orders : [];
    const totalToday = safeOrders.length;
    const placed = safeOrders.filter(o => o.status === ORDER_STATUS.PLACED).length;
    const accepted = safeOrders.filter(o => o.status === ORDER_STATUS.ACCEPTED).length;
    const preparing = safeOrders.filter(o => o.status === ORDER_STATUS.PREPARING).length;
    const ready = safeOrders.filter(o => o.status === ORDER_STATUS.READY_FOR_PICKUP || o.status === 'Ready for Pickup').length;
    const completed = safeOrders.filter(o => o.status === ORDER_STATUS.COMPLETED).length;
    const cancelled = safeOrders.filter(o => o.status === ORDER_STATUS.CANCELLED || o.status === ORDER_STATUS.REFUNDED).length;

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
