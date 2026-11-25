import React, { useState, useMemo, useEffect } from 'react';
import { Package, BookOpen, ShoppingCart, Users, PlusCircle, ArrowDownUp, Store, ChefHat, Search, X } from 'lucide-react';
import { PageHeader } from '../../../../components/common/PageHeader';
import { Button } from '../../../../components/common/Button';
import { ConfirmationModal } from '../../../../components/common/ConfirmationModal';
import { Pagination } from '../../../../components/common/Pagination';
import { useInventory } from '../hooks/useInventory';
import { StockTable } from '../components/StockTable';
import { StockMovementModal } from '../components/StockMovementModal';
import { StockLedgerTable } from '../components/StockLedgerTable';
import { PurchaseOrdersTable } from '../components/PurchaseOrdersTable';
import { PurchaseOrderModal } from '../components/PurchaseOrderModal';
import { SuppliersTable } from '../components/SuppliersTable';
import { SupplierModal } from '../components/SupplierModal';
import { InventoryItemModal } from '../components/InventoryItemModal';
import { KitchenRequestsTable } from '../components/KitchenRequestsTable';
import { ApproveKitchenRequestModal } from '../components/ApproveKitchenRequestModal';
import { RejectKitchenRequestModal } from '../components/RejectKitchenRequestModal';
import { RequestStockModal } from '../components/RequestStockModal';
import { EditKitchenRequestModal } from '../components/EditKitchenRequestModal';
import { canteenService } from '../../outlets/services/canteenService';

import { useCanteens } from '../../outlets/hooks/useCanteens';

