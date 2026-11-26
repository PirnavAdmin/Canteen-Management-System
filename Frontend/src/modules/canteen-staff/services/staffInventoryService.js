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
  if (raw === null || raw === undefined || raw === 'all' || raw === 'ALL' || raw === '') return undefined;
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
  const itemCode = raw.itemCode ?? raw.ItemCode ?? raw.code ?? (id ? `ING-${id}` : '—');
  const ingredientName = raw.ingredientName ?? raw.IngredientName ?? raw.name ?? raw.Name ?? 'Ingredient';
  const category = raw.category ?? raw.Category ?? 'General Kitchen Supplies';
  const availableQuantity = Number(
    raw.availableQuantity ?? raw.AvailableQuantity ?? raw.quantity ?? raw.Quantity ?? raw.currentStock ?? 0
  );
  const unit = raw.unit ?? raw.Unit ?? 'kg';
  const reorderLevel = Number(raw.reorderLevel ?? raw.ReorderLevel ?? raw.minStockLevel ?? 0);
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
    outletId: cleanOutletId(raw.outletId ?? raw.OutletId) ?? null
  };
};

/**
 * Normalizes backend batch lot record into consistent shape expected by Staff UI components.
 */
export const normalizeBatch = (raw) => {
  if (!raw || typeof raw !== 'object') return raw;

  const id = raw.id ?? raw.Id ?? raw.batchId ?? raw.BatchId ?? '';
  const batchNumber = raw.batchNumber ?? raw.BatchNumber ?? raw.batchNo ?? raw.BatchNo ?? (id ? `B-${id}` : '—');
  const ingredientId = raw.ingredientId ?? raw.IngredientId ?? raw.itemId ?? raw.ItemId ?? '';
  const ingredientName = raw.ingredientName ?? raw.IngredientName ?? raw.name ?? raw.Name ?? 'Ingredient';
  const itemCode = raw.itemCode ?? raw.ItemCode ?? (ingredientId ? `ING-${ingredientId}` : '—');
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
  const itemCode = raw.itemCode ?? raw.ItemCode ?? (raw.poNumber ? String(raw.poNumber) : (id ? `REQ-${id}` : '—'));
  const itemName = raw.itemName ?? raw.ItemName ?? raw.ingredientName ?? (firstItem?.ingredientName || 'Stock Item');
  const category = raw.category ?? raw.Category ?? (raw.supplierName ? `Supplier: ${raw.supplierName}` : 'General Kitchen Supplies');
  const requestedQuantity = Number(raw.requestedQuantity ?? raw.RequestedQuantity ?? raw.quantity ?? firstItem?.qty ?? firstItem?.quantity ?? 0);
  const unit = raw.unit ?? raw.Unit ?? (firstItem?.unit || 'kg');
  const urgency = raw.urgency ?? raw.Urgency ?? 'Normal';
  const status = raw.status ?? raw.Status ?? 'Pending';
  const adminNotes = raw.adminNotes ?? raw.AdminNotes ?? raw.notes ?? raw.Notes ?? (raw.supplierName ? `Supplier: ${raw.supplierName}` : '');
  const notes = raw.notes ?? raw.Notes ?? '';
  const requiredByDate = raw.requiredByDate ?? raw.RequiredByDate ?? raw.expectedDelivery ?? null;
  const requestedBy = raw.requestedBy ?? raw.RequestedBy ?? '—';
  const createdAt = raw.createdAt ?? raw.CreatedAt ?? null;

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
    rejectionReason: raw.rejectionReason ?? raw.RejectionReason ?? raw.reason ?? raw.Reason ?? (raw.status === 'Rejected' ? raw.adminNotes : '') ?? '',
    adminNotes,
    notes,
    requiredByDate,
    requestedBy,
    createdAt,
    outletId: cleanOutletId(raw.outletId ?? raw.OutletId) ?? null
  };
};

/**
 * Normalizes backend stock movement / ledger record into consistent shape expected by Staff UI components.
 */
