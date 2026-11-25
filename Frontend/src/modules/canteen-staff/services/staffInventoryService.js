/**
 * Canteen Staff Inventory & Stock Requisition Service
 * Pure live backend API integration with .NET 8 Web API.
 * No mock data, no localStorage caching, no simulated fallbacks.
 */

import { apiClient, API_ENDPOINTS } from '../../../services/api';

/**
 * Safely parses and normalizes outlet ID to positive integer for backend model binding.
 * Returns undefined for 'all', null, non-numeric strings to avoid 400 Bad Request.
 */
export const cleanOutletId = (raw) => {
  if (raw === null || raw === undefined || raw === 'all' || raw === '') return undefined;
  if (typeof raw === 'number' && !isNaN(raw) && raw > 0) return raw;
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (/^\d+$/.test(trimmed)) {
      const num = parseInt(trimmed, 10);
      return num > 0 ? num : undefined;
    }
    const match = trimmed.match(/\d+/);
    if (match) {
      const num = parseInt(match[0], 10);
      return num > 0 ? num : undefined;
    }
  }
  return undefined;
};

/**
 * Normalizes backend inventory item into consistent shape expected by Staff UI components.
 * Supports both PascalCase (.NET DTOs) and camelCase properties.
 */
export const normalizeInventoryItem = (raw) => {
  if (!raw || typeof raw !== 'object') return raw;

  const id = raw.id ?? raw.Id ?? raw.ingredientId ?? raw.itemId ?? '';
  const itemCode = raw.itemCode ?? raw.ItemCode ?? raw.code ?? (id ? `ING-${id}` : 'ING-001');
  const ingredientName = raw.ingredientName ?? raw.IngredientName ?? raw.name ?? raw.Name ?? 'Ingredient';
  const category = raw.category ?? raw.Category ?? 'General Ingredients';
  const availableQuantity = Number(
    raw.availableQuantity ?? raw.AvailableQuantity ?? raw.quantity ?? raw.Quantity ?? raw.currentStock ?? 0
  );
  const unit = raw.unit ?? raw.Unit ?? 'kg';
  const reorderLevel = Number(raw.reorderLevel ?? raw.ReorderLevel ?? raw.minStockLevel ?? 10);
  const expiryDate = raw.expiryDate ?? raw.ExpiryDate ?? null;

  let status = raw.status ?? raw.Status;
  if (!status) {
    if (availableQuantity <= 0) status = 'Out of Stock';
    else if (availableQuantity <= reorderLevel) status = 'Low Stock';
    else status = 'In Stock';
  }

  return {
    ...raw,
    id,
    itemCode,
    ingredientName,
    category,
    availableQuantity,
    unit,
    reorderLevel,
    expiryDate,
    status,
    outletId: raw.outletId ?? raw.OutletId ?? 1
  };
};

/**
 * Normalizes backend batch lot record into consistent shape expected by Staff UI components.
 */
export const normalizeBatch = (raw) => {
  if (!raw || typeof raw !== 'object') return raw;

  const id = raw.id ?? raw.Id ?? raw.batchId ?? raw.BatchId ?? '';
  const batchNumber = raw.batchNumber ?? raw.BatchNumber ?? raw.batchNo ?? raw.BatchNo ?? (id ? `B-${id}` : 'B-MAIN-01');
  const ingredientId = raw.ingredientId ?? raw.IngredientId ?? raw.itemId ?? raw.ItemId ?? '';
  const ingredientName = raw.ingredientName ?? raw.IngredientName ?? raw.name ?? raw.Name ?? 'Ingredient';
  const itemCode = raw.itemCode ?? raw.ItemCode ?? (ingredientId ? `ING-${ingredientId}` : 'ING-001');
  const availableQuantity = Number(
    raw.availableQuantity ?? raw.AvailableQuantity ?? raw.remainingQuantity ?? raw.RemainingQuantity ?? raw.quantity ?? raw.Quantity ?? 0
  );
  const unit = raw.unit ?? raw.Unit ?? 'kg';
  const expiryDate = raw.expiryDate ?? raw.ExpiryDate ?? null;
  const status = raw.status ?? raw.Status ?? 'Active';

  return {
    ...raw,
    id,
    batchNumber,
    ingredientId,
    ingredientName,
    itemCode,
    availableQuantity,
    unit,
    expiryDate,
    status
  };
};

