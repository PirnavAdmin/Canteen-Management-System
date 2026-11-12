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

  // Purchase Orders
  getPurchaseOrders: async (params = {}) => {
    const response = await apiClient.get(API_ENDPOINTS.INVENTORY.PURCHASE_ORDERS, params);
    return response?.data ?? response;
  },

  createPurchaseOrder: async (poData) => {
    const payload = {
      outletId: Number(poData.outletId) || 1,
      supplierId: Number(poData.supplierId) || 1,
      items: (poData.items || []).map(item => ({
        ingredientId: Number(item.ingredientId || item.id),
        quantity: Number(item.quantity),
        estimatedCost: Number(item.estimatedCost || 0)
      }))
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
  }
};

export default inventoryService;