export const normalizeLedgerEntry = (raw) => {
  if (!raw || typeof raw !== 'object') return raw;
  const id = raw.id ?? raw.Id ?? raw.movementId ?? '';
  const dateTime = raw.dateTime ?? raw.DateTime ?? raw.createdAt ?? raw.CreatedAt ?? null;
  const reference = raw.reference ?? raw.Reference ?? (id ? `MOV-${id}` : '—');
  const ingredientName = raw.ingredientName ?? raw.IngredientName ?? raw.name ?? raw.Name ?? 'Ingredient';
  const transactionType = raw.transactionType ?? raw.TransactionType ?? raw.movementType ?? raw.MovementType ?? 'STOCK ADJUSTMENT';
  const quantity = Number(raw.quantity ?? raw.Quantity ?? 0);
  const unit = raw.unit ?? raw.Unit ?? 'kg';
  const previousStock = Number(raw.previousStock ?? raw.PreviousStock ?? 0);
  const newStock = Number(raw.newStock ?? raw.NewStock ?? (previousStock + quantity));
  const performedBy = raw.performedBy ?? raw.PerformedBy ?? '—';
  const description = raw.description ?? raw.Description ?? raw.reason ?? raw.Reason ?? '—';

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
    outletId: cleanOutletId(raw.outletId ?? raw.OutletId) ?? null
  };
};

