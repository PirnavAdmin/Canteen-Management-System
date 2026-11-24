import React, { useState, useMemo, useEffect } from 'react';
import { Package, BookOpen, ShoppingCart, Users, PlusCircle, ArrowDownUp, Store, ChefHat } from 'lucide-react';
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
import { canteenService } from '../../outlets/services/canteenService';

import { useCanteens } from '../../outlets/hooks/useCanteens';

export const InventoryPage = () => {
  const { canteens: outlets = [], selectedOutlet = 'ALL', setSelectedOutlet } = useCanteens();

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
    markKitchenRequestReceived
  } = useInventory(selectedOutlet);

  const warehouseOutlet = useMemo(() => {
    return outlets.find(o => o.code === 'WH-01' || (o.name || '').toLowerCase().includes('warehouse') || Number(o.outletId || o.id) === 4) || null;
  }, [outlets]);

  const kitchenOutlets = useMemo(() => {
    return outlets.filter(o => o.code !== 'WH-01' && !(o.name || '').toLowerCase().includes('warehouse') && Number(o.outletId || o.id) !== 4);
  }, [outlets]);

  const isWarehouseView = warehouseOutlet && String(selectedOutlet) === String(warehouseOutlet.outletId || warehouseOutlet.id);
  const currentOutletName = outlets.find(o => String(o.outletId || o.id) === String(selectedOutlet))?.name || 'Selected Outlet';

  // Tab state: 'items' | 'ledger' | 'pos' | 'suppliers' | 'kitchen-requests'
  const [activeTab, setActiveTab] = useState('items');

  // Pagination state (default 5 per page) for each tab
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const [ledgerPage, setLedgerPage] = useState(1);
  const [ledgerPageSize, setLedgerPageSize] = useState(5);

  const [posPage, setPosPage] = useState(1);
  const [posPageSize, setPosPageSize] = useState(5);

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, currentPage, pageSize]);

  const paginatedLedger = useMemo(() => {
    const start = (ledgerPage - 1) * ledgerPageSize;
    return ledger.slice(start, start + ledgerPageSize);
  }, [ledger, ledgerPage, ledgerPageSize]);

  const paginatedPOs = useMemo(() => {
    const start = (posPage - 1) * posPageSize;
    return purchaseOrders.slice(start, start + posPageSize);
  }, [purchaseOrders, posPage, posPageSize]);

  // Modals & action loading state
  const [movementModal, setMovementModal] = useState({ isOpen: false, item: null, type: 'Stock Out' });
  const [approveModal, setApproveModal] = useState({ isOpen: false, request: null });
  const [isPOModalOpen, setIsPOModalOpen] = useState(false);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [supplierToDelete, setSupplierToDelete] = useState(null);

  // Main Inventory Item Modals
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);

  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

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
        title="Main Inventory & Stock Management"
        description="Maintain central campus raw materials, stock quantities, reorder thresholds, purchase orders, and supplier relationships."
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
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

            {activeTab === 'pos' && (
              <Button
                variant="primary"
                icon={PlusCircle}
                onClick={() => setIsPOModalOpen(true)}
              >
                Create Purchase Order
              </Button>
            )}

            {activeTab === 'suppliers' && (
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
            value={selectedOutlet}
            onChange={(e) => {
              setSelectedOutlet(e.target.value);
              setCurrentPage(1);
              setLedgerPage(1);
              setPosPage(1);
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
              {warehouseOutlet ? (
                <option value={warehouseOutlet.outletId || warehouseOutlet.id}>
                  📦 Central Warehouse (Admin Master Store)
                </option>
              ) : (
                <option value="4">📦 Central Warehouse (Admin Master Store)</option>
              )}
              <option value="ALL">🌐 Consolidated (All Outlets & Central Warehouse)</option>
            </optgroup>
            <optgroup label="🍳 Campus Kitchen Outlets">
              {kitchenOutlets.map(out => (
                <option key={out.outletId || out.id} value={out.outletId || out.id}>
                  🍽️ {out.name} (Kitchen Inventory)
                </option>
              ))}
            </optgroup>
          </select>
        </div>

        <div style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isWarehouseView ? (
            <span style={{
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              color: '#2563eb',
              padding: '5px 12px',
              borderRadius: '6px',
              fontWeight: 600,
              fontSize: '12px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <span>📦 <strong>Admin Central Warehouse</strong> • Bulk procurement & supplier replenishment (Dispatches to kitchens)</span>
            </span>
          ) : selectedOutlet === 'ALL' ? (
            <span style={{
              backgroundColor: 'rgba(107, 114, 128, 0.1)',
              color: 'var(--text-secondary)',
              padding: '5px 12px',
              borderRadius: '6px',
              fontWeight: 500,
              fontSize: '12px'
            }}>
              🏢 Consolidated stock across <strong>all {outlets.length} campus locations</strong>
            </span>
          ) : (
            <span style={{
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              color: '#059669',
              padding: '5px 12px',
              borderRadius: '6px',
              fontWeight: 600,
              fontSize: '12px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <span>🍳 <strong>{currentOutletName} Kitchen</strong> • Local cooking stock (Requests stock from Central Warehouse)</span>
            </span>
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
              totalItems={items.length}
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
              totalItems={ledger.length}
              pageSize={ledgerPageSize}
              onPageChange={setLedgerPage}
              onPageSizeChange={(sz) => { setLedgerPageSize(sz); setLedgerPage(1); }}
              pageSizeOptions={[5, 10, 15, 20]}
            />
          }
        />
      )}

      {activeTab === 'pos' && (
        <PurchaseOrdersTable
          orders={paginatedPOs}
          loading={loading}
          actionLoadingId={actionLoadingId}
          onUpdateStatus={handleUpdatePOStatus}
          footer={
            <Pagination
              currentPage={posPage}
              totalItems={purchaseOrders.length}
              pageSize={posPageSize}
              onPageChange={setPosPage}
              onPageSizeChange={(sz) => { setPosPageSize(sz); setPosPage(1); }}
              pageSizeOptions={[5, 10, 15, 20]}
            />
          }
        />
      )}

      {activeTab === 'suppliers' && (
        <SuppliersTable
          suppliers={suppliers}
          loading={loading}
          onEdit={handleOpenEditSupplier}
          onDelete={handleDeleteSupplier}
          onDeactivate={(supplier) => deactivateSupplier(supplier.id)}
        />
      )}

      {activeTab === 'kitchen-requests' && (
        <KitchenRequestsTable
          requests={kitchenRequests}
          loading={loading}
          onOpenApprove={(req) => setApproveModal({ isOpen: true, request: req })}
          onMarkReceived={markKitchenRequestReceived}
        />
      )}

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
        defaultOutletId={selectedOutlet !== 'ALL' ? Number(selectedOutlet) : (outlets[0]?.outletId || outlets[0]?.id || 1)}
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
    </div>
  );
};

export default InventoryPage;
