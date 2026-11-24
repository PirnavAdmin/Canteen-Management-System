import { useState, useEffect, useCallback } from 'react';
import { inventoryService } from '../services/inventoryService';
import { useToast } from '../../../../app/providers/ToastProvider';

export const useInventory = (selectedOutlet = 'ALL') => {
  const [items, setItems] = useState([]);
  const [ledger, setLedger] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [stockRequests, setStockRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { success, error: toastError, info } = useToast();

  const loadAll = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const outletParams = selectedOutlet && selectedOutlet !== 'ALL' && Number(selectedOutlet) > 0 ? { outletId: Number(selectedOutlet) } : {};
      const [itms, ledg, pos, sups, reqs] = await Promise.all([
        inventoryService.getItems(outletParams),
        inventoryService.getLedger(outletParams),
        inventoryService.getPurchaseOrders(outletParams),
        inventoryService.getSuppliers(),
        inventoryService.getStockRequests(outletParams)
      ]);
      setItems(itms);
      setLedger(ledg);
      setPurchaseOrders(pos);
      setSuppliers(sups);
      setStockRequests(reqs);
    } catch (err) {
      console.error('Failed to load inventory data:', err);
      setError(err.message || 'Error loading inventory');
      toastError('Inventory Error', 'Unable to retrieve inventory data.');
    } finally {
      setLoading(false);
    }
  }, [selectedOutlet, toastError]);

  useEffect(() => {
    loadAll();

    const handleUpdate = () => loadAll();
    const handleStorage = (e) => {
      if (e.key === 'cms_stock_request_sync_timestamp' || e.key === 'cms_inventory_sync_timestamp') {
        loadAll();
      }
    };

    window.addEventListener('cms:stock_request_created', handleUpdate);
    window.addEventListener('cms:stock_request_updated', handleUpdate);
    window.addEventListener('cms:inventory_updated', handleUpdate);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('cms:stock_request_created', handleUpdate);
      window.removeEventListener('cms:stock_request_updated', handleUpdate);
      window.removeEventListener('cms:inventory_updated', handleUpdate);
      window.removeEventListener('storage', handleStorage);
    };
  }, [loadAll]);

  const recordMovement = useCallback(async (movementData) => {
    try {
      const res = await inventoryService.recordMovement(movementData);
      setItems(prev => prev.map(i => i.id === res.item.id ? res.item : i));
      setLedger(prev => [res.movement, ...prev]);
      success('Stock Movement Logged', `Logged ${movementData.movementType} (${movementData.quantity} ${res.movement.unit}) for ${res.item.ingredientName}.`);
      return res;
    } catch (err) {
      toastError('Movement Failed', err.message);
      throw err;
    }
  }, [success, toastError]);

  const createPO = useCallback(async (poData) => {
    try {
      const newPO = await inventoryService.createPurchaseOrder(poData);
      setPurchaseOrders(prev => [newPO, ...prev]);
      success('PO Submitted', `Purchase Order ${newPO.poNumber} created successfully.`);
      return newPO;
    } catch (err) {
      toastError('Creation Failed', err.message);
      throw err;
    }
  }, [success, toastError]);

  const updatePOStatus = useCallback(async (id, status) => {
    try {
      const updated = await inventoryService.updatePOStatus(id, status);
      setPurchaseOrders(prev => prev.map(p => p.id === id ? updated : p));

      if (status === 'Received') {
        const outletParams = selectedOutlet && selectedOutlet !== 'ALL' && Number(selectedOutlet) > 0 ? { outletId: Number(selectedOutlet) } : {};
        const [updatedItems, updatedLedger] = await Promise.all([
          inventoryService.getItems(outletParams),
          inventoryService.getLedger(outletParams)
        ]);
        setItems(updatedItems);
        setLedger(updatedLedger);
        success('Delivery Received', `Stock inward completed for PO ${updated.poNumber}. Stock & Movement Ledger updated!`);
      } else {
        info('PO Updated', `Purchase Order ${updated.poNumber} moved to ${status}.`);
      }

      return updated;
    } catch (err) {
      toastError('Status Failed', err.message);
      throw err;
    }
  }, [info, success, toastError, selectedOutlet]);

  const approveStockRequest = useCallback(async (id) => {
    try {
      const res = await inventoryService.approveStockRequest(id);
      success('Requisition Approved & Inwarded', `Stock request ${id} approved and ingredients received into inventory!`);
      await loadAll();
      return res;
    } catch (err) {
      toastError('Approval Failed', err.message || 'Failed to approve stock request.');
      throw err;
    }
  }, [loadAll, success, toastError]);

  const rejectStockRequest = useCallback(async (id) => {
    try {
      const res = await inventoryService.rejectStockRequest(id);
      info('Requisition Rejected', `Stock request ${id} has been rejected.`);
      await loadAll();
      return res;
    } catch (err) {
      toastError('Rejection Failed', err.message || 'Failed to reject stock request.');
      throw err;
    }
  }, [loadAll, info, toastError]);

  const createSupplier = useCallback(async (supData) => {
    try {
      const newSup = await inventoryService.createSupplier(supData);
      setSuppliers(prev => [newSup, ...prev]);
      success('Supplier Registered', `Registered vendor "${newSup.name}".`);
      return newSup;
    } catch (err) {
      toastError('Registration Failed', err.message);
      throw err;
    }
  }, [success, toastError]);

  const updateSupplier = useCallback(async (id, updatedData) => {
    try {
      const updated = await inventoryService.updateSupplier(id, updatedData);
      setSuppliers(prev => prev.map(s => {
        const isMatch = s.id === id || String(s.id) === String(id);
        return isMatch ? { ...s, ...updated } : s;
      }));
      success('Supplier Updated', `Updated details for "${updated?.name || updatedData?.name || 'Supplier'}".`);
      return updated;
    } catch (err) {
      toastError('Update Failed', err.message || 'Failed to update supplier.');
      throw err;
    }
  }, [success, toastError]);

  const deleteSupplier = useCallback(async (id) => {
    try {
      const result = await inventoryService.deleteSupplier(id);
      if (result?.actionTaken === 'SOFT_DELETED') {
        setSuppliers(prev => prev.map(s => {
          const isMatch = s.id === id || String(s.id) === String(id);
          return isMatch ? { ...s, status: 'Inactive' } : s;
        }));
        info('Supplier Inactivated', result?.message || 'Supplier has linked purchase orders, so status was set to Inactive.');
      } else {
        setSuppliers(prev => prev.filter(s => !(s.id === id || String(s.id) === String(id))));
        success('Supplier Deleted', result?.message || 'Supplier deleted successfully.');
      }
      return result;
    } catch (err) {
      toastError('Delete Failed', err.message || 'Failed to delete supplier.');
      throw err;
    }
  }, [success, info, toastError]);

  const deactivateSupplier = useCallback(async (id) => {
    try {
      const current = suppliers.find(s => s.id === id || String(s.id) === String(id));
      const nextStatus = current?.status === 'Inactive' ? 'Active' : 'Inactive';
      const updated = await inventoryService.updateSupplierStatus(id, nextStatus);
      setSuppliers(prev => prev.map(s => {
        const isMatch = s.id === id || String(s.id) === String(id);
        return isMatch ? { ...s, ...updated, status: nextStatus } : s;
      }));
      info('Status Updated', `Supplier "${current?.name || current?.contactPerson || 'Supplier'}" marked as ${nextStatus}.`);
      return updated;
    } catch (err) {
      toastError('Status Update Failed', err.message || 'Failed to update supplier status.');
      throw err;
    }
  }, [suppliers, info, toastError]);

  return {
    items,
    ledger,
    purchaseOrders,
    suppliers,
    stockRequests,
    loading,
    error,
    recordMovement,
    createPO,
    updatePOStatus,
    approveStockRequest,
    rejectStockRequest,
    createSupplier,
    updateSupplier,
    deleteSupplier,
    deactivateSupplier,
    refreshInventory: loadAll
  };
};

export default useInventory;
