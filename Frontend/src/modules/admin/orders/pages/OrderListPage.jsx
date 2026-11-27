import React, { useState, useMemo, useEffect } from 'react';
import { RefreshCw, UtensilsCrossed, Clock, Printer, ShoppingBag } from 'lucide-react';
import { PageHeader } from '../../../../components/common/PageHeader';
import { Button } from '../../../../components/common/Button';
import { Pagination } from '../../../../components/common/Pagination';
import { useOrders } from '../hooks/useOrders';
import { OrderFilters } from '../components/OrderFilters';
import { OrderTable } from '../components/OrderTable';
import { OrderDetailsModal } from '../components/OrderDetailsModal';
import { CancelOrderModal } from '../components/CancelOrderModal';
import { OrderReceiptModal } from '../components/OrderReceiptModal';
import { OrdersA4SheetModal } from '../components/OrdersA4SheetModal';
import { PlaceOrderCatalog } from '../components/PlaceOrderCatalog';
import { useCanteens } from '../../outlets/hooks/useCanteens';
import { useAuth } from '../../../../app/providers/AuthProvider';
import { orderService } from '../services/orderService';
import { isSameIstDate, isYesterdayIST, isWithinDaysIST } from '../../../../utils/formatters';

export const OrderListPage = ({ cashierMode = false }) => {
  const { user } = useAuth();
  const {
    orders,
    loading,
    updateOrderStatus,
    cancelOrder,
    processRefund,
    refreshOrders
  } = useOrders({ localDemoMode: cashierMode });

  const { selectedOutlet: globalOutlet, setSelectedOutlet: setGlobalOutlet } = useCanteens();

  // Navigation tab: 'PLACE_ORDER' | 'TODAYS_ORDERS'
  const [activeTab, setActiveTab] = useState('PLACE_ORDER');

  // Filters state for Today's Orders (syncs with global navbar outlet)
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState('TODAY');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedPayment, setSelectedPayment] = useState('ALL');
  const [selectedOutlet, setSelectedOutlet] = useState(cashierMode && user?.outletId ? String(user.outletId) : (globalOutlet || 'ALL'));

  useEffect(() => {
    if (cashierMode && user?.outletId) {
      setSelectedOutlet(String(user.outletId));
    } else {
      setSelectedOutlet(globalOutlet || 'ALL');
    }
  }, [globalOutlet, cashierMode, user?.outletId]);

  // Cart state shared with PlaceOrderCatalog
  const [catalogCart, setCatalogCart] = useState({});
  const [isCatalogCartOpen, setIsCatalogCartOpen] = useState(false);
  const totalCartCount = useMemo(() => {
    return Object.values(catalogCart).reduce((acc, entry) => acc + (entry?.quantity || 0), 0);
  }, [catalogCart]);

  // Count of orders specifically placed today in IST
  const todaysOrdersCount = useMemo(() => {
    return orders.filter(o => isSameIstDate(o.orderDate || o.createdAt)).length;
  }, [orders]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  // Modals & action loading state
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderToCancel, setOrderToCancel] = useState(null);
  const [orderForReceipt, setOrderForReceipt] = useState(null);
  const [isA4SheetOpen, setIsA4SheetOpen] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // Date filter (IST)
      const ordDate = order.orderDate || order.createdAt;
      if (selectedDate === 'TODAY' && !isSameIstDate(ordDate)) return false;
      if (selectedDate === 'YESTERDAY' && !isYesterdayIST(ordDate)) return false;
      if (selectedDate === 'LAST_7_DAYS' && !isWithinDaysIST(ordDate, 7)) return false;

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
  }, [orders, selectedDate, searchTerm, selectedStatus, selectedPayment, selectedOutlet]);

  // Paginated records
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredOrders.slice(start, start + pageSize);
  }, [filteredOrders, currentPage, pageSize]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedDate('TODAY');
    setSelectedStatus('ALL');
    setSelectedPayment('ALL');
    setSelectedOutlet(cashierMode && user?.outletId ? String(user.outletId) : 'ALL');
    setCurrentPage(1);
  };

  const handleViewOrder = async (ord) => {
    setSelectedOrder(ord);
    try {
      const full = await orderService.getById(ord.id);
      if (full && full.id) {
        setSelectedOrder(prev => (prev && String(prev.id) === String(full.id) ? { ...prev, ...full } : prev));
      }
    } catch {}
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
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(prev => (prev ? { ...prev, status: 'Cancelled', cancellationReason: reason } : null));
      }
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Button
                variant="secondary"
                icon={Printer}
                onClick={() => setIsA4SheetOpen(true)}
                title="Download A4 Sheet configuration of currently filtered orders"
              >
                Download A4 Sheet
              </Button>
              <Button
                variant="secondary"
                icon={RefreshCw}
                onClick={refreshOrders}
                loading={loading}
              >
                Refresh Orders
              </Button>
            </div>
          ) : null
        }
      />

      {/* Two-Tab Navigation */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          marginBottom: '16px',
          borderBottom: '1px solid var(--border-color)',
          paddingBottom: '12px',
          flexWrap: 'wrap'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
            {todaysOrdersCount > 0 && (
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
                {todaysOrdersCount}
              </span>
            )}
          </button>
        </div>

        {/* Cart Trigger Button Aligned in line with Today's Orders on the Right */}
        <button
          type="button"
          onClick={() => {
            if (activeTab !== 'PLACE_ORDER') setActiveTab('PLACE_ORDER');
            setIsCatalogCartOpen(true);
          }}
          style={{
            height: '36px',
            padding: '0 16px',
            borderRadius: '8px',
            backgroundColor: totalCartCount > 0 ? 'var(--color-primary)' : 'var(--bg-surface)',
            color: totalCartCount > 0 ? '#ffffff' : 'var(--text-primary)',
            border: totalCartCount > 0 ? 'none' : '1px solid var(--border-color)',
            fontWeight: 600,
            fontSize: '13px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            boxShadow: totalCartCount > 0 ? '0 2px 6px rgba(30, 58, 138, 0.25)' : 'none',
            transition: 'all 0.15s ease'
          }}
        >
          <ShoppingBag size={16} />
          <span>Cart</span>
          {totalCartCount > 0 && (
            <span
              style={{
                backgroundColor: '#f59e0b',
                color: '#ffffff',
                padding: '1px 6px',
                borderRadius: '9999px',
                fontSize: '11px',
                fontWeight: 700
              }}
            >
              {totalCartCount}
            </span>
          )}
        </button>
      </div>

      {/* Tab 1: Place Order Food Catalog */}
      {activeTab === 'PLACE_ORDER' && (
        <PlaceOrderCatalog
          onOrderPlaced={handleOrderPlaced}
          cashierMode={cashierMode}
          cart={catalogCart}
          setCart={setCatalogCart}
          isCartOpen={isCatalogCartOpen}
          setIsCartOpen={setIsCatalogCartOpen}
        />
      )}

      {/* Tab 2: Today's Orders & Live Queue */}
      {activeTab === 'TODAYS_ORDERS' && (
        <>
          {/* Filter Toolbar */}
          <OrderFilters
            searchTerm={searchTerm}
            onSearchChange={(v) => { setSearchTerm(v); setCurrentPage(1); }}
            selectedDate={selectedDate}
            onDateChange={(v) => { setSelectedDate(v); setCurrentPage(1); }}
            selectedStatus={selectedStatus}
            onStatusChange={(v) => { setSelectedStatus(v); setCurrentPage(1); }}
            selectedPayment={selectedPayment}
            onPaymentChange={(v) => { setSelectedPayment(v); setCurrentPage(1); }}
            selectedOutlet={selectedOutlet}
            onOutletChange={(v) => { setSelectedOutlet(v); setGlobalOutlet(v); setCurrentPage(1); }}
            onReset={handleResetFilters}
            hideOutlet={cashierMode}
          />

          {/* Order Table */}
          <OrderTable
            orders={paginatedOrders}
            loading={loading}
            actionLoadingId={actionLoadingId}
            onView={handleViewOrder}
            onAdvanceStatus={handleStatusAdvance}
            onCancel={(ord) => setOrderToCancel(ord)}
            onPrintReceipt={(ord) => setOrderForReceipt(ord)}
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

          {/* Order Receipt Preview Modal (Thermal / A4) */}
          <OrderReceiptModal
            isOpen={Boolean(orderForReceipt)}
            onClose={() => setOrderForReceipt(null)}
            order={orderForReceipt}
          />

          {/* Global A4 Sheet Configuration & Download Modal */}
          <OrdersA4SheetModal
            isOpen={isA4SheetOpen}
            onClose={() => setIsA4SheetOpen(false)}
            orders={filteredOrders}
            activeFilters={{
              date: selectedDate,
              outlet: selectedOutlet,
              status: selectedStatus,
              payment: selectedPayment,
              search: searchTerm
            }}
          />
        </>
      )}
    </div>
  );
};

export default OrderListPage;
