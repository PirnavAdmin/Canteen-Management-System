import { useState, useEffect, useCallback } from 'react';
import { orderService } from '../services/orderService';
import { useToast } from '../../../../app/providers/ToastProvider';

export const useOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { success, error: toastError, info } = useToast();

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await orderService.getAll();
      setOrders(data);
    } catch (err) {
      console.error('Failed to load orders:', err);
      setError(err.message || 'Error loading orders');
      toastError('Order Error', 'Unable to retrieve order transactions.');
    } finally {
      setLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const updateOrderStatus = useCallback(async (orderId, newStatus, note = '') => {
    try {
      const updated = await orderService.updateStatus(orderId, newStatus, note);
      setOrders(prev => prev.map(o => o.id === orderId ? updated : o));
      success('Status Updated', `Order ${updated.token} moved to ${newStatus}.`);
      return updated;
    } catch (err) {
      toastError('Update Blocked', err.message);
      throw err;
    }
  }, [success, toastError]);

  const cancelOrder = useCallback(async (orderId, reason) => {
    try {
      const updated = await orderService.cancelOrder(orderId, reason);
      setOrders(prev => prev.map(o => o.id === orderId ? updated : o));
      info('Order Cancelled', `Order ${updated.token} has been marked as Cancelled.`);
      return updated;
    } catch (err) {
      toastError('Cancellation Error', err.message);
      throw err;
    }
  }, [info, toastError]);

  const processRefund = useCallback(async (orderId) => {
    try {
      const updated = await orderService.processRefund(orderId);
      setOrders(prev => prev.map(o => o.id === orderId ? updated : o));
      success('Refund Processed', `Refund of ${updated.totalAmount} processed for order ${updated.token}.`);
      return updated;
    } catch (err) {
      toastError('Refund Failed', err.message);
      throw err;
    }
  }, [success, toastError]);

  return {
    orders,
    loading,
    error,
    updateOrderStatus,
    cancelOrder,
    processRefund,
    refreshOrders: loadOrders
  };
};

export default useOrders;
