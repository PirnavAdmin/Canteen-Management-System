import React, { useState, useMemo } from 'react';
import { Package, BookOpen, ShoppingCart, Users, PlusCircle, ArrowDownUp, Store } from 'lucide-react';
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
import { canteenService } from '../../outlets/services/canteenService';

export const InventoryPage = () => {
  // Outlet filter state
  const [selectedOutlet, setSelectedOutlet] = useState('ALL');
  const [outlets, setOutlets] = useState([]);

  useEffect(() => {
    let isMounted = true;
    canteenService.getAll()
      .then(data => {
        if (isMounted && Array.isArray(data)) setOutlets(data);
      })
      .catch(err => console.error('Failed to load outlets for inventory:', err));
    return () => { isMounted = false; };
  }, []);

  const {
    items,
    ledger,
    purchaseOrders,
    suppliers,
    loading,
    recordMovement,
    createPO,
    updatePOStatus,
    createSupplier,
    updateSupplier,
    deleteSupplier,
    deactivateSupplier
  } = useInventory(selectedOutlet);

  // Tab state: 'items' | 'ledger' | 'pos' | 'suppliers'
  const [activeTab, setActiveTab] = useState('items');

  // Pagination state (default 5 per page)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, currentPage, pageSize]);

  // Modals & action loading state
  const [movementModal, setMovementModal] = useState({ isOpen: false, item: null, type: 'Stock In' });
  const [isPOModalOpen, setIsPOModalOpen] = useState(false);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [supplierToDelete, setSupplierToDelete] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  const handleOpenMovement = (item, type = 'Stock In') => {
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
                {out.name} {out.location ? `(${out.location})` : ''}
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
          <span>Raw Materials & Stock ({items.length})</span>
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
          <span>Movement Ledger ({ledger.length})</span>
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
          <span>Purchase Orders ({purchaseOrders.length})</span>
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
          <span>Suppliers ({suppliers.length})</span>
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
              pageSizeOptions={[5, 10, 20]}
            />
          }
        />
      )}

      {activeTab === 'ledger' && (
        <StockLedgerTable
          ledger={ledger}
          loading={loading}
        />
      )}

      {activeTab === 'pos' && (
        <PurchaseOrdersTable
          orders={purchaseOrders}
          loading={loading}
          actionLoadingId={actionLoadingId}
          onUpdateStatus={handleUpdatePOStatus}
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

      {/* Modals */}
      <StockMovementModal
        isOpen={movementModal.isOpen}
        onClose={() => !modalLoading && setMovementModal({ isOpen: false, item: null, type: 'Stock In' })}
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
        title="Delete Supplier"
        message={`Are you sure you want to delete "${supplierToDelete?.name || supplierToDelete?.contactPerson || 'this supplier'}"? If linked purchase orders exist, their status will be set to Inactive to preserve audit history.`}
        confirmText="Delete"
        variant="danger"
        loading={modalLoading}
      />
    </div>
  );
};

export default InventoryPage;
