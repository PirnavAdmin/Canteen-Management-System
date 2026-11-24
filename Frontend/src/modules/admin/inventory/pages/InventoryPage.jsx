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
import { KitchenRequestsTable } from '../components/KitchenRequestsTable';
import { ApproveKitchenRequestModal } from '../components/ApproveKitchenRequestModal';
import { canteenService } from '../../outlets/services/canteenService';

import { useCanteens } from '../../outlets/hooks/useCanteens';

export const InventoryPage = () => {
  const { canteens: outlets = [], selectedOutlet = 'ALL', setSelectedOutlet } = useCanteens();

  const {
    items,
    ledger,
    purchaseOrders,
    suppliers,
    kitchenRequests = [],
    loading,
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
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

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
        title="Kitchen Inventory & Stock Ledger"
        description="Trace raw ingredient inflows, issues, spoilage wastage, purchase orders, and supplier relationships with institutional ledger compliance."
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
            {activeTab === 'items' && items.length > 0 && (
              <Button
                variant="primary"
                icon={ArrowDownUp}
                onClick={() => handleOpenMovement(items[0], 'Stock In')}
              >
                Log Movement
              </Button>
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
        padding: '10px 16px',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        boxShadow: 'var(--shadow-xs)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Store size={18} style={{ color: 'var(--color-primary)' }} />
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
            Dining Outlet Filter:
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
              height: '36px',
              padding: '0 12px',
              fontSize: '13px',
              fontWeight: 500,
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--border-radius-md)',
              backgroundColor: 'var(--bg-app)',
              color: 'var(--text-primary)',
              minWidth: '220px',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            <option value="ALL">All Campus Outlets (Consolidated)</option>
            {outlets.map(out => (
              <option key={out.outletId || out.id} value={out.outletId || out.id}>
                {out.name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
          {selectedOutlet === 'ALL' ? (
            <span>Showing consolidated inventory across <strong>all {outlets.length || 'campus'} outlets</strong></span>
          ) : (
            <span>Filtered for <strong>{outlets.find(o => String(o.outletId || o.id) === String(selectedOutlet))?.name || 'Selected Outlet'}</strong></span>
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
        rawMaterials={items}
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
    </div>
  );
};

export default InventoryPage;