export const InventoryPage = () => {
  const { canteens: outlets = [] } = useCanteens();

  // Pure dining canteen kitchen outlets (WH-01 is decoupled into dedicated CanteenWarehouses)
  const kitchenOutlets = useMemo(() => {
    return outlets.filter(o => o.code !== 'WH-01' && !(o.name || '').toLowerCase().includes('warehouse'));
  }, [outlets]);

  // Inventory Scope: Defaults to 'CENTRAL' for Central Warehouse (Admin Master Store)
  const [inventoryScope, setInventoryScope] = useState('CENTRAL');

  const isWarehouseView = inventoryScope === 'CENTRAL' || inventoryScope === '4' || inventoryScope === 'ALL';

  const currentScopeOutlet = useMemo(() => {
    if (isWarehouseView) {
      return { id: 'CENTRAL', name: 'Central Procurement Warehouse (Admin Master Store)' };
    }
    return kitchenOutlets.find(o => String(o.outletId || o.id) === String(inventoryScope)) || kitchenOutlets[0] || null;
  }, [kitchenOutlets, inventoryScope, isWarehouseView]);

  const {
    items,
    centralItems,
    ledger,
    purchaseOrders,
    suppliers,
    kitchenRequests = [],
    loading,
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
    rejectKitchenRequest,
    markKitchenRequestReceived,
    submitBatchStockRequests,
    updateKitchenRequest,
    deleteKitchenRequest,
    refreshInventory
  } = useInventory(inventoryScope);

  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);

  // Tab state: 'items' | 'ledger' | 'pos' | 'suppliers' | 'kitchen-requests'
  const [activeTab, setActiveTab] = useState('items');

  // When switching to kitchen-requests tab, trigger fresh API load
  useEffect(() => {
    if (activeTab === 'kitchen-requests' && typeof refreshInventory === 'function') {
      refreshInventory();
    }
  }, [activeTab, refreshInventory]);

  // If viewing a kitchen outlet, auto-switch to 'items' if activeTab was pos or suppliers
  useEffect(() => {
    if (!isWarehouseView && (activeTab === 'pos' || activeTab === 'suppliers')) {
      setActiveTab('items');
    }
  }, [isWarehouseView, activeTab]);

  // Search term state
  const [searchTerm, setSearchTerm] = useState('');

  // Priority search for raw materials & stock items
  const filteredItems = useMemo(() => {
    if (!searchTerm || !searchTerm.trim()) return items;
    const q = searchTerm.trim().toLowerCase();

    const scored = [];
    for (const item of items) {
      const name = (item.ingredientName || item.name || '').toLowerCase();
      const code = (item.itemCode || item.code || `ING-${String(item.id || item.itemId || 1).padStart(3, '0')}`).toLowerCase();
      const supplier = (item.supplierName || item.vendor || '').toLowerCase();
      const batch = (item.batchNumber || '').toLowerCase();
      const outlet = (item.outletName || '').toLowerCase();
      const category = (item.category || '').toLowerCase();

      let score = null;
      if (code === q || name === q) {
        score = 1; // Highest priority: Exact match on code or name
      } else if (code.startsWith(q)) {
        score = 2; // Starts with code
      } else if (name.startsWith(q)) {
        score = 3; // Name starts with query
      } else if (name.split(/\s+/).some(word => word.startsWith(q))) {
        score = 4; // Word in name starts with query
      } else if (name.includes(q)) {
        score = 5; // Substring in name
      } else if (code.includes(q)) {
        score = 6; // Substring in code
      } else if (category.includes(q)) {
        score = 7; // Substring in category
      } else if (supplier.includes(q)) {
        score = 8; // Substring in supplier
      } else if (batch.includes(q)) {
        score = 9; // Substring in batch
      } else if (outlet.includes(q)) {
        score = 10; // Substring in outlet name
      }

      if (score !== null) {
        scored.push({ item, score });
      }
    }

    scored.sort((a, b) => {
      if (a.score !== b.score) return a.score - b.score;
      const nameA = (a.item.ingredientName || a.item.name || '').toLowerCase();
      const nameB = (b.item.ingredientName || b.item.name || '').toLowerCase();
      return nameA.localeCompare(nameB);
    });

    return scored.map(s => s.item);
  }, [items, searchTerm]);

  const filteredLedger = useMemo(() => {
    if (!searchTerm || !searchTerm.trim()) return ledger;
    const q = searchTerm.trim().toLowerCase();
    return ledger.filter(l =>
      (l.ingredientName || '').toLowerCase().includes(q) ||
      (l.batchNumber || '').toLowerCase().includes(q) ||
      (l.reference || '').toLowerCase().includes(q) ||
      (l.outletName || '').toLowerCase().includes(q)
    );
  }, [ledger, searchTerm]);

  const filteredPOs = useMemo(() => {
    if (!searchTerm || !searchTerm.trim()) return purchaseOrders;
    const q = searchTerm.trim().toLowerCase();
    return purchaseOrders.filter(p =>
      (p.poNumber || '').toLowerCase().includes(q) ||
      (p.supplierName || '').toLowerCase().includes(q) ||
      (p.outletName || '').toLowerCase().includes(q)
    );
  }, [purchaseOrders, searchTerm]);

  const filteredSuppliers = useMemo(() => {
    if (!searchTerm || !searchTerm.trim()) return suppliers;
    const q = searchTerm.trim().toLowerCase();
    return suppliers.filter(s =>
      (s.name || '').toLowerCase().includes(q) ||
      (s.contactPerson || '').toLowerCase().includes(q) ||
      (s.phone || '').toLowerCase().includes(q) ||
      (s.email || '').toLowerCase().includes(q)
    );
  }, [suppliers, searchTerm]);

  const filteredKitchenRequests = useMemo(() => {
    if (!searchTerm || !searchTerm.trim()) return kitchenRequests;
    const q = searchTerm.trim().toLowerCase();
    return kitchenRequests.filter(r =>
      (r.itemName || r.ingredientName || '').toLowerCase().includes(q) ||
      (r.requestId || r.id || '').toLowerCase().includes(q) ||
      (r.outletName || '').toLowerCase().includes(q)
    );
  }, [kitchenRequests, searchTerm]);

  // Pagination state (default 5 per page) for each tab
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const [ledgerPage, setLedgerPage] = useState(1);
  const [ledgerPageSize, setLedgerPageSize] = useState(5);

  const [posPage, setPosPage] = useState(1);
  const [posPageSize, setPosPageSize] = useState(5);

  const [kitchenRequestsPage, setKitchenRequestsPage] = useState(1);
  const [kitchenRequestsPageSize, setKitchenRequestsPageSize] = useState(5);

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, currentPage, pageSize]);

  const paginatedLedger = useMemo(() => {
    const start = (ledgerPage - 1) * ledgerPageSize;
    return filteredLedger.slice(start, start + ledgerPageSize);
  }, [filteredLedger, ledgerPage, ledgerPageSize]);

  const paginatedPOs = useMemo(() => {
    const start = (posPage - 1) * posPageSize;
    return filteredPOs.slice(start, start + posPageSize);
  }, [filteredPOs, posPage, posPageSize]);

  const paginatedKitchenRequests = useMemo(() => {
    const start = (kitchenRequestsPage - 1) * kitchenRequestsPageSize;
    return filteredKitchenRequests.slice(start, start + kitchenRequestsPageSize);
  }, [filteredKitchenRequests, kitchenRequestsPage, kitchenRequestsPageSize]);

  // Modals & action loading state
  const [movementModal, setMovementModal] = useState({ isOpen: false, item: null, type: 'Stock Out' });
  const [approveModal, setApproveModal] = useState({ isOpen: false, request: null });
  const [rejectModal, setRejectModal] = useState({ isOpen: false, request: null });
  const [isPOModalOpen, setIsPOModalOpen] = useState(false);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [supplierToDelete, setSupplierToDelete] = useState(null);

  // Main Inventory Item Modals
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);

  // Kitchen Requisition Edit & Delete states
  const [editingKitchenRequest, setEditingKitchenRequest] = useState(null);
  const [kitchenRequestToDelete, setKitchenRequestToDelete] = useState(null);

  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  const handleSaveEditKitchenRequest = async (request, qty, additionalData) => {
    try {
      setModalLoading(true);
      await updateKitchenRequest(request, qty, additionalData);
      setEditingKitchenRequest(null);
    } finally {
      setModalLoading(false);
    }
  };

  const handleConfirmDeleteKitchenRequest = async () => {
    if (!kitchenRequestToDelete) return;
    try {
      setModalLoading(true);
      await deleteKitchenRequest(kitchenRequestToDelete);
      setKitchenRequestToDelete(null);
    } finally {
      setModalLoading(false);
    }
  };

  const handleConfirmRejectKitchenRequest = async (request, reason) => {
    try {
      setModalLoading(true);
      await rejectKitchenRequest(request, reason);
      setRejectModal({ isOpen: false, request: null });
    } finally {
      setModalLoading(false);
    }
  };

  const handleOpenAddItem = () => {
    setEditingItem(null);
    setIsItemModalOpen(true);
  };

  const handleOpenEditItem = (item) => {
    setEditingItem(item);
    setIsItemModalOpen(true);
  };

  const handleSaveItem = async (payload) => {
    try {
      setModalLoading(true);
      if (editingItem) {
        await updateItem(editingItem.id, payload);
      } else {
        await createItem(payload);
      }
      setIsItemModalOpen(false);
      setEditingItem(null);
    } finally {
      setModalLoading(false);
    }
  };

  const handleConfirmDeleteItem = async () => {
    if (!itemToDelete) return;
    try {
      setModalLoading(true);
      await deleteItem(itemToDelete.id);
      setItemToDelete(null);
    } finally {
      setModalLoading(false);
    }
  };

  const handleOpenMovement = (item, type = 'Stock Out') => {
    setMovementModal({ isOpen: true, item, type });
  };

  const handleRecordMovement = async (payload) => {
    try {
      setModalLoading(true);
      await recordMovement(payload);
    } finally {
      setModalLoading(false);
    }
  };

  const handleCreatePO = async (payload) => {
    try {
      setModalLoading(true);
      await createPO(payload);
    } finally {
      setModalLoading(false);
    }
  };

  const handleCreateSupplier = async (payload) => {
    try {
      setModalLoading(true);
      await createSupplier(payload);
    } finally {
      setModalLoading(false);
    }
  };

  const handleOpenEditSupplier = (supplier) => {
    setEditingSupplier(supplier);
    setIsSupplierModalOpen(true);
  };

  const handleSaveSupplier = async (payload) => {
    try {
      setModalLoading(true);
      if (editingSupplier) {
        await updateSupplier(editingSupplier.id, payload);
      } else {
        await createSupplier(payload);
      }
      setIsSupplierModalOpen(false);
      setEditingSupplier(null);
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteSupplier = (supplier) => {
    setSupplierToDelete(supplier);
  };

  const handleConfirmDeleteSupplier = async () => {
    if (!supplierToDelete) return;
    try {
      setModalLoading(true);
      await deleteSupplier(supplierToDelete.id);
      setSupplierToDelete(null);
    } finally {
      setModalLoading(false);
    }
  };

  const handleUpdatePOStatus = async (poId, status) => {
    try {
      setActionLoadingId(poId);
      await updatePOStatus(poId, status);
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div>
      <PageHeader
        title={isWarehouseView ? "Central Warehouse Inventory & Master Store" : `${currentScopeOutlet?.name || 'Kitchen'} Inventory & Stock Ledger`}
        description={isWarehouseView
          ? "Maintain central campus raw materials, stock quantities, reorder thresholds, purchase orders, and supplier relationships."
          : `Manage ${currentScopeOutlet?.name || 'kitchen'} stock, record daily kitchen issues, track stock requisition history, and receive items from Central Warehouse.`}
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
            {/* If Kitchen Requests tab on an outlet, show 'Request Items / Goods' button */}
            {!isWarehouseView && activeTab === 'kitchen-requests' && (
              <Button
                variant="primary"
                icon={PlusCircle}
                onClick={() => setIsRequestModalOpen(true)}
              >
                Request Items / Goods
              </Button>
            )}

            {activeTab === 'items' && (
              <>
                <Button
                  variant="primary"
                  icon={PlusCircle}
                  onClick={handleOpenAddItem}
                >
                  Add Stock Item
                </Button>
                {items.length > 0 && (
                  <Button
                    variant="outline"
                    icon={ArrowDownUp}
                    onClick={() => handleOpenMovement(items[0], 'Stock In')}
                  >
                    Log Movement
                  </Button>
                )}
              </>
            )}

            {isWarehouseView && activeTab === 'pos' && (
              <Button
                variant="primary"
                icon={PlusCircle}
                onClick={() => setIsPOModalOpen(true)}
              >
                Create Purchase Order
              </Button>
            )}

            {isWarehouseView && activeTab === 'suppliers' && (
              <Button
                variant="primary"
                icon={PlusCircle}
                onClick={() => {
                  setEditingSupplier(null);
                  setIsSupplierModalOpen(true);
                }}
              >
                Register Supplier
              </Button>
            )}
          </div>
        }
      />

      {/* Dining Outlet Selector Toolbar */}
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        borderRadius: 'var(--border-radius-lg)',
        border: '1px solid var(--border-color)',
        padding: '12px 18px',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        boxShadow: 'var(--shadow-xs)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Store size={18} style={{ color: 'var(--color-primary)' }} />
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
            Inventory Scope:
          </span>
          <select
            value={inventoryScope}
            onChange={(e) => {
              setInventoryScope(e.target.value);
              setCurrentPage(1);
              setLedgerPage(1);
              setPosPage(1);
              setKitchenRequestsPage(1);
            }}
            style={{
              height: '38px',
              padding: '0 14px',
              fontSize: '13px',
              fontWeight: 600,
              border: '1.5px solid var(--border-color)',
              borderRadius: 'var(--border-radius-md)',
              backgroundColor: 'var(--bg-app)',
              color: 'var(--text-primary)',
              minWidth: '300px',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            <optgroup label="🏢 Central Administration">
              <option value="CENTRAL">
                📦 Central Warehouse (Admin Master Store)
              </option>
            </optgroup>
            <optgroup label="🍳 Campus Kitchen Outlets">
              {kitchenOutlets.map(out => (
                <option key={out.outletId || out.id} value={String(out.outletId || out.id)}>
                  🍽️ {out.name || out.outletName || `Outlet ${out.outletId || out.id}`} (Kitchen Inventory)
                </option>
              ))}
            </optgroup>
          </select>
        </div>

        {/* Search Bar in place of consolidate message with priority search */}
        <div style={{ position: 'relative', minWidth: '240px', maxWidth: '340px', flex: '1 1 240px' }}>
          <Search
            size={15}
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
              pointerEvents: 'none'
            }}
          />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
              setLedgerPage(1);
              setPosPage(1);
              setKitchenRequestsPage(1);
            }}
            placeholder="Search items by name, code..."
            aria-label="Search items by name, code"
            style={{
              width: '100%',
              height: '38px',
              padding: searchTerm ? '0 32px 0 34px' : '0 14px 0 34px',
              fontSize: '13px',
              fontWeight: 500,
              border: '1.5px solid var(--border-color)',
              borderRadius: 'var(--border-radius-md)',
              backgroundColor: 'var(--bg-app)',
              color: 'var(--text-primary)',
              outline: 'none',
              boxSizing: 'border-box',
              transition: 'border-color var(--transition-fast)'
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-primary)'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; }}
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setCurrentPage(1);
                setLedgerPage(1);
                setPosPage(1);
                setKitchenRequestsPage(1);
              }}
              title="Clear search"
              aria-label="Clear search"
              style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '4px',
                borderRadius: '50%'
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Tabs navigation */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--border-color)',
        marginBottom: '16px',
        gap: '4px'
      }}>
        <button
          type="button"
          onClick={() => setActiveTab('items')}
          style={{
            padding: '10px 16px',
            fontSize: '13px',
            fontWeight: activeTab === 'items' ? 600 : 500,
            color: activeTab === 'items' ? 'var(--color-primary)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'items' ? '2.5px solid var(--color-primary)' : '2.5px solid transparent',
            background: 'none',
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Package size={15} />
          <span>Raw Materials & Stock</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ledger')}
          style={{
            padding: '10px 16px',
            fontSize: '13px',
            fontWeight: activeTab === 'ledger' ? 600 : 500,
            color: activeTab === 'ledger' ? 'var(--color-primary)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'ledger' ? '2.5px solid var(--color-primary)' : '2.5px solid transparent',
            background: 'none',
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <BookOpen size={15} />
          <span>Movement Ledger</span>
        </button>

        {/* Purchase Orders Tab (Admin Central Warehouse only) */}
        {isWarehouseView && (
          <button
            type="button"
            onClick={() => setActiveTab('pos')}
            style={{
              padding: '10px 16px',
              fontSize: '13px',
              fontWeight: activeTab === 'pos' ? 600 : 500,
              color: activeTab === 'pos' ? 'var(--color-primary)' : 'var(--text-secondary)',
              borderBottom: activeTab === 'pos' ? '2.5px solid var(--color-primary)' : '2.5px solid transparent',
              background: 'none',
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <ShoppingCart size={15} />
            <span>Purchase Orders</span>
          </button>
        )}

        {/* Suppliers Tab (Admin Central Warehouse only) */}
        {isWarehouseView && (
          <button
            type="button"
            onClick={() => setActiveTab('suppliers')}
            style={{
              padding: '10px 16px',
              fontSize: '13px',
              fontWeight: activeTab === 'suppliers' ? 600 : 500,
              color: activeTab === 'suppliers' ? 'var(--color-primary)' : 'var(--text-secondary)',
              borderBottom: activeTab === 'suppliers' ? '2.5px solid var(--color-primary)' : '2.5px solid transparent',
              background: 'none',
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Users size={15} />
            <span>Suppliers</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => setActiveTab('kitchen-requests')}
          style={{
            padding: '10px 16px',
            fontSize: '13px',
            fontWeight: activeTab === 'kitchen-requests' ? 600 : 500,
            color: activeTab === 'kitchen-requests' ? 'var(--color-primary)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'kitchen-requests' ? '2.5px solid var(--color-primary)' : '2.5px solid transparent',
            background: 'none',
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <ChefHat size={15} />
          <span>Kitchen Requests</span>
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === 'items' && (
        <StockTable
          items={paginatedItems}
          loading={loading}
          onOpenMovement={handleOpenMovement}
          onEditItem={handleOpenEditItem}
          onDeleteItem={(item) => setItemToDelete(item)}
          footer={
            <Pagination
              currentPage={currentPage}
              totalItems={filteredItems.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={(sz) => { setPageSize(sz); setCurrentPage(1); }}
              pageSizeOptions={[5, 10, 15, 20]}
            />
          }
        />
      )}

      {activeTab === 'ledger' && (
        <StockLedgerTable
          ledger={paginatedLedger}
          loading={loading}
          footer={
            <Pagination
              currentPage={ledgerPage}
              totalItems={filteredLedger.length}
              pageSize={ledgerPageSize}
              onPageChange={setLedgerPage}
              onPageSizeChange={(sz) => { setLedgerPageSize(sz); setLedgerPage(1); }}
              pageSizeOptions={[5, 10, 15, 20]}
            />
          }
        />
      )}

      {isWarehouseView && activeTab === 'pos' && (
        <PurchaseOrdersTable
          orders={paginatedPOs}
          loading={loading}
          actionLoadingId={actionLoadingId}
          onUpdateStatus={handleUpdatePOStatus}
          footer={
            <Pagination
              currentPage={posPage}
              totalItems={filteredPOs.length}
              pageSize={posPageSize}
              onPageChange={setPosPage}
              onPageSizeChange={(sz) => { setPosPageSize(sz); setPosPage(1); }}
              pageSizeOptions={[5, 10, 15, 20]}
            />
          }
        />
      )}

      {isWarehouseView && activeTab === 'suppliers' && (
        <SuppliersTable
          suppliers={filteredSuppliers}
          loading={loading}
          onEdit={handleOpenEditSupplier}
          onDelete={handleDeleteSupplier}
          onDeactivate={(supplier) => deactivateSupplier(supplier.id)}
        />
      )}

      {activeTab === 'kitchen-requests' && (
        <KitchenRequestsTable
          requests={paginatedKitchenRequests}
          loading={loading}
          isWarehouseScope={isWarehouseView}
          onOpenApprove={(req) => setApproveModal({ isOpen: true, request: req })}
          onOpenReject={(req) => setRejectModal({ isOpen: true, request: req })}
          onMarkReceived={markKitchenRequestReceived}
          onEditRequest={(req) => setEditingKitchenRequest(req)}
          onDeleteRequest={(req) => setKitchenRequestToDelete(req)}
          footer={
            <Pagination
              currentPage={kitchenRequestsPage}
              totalItems={filteredKitchenRequests.length}
              pageSize={kitchenRequestsPageSize}
              onPageChange={setKitchenRequestsPage}
              onPageSizeChange={(sz) => { setKitchenRequestsPageSize(sz); setKitchenRequestsPage(1); }}
              pageSizeOptions={[5, 10, 15, 20]}
            />
          }
        />
      )}

      {/* Requisition Request Modal for Kitchen Outlets */}
      <RequestStockModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        currentOutlet={currentScopeOutlet}
        warehouseOutlet={warehouseOutlet}
        centralItems={centralItems}
        loading={modalLoading}
        onSubmitRequest={async (itemsList, commonData) => {
          try {
            setModalLoading(true);
            await submitBatchStockRequests(itemsList, commonData);
            setIsRequestModalOpen(false);
          } finally {
            setModalLoading(false);
          }
        }}
      />

      {/* Modals */}
      <ApproveKitchenRequestModal
        isOpen={approveModal.isOpen}
        onClose={() => setApproveModal({ isOpen: false, request: null })}
        request={approveModal.request}
        rawMaterials={centralItems && centralItems.length > 0 ? centralItems : items}
        loading={modalLoading}
        onApprove={async (req, qty) => {
          try {
            setModalLoading(true);
            await approveKitchenRequest(req, qty);
          } finally {
            setModalLoading(false);
          }
        }}
      />

      <RejectKitchenRequestModal
        isOpen={rejectModal.isOpen}
        onClose={() => !modalLoading && setRejectModal({ isOpen: false, request: null })}
        request={rejectModal.request}
        loading={modalLoading}
        onReject={handleConfirmRejectKitchenRequest}
      />

      {/* Modals */}
      <StockMovementModal
        isOpen={movementModal.isOpen}
        onClose={() => !modalLoading && setMovementModal({ isOpen: false, item: null, type: 'Stock Out' })}
        item={movementModal.item}
        defaultType={movementModal.type}
        loading={modalLoading}
        onRecordMovement={handleRecordMovement}
      />

      <PurchaseOrderModal
        isOpen={isPOModalOpen}
        onClose={() => !modalLoading && setIsPOModalOpen(false)}
        suppliers={suppliers}
        outlets={outlets}
        defaultOutletId={Number(inventoryScope) || (outlets[0]?.outletId || outlets[0]?.id || 1)}
        loading={modalLoading}
        onCreatePO={handleCreatePO}
      />

      <SupplierModal
        isOpen={isSupplierModalOpen}
        onClose={() => {
          if (!modalLoading) {
            setIsSupplierModalOpen(false);
            setEditingSupplier(null);
          }
        }}
        initialData={editingSupplier}
        loading={modalLoading}
        onSaveSupplier={handleSaveSupplier}
        onAddSupplier={handleCreateSupplier}
      />

      <ConfirmationModal
        isOpen={Boolean(supplierToDelete)}
        onClose={() => !modalLoading && setSupplierToDelete(null)}
        onConfirm={handleConfirmDeleteSupplier}
        title="Inactivate Supplier"
        message={`Are you sure you want to inactivate "${supplierToDelete?.name || supplierToDelete?.contactPerson || 'this supplier'}"? If linked purchase orders exist, their status will be set to Inactive to preserve audit history.`}
        confirmText="Inactive"
        variant="danger"
        loading={modalLoading}
      />

      <InventoryItemModal
        isOpen={isItemModalOpen}
        onClose={() => {
          if (!modalLoading) {
            setIsItemModalOpen(false);
            setEditingItem(null);
          }
        }}
        onSave={handleSaveItem}
        initialData={editingItem}
        outlets={outlets}
        defaultOutletId={Number(inventoryScope) || (warehouseOutletId || 4)}
        loading={modalLoading}
      />

      <ConfirmationModal
        isOpen={Boolean(itemToDelete)}
        onClose={() => !modalLoading && setItemToDelete(null)}
        onConfirm={handleConfirmDeleteItem}
        title="Delete Stock Item"
        message={`Are you sure you want to remove "${itemToDelete?.ingredientName || itemToDelete?.name || 'this item'}" from inventory? This action will permanently remove the item and its movement records.`}
        confirmText="Delete Material"
        variant="danger"
        loading={modalLoading}
      />

      <EditKitchenRequestModal
        isOpen={Boolean(editingKitchenRequest)}
        onClose={() => !modalLoading && setEditingKitchenRequest(null)}
        request={editingKitchenRequest}
        loading={modalLoading}
        onSave={handleSaveEditKitchenRequest}
      />

      <ConfirmationModal
        isOpen={Boolean(kitchenRequestToDelete)}
        onClose={() => !modalLoading && setKitchenRequestToDelete(null)}
        onConfirm={handleConfirmDeleteKitchenRequest}
        title="Delete Stock Requisition"
        message={`Are you sure you want to delete the requisition for "${kitchenRequestToDelete?.itemName || kitchenRequestToDelete?.ingredientName || 'this item'}" (${kitchenRequestToDelete?.requestedQuantity || kitchenRequestToDelete?.quantity || 0} ${kitchenRequestToDelete?.unit || 'units'})? This action cannot be undone.`}
        confirmText="Delete Requisition"
        variant="danger"
        loading={modalLoading}
      />
    </div>
  );
};

export default InventoryPage;
