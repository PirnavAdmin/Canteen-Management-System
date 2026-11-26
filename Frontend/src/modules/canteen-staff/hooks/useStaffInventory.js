import { useState, useEffect, useCallback, useMemo } from 'react';
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
  const {
    selectedOutlet: activeOutletId,
    activeOutletName,
    activeCampusName,
    outletsLoading,
    outletsError
  } = useStaffOutlet();

  const outletId = cleanOutletId(outletOverride ?? activeOutletId);

  const [kitchenStock, setKitchenStock] = useState([]);
  const [kitchenLedger, setKitchenLedger] = useState([]);
  const [incomingTransfers, setIncomingTransfers] = useState([]);
  const [stockRequests, setStockRequests] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    if (outletsLoading && !outletId) {
      return;
    }
    if (!outletId) {
      setKitchenStock([]);
      setKitchenLedger([]);
      setStockRequests([]);
      setIncomingTransfers([]);
      setError(outletsError || 'No active canteen outlet available.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

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

      const inTransit = safeRequests.filter((r) => {
        const s = String(r.status || '').toLowerCase();
        return s === 'dispatched' || s === 'in transit' || s === 'approved' || s === 'received' || s === 'partially received';
      });
      setIncomingTransfers(inTransit);
    } catch (err) {
      console.error('Failed to load staff kitchen inventory from backend:', err);
      setError(err.message || 'Unable to load inventory from server.');
      setKitchenStock([]);
      setKitchenLedger([]);
      setStockRequests([]);
      setIncomingTransfers([]);
    } finally {
      setLoading(false);
    }
  }, [outletId, outletsLoading, outletsError]);

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

  const operatorName = user?.fullName || user?.username || user?.name || 'Staff';

  const createRequest = useCallback(async (requestData) => {
    const created = await staffInventoryService.createStockRequest({
      ...requestData,
      requestedBy: operatorName,
      outletId: cleanOutletId(requestData.outletId) || outletId,
      outletName: requestData.outletName || activeOutletName
    });

    await loadData();
    return created;
  }, [operatorName, outletId, activeOutletName, loadData]);

  const updateRequest = useCallback(async (requestId, requestData) => {
    const updated = await staffInventoryService.updateStockRequest(requestId, requestData);
    await loadData();
    return updated;
  }, [loadData]);

  const confirmReceipt = useCallback(async (params) => {
    const result = await staffInventoryService.confirmReceipt({
      ...params,
      receivedBy: operatorName,
      outletId
    });

    await loadData();
    return result;
  }, [operatorName, outletId, loadData]);

  const recordUsage = useCallback(async (usageData) => {
    const result = await staffInventoryService.recordUsage({
      ...usageData,
      performedBy: operatorName,
      outletId
    });

    await loadData();
    return result;
  }, [operatorName, outletId, loadData]);

  const recordWaste = useCallback(async (itemId, quantity, reason, _operator, batchNumber = null) => {
    const result = await staffInventoryService.recordWaste(
      itemId,
      quantity,
      reason,
      operatorName,
      batchNumber
    );
    await loadData();
    return result;
  }, [operatorName, loadData]);

  const deleteRequest = useCallback(async (requestId) => {
    await staffInventoryService.deleteStockRequest(requestId);
    await loadData();
    return true;
  }, [loadData]);

  const markStockReceived = useCallback(async (requestId) => {
    const updated = await staffInventoryService.markStockReceived(requestId);
    await loadData();
    return updated;
  }, [loadData]);

  const lowStockItems = useMemo(() => {
    return kitchenStock.filter(
      (i) => i.status === 'Low Stock' || (Number(i.availableQuantity) <= Number(i.reorderLevel) && Number(i.availableQuantity) > 0)
    );
  }, [kitchenStock]);

  const outOfStockItems = useMemo(() => {
    return kitchenStock.filter(
      (i) => i.status === 'Out of Stock' || Number(i.availableQuantity) <= 0
    );
  }, [kitchenStock]);

  const expiringItems = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return kitchenStock
      .filter((i) => Boolean(i.expiryDate))
      .map((item) => {
        const exp = new Date(item.expiryDate);
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
  }, [kitchenStock]);

  return {
    outletId,
    activeOutletName,
    activeCampusName,
    kitchenStock,
    kitchenLedger,
    incomingTransfers,
    stockRequests,
    inventory: kitchenStock,
    lowStockItems,
    outOfStockItems,
    expiringItems,
    loading,
    error,
    refreshInventory: loadData,
    createRequest,
    updateRequest,
    confirmReceipt,
    recordUsage,
    recordWaste,
    deleteRequest,
    markStockReceived
  };
};

export default useStaffInventory;
