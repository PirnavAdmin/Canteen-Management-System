import React, { useState, useMemo } from 'react';
import { Package, BookOpen, ShoppingCart, Users, PlusCircle, ArrowDownUp } from 'lucide-react';
import { PageHeader } from '../../../../components/common/PageHeader';
import { Button } from '../../../../components/common/Button';
import { Pagination } from '../../../../components/common/Pagination';
import { useInventory } from '../hooks/useInventory';
import { StockTable } from '../components/StockTable';
import { StockMovementModal } from '../components/StockMovementModal';
import { StockLedgerTable } from '../components/StockLedgerTable';
import { PurchaseOrdersTable } from '../components/PurchaseOrdersTable';
import { PurchaseOrderModal } from '../components/PurchaseOrderModal';
import { SuppliersTable } from '../components/SuppliersTable';
import { SupplierModal } from '../components/SupplierModal';

export const InventoryPage = () => {
  const {
    items,
    ledger,
    purchaseOrders,
    suppliers,
    loading,
    recordMovement,
    createPO,
    updatePOStatus,
    createSupplier
  } = useInventory();

  // Tab state: 'items' | 'ledger' | 'pos' | 'suppliers'
  const [activeTab, setActiveTab] = useState('items');

  // Pagination state (default 5 per page)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, currentPage, pageSize]);

  // Modals state
  const [movementModal, setMovementModal] = useState({ isOpen: false, item: null, type: 'Stock In' });
  const [isPOModalOpen, setIsPOModalOpen] = useState(false);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);

  const handleOpenMovement = (item, type = 'Stock In') => {
    setMovementModal({ isOpen: true, item, type });
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
                onClick={() => setIsSupplierModalOpen(true)}
              >
                Register Supplier
              </Button>
            )}
          </div>
        }
      />

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
          onUpdateStatus={updatePOStatus}
        />
      )}

      {activeTab === 'suppliers' && (
        <SuppliersTable
          suppliers={suppliers}
          loading={loading}
        />
      )}

      {/* Modals */}
      <StockMovementModal
        isOpen={movementModal.isOpen}
        onClose={() => setMovementModal({ isOpen: false, item: null, type: 'Stock In' })}
        item={movementModal.item}
        defaultType={movementModal.type}
        onRecordMovement={recordMovement}
      />

      <PurchaseOrderModal
        isOpen={isPOModalOpen}
        onClose={() => setIsPOModalOpen(false)}
        suppliers={suppliers}
        onCreatePO={createPO}
      />

      <SupplierModal
        isOpen={isSupplierModalOpen}
        onClose={() => setIsSupplierModalOpen(false)}
        onAddSupplier={createSupplier}
      />
    </div>
  );
};

export default InventoryPage;
