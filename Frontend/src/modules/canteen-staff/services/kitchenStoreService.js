/**
 * Kitchen Store Service for Canteen Staff
 * Pure live integration delegating directly to backend staffInventoryService.
 * ZERO mock data, ZERO localStorage, ZERO fallbacks.
 */

import { staffInventoryService, cleanOutletId } from './staffInventoryService';

export const kitchenStoreService = {
  cleanOutletId,

  getKitchenStock: async (outletId) => {
    return staffInventoryService.getAllInventory(outletId);
  },

  getKitchenLedger: async (outletId) => {
    return staffInventoryService.getInventoryLedger({ outletId });
  },

  getIncomingTransfers: async (outletId) => {
    const requests = await staffInventoryService.getStockRequests(outletId);
    return requests.filter(r => r.status === 'Dispatched' || r.status === 'In Transit' || r.status === 'Approved');
  },

  confirmReceipt: async (outletId, params) => {
    return staffInventoryService.confirmReceipt(params);
  },

  recordUsage: async (outletId, usageData) => {
    return staffInventoryService.recordUsage(usageData);
  }
};

export default kitchenStoreService;
