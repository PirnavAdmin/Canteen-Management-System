/**
 * Inventory API Service
 */

import { apiClient, API_ENDPOINTS } from '../../../../services/api';
import { storageService } from '../../../../services/storageService';
import {
  INITIAL_INVENTORY_ITEMS,
  INITIAL_STOCK_MOVEMENTS,
  INITIAL_PURCHASE_ORDERS,
  INITIAL_SUPPLIERS
} from '../constants/inventoryConstants';

const STORAGE_KEYS = {
  ITEMS: 'cms_inventory_items',
  MOVEMENTS: 'cms_inventory_movements',
  POS: 'cms_inventory_pos',
  SUPPLIERS: 'cms_inventory_suppliers'
};

export const inventoryService = {
  // Stock Items
  getItems: async (params = {}) => {
    try {
      return await apiClient.get(API_ENDPOINTS.INVENTORY.ITEMS, params);
    } catch {
      const saved = storageService.getItem(STORAGE_KEYS.ITEMS, null);
      if (!saved) {
        storageService.setItem(STORAGE_KEYS.ITEMS, INITIAL_INVENTORY_ITEMS);
        return [...INITIAL_INVENTORY_ITEMS];
      }
      return saved;
    }
  },

  // Traceable Stock Movement (Stock In, Stock Out, Wastage, Adjustment)
  recordMovement: async (movementData) => {
    if (!movementData.ingredientId || !movementData.quantity || Number(movementData.quantity) === 0) {
      throw new Error('Valid ingredient and non-zero movement quantity are required.');
    }
    if (!movementData.reason || !movementData.reason.trim()) {
      throw new Error('An audit reason is required for any inventory adjustment or wastage.');
    }

    try {
      return await apiClient.post(API_ENDPOINTS.INVENTORY.STOCK_MOVEMENT, movementData);
    } catch {
      const items = await inventoryService.getItems();
      const idx = items.findIndex(i => i.id === movementData.ingredientId);
      if (idx === -1) throw new Error('Ingredient not found in master stock list.');

      const item = items[idx];
      const qtyNum = Number(movementData.quantity);
      let newQty = item.availableQuantity;

      if (movementData.movementType === 'Stock In') {
        newQty += Math.abs(qtyNum);
      } else if (movementData.movementType === 'Stock Out' || movementData.movementType === 'Wastage') {
        if (item.availableQuantity < Math.abs(qtyNum)) {
          throw new Error(`Insufficient stock: Only ${item.availableQuantity} ${item.unit} available, but attempted to deduct ${Math.abs(qtyNum)} ${item.unit}.`);
        }
        newQty -= Math.abs(qtyNum);
      } else if (movementData.movementType === 'Adjustment') {
        newQty += qtyNum;
        if (newQty < 0) throw new Error('Adjustment cannot result in negative stock quantity.');
      }

      // Determine updated status
      let newStatus = 'In Stock';
      if (newQty <= 0) newStatus = 'Out of Stock';
      else if (newQty <= item.reorderLevel) newStatus = 'Low Stock';

      const updatedItem = {
        ...item,
        availableQuantity: Number(newQty.toFixed(2)),
        status: newStatus,
        updatedAt: new Date().toISOString()
      };
      items[idx] = updatedItem;
      storageService.setItem(STORAGE_KEYS.ITEMS, [...items]);

      // Record movement in Ledger
      const movements = await inventoryService.getLedger();
      const newMovementRecord = {
        id: `mov-${Date.now()}`,
        ingredientId: item.id,
        ingredientName: item.ingredientName,
        movementType: movementData.movementType,
        quantity: qtyNum,
        unit: item.unit,
        batchNumber: movementData.batchNumber || item.batchNumber,
        expiryDate: movementData.expiryDate || item.expiryDate,
        reference: movementData.reference || `ADJ-${Math.floor(100 + Math.random() * 900)}`,
        reason: movementData.reason,
        dateTime: new Date().toISOString(),
        performedBy: movementData.performedBy || 'Campus Inventory Incharge'
      };

      const updatedMovements = [newMovementRecord, ...movements];
      storageService.setItem(STORAGE_KEYS.MOVEMENTS, updatedMovements);

      return { item: updatedItem, movement: newMovementRecord };
    }
  },

  // Stock Movement Ledger
  getLedger: async (params = {}) => {
    try {
      return await apiClient.get(API_ENDPOINTS.INVENTORY.LEDGER, params);
    } catch {
      const saved = storageService.getItem(STORAGE_KEYS.MOVEMENTS, null);
      if (!saved) {
        storageService.setItem(STORAGE_KEYS.MOVEMENTS, INITIAL_STOCK_MOVEMENTS);
        return [...INITIAL_STOCK_MOVEMENTS];
      }
      return saved;
    }
  },

  // Purchase Orders
  getPurchaseOrders: async (params = {}) => {
    try {
      return await apiClient.get(API_ENDPOINTS.INVENTORY.PURCHASE_ORDERS, params);
    } catch {
      const saved = storageService.getItem(STORAGE_KEYS.POS, null);
      if (!saved) {
        storageService.setItem(STORAGE_KEYS.POS, INITIAL_PURCHASE_ORDERS);
        return [...INITIAL_PURCHASE_ORDERS];
      }
      return saved;
    }
  },

  createPurchaseOrder: async (data) => {
    try {
      return await apiClient.post(API_ENDPOINTS.INVENTORY.PURCHASE_ORDERS, data);
    } catch {
      const pos = await inventoryService.getPurchaseOrders();
      const newPO = {
        ...data,
        id: `po-${Date.now()}`,
        poNumber: `PO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        orderDate: new Date().toISOString().split('T')[0],
        status: 'Submitted',
        createdAt: new Date().toISOString()
      };
      const updated = [newPO, ...pos];
      storageService.setItem(STORAGE_KEYS.POS, updated);
      return newPO;
    }
  },

  updatePOStatus: async (id, status) => {
    try {
      return await apiClient.patch(API_ENDPOINTS.INVENTORY.PO_UPDATE_STATUS(id), { status });
    } catch {
      const pos = await inventoryService.getPurchaseOrders();
      const idx = pos.findIndex(p => p.id === id);
      if (idx === -1) throw new Error(`PO with ID ${id} not found.`);

      pos[idx] = { ...pos[idx], status, updatedAt: new Date().toISOString() };
      storageService.setItem(STORAGE_KEYS.POS, [...pos]);
      return pos[idx];
    }
  },

  // Suppliers
  getSuppliers: async (params = {}) => {
    try {
      return await apiClient.get(API_ENDPOINTS.INVENTORY.SUPPLIERS, params);
    } catch {
      const saved = storageService.getItem(STORAGE_KEYS.SUPPLIERS, null);
      if (!saved) {
        storageService.setItem(STORAGE_KEYS.SUPPLIERS, INITIAL_SUPPLIERS);
        return [...INITIAL_SUPPLIERS];
      }
      return saved;
    }
  },

  createSupplier: async (data) => {
    try {
      return await apiClient.post(API_ENDPOINTS.INVENTORY.SUPPLIERS, data);
    } catch {
      const suppliers = await inventoryService.getSuppliers();
      const newSupplier = {
        ...data,
        id: `sup-${Date.now()}`,
        status: 'Active',
        createdAt: new Date().toISOString()
      };
      const updated = [newSupplier, ...suppliers];
      storageService.setItem(STORAGE_KEYS.SUPPLIERS, updated);
      return newSupplier;
    }
  }
};

export default inventoryService;
