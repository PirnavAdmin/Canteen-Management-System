import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
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
  AlertCircle,
  History,
  Flame
} from 'lucide-react';
import { useStaffOrders } from '../hooks/useStaffOrders';
import { STAFF_APP_CONFIG } from '../constants/staffNavigation';
import { ORDER_STATUS } from '../../../constants/appConstants';
import {
  isStatusPlaced,
  isStatusAccepted,
  isStatusPreparing,
  isStatusReady,
  isStatusCompleted,
  isStatusCancelled
} from '../services/staffOrderService';
import { isSameIstDate, isWithinDaysIST } from '../../../utils/formatters';
import { PageHeader } from '../../../components/common/PageHeader';
import { Button } from '../../../components/common/Button';
import { Pagination } from '../../../components/common/Pagination';
import { StaffOrderTable } from '../components/StaffOrderTable';
import { StaffOrderHistoryTable } from '../components/StaffOrderHistoryTable';
import { StaffOrderDetailsModal } from '../components/StaffOrderDetailsModal';
import { StaffOrderStatusModal } from '../components/StaffOrderStatusModal';

export const StaffOrderBoardPage = () => {
  const {
    orders,
    loading,
    refreshOrders,
    advanceOrderStatus,
    acceptOrder,
    startPreparation,
    markReadyForPickup,
    completeOrder,
    rejectOrder
  } = useStaffOrders();

  // View Mode: 'active' (Operational Orders) | 'history' (Completed Orders)
  const [viewMode, setViewMode] = useState('active');

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('TODAY'); // 'ALL' | 'TODAY' | 'WEEK' | 'MONTH' (defaults to 'TODAY')
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

  // 1. Filter Orders by Date Range (Local IST / Business Date)
  const dateFilteredOrders = useMemo(() => {
    if (dateFilter === 'ALL') return orders;

    return orders.filter(order => {
      const orderDateVal = order.orderDate || order.createdAt;
      if (!orderDateVal) return false;

      if (dateFilter === 'TODAY') {
        return isSameIstDate(orderDateVal);
      }
      if (dateFilter === 'WEEK') {
        return isWithinDaysIST(orderDateVal, 7) || isSameIstDate(orderDateVal);
      }
      if (dateFilter === 'MONTH') {
        return isWithinDaysIST(orderDateVal, 30) || isSameIstDate(orderDateVal);
      }
      return true;
    });
  }, [orders, dateFilter]);

  // Operational Active Orders (exclude completed orders)
  const activeOrders = useMemo(() => {
    return dateFilteredOrders.filter(o => !isStatusCompleted(o.status));
  }, [dateFilteredOrders]);

  // Completed Orders for Order History
  const completedOrders = useMemo(() => {
    return dateFilteredOrders.filter(o => isStatusCompleted(o.status));
  }, [dateFilteredOrders]);

  // 2. Summary Metrics follows Required Logic:
  // - Total Orders: Based on selected date and outlet
  // - New Orders: Orders with Placed status
  // - Preparing: Orders currently being prepared
  // - Ready for Pickup: Orders waiting for collection
  // - Collected: Collected / completed orders in the current scope
  const summaryMetrics = useMemo(() => {
    const total = dateFilteredOrders.length;
    const newOrders = dateFilteredOrders.filter(o => isStatusPlaced(o.status)).length;
    const preparing = dateFilteredOrders.filter(o => isStatusPreparing(o.status) || isStatusAccepted(o.status)).length;
    const ready = dateFilteredOrders.filter(o => isStatusReady(o.status)).length;
    const completed = dateFilteredOrders.filter(o => isStatusCompleted(o.status)).length;
    const cancelled = dateFilteredOrders.filter(o => isStatusCancelled(o.status)).length;

    return { total, newOrders, preparing, ready, completed, cancelled };
  }, [dateFilteredOrders]);

  // 3. Current Scope Orders for Active / History view
  const currentScopeOrders = viewMode === 'active' ? activeOrders : completedOrders;

  // 4. Filter Orders based on Search, Status, and Order Type
  const filteredOrders = useMemo(() => {
    return currentScopeOrders.filter(order => {
      // Search matching (Order ID or Token or Customer Name)
      const q = searchQuery.trim().toLowerCase();
      if (q) {
        const id = String(order.id || '').toLowerCase();
        const token = String(order.token || '').toLowerCase();
        const customerName = String(order.customer?.name || order.customerName || '').toLowerCase();

        const matchesSearch = id.includes(q) || token.includes(q) || customerName.includes(q);
        if (!matchesSearch) return false;
      }

      // Order Status Filter (only applies in Active view; History is always completed)
      if (viewMode === 'active' && statusFilter !== 'ALL') {
        const targetSt = String(statusFilter).toLowerCase();
        if (targetSt === 'placed' || targetSt === 'new') {
          if (!isStatusPlaced(order.status)) return false;
        } else if (targetSt === 'accepted') {
          if (!isStatusAccepted(order.status)) return false;
        } else if (targetSt === 'preparing') {
          if (!isStatusPreparing(order.status)) return false;
        } else if (targetSt === 'ready for pickup' || targetSt === 'ready') {
          if (!isStatusReady(order.status)) return false;
        } else if (targetSt === 'completed' || targetSt === 'collected') {
          if (!isStatusCompleted(order.status)) return false;
        } else if (targetSt === 'cancelled' || targetSt === 'refunded') {
          if (!isStatusCancelled(order.status)) return false;
        } else if (String(order.status || '').toLowerCase() !== targetSt) {
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
  }, [currentScopeOrders, searchQuery, statusFilter, orderTypeFilter, viewMode]);

  // 5. Paginated Data Slice
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
    setDateFilter('TODAY');
    setStatusFilter('ALL');
    setOrderTypeFilter('ALL');
    setCurrentPage(1);
  };

  const hasActiveFilters = Boolean(
    searchQuery ||
    dateFilter !== 'TODAY' ||
    (viewMode === 'active' && statusFilter !== 'ALL') ||
    orderTypeFilter !== 'ALL'
  );

  // Status Lifecycle Action Handlers
  const handleAcceptOrder = async (orderId) => {
    try {
      setActionLoadingId(orderId);
      // Directly moves to Preparing stage without separate kitchen transfer
      const updated = await acceptOrder(orderId);
      showNotification('success', 'Order Accepted', `Order #${updated.token || orderId} accepted and cooking started.`);
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
      showNotification('success', 'Cooking Started', `Order #${updated.token || orderId} moved to Preparing.`);
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
      showNotification('success', 'Marked Ready', `Order #${updated.token || orderId} is ready for customer pickup.`);
      if (selectedOrderForView && String(selectedOrderForView.id) === String(orderId)) {
        setSelectedOrderForView(updated);
      }
    } catch (err) {
      showNotification('error', 'Action Error', err.message || 'Failed to mark order ready.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Simplified Order Completion Handler (No QR / PIN verification required)
  const handleCompleteOrder = async (orderId) => {
    try {
      setActionLoadingId(orderId);
      const updated = await completeOrder(orderId);
      showNotification('success', 'Order Completed', `Order #${updated.token || orderId} completed and moved to Order History.`);
      if (selectedOrderForView && String(selectedOrderForView.id) === String(orderId)) {
        setSelectedOrderForView(updated);
      }
    } catch (err) {
      showNotification('error', 'Completion Error', err.message || 'Failed to complete order.');
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Link to="/staff/kitchen" style={{ textDecoration: 'none' }}>
              <Button variant="secondary" icon={Flame}>
                Kitchen Display (KDS)
              </Button>
            </Link>
            <Button
              variant={viewMode === 'history' ? 'primary' : 'secondary'}
              icon={History}
              onClick={() => {
                if (viewMode === 'active') {
                  setViewMode('history');
                  setDateFilter('ALL');
                } else {
                  setViewMode('active');
                  setDateFilter('TODAY');
                }
                setCurrentPage(1);
              }}
            >
              {viewMode === 'active' ? 'Order History' : 'Back to Active Orders'}
            </Button>
            <Button
              variant="secondary"
              icon={RefreshCw}
              onClick={refreshOrders}
              loading={loading}
            >
              Refresh
            </Button>
          </div>
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

      {/* Order History Mode Banner */}
      {viewMode === 'history' && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'var(--bg-surface)',
          padding: '12px 18px',
          borderRadius: 'var(--border-radius-md)',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-xs)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <History size={18} style={{ color: 'var(--color-primary)' }} />
            <div>
              <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>Order History (Completed Orders)</strong>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '8px' }}>
                — Historical completed orders saved in database
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setViewMode('active');
              setDateFilter('TODAY');
              setCurrentPage(1);
            }}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-app)',
              color: 'var(--color-primary)',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            ← Back to Active Orders
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

        {/* Collected Orders */}
        <div
          onClick={() => {
            setViewMode('history');
            setCurrentPage(1);
          }}
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--border-radius-lg)',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            boxShadow: 'var(--shadow-xs)',
            cursor: 'pointer'
          }}
          title="Click to view Completed / Collected Order History"
        >
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
              Collected
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
              Showing <strong>{filteredOrders.length}</strong> of {currentScopeOrders.length} {viewMode === 'active' ? 'active' : 'completed'} orders
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

          {/* Order Status Filter (active mode only; in history view all orders are completed) */}
          {viewMode === 'active' && (
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
                <option value={ORDER_STATUS.CANCELLED}>Cancelled</option>
              </select>
            </div>
          )}

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

      {/* 4. Structured Order Management Data Table / Order History Table */}
      {viewMode === 'active' ? (
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
          onCompleteOrder={handleCompleteOrder}
          onReject={handleOpenReject}
        />
      ) : (
        <StaffOrderHistoryTable
          orders={paginatedOrders}
          loading={loading}
          currentPage={currentPage}
          pageSize={pageSize}
          onViewDetails={(order) => setSelectedOrderForView(order)}
        />
      )}

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
          onCompleteOrder={handleCompleteOrder}
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
