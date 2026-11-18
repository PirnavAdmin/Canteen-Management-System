import React, { useState, useMemo, useEffect } from 'react';
import { RefreshCw, UtensilsCrossed, Clock } from 'lucide-react';
import { PageHeader } from '../../../../components/common/PageHeader';
import { Button } from '../../../../components/common/Button';
import { Pagination } from '../../../../components/common/Pagination';
import { useOrders } from '../hooks/useOrders';
import { OrderFilters } from '../components/OrderFilters';
import { OrderTable } from '../components/OrderTable';
import { OrderDetailsModal } from '../components/OrderDetailsModal';
import { CancelOrderModal } from '../components/CancelOrderModal';
import { PlaceOrderCatalog } from '../components/PlaceOrderCatalog';
import { useCanteens } from '../../outlets/hooks/useCanteens';

export const OrderListPage = () => {
  const {
    orders,
    loading,
    updateOrderStatus,
    cancelOrder,
    processRefund,
    refreshOrders
  } = useOrders();

  const { selectedOutlet: globalOutlet, setSelectedOutlet: setGlobalOutlet } = useCanteens();

  // Navigation tab: 'PLACE_ORDER' | 'TODAYS_ORDERS'
  const [activeTab, setActiveTab] = useState('PLACE_ORDER');

  // Filters state for Today's Orders (syncs with global navbar outlet)
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedPayment, setSelectedPayment] = useState('ALL');
  const [selectedOutlet, setSelectedOutlet] = useState(globalOutlet || 'ALL');

  useEffect(() => {
    setSelectedOutlet(globalOutlet || 'ALL');
  }, [globalOutlet]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  // Modals & action loading state
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderToCancel, setOrderToCancel] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const matchesToken = order.token?.toLowerCase().includes(q);
        const matchesId = order.id?.toLowerCase().includes(q);
        const matchesCustomer = order.customer?.name?.toLowerCase().includes(q);
        const matchesRoll = order.customer?.rollNo?.toLowerCase().includes(q);
        if (!matchesToken && !matchesId && !matchesCustomer && !matchesRoll) return false;
      }
      if (selectedStatus !== 'ALL' && order.status !== selectedStatus) return false;
      if (selectedPayment !== 'ALL' && order.payment?.status !== selectedPayment) return false;
      if (selectedOutlet !== 'ALL' && String(order.outletId ?? order.canteenId ?? '') !== String(selectedOutlet)) return false;
      return true;
    });
  }, [orders, searchTerm, selectedStatus, selectedPayment, selectedOutlet]);

  // Paginated records
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredOrders.slice(start, start + pageSize);
  }, [filteredOrders, currentPage, pageSize]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedStatus('ALL');
    setSelectedPayment('ALL');
    setSelectedOutlet('ALL');
    setCurrentPage(1);
  };

  const handleStatusAdvance = async (order, nextStatus) => {
    const orderId = typeof order === 'string' ? order : order.id;
    try {
      setActionLoadingId(orderId);
      setModalLoading(true);
      await updateOrderStatus(orderId, nextStatus);
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(prev => ({ ...prev, status: nextStatus }));
      }
    } finally {
      setActionLoadingId(null);
      setModalLoading(false);
    }
  };

  const handleProcessRefund = async (orderId) => {
    try {
      setModalLoading(true);
      await processRefund(orderId);
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(null);
      }
    } finally {
      setModalLoading(false);
    }
  };

  const handleConfirmCancel = async (orderId, reason) => {
    try {
      setModalLoading(true);
      await cancelOrder(orderId, reason);
    } finally {
      setModalLoading(false);
    }
  };

  const handleOrderPlaced = () => {
    setActiveTab('TODAYS_ORDERS');
    refreshOrders();
  };

  return (
    <div>
      <PageHeader
        title={activeTab === 'PLACE_ORDER' ? 'Admin Food Ordering & Catalog' : 'Order Management & Live Queue'}
        breadcrumbItems={[
          { label: 'Admin' },
          { label: 'Order Management' },
          { label: activeTab === 'PLACE_ORDER' ? 'Place Order' : "Today's Orders" }
        ]}
        actions={
          activeTab === 'TODAYS_ORDERS' ? (
            <Button
              variant="secondary"
              icon={RefreshCw}
              onClick={refreshOrders}
              loading={loading}
            >
              Refresh Orders
            </Button>
          ) : null
        }
      />

      {/* Two-Tab Navigation */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '16px',
          borderBottom: '1px solid var(--border-color)',
          paddingBottom: '12px'
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('PLACE_ORDER')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 18px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            border: activeTab === 'PLACE_ORDER' ? 'none' : '1px solid var(--border-color)',
            backgroundColor: activeTab === 'PLACE_ORDER' ? 'var(--color-primary)' : 'var(--bg-surface)',
            color: activeTab === 'PLACE_ORDER' ? '#ffffff' : 'var(--text-secondary)',
            boxShadow: activeTab === 'PLACE_ORDER' ? 'var(--shadow-xs)' : 'none'
          }}
        >
          <UtensilsCrossed size={16} />
          <span>Place Order</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('TODAYS_ORDERS')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 18px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            border: activeTab === 'TODAYS_ORDERS' ? 'none' : '1px solid var(--border-color)',
            backgroundColor: activeTab === 'TODAYS_ORDERS' ? 'var(--color-primary)' : 'var(--bg-surface)',
            color: activeTab === 'TODAYS_ORDERS' ? '#ffffff' : 'var(--text-secondary)',
            boxShadow: activeTab === 'TODAYS_ORDERS' ? 'var(--shadow-xs)' : 'none'
          }}
        >
          <Clock size={16} />
          <span>Today's Orders</span>
          {orders.length > 0 && (
            <span
              style={{
                padding: '2px 7px',
                borderRadius: '9999px',
                fontSize: '11px',
                fontWeight: 700,
                backgroundColor: activeTab === 'TODAYS_ORDERS' ? 'rgba(255, 255, 255, 0.25)' : 'var(--bg-muted)',
                color: activeTab === 'TODAYS_ORDERS' ? '#ffffff' : 'var(--text-primary)'
              }}
            >
              {orders.length}
            </span>
          )}
        </button>
      </div>

      {/* Tab 1: Place Order Food Catalog */}
      {activeTab === 'PLACE_ORDER' && (
        <PlaceOrderCatalog onOrderPlaced={handleOrderPlaced} />
      )}

      {/* Tab 2: Today's Orders & Live Queue */}
      {activeTab === 'TODAYS_ORDERS' && (
        <>
          {/* Filter Toolbar */}
          <OrderFilters
            searchTerm={searchTerm}
            onSearchChange={(v) => { setSearchTerm(v); setCurrentPage(1); }}
            selectedStatus={selectedStatus}
            onStatusChange={(v) => { setSelectedStatus(v); setCurrentPage(1); }}
            selectedPayment={selectedPayment}
            onPaymentChange={(v) => { setSelectedPayment(v); setCurrentPage(1); }}
            selectedOutlet={selectedOutlet}
            onOutletChange={(v) => { setSelectedOutlet(v); setGlobalOutlet(v); setCurrentPage(1); }}
            onReset={handleResetFilters}
          />

          {/* Order Table */}
          <OrderTable
            orders={paginatedOrders}
            loading={loading}
            actionLoadingId={actionLoadingId}
            onView={(ord) => setSelectedOrder(ord)}
            onAdvanceStatus={handleStatusAdvance}
            footer={
              <Pagination
                currentPage={currentPage}
                totalItems={filteredOrders.length}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={(sz) => { setPageSize(sz); setCurrentPage(1); }}
                pageSizeOptions={[5, 10, 20]}
              />
            }
          />

          {/* Order Details Modal */}
          <OrderDetailsModal
            isOpen={Boolean(selectedOrder)}
            onClose={() => !modalLoading && setSelectedOrder(null)}
            order={selectedOrder}
            loading={modalLoading}
            onUpdateStatus={handleStatusAdvance}
            onOpenCancel={(ord) => setOrderToCancel(ord)}
            onProcessRefund={handleProcessRefund}
          />

          {/* Cancel Order Modal */}
          <CancelOrderModal
            isOpen={Boolean(orderToCancel)}
            onClose={() => !modalLoading && setOrderToCancel(null)}
            order={orderToCancel}
            loading={modalLoading}
            onConfirmCancel={handleConfirmCancel}
          />
        </>
      )}
    </div>
  );
};

export default OrderListPage;