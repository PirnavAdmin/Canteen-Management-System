import React, { useState, useMemo } from 'react';
import { RefreshCw } from 'lucide-react';
import { PageHeader } from '../../../../components/common/PageHeader';
import { Button } from '../../../../components/common/Button';
import { Pagination } from '../../../../components/common/Pagination';
import { useOrders } from '../hooks/useOrders';
import { OrderFilters } from '../components/OrderFilters';
import { OrderTable } from '../components/OrderTable';
import { OrderDetailsModal } from '../components/OrderDetailsModal';
import { CancelOrderModal } from '../components/CancelOrderModal';

export const OrderListPage = () => {
  const {
    orders,
    loading,
    updateOrderStatus,
    cancelOrder,
    processRefund,
    refreshOrders
  } = useOrders();

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedPayment, setSelectedPayment] = useState('ALL');
  const [selectedOutlet, setSelectedOutlet] = useState('ALL');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  // Modals state
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderToCancel, setOrderToCancel] = useState(null);

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
      if (selectedOutlet !== 'ALL' && order.outletId !== selectedOutlet) return false;
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
    await updateOrderStatus(order.id, nextStatus);
    if (selectedOrder && selectedOrder.id === order.id) {
      setSelectedOrder(prev => ({ ...prev, status: nextStatus }));
    }
  };

  const handleProcessRefund = async (orderId) => {
    await processRefund(orderId);
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder(null);
    }
  };

  return (
    <div>
      <PageHeader
        title="Order Management & Live Queue"
        description="Monitor real-time student and faculty orders, transition kitchen milestones, manage token pickups, and handle cancellations or refunds."
        breadcrumbItems={[
          { label: 'Admin' },
          { label: 'Order Management' }
        ]}
        actions={
          <Button
            variant="secondary"
            icon={RefreshCw}
            onClick={refreshOrders}
            loading={loading}
          >
            Refresh Orders
          </Button>
        }
      />

      {/* Filter Toolbar */}
      <OrderFilters
        searchTerm={searchTerm}
        onSearchChange={(v) => { setSearchTerm(v); setCurrentPage(1); }}
        selectedStatus={selectedStatus}
        onStatusChange={(v) => { setSelectedStatus(v); setCurrentPage(1); }}
        selectedPayment={selectedPayment}
        onPaymentChange={(v) => { setSelectedPayment(v); setCurrentPage(1); }}
        selectedOutlet={selectedOutlet}
        onOutletChange={(v) => { setSelectedOutlet(v); setCurrentPage(1); }}
        onReset={handleResetFilters}
      />

      {/* Order Table */}
      <OrderTable
        orders={paginatedOrders}
        loading={loading}
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
        onClose={() => setSelectedOrder(null)}
        order={selectedOrder}
        onUpdateStatus={handleStatusAdvance}
        onOpenCancel={(ord) => setOrderToCancel(ord)}
        onProcessRefund={handleProcessRefund}
      />

      {/* Cancel Order Modal */}
      <CancelOrderModal
        isOpen={Boolean(orderToCancel)}
        onClose={() => setOrderToCancel(null)}
        order={orderToCancel}
        onConfirmCancel={cancelOrder}
      />
    </div>
  );
};

export default OrderListPage;
