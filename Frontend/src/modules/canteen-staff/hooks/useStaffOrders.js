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
    isOrderInCurrentOutlet
  } = useStaffOutlet();

  const currentOutletId = outletOverride ?? activeOutletId;

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isFetchingRef = useRef(false);
  const isFirstMountRef = useRef(true);
  const debounceTimerRef = useRef(null);

  // loadOrders: silent background update by default (isManualRefresh = false)
  // Only toggles `loading = true` on initial component mount or explicit manual Refresh click
  const loadOrders = useCallback(async (isManualRefresh = false) => {
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

      // Outlet Isolation: Guarantee orders strictly belong to the active outlet
      const outletFilteredList = freshList.filter(isOrderInCurrentOutlet);

      setOrders(prevOrders => {
        if (areOrdersEqual(prevOrders, outletFilteredList)) {
          return prevOrders;
        }
        return outletFilteredList;
      });
    } catch (err) {
      console.error('Failed to load staff orders:', err);
      setError(err.message || 'Error fetching staff orders');
    } finally {
      isFetchingRef.current = false;
      isFirstMountRef.current = false;
      setLoading(false);
    }
  }, [currentOutletId, isOrderInCurrentOutlet]);

  const manualRefresh = useCallback(() => {
    return loadOrders(true);
  }, [loadOrders]);

  useEffect(() => {
    // Initial fetch on mount
    loadOrders(false);

    // Immediate state reflection + Debounced background sync for cross-tab events
    const handleOrderEvent = (e) => {
      const detail = e?.detail;
      const order = detail?.updatedOrder || detail?.order || detail;
      if (order && order.id) {
        setOrders(prev => prev.map(o => String(o.id) === String(order.id) ? { ...o, ...order } : o));
      }
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        loadOrders(false); // Silent background fetch without toggling loading spinners
      }, 500);
    };

    const handleOutletEvent = () => {
      loadOrders(true);
    };

    window.addEventListener('cms:order_status_updated', handleOrderEvent);
    window.addEventListener('cms:order_created', handleOrderEvent);
    window.addEventListener('cms:order_updated', handleOrderEvent);
    window.addEventListener('cms:outlet_changed', handleOutletEvent);

    // Controlled 20-second background polling interval for quiet synchronization
    const pollInterval = setInterval(() => {
      loadOrders(false); // Silent background sync without loading spinners
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

  const markCollected = useCallback(async (orderId) => {
    try {
      const operator = user?.fullName || user?.username || 'Counter Staff';
      const updated = await staffOrderService.markCollected(orderId, operator);
      setOrders(prev => prev.map(o => String(o.id) === String(orderId) ? updated : o));
      return updated;
    } catch (err) {
      console.error('Failed to mark order as collected:', err);
      throw err;
    }
  }, [user]);

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
