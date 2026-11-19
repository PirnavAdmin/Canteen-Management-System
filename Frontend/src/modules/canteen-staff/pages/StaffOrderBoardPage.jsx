import React, { useState, useMemo } from 'react';
import {
  Search,
  RefreshCw,
  ShoppingBag,
  Clock,
  ChefHat,
  BellRing,
  CheckCheck,
  X,
  Store,
  Calendar,
  RotateCcw,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useStaffOrders } from '../hooks/useStaffOrders';
import { STAFF_APP_CONFIG } from '../constants/staffNavigation';
import { ORDER_STATUS } from '../../../constants/appConstants';
import { PageHeader } from '../../../components/common/PageHeader';
import { Button } from '../../../components/common/Button';
import { Pagination } from '../../../components/common/Pagination';
import { StaffOrderTable } from '../components/StaffOrderTable';
import { StaffOrderDetailsModal } from '../components/StaffOrderDetailsModal';
import { StaffOrderStatusModal } from '../components/StaffOrderStatusModal';
import { StaffVerifyPickupModal } from '../components/StaffVerifyPickupModal';

export const StaffOrderBoardPage = () => {
  const {
    orders,
    loading,
    refreshOrders,
    advanceOrderStatus,
    acceptOrder,
    startPreparation,
    markReadyForPickup,
    rejectOrder
  } = useStaffOrders();

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('ALL'); // 'ALL' | 'TODAY' | 'WEEK' | 'MONTH'
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [orderTypeFilter, setOrderTypeFilter] = useState('ALL');

  // Pagination State (10 records per page default)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Action Loading & Notifications
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [notification, setNotification] = useState(null);

  // Modal States
  const [selectedOrderForView, setSelectedOrderForView] = useState(null);
  const [selectedOrderForEdit, setSelectedOrderForEdit] = useState(null);
  const [selectedOrderForVerify, setSelectedOrderForVerify] = useState(null);
  const [rejectModalOrder, setRejectModalOrder] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const showNotification = (type, title, message) => {
    setNotification({ type, title, message });
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  // 1. Calculate Exact Summary Metrics from backend order records
  const summaryMetrics = useMemo(() => {
    const total = orders.length;
    const newOrders = orders.filter(o => o.status === ORDER_STATUS.PLACED).length;
    const accepted = orders.filter(o => o.status === ORDER_STATUS.ACCEPTED).length;
    const preparing = orders.filter(o => o.status === ORDER_STATUS.PREPARING).length;
    const ready = orders.filter(
      o => o.status === ORDER_STATUS.READY_FOR_PICKUP || o.status === 'Ready for Pickup'
    ).length;
    const completed = orders.filter(o => o.status === ORDER_STATUS.COMPLETED).length;

    return { total, newOrders, accepted, preparing, ready, completed };
  }, [orders]);

  // 2. Filter Orders based on Search & Toolbar controls
  const filteredOrders = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const sevenDaysAgo = startOfToday - 7 * 24 * 60 * 60 * 1000;
    const thirtyDaysAgo = startOfToday - 30 * 24 * 60 * 60 * 1000;

    return orders.filter(order => {
      // Search matching (Order ID or Token)
      const q = searchQuery.trim().toLowerCase();
      if (q) {
        const id = String(order.id || '').toLowerCase();
        const token = String(order.token || '').toLowerCase();

        const matchesSearch = id.includes(q) || token.includes(q);
        if (!matchesSearch) return false;
      }

      // Date Range Filter
      if (dateFilter !== 'ALL') {
        const orderDateVal = order.orderDate || order.createdAt;
        if (!orderDateVal) return false;
        const time = new Date(orderDateVal).getTime();
        if (isNaN(time)) return false;

        if (dateFilter === 'TODAY' && time < startOfToday) return false;
        if (dateFilter === 'WEEK' && time < sevenDaysAgo) return false;
        if (dateFilter === 'MONTH' && time < thirtyDaysAgo) return false;
      }

      // Order Status Filter
      if (statusFilter !== 'ALL') {
        const normSt = String(order.status || '').toLowerCase();
        const targetSt = String(statusFilter).toLowerCase();
        if (targetSt === 'ready for pickup') {
          if (!normSt.includes('ready')) return false;
        } else if (normSt !== targetSt) {
          return false;
        }
      }

      // Order Type Filter
      if (orderTypeFilter !== 'ALL') {
        const type = String(order.orderType || order.type || 'Pickup').toLowerCase();
        if (!type.includes(String(orderTypeFilter).toLowerCase())) {
          return false;
        }
      }

      return true;
    });
  }, [orders, searchQuery, dateFilter, statusFilter, orderTypeFilter]);

  // 3. Paginated Data Slice
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredOrders.slice(start, start + pageSize);
  }, [filteredOrders, currentPage, pageSize]);

  // Reset page when any filter changes
  const handleFilterChange = (setter, val) => {
    setter(val);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setDateFilter('ALL');
    setStatusFilter('ALL');
    setOrderTypeFilter('ALL');
    setCurrentPage(1);
  };

  const hasActiveFilters = Boolean(
    searchQuery ||
    dateFilter !== 'ALL' ||
    statusFilter !== 'ALL' ||
    orderTypeFilter !== 'ALL'
  );

  // Status Lifecycle Action Handlers
  const handleAcceptOrder = async (orderId) => {
    try {
      setActionLoadingId(orderId);
      const updated = await acceptOrder(orderId);
      showNotification('success', 'Order Accepted & Sent to Kitchen', `Order #${updated.token || orderId} is now Preparing and queued in Kitchen Display.`);
      if (selectedOrderForView && String(selectedOrderForView.id) === String(orderId)) {
        setSelectedOrderForView(updated);
      }
    } catch (err) {
      showNotification('error', 'Acceptance Failed', err.message || 'Failed to accept order.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleStartCooking = async (orderId) => {
    try {
      setActionLoadingId(orderId);
      const updated = await startPreparation(orderId);
      showNotification('success', 'Cooking Started', `Order #${updated.token || orderId} moved to Preparing. Visible in Kitchen Display.`);
      if (selectedOrderForView && String(selectedOrderForView.id) === String(orderId)) {
        setSelectedOrderForView(updated);
      }
    } catch (err) {
      showNotification('error', 'Preparation Error', err.message || 'Failed to start cooking.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleMarkReady = async (orderId) => {
    try {
      setActionLoadingId(orderId);
      const updated = await markReadyForPickup(orderId);
      showNotification('success', 'Marked Ready', `Order #${updated.token || orderId} is plated and waiting for counter pickup.`);
      if (selectedOrderForView && String(selectedOrderForView.id) === String(orderId)) {
        setSelectedOrderForView(updated);
      }
    } catch (err) {
      showNotification('error', 'Action Error', err.message || 'Failed to mark order ready.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleOpenVerifyModal = (order) => {
    setSelectedOrderForVerify(order);
  };

  const handleVerifySuccess = (updatedOrder) => {
    showNotification('success', 'Pickup Verified', `Token #${updatedOrder.token || updatedOrder.id} successfully verified and completed.`);
    refreshOrders();
    if (selectedOrderForView && String(selectedOrderForView.id) === String(updatedOrder.id)) {
      setSelectedOrderForView(updatedOrder);
    }
  };

  const handleOpenReject = (order) => {
    setRejectModalOrder(order);
    setRejectReason('');
  };

  const handleConfirmReject = async () => {
    if (!rejectModalOrder) return;
    try {
      setActionLoadingId(rejectModalOrder.id);
      const updated = await rejectOrder(rejectModalOrder.id, rejectReason || 'Kitchen unavailable');
      showNotification('success', 'Order Rejected', `Order #${rejectModalOrder.token || rejectModalOrder.id} has been cancelled.`);
      setRejectModalOrder(null);
      setRejectReason('');
      if (selectedOrderForView && String(selectedOrderForView.id) === String(rejectModalOrder.id)) {
        setSelectedOrderForView(updated);
      }
    } catch (err) {
      showNotification('error', 'Rejection Error', err.message || 'Failed to reject order.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleUpdateStatusConfirm = async (orderId, newStatus, note) => {
    try {
      setActionLoadingId(orderId);
      const updated = await advanceOrderStatus(orderId, newStatus, note);
      showNotification('success', 'Status Updated', `Order #${updated.token || orderId} updated to ${newStatus}.`);
      if (selectedOrderForView && String(selectedOrderForView.id) === String(orderId)) {
        setSelectedOrderForView(updated);
      }
    } catch (err) {
      showNotification('error', 'Update Failed', err.message || 'Failed to update order status.');
      throw err;
    } finally {
      setActionLoadingId(null);
    }
  };

  // Current Date display
  const todayDateString = new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* 1. Page Header */}
      <PageHeader
        title="Order Management"
        description="View and manage all canteen orders."
        badge={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '3px 10px',
              borderRadius: '9999px',
              backgroundColor: 'var(--color-primary-light)',
              color: 'var(--color-primary)',
              fontSize: '12px',
              fontWeight: 600,
              border: '1px solid var(--border-color)'
            }}>
              <Store size={12} />
              {STAFF_APP_CONFIG.canteenOutlet} • {STAFF_APP_CONFIG.campusName}
            </span>

            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 10px',
              borderRadius: '9999px',
              backgroundColor: 'var(--bg-surface)',
              color: 'var(--text-secondary)',
              fontSize: '11.5px',
              fontWeight: 500,
              border: '1px solid var(--border-color)'
            }}>
              <Calendar size={12} />
              {todayDateString}
            </span>
          </div>
        }
        actions={
          <Button
            variant="secondary"
            icon={RefreshCw}
            onClick={refreshOrders}
            loading={loading}
          >
            Refresh
          </Button>
        }
      />

      {/* Floating Status Notification Toast */}
      {notification && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 18px',
          borderRadius: 'var(--border-radius-md)',
          backgroundColor: notification.type === 'success' ? 'var(--color-success-bg)' : 'var(--color-danger-bg)',
          color: notification.type === 'success' ? 'var(--color-success)' : 'var(--color-danger)',
          border: `1px solid ${notification.type === 'success' ? 'var(--color-success-border)' : 'var(--color-danger-border)'}`,
          boxShadow: 'var(--shadow-sm)',
          fontSize: '13px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {notification.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <div>
              <strong>{notification.title}: </strong>
              <span>{notification.message}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0 }}
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* 2. Compact Summary Cards (5 Useful Cards) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '12px'
      }}>
        {/* Total Orders */}
        <div style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--border-radius-lg)',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          boxShadow: 'var(--shadow-xs)'
        }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '8px',
            backgroundColor: '#eff6ff',
            color: '#2563eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <ShoppingBag size={18} />
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Total Orders
            </div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2 }}>
              {summaryMetrics.total}
            </div>
          </div>
        </div>

        {/* New Orders */}
        <div style={{
          backgroundColor: 'var(--bg-surface)',
          border: summaryMetrics.newOrders > 0 ? '1.5px solid #fde68a' : '1px solid var(--border-color)',
          borderRadius: 'var(--border-radius-lg)',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          boxShadow: 'var(--shadow-xs)'
        }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '8px',
            backgroundColor: '#fffbeb',
            color: '#d97706',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Clock size={18} />
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              New Orders
            </div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#d97706', lineHeight: 1.2 }}>
              {summaryMetrics.newOrders}
            </div>
          </div>
        </div>

        {/* Preparing Orders */}
        <div style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--border-radius-lg)',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          boxShadow: 'var(--shadow-xs)'
        }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '8px',
            backgroundColor: '#f5f3ff',
            color: '#8b5cf6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <ChefHat size={18} />
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Preparing
            </div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#8b5cf6', lineHeight: 1.2 }}>
              {summaryMetrics.preparing}
            </div>
          </div>
        </div>

        {/* Ready for Pickup */}
        <div style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--border-radius-lg)',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          boxShadow: 'var(--shadow-xs)'
        }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '8px',
            backgroundColor: '#ecfdf5',
            color: '#059669',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <BellRing size={18} />
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Ready for Pickup
            </div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#059669', lineHeight: 1.2 }}>
              {summaryMetrics.ready}
            </div>
          </div>
        </div>

        {/* Completed Orders */}
        <div style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--border-radius-lg)',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          boxShadow: 'var(--shadow-xs)'
        }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '8px',
            backgroundColor: '#ecfdf5',
            color: '#10b981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <CheckCheck size={18} />
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Completed
            </div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#10b981', lineHeight: 1.2 }}>
              {summaryMetrics.completed}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Search & Filter Toolbar */}
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--border-radius-lg)',
        padding: '14px 16px',
        boxShadow: 'var(--shadow-xs)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        {/* Top Line: Search Bar + Refresh */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          flexWrap: 'wrap'
        }}>
          {/* Search Input */}
          <div style={{
            flex: '1 1 300px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'var(--bg-app)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--border-radius-md)',
            padding: '0 12px',
            height: '38px'
          }}>
            <Search size={16} style={{ color: 'var(--text-placeholder)' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleFilterChange(setSearchQuery, e.target.value)}
              placeholder="Search by Order ID or Token (e.g. T-301, ORD-8401)..."
              style={{
                width: '100%',
                border: 'none',
                backgroundColor: 'transparent',
                color: 'var(--text-primary)',
                fontSize: '12.5px',
                outline: 'none'
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => handleFilterChange(setSearchQuery, '')}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Result Count and Clear Filters */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Showing <strong>{filteredOrders.length}</strong> of {orders.length} orders
            </span>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-app)',
                  color: 'var(--text-secondary)',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <RotateCcw size={12} />
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Filter Dropdowns Line – 3 Necessary Operational Filters */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px'
        }}>
          {/* Date Filter */}
          <div>
            <label style={{ display: 'block', fontSize: '10.5px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '3px' }}>
              Date Range
            </label>
            <select
              value={dateFilter}
              onChange={(e) => handleFilterChange(setDateFilter, e.target.value)}
              style={{
                width: '100%',
                height: '34px',
                padding: '0 8px',
                fontSize: '12px',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-app)',
                color: 'var(--text-primary)',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="ALL">All Dates</option>
              <option value="TODAY">Today</option>
              <option value="WEEK">This Week (7 days)</option>
              <option value="MONTH">This Month (30 days)</option>
            </select>
          </div>

          {/* Order Status Filter */}
          <div>
            <label style={{ display: 'block', fontSize: '10.5px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '3px' }}>
              Order Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => handleFilterChange(setStatusFilter, e.target.value)}
              style={{
                width: '100%',
                height: '34px',
                padding: '0 8px',
                fontSize: '12px',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-app)',
                color: 'var(--text-primary)',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="ALL">All Order Statuses</option>
              <option value={ORDER_STATUS.PLACED}>Placed (New)</option>
              <option value={ORDER_STATUS.ACCEPTED}>Accepted</option>
              <option value={ORDER_STATUS.PREPARING}>Preparing</option>
              <option value={ORDER_STATUS.READY_FOR_PICKUP}>Ready for Pickup</option>
              <option value={ORDER_STATUS.COMPLETED}>Completed</option>
              <option value={ORDER_STATUS.CANCELLED}>Cancelled</option>
            </select>
          </div>

          {/* Order Type Filter */}
          <div>
            <label style={{ display: 'block', fontSize: '10.5px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '3px' }}>
              Order Type
            </label>
            <select
              value={orderTypeFilter}
              onChange={(e) => handleFilterChange(setOrderTypeFilter, e.target.value)}
              style={{
                width: '100%',
                height: '34px',
                padding: '0 8px',
                fontSize: '12px',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-app)',
                color: 'var(--text-primary)',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="ALL">All Order Types</option>
              <option value="Pickup">Pickup</option>
              <option value="Dine-in">Dine-in</option>
              <option value="Takeaway">Takeaway</option>
              <option value="Delivery">Delivery</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. Structured 9-Column Order Management Data Table */}
      <StaffOrderTable
        orders={paginatedOrders}
        loading={loading}
        actionLoadingId={actionLoadingId}
        currentPage={currentPage}
        pageSize={pageSize}
        onViewDetails={(order) => setSelectedOrderForView(order)}
        onAccept={handleAcceptOrder}
        onStartCooking={handleStartCooking}
        onMarkReady={handleMarkReady}
        onVerifyPickup={handleOpenVerifyModal}
        onReject={handleOpenReject}
      />

      {/* 5. Pagination Bar */}
      {filteredOrders.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalItems={filteredOrders.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setCurrentPage(1);
          }}
          pageSizeOptions={[5, 10, 20, 50]}
        />
      )}

      {/* 6. View Order Details Modal */}
      {selectedOrderForView && (
        <StaffOrderDetailsModal
          isOpen={Boolean(selectedOrderForView)}
          onClose={() => setSelectedOrderForView(null)}
          order={selectedOrderForView}
          onAccept={handleAcceptOrder}
          onStartCooking={handleStartCooking}
          onMarkReady={handleMarkReady}
          onVerifyPickup={handleOpenVerifyModal}
          onReject={handleOpenReject}
        />
      )}

      {/* 7. Edit Order Status Modal */}
      {selectedOrderForEdit && (
        <StaffOrderStatusModal
          isOpen={Boolean(selectedOrderForEdit)}
          onClose={() => setSelectedOrderForEdit(null)}
          order={selectedOrderForEdit}
          onConfirm={handleUpdateStatusConfirm}
        />
      )}

      {/* 8. Dedicated Verify Pickup Modal (Mandatory Token/Code Authentication) */}
      {selectedOrderForVerify && (
        <StaffVerifyPickupModal
          isOpen={Boolean(selectedOrderForVerify)}
          onClose={() => setSelectedOrderForVerify(null)}
          order={selectedOrderForVerify}
          onConfirmSuccess={handleVerifySuccess}
        />
      )}

      {/* 9. Reject Order Modal */}
      {rejectModalOrder && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100,
          padding: '16px'
        }}>
          <div style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--border-radius-lg)',
            maxWidth: '440px',
            width: '100%',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            boxShadow: 'var(--shadow-modal)'
          }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: 'var(--color-danger)' }}>
              Reject Order #{rejectModalOrder.token || rejectModalOrder.id}
            </h3>
            <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: 0 }}>
              Are you sure you want to reject this order from {rejectModalOrder.customer?.name}? Please specify the reason:
            </p>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g., Kitchen stations out of paneer, high rush delay..."
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-app)',
                color: 'var(--text-primary)',
                fontSize: '12.5px',
                outline: 'none',
                resize: 'none'
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setRejectModalOrder(null)}
                style={{
                  padding: '7px 14px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-app)',
                  color: 'var(--text-secondary)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                style={{
                  padding: '7px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: 'var(--color-danger)',
                  color: '#ffffff',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffOrderBoardPage;
