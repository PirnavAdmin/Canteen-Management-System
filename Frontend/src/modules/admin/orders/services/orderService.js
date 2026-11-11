/**
 * Order Management API Service
 */

import { apiClient, API_ENDPOINTS } from '../../../../services/api';
import { storageService } from '../../../../services/storageService';
import { INITIAL_ORDERS } from '../constants/orderConstants';
import { ORDER_STATUS, ORDER_LIFECYCLE_NEXT_STEPS } from '../../../../constants/appConstants';

const STORAGE_KEY = 'cms_canteen_management_orders';

export const orderService = {
  getAll: async (params = {}) => {
    try {
      return await apiClient.get(API_ENDPOINTS.ORDERS.BASE, params);
    } catch {
      const saved = storageService.getItem(STORAGE_KEY, null);
      if (!saved) {
        storageService.setItem(STORAGE_KEY, INITIAL_ORDERS);
        return [...INITIAL_ORDERS];
      }
      return saved;
    }
  },

  getById: async (id) => {
    try {
      return await apiClient.get(API_ENDPOINTS.ORDERS.BY_ID(id));
    } catch {
      const orders = await orderService.getAll();
      return orders.find(o => o.id === id) || null;
    }
  },

  updateStatus: async (id, newStatus, note = '') => {
    try {
      return await apiClient.patch(API_ENDPOINTS.ORDERS.UPDATE_STATUS(id), { status: newStatus, note });
    } catch {
      const orders = await orderService.getAll();
      const idx = orders.findIndex(o => o.id === id);
      if (idx === -1) throw new Error(`Order with ID ${id} not found.`);

      const currentOrder = orders[idx];
      const validNext = ORDER_LIFECYCLE_NEXT_STEPS[currentOrder.status] || [];
      if (!validNext.includes(newStatus)) {
        throw new Error(`Invalid status transition from "${currentOrder.status}" to "${newStatus}". Permitted next states: ${validNext.join(', ') || 'None (Terminal state)'}`);
      }

      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const updatedTimeline = [
        ...currentOrder.timeline,
        {
          status: newStatus,
          timestamp: timeStr,
          note: note || `Order transitioned to ${newStatus}`
        }
      ];

      const updatedOrder = {
        ...currentOrder,
        status: newStatus,
        timeline: updatedTimeline,
        updatedAt: now.toISOString()
      };

      orders[idx] = updatedOrder;
      storageService.setItem(STORAGE_KEY, [...orders]);
      return updatedOrder;
    }
  },

  cancelOrder: async (id, reason) => {
    if (!reason || !reason.trim()) {
      throw new Error('A cancellation reason is required for audit and refund initiation.');
    }

    try {
      return await apiClient.post(API_ENDPOINTS.ORDERS.UPDATE_STATUS(id), { status: ORDER_STATUS.CANCELLED, reason });
    } catch {
      const orders = await orderService.getAll();
      const idx = orders.findIndex(o => o.id === id);
      if (idx === -1) throw new Error(`Order with ID ${id} not found.`);

      const currentOrder = orders[idx];
      if (currentOrder.status === ORDER_STATUS.COMPLETED) {
        throw new Error('Completed orders cannot be cancelled.');
      }

      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const updatedTimeline = [
        ...currentOrder.timeline,
        {
          status: ORDER_STATUS.CANCELLED,
          timestamp: timeStr,
          note: `Cancelled: ${reason}`
        }
      ];

      const updatedOrder = {
        ...currentOrder,
        status: ORDER_STATUS.CANCELLED,
        cancellationReason: reason,
        timeline: updatedTimeline,
        updatedAt: now.toISOString()
      };

      orders[idx] = updatedOrder;
      storageService.setItem(STORAGE_KEY, [...orders]);
      return updatedOrder;
    }
  },

  processRefund: async (id) => {
    try {
      return await apiClient.post(API_ENDPOINTS.ORDERS.PROCESS_REFUND(id));
    } catch {
      const orders = await orderService.getAll();
      const idx = orders.findIndex(o => o.id === id);
      if (idx === -1) throw new Error(`Order with ID ${id} not found.`);

      const currentOrder = orders[idx];
      if (currentOrder.status !== ORDER_STATUS.CANCELLED) {
        throw new Error('Only cancelled orders can be processed for refund.');
      }

      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const refundRecord = {
        refundId: `RFND-${Math.floor(10000 + Math.random() * 90000)}`,
        amount: currentOrder.totalAmount,
        processedAt: now.toISOString(),
        mode: `${currentOrder.payment.method} Reverse Gateway`,
        status: 'Refund Settled'
      };

      const updatedTimeline = [
        ...currentOrder.timeline,
        {
          status: ORDER_STATUS.REFUNDED,
          timestamp: timeStr,
          note: `Refund of ${currentOrder.totalAmount} processed via ${refundRecord.mode}`
        }
      ];

      const updatedOrder = {
        ...currentOrder,
        status: ORDER_STATUS.REFUNDED,
        refundDetails: refundRecord,
        payment: {
          ...currentOrder.payment,
          status: 'Refunded'
        },
        timeline: updatedTimeline,
        updatedAt: now.toISOString()
      };

      orders[idx] = updatedOrder;
      storageService.setItem(STORAGE_KEY, [...orders]);
      return updatedOrder;
    }
  }
};

export default orderService;