export const staffInventoryService = {
  /**
   * GET /api/v1/canteen-inventory/items
   * Retrieve all live inventory ingredient items from backend.
   * Propagates errors instead of returning empty fallback arrays.
   */
  getAllInventory: async (outletId = null, params = {}) => {
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
  },

  /**
   * Get single inventory item by ID
   */
  getInventoryItemById: async (id, outletId = null) => {
    const items = await staffInventoryService.getAllInventory(outletId);
    return items.find((item) => String(item.id) === String(id) || item.itemCode === id) || null;
  },

  /**
   * POST /api/v1/canteen-inventory/items
   * Create a new inventory ingredient item in the kitchen outlet store
   */
  addItem: async (itemData) => {
    const outletId = cleanOutletId(itemData.outletId);
    if (!outletId) {
      throw new Error('A valid canteen outlet is required to create an inventory item.');
    }
    const payload = {
      ingredientName: itemData.ingredientName?.trim(),
      category: itemData.category || 'General Kitchen Supplies',
      availableQuantity: Number(itemData.availableQuantity || itemData.quantity || 0),
      unit: itemData.unit || 'kg',
      reorderLevel: Number(itemData.reorderLevel ?? 5),
      costPerUnit: Number(itemData.costPerUnit || 0),
      outletId,
      batchNumber: itemData.batchNumber || null,
      expiryDate: itemData.expiryDate || null,
      status: itemData.status || 'In Stock'
    };
    const response = await apiClient.post(API_ENDPOINTS.INVENTORY.ITEMS, payload);
    return response?.data ?? response;
  },

  /**
   * PUT /api/v1/canteen-inventory/items/{id}
   * Update an existing kitchen inventory item
   */
  updateItem: async (id, itemData) => {
    const payload = {
      ingredientName: itemData.ingredientName?.trim(),
      category: itemData.category,
      availableQuantity: itemData.availableQuantity !== undefined ? Number(itemData.availableQuantity) : undefined,
      unit: itemData.unit,
      reorderLevel: itemData.reorderLevel !== undefined ? Number(itemData.reorderLevel) : undefined,
      costPerUnit: itemData.costPerUnit !== undefined ? Number(itemData.costPerUnit) : undefined,
      outletId: itemData.outletId ? cleanOutletId(itemData.outletId) : undefined,
      batchNumber: itemData.batchNumber || null,
      expiryDate: itemData.expiryDate || null,
      status: itemData.status
    };
    const response = await apiClient.put(API_ENDPOINTS.INVENTORY.ITEM_BY_ID(id), payload);
    return response?.data ?? response;
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
   * Retrieve all live ingredient batch lots from backend
   */
  getInventoryBatches: async (params = {}) => {
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
  },

  /**
   * Get expiring batches (within N days) from live batch inventory or ingredient expiry dates
   */
  getExpiringItems: async (daysAhead = 7, outletId = null, preloadedItems = null) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const validOutletId = cleanOutletId(outletId);
    const batches = await staffInventoryService.getInventoryBatches({
      outletId: validOutletId
    });
    const candidates = (Array.isArray(batches) && batches.length > 0)
      ? batches
      : (preloadedItems || await staffInventoryService.getAllInventory(validOutletId));

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
  recordWaste: async (itemId, quantity, reason = 'Expired batch discarded', operatorName = 'Staff', batchNumber = null) => {
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
      performedBy: movementData.performedBy || 'Staff'
    };

    const res = await apiClient.post(API_ENDPOINTS.INVENTORY.STOCK_MOVEMENT, payload);
    const result = res?.data ?? res;

    window.dispatchEvent(new CustomEvent('cms:inventory_updated', {
      detail: { result }
    }));

    return result;
  },

  /**
   * Confirm receipt of incoming stock and synchronize with backend inventory.
   * Propagates API errors so UI never shows false success.
   */
  confirmReceipt: async (params) => {
    const reqId = params.requestId || params.id;
    let requestResult = null;
    if (reqId) {
      requestResult = await staffInventoryService.markStockReceived(reqId);
    }

    const outletId = cleanOutletId(params.outletId);
    const receivedQty = Number(params.receivedQuantity || params.quantity || 0);
    const ingredientName = (params.ingredientName || params.itemName || '').trim();

    if (receivedQty > 0 && ingredientName && outletId) {
      const kitchenItems = await staffInventoryService.getAllInventory(outletId);
      const targetItem = kitchenItems.find((i) =>
        (params.ingredientId && String(i.id) === String(params.ingredientId)) ||
        (params.itemId && String(i.id) === String(params.itemId)) ||
        ((i.ingredientName || '').trim().toLowerCase() === ingredientName.toLowerCase())
      );

      let finalItemId;
      if (targetItem) {
        finalItemId = targetItem.id;
        const currentQty = Number(targetItem.availableQuantity || 0);
        const newQty = currentQty + receivedQty;
        await staffInventoryService.updateItem(targetItem.id, {
          availableQuantity: newQty,
          status: newQty > 0 ? 'In Stock' : targetItem.status
        });
      } else {
        const created = await staffInventoryService.addItem({
          ingredientName,
          category: params.category || 'General Kitchen Supplies',
          availableQuantity: receivedQty,
          unit: params.unit || 'kg',
          reorderLevel: 5,
          costPerUnit: 0,
          outletId,
          status: 'In Stock'
        });
        finalItemId = created?.data?.id ?? created?.id;
      }

      const movementItemId = finalItemId || params.itemId || params.ingredientId;
      if (movementItemId) {
        await staffInventoryService.recordMovement({
          ingredientId: movementItemId,
          movementType: 'Stock In',
          quantity: receivedQty,
          reference: params.reference || `REQ-${reqId || 'RCV'}`,
          reason: targetItem
            ? 'Received from Central Admin Warehouse'
            : 'Initial receipt of new requested ingredient from Central Admin',
          performedBy: params.receivedBy || 'Staff'
        });
      }
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
    const isWaste = Boolean(usageData.isWaste || usageData.waste || usageData.type === 'WASTAGE');

    return staffInventoryService.recordMovement({
      ingredientId,
      movementType: isWaste ? 'Wastage' : 'Stock Out',
      quantity: qty,
      reference: usageData.reference || `USE-${Date.now().toString().slice(-4)}`,
      reason: usageData.reason || (isWaste ? 'Spoilage / expired batch discarded' : 'Kitchen food preparation consumption'),
      performedBy: usageData.performedBy || 'Staff'
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
    const outletId = cleanOutletId(requestData.outletId);
    if (!outletId) {
      throw new Error('No active canteen outlet selected for this stock requisition.');
    }

    const payload = {
      outletId,
      outletName: requestData.outletName || '',
      ingredientId: requestData.ingredientId ? Number(requestData.ingredientId) : null,
      itemId: requestData.ingredientId ? Number(requestData.ingredientId) : null,
      itemCode: requestData.itemCode || 'ING-REQ',
      itemName: requestData.itemName.trim(),
      category: requestData.category || 'General Kitchen Supplies',
      requestedQuantity: qty,
      unit: requestData.unit || 'kg',
      urgency: requestData.urgency || 'Normal',
      requiredByDate: requestData.requiredByDate || new Date().toISOString().split('T')[0],
      notes: requestData.notes ? requestData.notes.trim() : '',
      requestedBy: requestData.requestedBy || 'Staff'
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
   * PUT / PATCH /api/v1/canteen-inventory/stock-requests/{id}
   * Update a pending stock requisition on live backend
   */
  updateStockRequest: async (requestId, requestData = {}) => {
    let response;
    try {
      response = await apiClient.put(API_ENDPOINTS.INVENTORY.STOCK_REQUEST_BY_ID(requestId), requestData);
    } catch {
      response = await apiClient.patch(API_ENDPOINTS.INVENTORY.STOCK_REQUEST_BY_ID(requestId), requestData);
    }
    const raw = response?.data ?? response;
    const updated = normalizeStockRequest(raw);

    window.dispatchEvent(new CustomEvent('cms:stock_request_updated', {
      detail: { request: updated }
    }));

    return updated;
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
   * Delete / cancel a stock requisition record from live backend
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
