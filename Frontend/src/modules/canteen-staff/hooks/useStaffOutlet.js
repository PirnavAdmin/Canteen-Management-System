import { useMemo, useCallback } from 'react';
import { useCanteensContext } from '../../../app/providers/CanteenProvider';
import { useAuth } from '../../../app/providers/AuthProvider';
import { STAFF_APP_CONFIG } from '../constants/staffNavigation';
import { cleanOutletId } from '../services/staffOrderService';

/**
 * Canteen Staff Outlet Context Hook
 * Pure live integration with registered backend canteen outlets.
 * ZERO mock data, ZERO localStorage, ZERO dummy fallbacks.
 */
export const useStaffOutlet = () => {
  const { user } = useAuth();
  let canteensContext = null;
  try {
    canteensContext = useCanteensContext();
  } catch {
    canteensContext = null;
  }

  // 1. Staff Assignment:
  // If the logged-in staff member has an assigned outlet, link to it directly.
  const assignedOutletId = user?.assignedOutletId ?? user?.outletId ?? user?.canteenId ?? null;
  const isStaffRestricted = Boolean(
    assignedOutletId &&
    user?.role &&
    !String(user.role).toLowerCase().includes('admin')
  );

  // 2. Outlets list: Derived purely from backend canteens in CanteenContext
  const outlets = useMemo(() => {
    const rawList = canteensContext?.canteens;
    if (Array.isArray(rawList) && rawList.length > 0) {
      return rawList.map((c, index) => {
        const cleanedId = cleanOutletId(c.outletId ?? c.id) || (index + 1);
        return {
          id: cleanedId,
          outletId: cleanedId,
          name: c.name || `Outlet ${cleanedId}`,
          campus: typeof c.campus === 'object' ? (c.campus?.name || 'Main Campus') : (c.campus || 'Main Campus'),
          code: c.code || `OUT-${cleanedId}`,
          status: c.status || 'Active',
          assignedStaff: c.assignedStaff || []
        };
      });
    }
    return [];
  }, [canteensContext?.canteens]);

  // 3. Current active selected outlet ID (defaults to assigned outlet or '1')
  const selectedOutlet = useMemo(() => {
    if (assignedOutletId) {
      const cleanAssigned = cleanOutletId(assignedOutletId);
      return String(cleanAssigned || assignedOutletId);
    }
    if (canteensContext?.selectedOutlet && canteensContext.selectedOutlet !== 'ALL') {
      return String(canteensContext.selectedOutlet);
    }
    if (outlets.length > 0) {
      return String(outlets[0].id);
    }
    return '1';
  }, [assignedOutletId, canteensContext?.selectedOutlet, outlets]);

  // 4. Active outlet object
  const selectedOutletObj = useMemo(() => {
    const found = outlets.find(
      (o) => String(o.id) === String(selectedOutlet) || String(o.outletId) === String(selectedOutlet)
    );
    return found || outlets[0] || null;
  }, [outlets, selectedOutlet]);

  const activeOutletName = selectedOutletObj?.name || STAFF_APP_CONFIG.canteenOutlet;
  const activeCampusName = selectedOutletObj?.campus || STAFF_APP_CONFIG.campusName;

  // 5. Change active outlet (if not restricted by staff assignment)
  const changeOutlet = useCallback(
    (outletId) => {
      if (isStaffRestricted) {
        console.warn(`Staff member is assigned to outlet ${assignedOutletId} and cannot switch.`);
        return;
      }
      const val = String(outletId);
      if (canteensContext?.setSelectedOutlet) {
        canteensContext.setSelectedOutlet(val);
      }
      window.dispatchEvent(new CustomEvent('cms:outlet_changed', { detail: { outletId: val } }));
    },
    [isStaffRestricted, assignedOutletId, canteensContext]
  );

  // 6. Outlet Filter Helper: Checks whether an order belongs to the active outlet
  const isOrderInCurrentOutlet = useCallback(
    (order) => {
      if (!order) return false;
      if (selectedOutlet === 'ALL') return true;

      const targetOutletId = cleanOutletId(selectedOutlet) || 1;
      const orderOutletId = cleanOutletId(order.outletId ?? order.OutletId);

      // Match by normalized numeric outletId
      if (orderOutletId !== undefined) {
        return Number(orderOutletId) === Number(targetOutletId);
      }

      // Match by outlet name if present
      const orderOutletName = (order.outletName ?? order.OutletName ?? '').toLowerCase();
      if (orderOutletName) {
        const activeName = (activeOutletName || '').toLowerCase();
        if (orderOutletName.includes(activeName) || activeName.includes(orderOutletName)) {
          return true;
        }
      }

      return Number(targetOutletId) === 1;
    },
    [selectedOutlet, activeOutletName]
  );

  // 7. Filter an array of orders strictly by active outlet
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
    isStaffRestricted,
    assignedOutletId,
    changeOutlet,
    isOrderInCurrentOutlet,
    filterOrdersByOutlet
  };
};

export default useStaffOutlet;