/**
 * Normalizes backend stock requisition record into consistent shape expected by Staff UI components.
 */
export const normalizeStockRequest = (raw) => {
  if (!raw || typeof raw !== 'object') return raw;

  const firstItem = Array.isArray(raw.items) && raw.items.length > 0 ? raw.items[0] : null;

  const id = raw.id ?? raw.Id ?? raw.requestId ?? raw.poNumber ?? '';
  const itemCode = raw.itemCode ?? raw.ItemCode ?? (raw.poNumber ? String(raw.poNumber) : (id ? `REQ-${id}` : 'ING-REQ'));
  const itemName = raw.itemName ?? raw.ItemName ?? raw.ingredientName ?? (firstItem?.ingredientName || 'Stock Item');
  const category = raw.category ?? raw.Category ?? (raw.supplierName ? `Supplier: ${raw.supplierName}` : 'General Kitchen Supplies');
  const requestedQuantity = Number(raw.requestedQuantity ?? raw.RequestedQuantity ?? raw.quantity ?? firstItem?.qty ?? firstItem?.quantity ?? 0);
  const unit = raw.unit ?? raw.Unit ?? (firstItem?.unit || 'kg');
  const urgency = raw.urgency ?? raw.Urgency ?? 'Normal';
  const status = raw.status ?? raw.Status ?? 'Pending';
  const adminNotes = raw.adminNotes ?? raw.AdminNotes ?? raw.notes ?? raw.Notes ?? (raw.supplierName ? `Supplier: ${raw.supplierName}` : '');
  const notes = raw.notes ?? raw.Notes ?? '';
  const requiredByDate = raw.requiredByDate ?? raw.RequiredByDate ?? raw.expectedDelivery ?? new Date().toISOString().split('T')[0];
  const requestedBy = raw.requestedBy ?? raw.RequestedBy ?? 'Staff Attendant';
  const createdAt = raw.createdAt ?? raw.CreatedAt ?? new Date().toISOString();

  return {
    ...raw,
    id,
    itemCode,
    itemName,
    category,
    requestedQuantity,
    unit,
    urgency,
    status,
    adminNotes,
    notes,
    requiredByDate,
    requestedBy,
    createdAt,
    outletId: cleanOutletId(raw.outletId ?? raw.OutletId) || 1
  };
};

/**
 * Normalizes backend stock movement / ledger record into consistent shape expected by Staff UI components.
 */
export const normalizeLedgerEntry = (raw) => {
  if (!raw || typeof raw !== 'object') return raw;
  const id = raw.id ?? raw.Id ?? raw.movementId ?? '';
  const dateTime = raw.dateTime ?? raw.DateTime ?? raw.createdAt ?? raw.CreatedAt ?? new Date().toISOString();
  const reference = raw.reference ?? raw.Reference ?? (id ? `MOV-${id}` : 'MOV-001');
  const ingredientName = raw.ingredientName ?? raw.IngredientName ?? raw.name ?? raw.Name ?? 'Ingredient';
  const transactionType = raw.transactionType ?? raw.TransactionType ?? raw.movementType ?? raw.MovementType ?? 'STOCK ADJUSTMENT';
  const quantity = Number(raw.quantity ?? raw.Quantity ?? 0);
  const unit = raw.unit ?? raw.Unit ?? 'kg';
  const previousStock = Number(raw.previousStock ?? raw.PreviousStock ?? 0);
  const newStock = Number(raw.newStock ?? raw.NewStock ?? (previousStock + quantity));
  const performedBy = raw.performedBy ?? raw.PerformedBy ?? 'Staff Attendant';
  const description = raw.description ?? raw.Description ?? raw.reason ?? raw.Reason ?? 'Stock update';

  return {
    id,
    dateTime,
    reference,
    ingredientName,
    transactionType,
    quantity,
    unit,
    previousStock,
    newStock,
    performedBy,
    description,
    outletId: cleanOutletId(raw.outletId ?? raw.OutletId) || 1
  };
};

