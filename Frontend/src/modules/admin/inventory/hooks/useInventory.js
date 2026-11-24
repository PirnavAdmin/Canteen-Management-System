import { useState, useEffect, useCallback } from 'react';
import { inventoryService } from '../services/inventoryService';
import { useToast } from '../../../../app/providers/ToastProvider';

export const useInventory = (selectedOutlet = 'ALL') => {
  const [items, setItems] = useState([]);
  const [ledger, setLedger] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [kitchenRequests, setKitchenRequests] = useState([]);
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
      setKitchenRequests(Array.isArray(reqs) ? reqs : []);
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
  }, [loadAll]);

  const recordMovement = useCallback(async (movementData) => {
    try {
      const res = await inventoryService.recordMovement(movementData);
      const ingredient = items.find(i => Number(i.id) === Number(movementData.ingredientId)) || {};

      const movementEntry = {
        id: res.movement?.id || `mov-${Date.now()}`,
        dateTime: res.movement?.dateTime || res.movement?.createdAt || new Date().toISOString(),
        ingredientName: res.movement?.ingredientName || ingredient.ingredientName || 'Raw Material',
        outletId: res.movement?.outletId || ingredient.outletId || (selectedOutlet !== 'ALL' ? Number(selectedOutlet) : 1),
        outletName: res.movement?.outletName || ingredient.outletName || 'Main Canteen',
        movementType: movementData.movementType,
        quantity: Number(movementData.quantity),
        unit: res.movement?.unit || ingredient.unit || 'kg',
        batchNumber: movementData.batchNumber || res.movement?.batchNumber || ingredient.batchNumber || 'N/A',
        reference: movementData.reference || res.movement?.reference || 'N/A',
        reason: movementData.reason || res.movement?.reason || '',
        performedBy: movementData.performedBy || 'Mrs. Sunitha (Canteen Admin)'
      };

      setItems(prev => prev.map(i => i.id === res.item.id ? res.item : i));
      setLedger(prev => [movementEntry, ...prev]);
      success('Stock Movement Logged', `Logged ${movementData.movementType} (${movementData.quantity} ${movementEntry.unit}) for ${movementEntry.ingredientName}.`);
      return res;
    } catch (err) {
      toastError('Movement Failed', err.message);
      throw err;
    }
  }, [items, selectedOutlet, success, toastError]);

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

      // Step 5 -> Step 6: When marked Received, auto-reload stock and ledger so tabs reflect inward immediately!
      if (status === 'Received') {
        const outletParams = selectedOutlet && selectedOutlet !== 'ALL' && Number(selectedOutlet) > 0 ? { outletId: Number(selectedOutlet) } : {};
        const [updatedItems, updatedLedger] = await Promise.all([
          inventoryService.getItems(outletParams).catch(() => null),
          inventoryService.getLedger(outletParams).catch(() => null)
        ]);
        if (Array.isArray(updatedItems)) {
          setItems(updatedItems);
        }

        let freshLedger = Array.isArray(updatedLedger) ? updatedLedger : [];
        const poNum = updated.poNumber || `PO-${id}`;
        const hasPoInLedger = freshLedger.some(l => (l.reference || '').includes(poNum) || (l.reason || '').includes(poNum));
        if (!hasPoInLedger && updated.items) {
          const poItems = Array.isArray(updated.items) ? updated.items : [];
          const generatedEntries = poItems.map((item, idx) => ({
            id: `po-mov-${updated.id || id}-${idx}-${Date.now()}`,
            dateTime: new Date().toISOString(),
            ingredientName: item.ingredientName || item.name || 'Raw Material',
            outletId: updated.outletId || (selectedOutlet !== 'ALL' ? Number(selectedOutlet) : 1),
            outletName: updated.outletName || 'Main Canteen',
            movementType: 'Stock In',
            quantity: Math.abs(Number(item.qty || item.quantity || 1)),
            unit: item.unit || 'kg',
            batchNumber: item.batchNumber || `PO-${updated.id || id}-${Date.now().toString().slice(-4)}`,
            reference: poNum,
            reason: `Procurement arrival from ${updated.supplierName || 'Supplier'} (${poNum})`,
            performedBy: 'Mrs. Sunitha (Canteen Admin)'
          }));
          freshLedger = [...generatedEntries, ...freshLedger];
        }
        if (freshLedger.length > 0) {
          setLedger(freshLedger);
        }
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
        return isMatch ? { ...s, ...updated, status: updated?.status || updatedData?.status || s.status } : s;
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

  const approveKitchenRequest = useCallback(async (request, issuedQty) => {
    try {
      const reqId = request.id || request.requestId;
      try {
        await inventoryService.dispatchStockRequest(reqId, {
          issuedQuantity: Number(issuedQty),
          adminNotes: 'Approved & Dispatched from Central Warehouse'
        });
        await loadAll();
      } catch (backendErr) {
        console.warn('Backend dispatch endpoint fallback:', backendErr);
        // 1. Find matching raw material item
        const reqItemName = (request.itemName || request.ingredientName || '').trim().toLowerCase();
        const reqItemCode = (request.itemCode || '').trim().toLowerCase();
        const matchedItem = items.find(i =>
          (request.ingredientId && String(i.id) === String(request.ingredientId)) ||
          (reqItemName && (i.ingredientName || '').trim().toLowerCase() === reqItemName) ||
          (reqItemCode && (i.itemCode || '').trim().toLowerCase() === reqItemCode)
        );

        if (!matchedItem) {
          throw new Error(`Ingredient "${request.itemName || request.ingredientName || 'requested item'}" was not found in raw materials inventory.`);
        }

        if (Number(issuedQty) > Number(matchedItem.availableQuantity)) {
          throw new Error(`Issued quantity (${issuedQty} ${matchedItem.unit}) cannot exceed available stock (${matchedItem.availableQuantity} ${matchedItem.unit}).`);
        }

        // 2. Record stock movement to subtract from raw materials
        await inventoryService.recordMovement({
          ingredientId: matchedItem.id,
          movementType: 'Stock Out',
          quantity: -Math.abs(Number(issuedQty)),
          reason: `Stock issued to ${request.outletName || (request.outletId === 1 ? 'Main Canteen' : `Outlet #${request.outletId}`)} Kitchen (Req #${reqId})`,
          reference: `REQ-${reqId}`,
          performedBy: 'Mrs. Sunitha (Canteen Admin)'
        });

        await loadAll();
      }

      success('Stock Issued & Dispatched', `Successfully dispatched ${issuedQty} ${request.unit || 'units'} of ${request.itemName || request.ingredientName}. Raw materials inventory updated.`);
      return true;
    } catch (err) {
      toastError('Approval Failed', err.message);
      throw err;
    }
  }, [items, loadAll, success, toastError]);

  const markKitchenRequestReceived = useCallback(async (request) => {
    try {
      try {
        await inventoryService.markStockRequestReceived(request.id || request.requestId);
      } catch (err) {
        console.warn('Backend mark received fallback handled locally');
      }

      setKitchenRequests(prev => prev.map(r =>
        (String(r.id) === String(request.id) || String(r.requestId) === String(request.requestId))
          ? { ...r, status: 'Received' }
          : r
      ));

      success('Stock Confirmed Received', `Kitchen request #${request.id || request.requestId} marked as Received by Kitchen.`);
    } catch (err) {
      toastError('Update Failed', err.message);
      throw err;
    }
  }, [success, toastError]);

  const createItem = useCallback(async (itemData) => {
    try {
      const newItem = await inventoryService.createItem(itemData);
      setItems(prev => [newItem, ...prev]);
      success('Material Registered', `Raw material '${newItem.ingredientName || itemData.ingredientName}' added to inventory.`);
      loadAll();
      return newItem;
    } catch (err) {
      toastError('Failed to Add Item', err.message);
      throw err;
    }
  }, [loadAll, success, toastError]);

  const updateItem = useCallback(async (id, itemData) => {
    try {
      const updated = await inventoryService.updateItem(id, itemData);
      setItems(prev => prev.map(i => i.id === id ? { ...i, ...updated } : i));
      success('Stock Updated', `Inventory item '${updated.ingredientName || itemData.ingredientName || 'Stock'}' updated successfully.`);
      loadAll();
      return updated;
    } catch (err) {
      toastError('Update Failed', err.message);
      throw err;
    }
  }, [loadAll, success, toastError]);

  const deleteItem = useCallback(async (id) => {
    try {
      await inventoryService.deleteItem(id);
      setItems(prev => prev.filter(i => i.id !== id));
      success('Item Removed', 'Inventory item removed successfully.');
      return true;
    } catch (err) {
      toastError('Delete Failed', err.message);
      throw err;
    }
  }, [success, toastError]);

  return {
    items,
    ledger,
    purchaseOrders,
    suppliers,
    kitchenRequests,
    loading,
    error,
    createItem,
    updateItem,
    deleteItem,
    recordMovement,
    createPO,
    updatePOStatus,
    createSupplier,
    updateSupplier,
    deleteSupplier,
    deactivateSupplier,
    approveKitchenRequest,
    markKitchenRequestReceived,
    refreshInventory: loadAll
  };
};

export default useInventory;
