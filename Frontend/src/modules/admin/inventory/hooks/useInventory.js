import { useState, useEffect, useCallback } from 'react';
import { inventoryService } from '../services/inventoryService';
import { useToast } from '../../../../app/providers/ToastProvider';

export const useInventory = () => {
  const [items, setItems] = useState([]);
  const [ledger, setLedger] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { success, error: toastError, info } = useToast();

  const loadAll = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [itms, ledg, pos, sups] = await Promise.all([
        inventoryService.getItems(),
        inventoryService.getLedger(),
        inventoryService.getPurchaseOrders(),
        inventoryService.getSuppliers()
      ]);
      setItems(itms);
      setLedger(ledg);
      setPurchaseOrders(pos);
      setSuppliers(sups);
    } catch (err) {
      console.error('Failed to load inventory data:', err);
      setError(err.message || 'Error loading inventory');
      toastError('Inventory Error', 'Unable to retrieve inventory data.');
    } finally {
      setLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    loadAll();
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

      // Step 5 -> Step 6: When marked Received, auto-reload stock and ledger so tabs reflect inward immediately!
      if (status === 'Received') {
        const [updatedItems, updatedLedger] = await Promise.all([
          inventoryService.getItems(),
          inventoryService.getLedger()
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
  }, [info, success, toastError]);

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

  return {
    items,
    ledger,
    purchaseOrders,
    suppliers,
    loading,
    error,
    recordMovement,
    createPO,
    updatePOStatus,
    createSupplier,
    refreshInventory: loadAll
  };
};

export default useInventory;
