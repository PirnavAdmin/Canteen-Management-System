import { useState, useEffect, useCallback } from 'react';
import { staffInventoryService } from '../services/staffInventoryService';
import { useAuth } from '../../../app/providers/AuthProvider';

export const useStaffInventory = (outletId = 'canteen-001') => {
  const { user } = useAuth();
  const [inventory, setInventory] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [expiringItems, setExpiringItems] = useState([]);
  const [stockRequests, setStockRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [items, requests] = await Promise.all([
        staffInventoryService.getAllInventory(outletId),
        staffInventoryService.getStockRequests(outletId)
      ]);
      const low = await staffInventoryService.getLowStockItems(outletId, items);
      const expiring = await staffInventoryService.getExpiringItems(7, outletId, items);
      setInventory(items);
      setLowStockItems(low);
      setExpiringItems(expiring);
      setStockRequests(requests);
    } catch (err) {
      console.error('Failed to load staff inventory:', err);
      setError(err.message || 'Error loading inventory data');
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

    return () => {
      window.removeEventListener('cms:inventory_updated', handleUpdate);
      window.removeEventListener('cms:stock_request_created', handleUpdate);
      window.removeEventListener('cms:stock_request_updated', handleUpdate);
    };
  }, [loadData]);

  const createRequest = useCallback(async (requestData) => {
    try {
      const requester = user?.fullName || user?.username || 'Staff Attendant';
      const created = await staffInventoryService.createStockRequest({
        ...requestData,
        requestedBy: requester,
        outletId
      });
      await loadData();
      return created;
    } catch (err) {
      console.error('Error creating stock request:', err);
      throw err;
    }
  }, [user, outletId, loadData]);

  const recordWaste = useCallback(async (itemId, quantity, reason, operator, batchNumber) => {
    try {
      const updated = await staffInventoryService.recordWaste(itemId, quantity, reason, operator, batchNumber);
      await loadData();
      return updated;
    } catch (err) {
      console.error('Error recording waste:', err);
      throw err;
    }
  }, [loadData]);

  const deleteRequest = useCallback(async (requestId) => {
    try {
      await staffInventoryService.deleteStockRequest(requestId);
      await loadData();
      return true;
    } catch (err) {
      console.error('Error deleting stock request:', err);
      throw err;
    }
  }, [loadData]);

  const markStockReceived = useCallback(async (requestId) => {
    try {
      const updated = await staffInventoryService.markStockReceived(requestId);
      await loadData();
      return updated;
    } catch (err) {
      console.error('Error marking stock received:', err);
      throw err;
    }
  }, [loadData]);

  return {
    inventory,
    lowStockItems,
    expiringItems,
    stockRequests,
    loading,
    error,
    refreshInventory: loadData,
    createRequest,
    deleteRequest,
    recordWaste,
    markStockReceived
  };
};

export default useStaffInventory;
