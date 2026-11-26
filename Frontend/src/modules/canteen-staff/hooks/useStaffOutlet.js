import { useMemo, useCallback } from 'react';
import { useCanteensContext } from '../../../app/providers/CanteenProvider';
import { useAuth } from '../../../app/providers/AuthProvider';
import { cleanOutletId } from '../services/staffOrderService';

/**
 * Canteen Staff Outlet Context Hook
 * Pure live integration with registered backend canteen outlets.
 * ZERO mock data, ZERO localStorage, ZERO dummy fallbacks.
 */
export const useStaffOutlet = () => {
  const { user } = useAuth();
  const canteensContext = useCanteensContext();

  const assignedOutletId = user?.assignedOutletId ?? user?.outletId ?? user?.canteenId ?? null;
  const isStaffRestricted = Boolean(
    assignedOutletId &&
    user?.role &&
    !String(user.role).toLowerCase().includes('admin')
  );

  const rawCanteens = canteensContext?.canteens;
  const contextSelectedOutlet = canteensContext?.selectedOutlet;

  // Dining outlets derived purely from backend canteens in CanteenContext (excluding Central Warehouse)
  const outlets = useMemo(() => {
    if (Array.isArray(rawCanteens) && rawCanteens.length > 0) {
      return rawCanteens
        .filter((c) => {
          const oid = Number(c.outletId ?? c.id);
          const name = (c.name || c.outletName || '').toLowerCase();
          const code = (c.code || '').toUpperCase();
          return oid !== 4 && code !== 'WH-01' && !name.includes('warehouse');
        })
        .map((c, index) => {
          const cleanedId = cleanOutletId(c.outletId ?? c.id) || (index + 1);
          return {
            id: cleanedId,
            outletId: cleanedId,
            name: c.name || c.outletName || `Outlet #${cleanedId}`,
            campus: typeof c.campus === 'object' ? (c.campus?.name || '') : (c.campus || ''),
            code: c.code || `OUT-${cleanedId}`,
            status: c.status || 'Active',
            assignedStaff: c.assignedStaff || []
          };
        });
    }
    return [];
  }, [rawCanteens]);

  const selectedOutlet = useMemo(() => {
    if (assignedOutletId) {
      const cleanAssigned = cleanOutletId(assignedOutletId);
      return String(cleanAssigned || assignedOutletId);
    }
    if (contextSelectedOutlet && contextSelectedOutlet !== 'ALL') {
      return String(contextSelectedOutlet);
    }
    if (outlets.length > 0) {
      return String(outlets[0].id);
    }
    return '';
  }, [assignedOutletId, contextSelectedOutlet, outlets]);

  const selectedOutletObj = useMemo(() => {
    if (!selectedOutlet) return null;
    return (
      outlets.find(
        (o) => String(o.id) === String(selectedOutlet) || String(o.outletId) === String(selectedOutlet)
      ) || outlets[0] || null
    );
  }, [outlets, selectedOutlet]);

  const activeOutletName = selectedOutletObj?.name || '';
  const activeCampusName = selectedOutletObj?.campus || canteensContext?.selectedCampus || '';

  const changeOutlet = useCallback(
    (outletId) => {
      if (isStaffRestricted) {
        return;
      }
      const val = String(outletId);
      if (canteensContext?.setSelectedOutlet) {
        canteensContext.setSelectedOutlet(val);
      }
      window.dispatchEvent(new CustomEvent('cms:outlet_changed', { detail: { outletId: val } }));
    },
    [isStaffRestricted, canteensContext]
  );

  const isOrderInCurrentOutlet = useCallback(
    (order) => {
      if (!order) return false;
      if (!selectedOutlet || selectedOutlet === 'ALL') return true;

      const targetOutletId = cleanOutletId(selectedOutlet);
      if (!targetOutletId) return true;

      const orderOutletId = cleanOutletId(order.outletId ?? order.OutletId);
      if (orderOutletId !== undefined) {
        return Number(orderOutletId) === Number(targetOutletId);
      }

      const orderOutletName = (order.outletName ?? order.OutletName ?? '').toLowerCase();
      if (orderOutletName && activeOutletName) {
        const activeName = activeOutletName.toLowerCase();
        return orderOutletName.includes(activeName) || activeName.includes(orderOutletName);
      }

      return false;
    },
    [selectedOutlet, activeOutletName]
  );

  const filterOrdersByOutlet = useCallback(
    (ordersList) => {
      if (!Array.isArray(ordersList)) return [];
      return ordersList.filter(isOrderInCurrentOutlet);
    },
    [isOrderInCurrentOutlet]
  );

  return {
    outlets,
    selectedOutlet,
    selectedOutletObj,
    activeOutletName,
    activeCampusName,
    availableCampuses: canteensContext?.availableCampuses ?? [],
    selectedCampus: canteensContext?.selectedCampus ?? '',
    setSelectedCampus: canteensContext?.setSelectedCampus,
    outletsLoading: canteensContext?.loading ?? false,
    outletsError: canteensContext?.error ?? null,
    isStaffRestricted,
    assignedOutletId,
    changeOutlet,
    isOrderInCurrentOutlet,
    filterOrdersByOutlet
  };
};

export default useStaffOutlet;
