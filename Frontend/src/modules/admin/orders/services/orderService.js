/**
 * Order Management API Service
 * Pure live integration with .NET 8 Web API (Hostinger Cloud MySQL DB).
 * No mock data, no localStorage caching, no simulated fallbacks.
 */

import { apiClient, API_ENDPOINTS } from '../../../../services/api';
import { normalizeOrder, isStatusCompleted } from '../../../canteen-staff/services/staffOrderService';
import { ORDER_STATUS } from '../../../../constants/appConstants';

export const orderService = {
  getAll: async (params = {}) => {
    const response = await apiClient.get(API_ENDPOINTS.ORDERS.BASE, params);
    const list = response?.data ?? response;
    return Array.isArray(list) ? list.map(normalizeOrder) : list;
  },

  getById: async (id) => {
    const response = await apiClient.get(API_ENDPOINTS.ORDERS.BY_ID(id));
    const raw = response?.data ?? response;
    return normalizeOrder(raw);
  },

  create: async (data) => {
    const response = await apiClient.post(API_ENDPOINTS.ORDERS.BASE, data);
    const raw = response?.data ?? response;
    const created = normalizeOrder(raw);
    window.dispatchEvent(new CustomEvent('cms:order_created', { detail: created }));
    window.dispatchEvent(new CustomEvent('cms:order_updated', { detail: created }));
    try {
      localStorage.setItem('cms_order_sync_timestamp', Date.now().toString());
    } catch {}
    return created;
  },

  updateStatus: async (id, newStatus, note = '') => {
    const response = await apiClient.patch(API_ENDPOINTS.ORDERS.UPDATE_STATUS(id), {
      status: newStatus,
      note: note || undefined
    });
    const raw = response?.data ?? response;
    const updated = normalizeOrder(raw);
    if (isStatusCompleted(newStatus)) {
      updated.completedAt = new Date().toISOString();
    }
    window.dispatchEvent(new CustomEvent('cms:order_status_updated', {
      detail: { orderId: id, newStatus, updatedOrder: updated }
    }));
    window.dispatchEvent(new CustomEvent('cms:order_updated', { detail: updated }));
    try {
      localStorage.setItem('cms_order_sync_timestamp', Date.now().toString());
    } catch {}
    return updated;
  },

  cancelOrder: async (id, reason) => {
    if (!reason || !reason.trim()) {
      throw new Error('A cancellation reason is required.');
    }
    const response = await apiClient.post(API_ENDPOINTS.ORDERS.CANCEL(id), { reason });
    const raw = response?.data ?? response;
    const updated = normalizeOrder(raw);
    window.dispatchEvent(new CustomEvent('cms:order_status_updated', {
      detail: { orderId: id, newStatus: ORDER_STATUS.CANCELLED, updatedOrder: updated }
    }));
    window.dispatchEvent(new CustomEvent('cms:order_updated', { detail: updated }));
    try {
      localStorage.setItem('cms_order_sync_timestamp', Date.now().toString());
    } catch {}
    return updated;
  },

  processRefund: async (id) => {
    const response = await apiClient.post(API_ENDPOINTS.ORDERS.REFUND(id));
    const raw = response?.data ?? response;
    const updated = normalizeOrder(raw);
    window.dispatchEvent(new CustomEvent('cms:order_status_updated', {
      detail: { orderId: id, newStatus: ORDER_STATUS.REFUNDED, updatedOrder: updated }
    }));
    window.dispatchEvent(new CustomEvent('cms:order_updated', { detail: updated }));
    try {
      localStorage.setItem('cms_order_sync_timestamp', Date.now().toString());
    } catch {}
    return updated;
  }
};

export default orderService;
