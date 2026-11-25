import { useState, useEffect, useCallback } from 'react';
import { staffInventoryService, cleanOutletId } from '../services/staffInventoryService';
import { useAuth } from '../../../app/providers/AuthProvider';
import { useStaffOutlet } from './useStaffOutlet';

/**
 * Canteen Staff Inventory Hook
 * Pure live integration with backend .NET 8 Web API.
 * ZERO mock data, ZERO localStorage, ZERO dummy fallbacks.
 */
export const useStaffInventory = (outletOverride = null) => {
  const { user } = useAuth();
  const { selectedOutlet: activeOutletId, activeOutletName, activeCampusName } = useStaffOutlet();
  const outletId = cleanOutletId(outletOverride ?? activeOutletId) || 1;

  // 1. Live Kitchen Stock from database
  const [kitchenStock, setKitchenStock] = useState([]);

  // 2. Live Movement Ledger from database
  const [kitchenLedger, setKitchenLedger] = useState([]);

  // 3. Live Incoming Transfers from database (Approved/Dispatched requisitions)
  const [incomingTransfers, setIncomingTransfers] = useState([]);

  // 4. Live Stock Requests from database
  const [stockRequests, setStockRequests] = useState([]);

  // 5. Loading & Error States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch live inventory, ledger, and stock requisitions in parallel directly from backend
      const [itemsData, ledgerData, requestsData] = await Promise.all([
        staffInventoryService.getAllInventory(outletId),
        staffInventoryService.getInventoryLedger({ outletId }),
        staffInventoryService.getStockRequests(outletId)
      ]);

      const safeItems = Array.isArray(itemsData) ? itemsData : [];
      const safeLedger = Array.isArray(ledgerData) ? ledgerData : [];
      const safeRequests = Array.isArray(requestsData) ? requestsData : [];

      setKitchenStock(safeItems);
      setKitchenLedger(safeLedger);
      setStockRequests(safeRequests);

      // Incoming transfers are active requests awaiting physical receipt at the counter
      const inTransit = safeRequests.filter((r) => {
        const s = String(r.status || '').toLowerCase();
        return s === 'dispatched' || s === 'in transit' || s === 'approved';
      });
      setIncomingTransfers(inTransit);
    } catch (err) {
      console.error('Failed to load staff kitchen inventory from backend:', err);
      setError(err.message || 'Error loading live inventory from server.');
      setKitchenStock([]);
      setKitchenLedger([]);
      setStockRequests([]);
      setIncomingTransfers([]);
    } finally {
      setLoading(false);
    }
  }, [outletId]);

  useEffect(() => {
    loadData();

    const handleUpdate = () => {
      loadData();
    };

    window.addEventListener('cms:inventory_updated', handleUpdate);
    window.addEventListener('cms:stock_request_created', handleUpdate);
    window.addEventListener('cms:stock_request_updated', handleUpdate);
    window.addEventListener('cms:stock_received', handleUpdate);
    window.addEventListener('cms:outlet_changed', handleUpdate);

    return () => {
      window.removeEventListener('cms:inventory_updated', handleUpdate);
      window.removeEventListener('cms:stock_request_created', handleUpdate);
      window.removeEventListener('cms:stock_request_updated', handleUpdate);
      window.removeEventListener('cms:stock_received', handleUpdate);
      window.removeEventListener('cms:outlet_changed', handleUpdate);
    };
  }, [loadData]);

  // Create Stock Requisition to Central Warehouse via backend API
  const createRequest = useCallback(async (requestData) => {
    const requester = user?.fullName || user?.username || 'Staff Attendant';
    const created = await staffInventoryService.createStockRequest({
      ...requestData,
      requestedBy: requester,
      outletId,
      outletName: activeOutletName
    });

    await loadData();
    return created;
  }, [user, outletId, activeOutletName, loadData]);

  // Confirm Receipt of Incoming Stock from Central Warehouse via backend API
  const confirmReceipt = useCallback(async (params) => {
    const receivedBy = user?.fullName || user?.username || 'Staff Attendant';
    const result = await staffInventoryService.confirmReceipt({
      ...params,
      receivedBy,
      outletId
    });

    await loadData();
    return result;
  }, [user, outletId, loadData]);

  // Record Kitchen Usage (Consumption during cooking or Wastage/Spoilage) via backend API
  const recordUsage = useCallback(async (usageData) => {
    const performedBy = user?.fullName || user?.username || 'Chef Manoj';
    const result = await staffInventoryService.recordUsage({
      ...usageData,
      performedBy,
      outletId
    });

    await loadData();
    return result;
  }, [user, outletId, loadData]);

  // Delete / Cancel a pending stock requisition via backend API
  const deleteRequest = useCallback(async (requestId) => {
    await staffInventoryService.deleteStockRequest(requestId);
    await loadData();
    return true;
  }, [loadData]);

  // Mark Stock Received directly by request ID
  const markStockReceived = useCallback(async (requestId) => {
    const updated = await staffInventoryService.markStockReceived(requestId);
    await loadData();
    return updated;
  }, [loadData]);

  // Derived stock health lists directly from live data
  const inventory = kitchenStock;
  const lowStockItems = kitchenStock.filter(
    (i) => i.status === 'Low Stock' || (Number(i.availableQuantity) <= Number(i.reorderLevel) && Number(i.availableQuantity) > 0)
  );
  const outOfStockItems = kitchenStock.filter(
    (i) => i.status === 'Out of Stock' || Number(i.availableQuantity) <= 0
  );
  const expiringItems = kitchenStock
    .filter((i) => Boolean(i.expiryDate))
    .map((item) => {
      const exp = new Date(item.expiryDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      exp.setHours(0, 0, 0, 0);
      const diffTime = exp.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      let urgencyTag = 'valid';
      if (diffDays < 0) urgencyTag = 'expired';
      else if (diffDays === 0) urgencyTag = 'today';
      else if (diffDays <= 3) urgencyTag = 'critical';
      else if (diffDays <= 7) urgencyTag = 'soon';

      return {
        ...item,
        daysToExpiry: diffDays,
        urgencyTag
      };
    })
    .filter((i) => i.daysToExpiry <= 7)
    .sort((a, b) => a.daysToExpiry - b.daysToExpiry);

  return {
    outletId,
    activeOutletName,
    activeCampusName,
    kitchenStock,
    kitchenLedger,
    incomingTransfers,
    stockRequests,
    inventory,
    lowStockItems,
    outOfStockItems,
    expiringItems,
    loading,
    error,
    refreshInventory: loadData,
    createRequest,
    confirmReceipt,
    recordUsage,
    deleteRequest,
    markStockReceived
  };
};

export default useStaffInventory;