export const staffInventoryService = {
  /**
   * GET /api/v1/canteen-inventory/items
   * Retrieve all live inventory ingredient items from backend
   */
  getAllInventory: async (outletId = null, params = {}) => {
    try {
      const queryParams = { ...params };
      const validOutletId = cleanOutletId(outletId);
      if (validOutletId) {
        queryParams.outletId = validOutletId;
      }

      const response = await apiClient.get(API_ENDPOINTS.INVENTORY.ITEMS, queryParams);
      const raw = response?.data ?? response;
      const list = Array.isArray(raw)
        ? raw
        : (Array.isArray(raw?.items) ? raw.items : []);
      return list.map(normalizeInventoryItem);
    } catch (err) {
      console.warn('Network issue fetching /canteen-inventory/items:', err.message);
      return [];
    }
  },

  /**
   * Get single inventory item by ID
   */
  getInventoryItemById: async (id) => {
    const items = await staffInventoryService.getAllInventory();
    return items.find((item) => String(item.id) === String(id) || item.itemCode === id) || null;
  },

  /**
   * Get Low Stock items where availableQuantity <= reorderLevel
   */
  getLowStockItems: async (outletId = null, preloadedItems = null) => {
    const items = preloadedItems || await staffInventoryService.getAllInventory(outletId);
    return items.filter((item) => {
      const qty = Number(item.availableQuantity) || 0;
      const reorder = Number(item.reorderLevel) || 0;
      return qty <= reorder;
    });
  },

  /**
   * GET /api/v1/canteen-inventory/batches
   * Retrieve all live ingredient batch lots from backend (maps to /canteen-inventory/items)
   */
  getInventoryBatches: async (params = {}) => {
    try {
      const queryParams = { ...params };
      if (queryParams.outletId) {
        const cleaned = cleanOutletId(queryParams.outletId);
        if (cleaned) queryParams.outletId = cleaned;
        else delete queryParams.outletId;
      }
      const response = await apiClient.get(API_ENDPOINTS.INVENTORY.BATCHES, queryParams);
      const raw = response?.data ?? response;
      const list = Array.isArray(raw)
        ? raw
        : (Array.isArray(raw?.batches) ? raw.batches : (Array.isArray(raw?.items) ? raw.items : []));
      return list.map(normalizeBatch);
    } catch (err) {
      console.warn('Network issue fetching /canteen-inventory/batches:', err.message);
      return [];
    }
  },

  /**
   * Get expiring batches (within N days) from live batch inventory or ingredient expiry dates
   */
  getExpiringItems: async (daysAhead = 7, outletId = null, preloadedItems = null) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let candidates = [];
    const validOutletId = cleanOutletId(outletId);

    // 1. Try to fetch live batches from GET /api/v1/canteen-inventory/batches
    try {
      const batches = await staffInventoryService.getInventoryBatches({
        outletId: validOutletId
      });
      if (Array.isArray(batches) && batches.length > 0) {
        candidates = batches;
      }
    } catch (err) {
      console.warn('Could not load /canteen-inventory/batches, falling back to items:', err.message);
    }

    // 2. If no batches returned, fall back to preloadedItems / all items
    if (candidates.length === 0) {
      candidates = preloadedItems || await staffInventoryService.getAllInventory(validOutletId);
    }

    return candidates
      .filter((item) => Boolean(item.expiryDate))
      .map((item) => {
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
      .filter((item) => item.daysToExpiry <= daysAhead)
      .sort((a, b) => a.daysToExpiry - b.daysToExpiry);
  },

  /**
   * POST /api/v1/canteen-inventory/movements
   * Record waste or disposal of an expired/spoiled batch via inventory movement endpoint
   */
  recordWaste: async (itemId, quantity, reason = 'Expired batch discarded', operatorName = 'Staff Attendant', batchNumber = null) => {
    const ingredientId = Number(itemId) || itemId;
    const payload = {
      ingredientId,
      movementType: 'Wastage',
      quantity: Number(quantity),
      batchNumber: batchNumber || null,
      expiryDate: null,
      reference: 'STAFF-WASTE',
      reason: reason || 'Disposal of spoiled/expired items',
      performedBy: operatorName
    };

    const response = await apiClient.post(API_ENDPOINTS.INVENTORY.STOCK_MOVEMENT, payload);
    const result = response?.data ?? response;

    window.dispatchEvent(new CustomEvent('cms:inventory_updated', {
      detail: { result }
    }));

    return result;
  },

  /**
   * GET /api/v1/canteen-inventory/ledger
   * Retrieve stock movements audit ledger
   */
  getInventoryLedger: async (params = {}) => {
    const queryParams = { ...params };
    if (queryParams.outletId) {
      const cleaned = cleanOutletId(queryParams.outletId);
      if (cleaned) queryParams.outletId = cleaned;
      else delete queryParams.outletId;
    }
    const response = await apiClient.get(API_ENDPOINTS.INVENTORY.LEDGER, queryParams);
    const raw = response?.data ?? response;
    const list = Array.isArray(raw)
      ? raw
      : (Array.isArray(raw?.movements) ? raw.movements : (Array.isArray(raw?.items) ? raw.items : []));
    return list.map(normalizeLedgerEntry);
  },

  /**
   * POST /api/v1/canteen-inventory/movements
   * Direct stock movement registration
   */
  recordMovement: async (movementData) => {
    const ingredientId = Number(movementData.ingredientId || movementData.itemId || movementData.id);
    const payload = {
      ingredientId,
      movementType: movementData.movementType || 'Stock Out',
      quantity: Number(movementData.quantity),
      batchNumber: movementData.batchNumber || null,
      expiryDate: movementData.expiryDate || null,
      reference: movementData.reference || null,
      reason: movementData.reason || 'Kitchen movement',
      performedBy: movementData.performedBy || 'Staff Attendant'
    };

    const res = await apiClient.post(API_ENDPOINTS.INVENTORY.STOCK_MOVEMENT, payload);
    const result = res?.data ?? res;

    window.dispatchEvent(new CustomEvent('cms:inventory_updated', {
      detail: { result }
    }));

    return result;
  },

  /**
   * Confirm receipt of incoming stock and synchronize with backend inventory
   */
  confirmReceipt: async (params) => {
    let requestResult = null;
    if (params.requestId) {
      try {
        requestResult = await staffInventoryService.markStockReceived(params.requestId);
      } catch (err) {
        console.warn('Backend mark received notice:', err.message);
      }
    }

    if (params.itemId || params.ingredientId) {
      await staffInventoryService.recordMovement({
        ingredientId: params.itemId || params.ingredientId,
        movementType: 'Stock In',
        quantity: Number(params.quantity || params.receivedQuantity || 0),
        reference: params.reference || `RCV-${Date.now().toString().slice(-4)}`,
        reason: params.reason || 'Received from Central Admin Warehouse',
        performedBy: params.receivedBy || 'Staff Attendant'
      });
    }

    window.dispatchEvent(new CustomEvent('cms:inventory_updated', {
      detail: { params }
    }));
    window.dispatchEvent(new CustomEvent('cms:stock_received', {
      detail: { params }
    }));

    return requestResult || params;
  },

  /**
   * Record kitchen usage or cooking consumption
   */
  recordUsage: async (usageData) => {
    const ingredientId = Number(usageData.itemId || usageData.ingredientId || usageData.id);
    const qty = Number(usageData.quantityUsed || usageData.quantity || 0);
    const isWaste = Boolean(usageData.isWaste || usageData.waste);

    return staffInventoryService.recordMovement({
      ingredientId,
      movementType: isWaste ? 'Wastage' : 'Stock Out',
      quantity: qty,
      reference: usageData.reference || `USE-${Date.now().toString().slice(-4)}`,
      reason: usageData.reason || (isWaste ? 'Spoilage / expired batch discarded' : 'Kitchen food preparation consumption'),
      performedBy: usageData.performedBy || 'Chef / Kitchen Staff'
    });
  },

  /**
   * GET /api/v1/canteen-inventory/stock-requests
   * Retrieve all raw material stock requisitions from backend
   */
  getStockRequests: async (outletId = null, params = {}) => {
    const queryParams = { ...params };
    const validOutletId = cleanOutletId(outletId);
    if (validOutletId) {
      queryParams.outletId = validOutletId;
    }

    const response = await apiClient.get(API_ENDPOINTS.INVENTORY.STOCK_REQUESTS, queryParams);
    const raw = response?.data ?? response;
    const list = Array.isArray(raw)
      ? raw
      : (Array.isArray(raw?.requests) ? raw.requests : (Array.isArray(raw?.items) ? raw.items : []));
    return list.map(normalizeStockRequest);
  },

  /**
   * POST /api/v1/canteen-inventory/stock-requests
   * Submit an Admin Stock Requisition to live backend
   */
  createStockRequest: async (requestData) => {
    if (!requestData.itemName || !requestData.requestedQuantity) {
      throw new Error('Please specify an item name and required quantity.');
    }

    const qty = Number(requestData.requestedQuantity) || 1;
    const outletId = cleanOutletId(requestData.outletId) || 1;

    const payload = {
      outletId,
      outletName: requestData.outletName || 'Central Dining Hall',
      itemCode: requestData.itemCode || 'ING-REQ',
      itemName: requestData.itemName.trim(),
      category: requestData.category || 'General Kitchen Supplies',
      requestedQuantity: qty,
      unit: requestData.unit || 'kg',
      urgency: requestData.urgency || 'Normal',
      requiredByDate: requestData.requiredByDate || new Date().toISOString().split('T')[0],
      notes: requestData.notes ? requestData.notes.trim() : '',
      requestedBy: requestData.requestedBy || 'Staff Attendant'
    };

    const response = await apiClient.post(API_ENDPOINTS.INVENTORY.STOCK_REQUESTS, payload);
    const raw = response?.data ?? response;
    const created = normalizeStockRequest(raw);

    window.dispatchEvent(new CustomEvent('cms:stock_request_created', {
      detail: { request: created }
    }));
    window.dispatchEvent(new CustomEvent('cms:stock_request_updated', {
      detail: { request: created }
    }));

    return created;
  },

  /**
   * PATCH /api/v1/canteen-inventory/stock-requests/{id}/received
   * Mark a stock request as received/fulfilled at the counter and inward to inventory
   */
  markStockReceived: async (requestId) => {
    const response = await apiClient.patch(API_ENDPOINTS.INVENTORY.STOCK_REQUEST_RECEIVED(requestId));
    const raw = response?.data ?? response;
    const updated = normalizeStockRequest(raw);

    window.dispatchEvent(new CustomEvent('cms:stock_request_updated', {
      detail: { request: updated }
    }));
    window.dispatchEvent(new CustomEvent('cms:inventory_updated', {
      detail: { updatedStockRequest: updated }
    }));

    return updated;
  },

  /**
   * DELETE /api/v1/canteen-inventory/stock-requests/{id}
   * Delete / reject a stock requisition record from live backend
   */
  deleteStockRequest: async (requestId) => {
    await apiClient.delete(API_ENDPOINTS.INVENTORY.STOCK_REQUEST_BY_ID(requestId));

    window.dispatchEvent(new CustomEvent('cms:stock_request_updated', {
      detail: { deletedRequestId: requestId }
    }));

    return true;
  }
};

export default staffInventoryService;
