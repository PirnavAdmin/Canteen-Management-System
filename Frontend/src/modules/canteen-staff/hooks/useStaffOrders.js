import { useState, useEffect, useCallback } from 'react';
import { staffOrderService } from '../services/staffOrderService';
import { useAuth } from '../../../app/providers/AuthProvider';

export const useStaffOrders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await staffOrderService.getAllOrders();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load staff orders:', err);
      setError(err.message || 'Error fetching staff orders');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();

    const handleOrderEvent = () => {
      loadOrders();
    };

    window.addEventListener('cms:order_status_updated', handleOrderEvent);
    window.addEventListener('cms:order_created', handleOrderEvent);

    // Periodic polling to synchronize across browser tabs and backend
    const interval = setInterval(() => {
      loadOrders();
    }, 10000);

    return () => {
      window.removeEventListener('cms:order_status_updated', handleOrderEvent);
      window.removeEventListener('cms:order_created', handleOrderEvent);
      clearInterval(interval);
    };
  }, [loadOrders]);

  const advanceOrderStatus = useCallback(async (orderId, nextStatus, note = '') => {
    try {
      const operator = user?.fullName || user?.username || 'Staff Attendant';
      const updated = await staffOrderService.updateOrderStatus(orderId, nextStatus, note, operator);
      setOrders(prev => prev.map(o => String(o.id) === String(orderId) ? updated : o));
      return updated;
    } catch (err) {
      console.error('Failed to update status:', err);
      throw err;
    }
  }, [user]);

  const acceptOrder = useCallback(async (orderId) => {
    const operator = user?.fullName || user?.username || 'Staff Attendant';
    const updated = await staffOrderService.acceptOrder(orderId, operator);
    setOrders(prev => prev.map(o => String(o.id) === String(orderId) ? updated : o));
    return updated;
  }, [user]);

  const startPreparation = useCallback(async (orderId) => {
    const operator = user?.fullName || user?.username || 'Chef / Kitchen Staff';
    const updated = await staffOrderService.startPreparation(orderId, operator);
    setOrders(prev => prev.map(o => String(o.id) === String(orderId) ? updated : o));
    return updated;
  }, [user]);

  const markReadyForPickup = useCallback(async (orderId) => {
    const operator = user?.fullName || user?.username || 'Kitchen & Counter Staff';
    const updated = await staffOrderService.markReadyForPickup(orderId, operator);
    setOrders(prev => prev.map(o => String(o.id) === String(orderId) ? updated : o));
    return updated;
  }, [user]);

  const rejectOrder = useCallback(async (orderId, reason) => {
    const operator = user?.fullName || user?.username || 'Staff Attendant';
    const updated = await staffOrderService.rejectOrder(orderId, reason, operator);
    setOrders(prev => prev.map(o => String(o.id) === String(orderId) ? updated : o));
    return updated;
  }, [user]);

  const confirmPickupHandover = useCallback(async (orderId) => {
    try {
      const operator = user?.fullName || user?.username || 'Counter Staff';
      const updated = await staffOrderService.confirmHandover(orderId, operator);
      setOrders(prev => prev.map(o => String(o.id) === String(orderId) ? updated : o));
      return updated;
    } catch (err) {
      console.error('Failed to confirm handover:', err);
      throw err;
    }
  }, [user]);

  const metrics = staffOrderService.calculateMetrics(orders);

  return {
    orders,
    metrics,
    loading,
    error,
    refreshOrders: loadOrders,
    advanceOrderStatus,
    acceptOrder,
    startPreparation,
    markReadyForPickup,
    rejectOrder,
    confirmPickupHandover
  };
};

export default useStaffOrders;
