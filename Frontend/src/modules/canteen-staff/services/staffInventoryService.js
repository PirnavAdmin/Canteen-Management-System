/**
 * Canteen Staff Inventory & Stock Requisition Service
 */

import { storageService } from '../../../services/storageService';
import {
  getFreshStaffInventory,
  getFreshStaffStockRequests
} from '../constants/staffConstants';

const INVENTORY_STORAGE_KEY = 'cms_canteen_staff_inventory';
const STOCK_REQUESTS_KEY = 'cms_canteen_staff_stock_requests';

export const staffInventoryService = {
  /**
   * Get all inventory items with outlet filter and safe initial seed
   */
  getAllInventory: async (outletId = 'canteen-001') => {
    let items = storageService.getItem(INVENTORY_STORAGE_KEY, null);
    if (!Array.isArray(items) || items.length === 0 || !items.some(i => i.itemCode?.startsWith('ING-'))) {
      items = getFreshStaffInventory();
      storageService.setItem(INVENTORY_STORAGE_KEY, items);
    }

    if (!outletId || outletId === 'all') {
      return items;
    }
    return items.filter(item => !item.outletId || item.outletId === outletId);
  },

  /**
   * Get single inventory item by ID
   */
  getInventoryItemById: async (id) => {
    const items = await staffInventoryService.getAllInventory('all');
    return items.find(item => String(item.id) === String(id) || item.itemCode === id) || null;
  },

  /**
   * Get Low Stock items where availableQuantity <= reorderLevel
   */
  getLowStockItems: async (outletId = 'canteen-001') => {
    const items = await staffInventoryService.getAllInventory(outletId);
    return items.filter(item => {
      const qty = Number(item.availableQuantity) || 0;
      const reorder = Number(item.reorderLevel) || 0;
      return qty <= reorder;
    });
  },

  /**
   * Get expiring batches (within N days)
   */
  getExpiringItems: async (daysAhead = 7, outletId = 'canteen-001') => {
    const items = await staffInventoryService.getAllInventory(outletId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const targetDate = new Date();
    targetDate.setDate(today.getDate() + daysAhead);

    return items
      .filter(item => Boolean(item.expiryDate))
      .map(item => {
        const exp = new Date(item.expiryDate);
        exp.setHours(0, 0, 0, 0);
        const diffTime = exp.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        let urgencyTag = 'valid';
        if (diffDays < 0) urgencyTag = 'expired';
        else if (diffDays === 0) urgencyTag = 'today';
        else if (diffDays <= 3) urgencyTag = 'critical';
        else if (diffDays <= daysAhead) urgencyTag = 'soon';

        return {
          ...item,
          daysToExpiry: diffDays,
          urgencyTag
        };
      })
      .filter(item => item.daysToExpiry <= daysAhead)
      .sort((a, b) => a.daysToExpiry - b.daysToExpiry);
  },

  /**
   * Submit an Admin Stock Requisition
   */
  createStockRequest: async (requestData) => {
    if (!requestData.itemName || !requestData.requestedQuantity) {
      throw new Error('Please specify an item name and required quantity.');
    }

    const currentRequests = await staffInventoryService.getStockRequests('all');
    const newId = `REQ-2026-${String(currentRequests.length + 812).padStart(4, '0')}`;

    const newRequest = {
      id: newId,
      itemCode: requestData.itemCode || 'ING-REQ',
      itemName: requestData.itemName,
      category: requestData.category || 'General Ingredients',
      requestedQuantity: Number(requestData.requestedQuantity),
      unit: requestData.unit || 'units',
      outletId: requestData.outletId || 'canteen-001',
      outletName: requestData.outletName || 'Central Dining Hall',
      urgency: requestData.urgency || 'Normal',
      requiredByDate: requestData.requiredByDate || new Date().toISOString().split('T')[0],
      notes: requestData.notes || '',
      requestedBy: requestData.requestedBy || 'Staff Attendant',
      status: 'Pending Review',
      adminNotes: '',
      createdAt: new Date().toISOString()
    };

    const updated = [newRequest, ...currentRequests];
    storageService.setItem(STOCK_REQUESTS_KEY, updated);

    window.dispatchEvent(new CustomEvent('cms:stock_request_created', {
      detail: { request: newRequest }
    }));

    return newRequest;
  },

  /**
   * Get all stock requests
   */
  getStockRequests: async (outletId = 'canteen-001') => {
    let requests = storageService.getItem(STOCK_REQUESTS_KEY, null);
    if (!Array.isArray(requests)) {
      requests = getFreshStaffStockRequests();
      storageService.setItem(STOCK_REQUESTS_KEY, requests);
    }

    if (!outletId || outletId === 'all') {
      return requests;
    }
    return requests.filter(r => !r.outletId || r.outletId === outletId);
  },

  /**
   * Delete a stock request
   */
  deleteStockRequest: async (requestId) => {
    let requests = storageService.getItem(STOCK_REQUESTS_KEY, null);
    if (!Array.isArray(requests)) {
      requests = getFreshStaffStockRequests();
    }
    const filtered = requests.filter(r => r.id !== requestId);
    storageService.setItem(STOCK_REQUESTS_KEY, filtered);

    window.dispatchEvent(new CustomEvent('cms:stock_request_updated', {
      detail: { deletedRequestId: requestId }
    }));

    return true;
  },

  /**
   * Record waste or disposal of an expired/spoiled batch
   */
  recordWaste: async (itemId, quantity, reason = 'Batch expired') => {
    const allItems = await staffInventoryService.getAllInventory('all');
    const idx = allItems.findIndex(i => String(i.id) === String(itemId) || i.itemCode === itemId);

    if (idx === -1) {
      throw new Error('Inventory item not found.');
    }

    const currentItem = allItems[idx];
    const qtyToDeduct = Math.min(Number(quantity) || 0, Number(currentItem.availableQuantity) || 0);
    const newQty = Math.max(0, (Number(currentItem.availableQuantity) || 0) - qtyToDeduct);

    const updatedItem = {
      ...currentItem,
      availableQuantity: newQty,
      status: newQty === 0 ? 'Out of Stock' : (newQty <= currentItem.reorderLevel ? 'Low Stock' : currentItem.status),
      lastWasteRecorded: {
        quantity: qtyToDeduct,
        reason,
        date: new Date().toISOString()
      }
    };

    allItems[idx] = updatedItem;
    storageService.setItem(INVENTORY_STORAGE_KEY, allItems);

    window.dispatchEvent(new CustomEvent('cms:inventory_updated', {
      detail: { item: updatedItem }
    }));

    return updatedItem;
  },

  /**
   * Mark a stock request as received/fulfilled at the counter
   */
  markStockReceived: async (requestId) => {
    const allRequests = await staffInventoryService.getStockRequests('all');
    const reqIdx = allRequests.findIndex(r => r.id === requestId);

    if (reqIdx === -1) {
      throw new Error('Stock request not found.');
    }

    const req = allRequests[reqIdx];
    allRequests[reqIdx] = {
      ...req,
      status: 'Fulfilled',
      receivedAt: new Date().toISOString()
    };
    storageService.setItem(STOCK_REQUESTS_KEY, allRequests);

    // Also update current inventory quantity if matching item exists
    const allItems = await staffInventoryService.getAllInventory('all');
    const invIdx = allItems.findIndex(i => i.itemCode === req.itemCode || i.ingredientName === req.itemName);

    if (invIdx !== -1) {
      allItems[invIdx] = {
        ...allItems[invIdx],
        availableQuantity: (Number(allItems[invIdx].availableQuantity) || 0) + Number(req.requestedQuantity),
        status: 'In Stock'
      };
      storageService.setItem(INVENTORY_STORAGE_KEY, allItems);
    }

    window.dispatchEvent(new CustomEvent('cms:stock_request_updated', {
      detail: { request: allRequests[reqIdx] }
    }));

    return allRequests[reqIdx];
  }
};

export default staffInventoryService;
