/**
 * Canteen Staff Order Service
 * Handles operational order streaming, KDS milestone transitions, and pickup token verification.
 */

import { storageService } from '../../../services/storageService';
import { orderService } from '../../admin/orders/services/orderService';
import { ORDER_STATUS } from '../../../constants/appConstants';

const STORAGE_KEY = 'cms_canteen_management_orders';

export const staffOrderService = {
  /**
   * Retrieve all canteen orders for operational management
   */
  getAllOrders: async () => {
    try {
      // Reuses shared storage / API layer
      return await orderService.getAll();
    } catch (err) {
      console.error('Failed to retrieve orders for staff:', err);
      const orders = storageService.getItem(STORAGE_KEY, []) || [];
      return orders;
    }
  },

  /**
   * Get single order by ID
   */
  getOrderById: async (orderId) => {
    const orders = await staffOrderService.getAllOrders();
    return orders.find(o => o.id === orderId) || null;
  },

  /**
   * Transition order preparation milestone
   */
  updateOrderStatus: async (orderId, newStatus, staffNote = '', operatorName = 'Staff Attendant') => {
    const allOrders = storageService.getItem(STORAGE_KEY, []) || [];
    const idx = allOrders.findIndex(o => o.id === orderId);

    if (idx === -1) {
      throw new Error(`Order #${orderId} was not found in the canteen database.`);
    }

    const currentOrder = allOrders[idx];
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const note = staffNote || `Status updated to ${newStatus} by ${operatorName}`;

    const updatedTimeline = [
      ...(currentOrder.timeline || []),
      {
        status: newStatus,
        timestamp: timeStr,
        note
      }
    ];

    const updatedOrder = {
      ...currentOrder,
      status: newStatus,
      timeline: updatedTimeline,
      updatedAt: now.toISOString()
    };

    allOrders[idx] = updatedOrder;
    storageService.setItem(STORAGE_KEY, [...allOrders]);

    // Dispatch global event so Customer UI / Admin UI react immediately
    window.dispatchEvent(new CustomEvent('cms:order_status_updated', {
      detail: { orderId, newStatus, updatedOrder }
    }));

    return updatedOrder;
  },

  /**
   * Verify and Handover Counter Pickup Token
   */
  verifyPickupHandover: async (tokenOrIdInput, operatorName = 'Staff Attendant') => {
    if (!tokenOrIdInput || !tokenOrIdInput.trim()) {
      throw new Error('Please enter a valid counter token (e.g., T-101) or Order ID.');
    }

    const query = tokenOrIdInput.trim().toUpperCase();
    const allOrders = storageService.getItem(STORAGE_KEY, []) || [];

    // Search by Token (e.g., "T-101", "101") or Order ID (e.g., "ORD-2026-8910")
    const targetOrder = allOrders.find(o => {
      const orderToken = (o.token || '').toUpperCase();
      const orderId = (o.id || '').toUpperCase();
      const cleanToken = orderToken.replace('T-', '');
      const cleanQuery = query.replace('T-', '');

      return (
        orderToken === query ||
        orderId === query ||
        orderId.endsWith(query) ||
        cleanToken === cleanQuery
      );
    });

    if (!targetOrder) {
      throw new Error(`No matching order found for token/ID "${tokenOrIdInput}". Please check the token number.`);
    }

    return targetOrder;
  },

  /**
   * Confirm handover and mark as Completed
   */
  confirmHandover: async (orderId, operatorName = 'Staff Attendant') => {
    const allOrders = storageService.getItem(STORAGE_KEY, []) || [];
    const idx = allOrders.findIndex(o => o.id === orderId);

    if (idx === -1) {
      throw new Error(`Order #${orderId} not found.`);
    }

    const currentOrder = allOrders[idx];

    // Duplicate verification prevention
    if (currentOrder.status === ORDER_STATUS.COMPLETED) {
      throw new Error(`Order #${currentOrder.token || currentOrder.id} has ALREADY been collected and completed! Duplicate pickup blocked.`);
    }

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const updatedTimeline = [
      ...(currentOrder.timeline || []),
      {
        status: ORDER_STATUS.COMPLETED,
        timestamp: timeStr,
        note: `Meal handed over at counter by ${operatorName}. Pickup verified.`
      }
    ];

    const updatedOrder = {
      ...currentOrder,
      status: ORDER_STATUS.COMPLETED,
      paymentStatus: 'Paid', // In case of cash on pickup, handover confirms payment collection
      payment: {
        ...(currentOrder.payment || {}),
        status: 'Paid',
        collectedAt: now.toISOString()
      },
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
    const totalToday = orders.length;
    const placed = orders.filter(o => o.status === ORDER_STATUS.PLACED).length;
    const accepted = orders.filter(o => o.status === ORDER_STATUS.ACCEPTED).length;
    const preparing = orders.filter(o => o.status === ORDER_STATUS.PREPARING).length;
    const ready = orders.filter(o => o.status === ORDER_STATUS.READY_FOR_PICKUP || o.status === 'Ready for Pickup').length;
    const completed = orders.filter(o => o.status === ORDER_STATUS.COMPLETED).length;
    const cancelled = orders.filter(o => o.status === ORDER_STATUS.CANCELLED || o.status === ORDER_STATUS.REFUNDED).length;

    return {
      totalToday,
      pending: placed + accepted,
      preparing,
      ready,
      completed,
      cancelled
    };
  }
};

export default staffOrderService;
