import { useState, useEffect, useCallback, useRef } from 'react';
import { staffOrderService, cleanOutletId } from '../services/staffOrderService';
import { useAuth } from '../../../app/providers/AuthProvider';
import { useStaffOutlet } from './useStaffOutlet';

/**
 * Fast shallow comparison of order arrays to prevent unnecessary React re-renders
 */
const areOrdersEqual = (prev, next) => {
  if (!Array.isArray(prev) || !Array.isArray(next)) return false;
  if (prev.length !== next.length) return false;
  for (let i = 0; i < prev.length; i++) {
    const p = prev[i];
    const n = next[i];
    if (
      p.id !== n.id ||
      p.status !== n.status ||
      p.prepStartedAt !== n.prepStartedAt ||
      p.prepCompletedAt !== n.prepCompletedAt ||
      (p.timeline?.length || 0) !== (n.timeline?.length || 0)
    ) {
      return false;
    }
  }
  return true;
};

export const useStaffOrders = (outletOverride = null) => {
  const { user } = useAuth();
  const {
    selectedOutlet: activeOutletId,
    activeOutletName,
    activeCampusName,
    outletsLoading,
    outletsError,
    isOrderInCurrentOutlet
  } = useStaffOutlet();

  const currentOutletId = outletOverride ?? activeOutletId;

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isFetchingRef = useRef(false);
  const isFirstMountRef = useRef(true);
  const debounceTimerRef = useRef(null);

  const loadOrders = useCallback(async (isManualRefresh = false) => {
    if (outletsLoading && !currentOutletId) {
      return;
    }
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    if (isManualRefresh || isFirstMountRef.current) {
      setLoading(true);
    }

    try {
      setError(null);
      const targetId = cleanOutletId(currentOutletId);
      const params = (targetId && currentOutletId !== 'ALL') ? { outletId: targetId } : {};
      const data = await staffOrderService.getAllOrders(params);
      const freshList = Array.isArray(data) ? data : [];

      const outletFilteredList = freshList.filter(isOrderInCurrentOutlet);

      setOrders((prevOrders) => {
        if (areOrdersEqual(prevOrders, outletFilteredList)) {
          return prevOrders;
        }
        return outletFilteredList;
      });
    } catch (err) {
      console.error('Failed to load staff orders:', err);
      setError(err.message || outletsError || 'Unable to load orders from server.');
    } finally {
      isFetchingRef.current = false;
      isFirstMountRef.current = false;
      setLoading(false);
    }
  }, [currentOutletId, outletsLoading, outletsError, isOrderInCurrentOutlet]);

  const manualRefresh = useCallback(() => {
    return loadOrders(true);
  }, [loadOrders]);

  useEffect(() => {
    loadOrders(false);

    const handleOrderEvent = (e) => {
      const detail = e?.detail;
      const order = detail?.updatedOrder || detail?.order || detail;
      if (order && order.id) {
        setOrders((prev) => prev.map((o) => String(o.id) === String(order.id) ? { ...o, ...order } : o));
      }
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        loadOrders(false);
      }, 500);
    };

    const handleOutletEvent = () => {
      loadOrders(true);
    };

    window.addEventListener('cms:order_status_updated', handleOrderEvent);
    window.addEventListener('cms:order_created', handleOrderEvent);
    window.addEventListener('cms:order_updated', handleOrderEvent);
    window.addEventListener('cms:outlet_changed', handleOutletEvent);

    const pollInterval = setInterval(() => {
      loadOrders(false);
    }, 20000);

    return () => {
      clearInterval(pollInterval);
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      window.removeEventListener('cms:order_status_updated', handleOrderEvent);
      window.removeEventListener('cms:order_created', handleOrderEvent);
      window.removeEventListener('cms:order_updated', handleOrderEvent);
      window.removeEventListener('cms:outlet_changed', handleOutletEvent);
    };
  }, [loadOrders]);

  const operatorName = user?.fullName || user?.username || user?.name || 'Staff';

  const advanceOrderStatus = useCallback(async (orderId, nextStatus, note = '') => {
    const updated = await staffOrderService.updateOrderStatus(orderId, nextStatus, note, operatorName);
    setOrders((prev) => prev.map((o) => String(o.id) === String(orderId) ? updated : o));
    return updated;
  }, [operatorName]);

  const acceptOrder = useCallback(async (orderId) => {
    const updated = await staffOrderService.acceptOrder(orderId, operatorName);
    setOrders((prev) => prev.map((o) => String(o.id) === String(orderId) ? updated : o));
    return updated;
  }, [operatorName]);

  const startPreparation = useCallback(async (orderId) => {
    const updated = await staffOrderService.startPreparation(orderId, operatorName);
    setOrders((prev) => prev.map((o) => String(o.id) === String(orderId) ? updated : o));
    return updated;
  }, [operatorName]);

  const markReadyForPickup = useCallback(async (orderId) => {
    const updated = await staffOrderService.markReadyForPickup(orderId, operatorName);
    setOrders((prev) => prev.map((o) => String(o.id) === String(orderId) ? updated : o));
    return updated;
  }, [operatorName]);

  const rejectOrder = useCallback(async (orderId, reason) => {
    const updated = await staffOrderService.rejectOrder(orderId, reason, operatorName);
    setOrders((prev) => prev.map((o) => String(o.id) === String(orderId) ? updated : o));
    return updated;
  }, [operatorName]);

  const markCollected = useCallback(async (orderId) => {
    const updated = await staffOrderService.markCollected(orderId, operatorName);
    setOrders((prev) => prev.map((o) => String(o.id) === String(orderId) ? updated : o));
    return updated;
  }, [operatorName]);

  const completeOrder = useCallback(async (orderId) => {
    return markCollected(orderId);
  }, [markCollected]);

  const confirmPickupHandover = useCallback(async (orderId) => {
    return markCollected(orderId);
  }, [markCollected]);

  const metrics = staffOrderService.calculateMetrics(orders);

  return {
    orders,
    metrics,
    loading,
    error,
    selectedOutlet: currentOutletId,
    activeOutletName,
    activeCampusName,
    refreshOrders: manualRefresh,
    advanceOrderStatus,
    acceptOrder,
    startPreparation,
    markReadyForPickup,
    markCollected,
    rejectOrder,
    completeOrder,
    confirmPickupHandover
  };
};

export default useStaffOrders;
