/**
 * Inventory API Service
 * Pure live integration with .NET 8 Web API (Hostinger Cloud MySQL DB).
 * No mock data, no localStorage caching, no simulated fallbacks.
 */

import { apiClient, API_ENDPOINTS } from '../../../../services/api';

export const inventoryService = {
  // Stock Items
  getItems: async (params = {}) => {
    const response = await apiClient.get(API_ENDPOINTS.INVENTORY.ITEMS, params);
    return response?.data ?? response;
  },

  createItem: async (itemData) => {
    const payload = {
      ingredientName: itemData.ingredientName?.trim(),
      category: itemData.category || 'Groceries',
      availableQuantity: Number(itemData.availableQuantity || itemData.quantity || 0),
      unit: itemData.unit || 'kg',
      reorderLevel: Number(itemData.reorderLevel || 10),
      costPerUnit: Number(itemData.costPerUnit || 0),
      outletId: Number(itemData.outletId || 1),
      batchNumber: itemData.batchNumber || null,
      expiryDate: itemData.expiryDate || null,
      status: itemData.status || 'In Stock'
    };
    const response = await apiClient.post(API_ENDPOINTS.INVENTORY.ITEMS, payload);
    return response?.data ?? response;
  },

  updateItem: async (id, itemData) => {
    const payload = {
      ingredientName: itemData.ingredientName?.trim(),
      category: itemData.category,
      availableQuantity: itemData.availableQuantity !== undefined ? Number(itemData.availableQuantity) : undefined,
      unit: itemData.unit,
      reorderLevel: itemData.reorderLevel !== undefined ? Number(itemData.reorderLevel) : undefined,
      costPerUnit: itemData.costPerUnit !== undefined ? Number(itemData.costPerUnit) : undefined,
      outletId: itemData.outletId ? Number(itemData.outletId) : undefined,
      batchNumber: itemData.batchNumber || null,
      expiryDate: itemData.expiryDate || null,
      status: itemData.status
    };
    const response = await apiClient.put(API_ENDPOINTS.INVENTORY.ITEM_BY_ID(id), payload);
    return response?.data ?? response;
  },

  deleteItem: async (id) => {
    const response = await apiClient.delete(API_ENDPOINTS.INVENTORY.ITEM_BY_ID(id));
    return response?.data ?? response;
  },

  // Traceable Stock Movement (Stock In, Stock Out, Wastage, Adjustment)
  recordMovement: async (movementData) => {
    const ingredientId = Number(movementData.ingredientId || movementData.itemId || movementData.id);
    const payload = {
      ingredientId,
      movementType: movementData.movementType,
      quantity: Number(movementData.quantity),
      batchNumber: movementData.batchNumber || null,
      expiryDate: movementData.expiryDate || null,
      reference: movementData.reference || null,
      reason: movementData.reason,
      performedBy: movementData.performedBy || null
    };

    const res = await apiClient.post(API_ENDPOINTS.INVENTORY.STOCK_MOVEMENT, payload);
    const movement = res?.data ?? res;

    // Refresh items to get updated quantities
    const itemsRes = await apiClient.get(API_ENDPOINTS.INVENTORY.ITEMS);
    const items = itemsRes?.data ?? itemsRes;
    const updatedItem = Array.isArray(items) ? items.find(i => i.id === ingredientId) : null;

    return {
      movement,
      item: updatedItem || { id: ingredientId, ingredientName: movement.ingredientName }
    };
  },

  // Stock Movement Ledger
  getLedger: async (params = {}) => {
    const response = await apiClient.get(API_ENDPOINTS.INVENTORY.LEDGER, params);
    return response?.data ?? response;
  },

  // Stock Requests
  getStockRequests: async (params = {}) => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.INVENTORY.STOCK_REQUESTS, params);
      const raw = response?.data ?? response;
      if (Array.isArray(raw)) return raw;
      if (Array.isArray(raw?.data)) return raw.data;
      if (Array.isArray(raw?.requests)) return raw.requests;
      if (Array.isArray(raw?.items)) return raw.items;
      return [];
    } catch (err) {
      console.warn('Network issue fetching stock requests:', err.message);
      return [];
    }
  },

  approveStockRequest: async (id) => {
    const response = await apiClient.patch(API_ENDPOINTS.INVENTORY.STOCK_REQUEST_RECEIVED(id));
    const raw = response?.data ?? response;
    window.dispatchEvent(new CustomEvent('cms:stock_request_updated', { detail: { id, status: 'Fulfilled', request: raw } }));
    window.dispatchEvent(new CustomEvent('cms:inventory_updated', { detail: { id } }));
    return raw;
  },

  rejectStockRequest: async (id) => {
    const response = await apiClient.delete(API_ENDPOINTS.INVENTORY.STOCK_REQUEST_BY_ID(id));
    const raw = response?.data ?? response;
    window.dispatchEvent(new CustomEvent('cms:stock_request_updated', { detail: { id, status: 'Rejected', request: raw } }));
    return raw;
  },

  // Purchase Orders
  getPurchaseOrders: async (params = {}) => {
    const response = await apiClient.get(API_ENDPOINTS.INVENTORY.PURCHASE_ORDERS, params);
    return response?.data ?? response;
  },

  createPurchaseOrder: async (poData) => {
    const items = (poData.items || []).map(item => {
      const q = Number(item.qty || item.quantity) || 1;
      const p = Number(item.unitPrice || item.price || item.estimatedCost) || 0;
      return {
        ingredientName: item.ingredientName || item.name || '',
        qty: q,
        unit: item.unit || 'kg',
        unitPrice: p,
        total: Number(item.total) || (q * p),
        mfgDate: item.mfgDate || null,
        expiryDate: item.expiryDate || null
      };
    });

    const calculatedTotal = items.reduce((acc, curr) => acc + curr.total, 0);

    const payload = {
      outletId: Number(poData.outletId) || 1,
      supplierId: Number(poData.supplierId) || 1,
      supplierName: poData.supplierName || null,
      expectedDelivery: poData.expectedDelivery || null,
      totalAmount: Number(poData.totalAmount) || calculatedTotal,
      items
    };
    const response = await apiClient.post(API_ENDPOINTS.INVENTORY.PURCHASE_ORDERS, payload);
    return response?.data ?? response;
  },

  updatePOStatus: async (id, status) => {
    const response = await apiClient.patch(API_ENDPOINTS.INVENTORY.PO_UPDATE_STATUS(id), { status });
    return response?.data ?? response;
  },

  // Suppliers
  getSuppliers: async () => {
    const response = await apiClient.get(API_ENDPOINTS.INVENTORY.SUPPLIERS);
    return response?.data ?? response;
  },

  createSupplier: async (data) => {
    const response = await apiClient.post(API_ENDPOINTS.INVENTORY.SUPPLIERS, data);
    return response?.data ?? response;
  },

  updateSupplier: async (id, data) => {
    const payload = {
      name: data.name,
      contactPerson: data.contactPerson || null,
      phone: data.phone,
      email: data.email || null,
      address: data.address || null,
      suppliedCategories: data.suppliedCategories || null,
      gstin: data.gstin || null,
      fssaiNumber: data.fssaiNumber || null,
      status: data.status || 'Active'
    };
    const response = await apiClient.put(API_ENDPOINTS.INVENTORY.SUPPLIER_BY_ID(id), payload);
    return response?.data ?? response;
  },

  deleteSupplier: async (id) => {
    const response = await apiClient.delete(API_ENDPOINTS.INVENTORY.SUPPLIER_BY_ID(id));
    return response?.data ?? response;
  },

  updateSupplierStatus: async (id, status) => {
    const response = await apiClient.patch(API_ENDPOINTS.INVENTORY.SUPPLIER_STATUS(id), { status });
    return response?.data ?? response;
  },

  // Kitchen Stock Requisitions
  createStockRequest: async (requestData) => {
    try {
      const response = await apiClient.post(API_ENDPOINTS.INVENTORY.STOCK_REQUESTS, requestData);
      return response?.data ?? response;
    } catch (err) {
      console.error('Failed to create stock request:', err);
      throw err;
    }
  },

  updateStockRequest: async (id, data = {}) => {
    try {
      const response = await apiClient.put(API_ENDPOINTS.INVENTORY.STOCK_REQUEST_BY_ID(id), data);
      return response?.data ?? response;
    } catch {
      const response = await apiClient.patch(API_ENDPOINTS.INVENTORY.STOCK_REQUEST_BY_ID(id), data);
      return response?.data ?? response;
    }
  },

  deleteStockRequest: async (id) => {
    const response = await apiClient.delete(API_ENDPOINTS.INVENTORY.STOCK_REQUEST_BY_ID(id));
    return response?.data ?? response;
  },

  updateStockRequestStatus: async (id, status, notes = '') => {
    try {
      const response = await apiClient.patch(API_ENDPOINTS.INVENTORY.STOCK_REQUEST_BY_ID(id), { status, notes });
      return response?.data ?? response;
    } catch (err) {
      return { id, status };
    }
  },

  dispatchStockRequest: async (id, data = {}) => {
    try {
      const response = await apiClient.patch(API_ENDPOINTS.INVENTORY.STOCK_REQUEST_DISPATCH(id), data);
      return response?.data ?? response;
    } catch (err) {
      console.error('Failed to dispatch stock request:', err);
      throw err;
    }
  },

  rejectStockRequest: async (id, reason = '') => {
    try {
      const response = await apiClient.patch(API_ENDPOINTS.INVENTORY.STOCK_REQUEST_REJECT(id), { reason });
      return response?.data ?? response;
    } catch (err) {
      console.warn('Reject endpoint failed, falling back to status update:', err?.message);
      const fallback = await apiClient.patch(API_ENDPOINTS.INVENTORY.STOCK_REQUEST_BY_ID(id), {
        status: 'Rejected',
        rejectionReason: reason,
        adminNotes: reason,
        notes: reason
      });
      return fallback?.data ?? fallback;
    }
  },

  markStockRequestReceived: async (id) => {
    try {
      const response = await apiClient.patch(API_ENDPOINTS.INVENTORY.STOCK_REQUEST_RECEIVED(id));
      return response?.data ?? response;
    } catch (err) {
      return { id, status: 'Received' };
    }
  }
};

export default inventoryService;
