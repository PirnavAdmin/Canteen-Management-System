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
  AlertCircle,
  History
} from 'lucide-react';
import { useStaffOrders } from '../hooks/useStaffOrders';
import { useToast } from '../../../app/providers/ToastProvider';
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
import { Modal } from '../../../components/modals/Modal';
import { StaffOrderTable } from '../components/StaffOrderTable';
import { StaffOrderHistoryTable } from '../components/StaffOrderHistoryTable';
import { StaffOrderDetailsModal } from '../components/StaffOrderDetailsModal';
import { StaffOrderStatusModal } from '../components/StaffOrderStatusModal';
import styles from '../styles/staff.module.css';

export const StaffOrderBoardPage = () => {
  const { success, error: toastError } = useToast();
  const {
    orders,
    loading,
    error,
    refreshOrders,
    advanceOrderStatus,
    startPreparation,
    markReadyForPickup,
    rejectOrder,
    activeOutletName,
    activeCampusName
  } = useStaffOrders();

  const [viewMode, setViewMode] = useState('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('TODAY');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [orderTypeFilter, setOrderTypeFilter] = useState('ALL');

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [selectedOrderForView, setSelectedOrderForView] = useState(null);
  const [selectedOrderForEdit, setSelectedOrderForEdit] = useState(null);
  const [rejectModalOrder, setRejectModalOrder] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  // 1. Filter Orders by Date Range (Local IST)
  const dateFilteredOrders = useMemo(() => {
    if (dateFilter === 'ALL') return orders;

    return orders.filter((order) => {
      const orderDateVal = order.orderDate || order.createdAt;
      if (!orderDateVal) return false;

      if (dateFilter === 'TODAY') return isSameIstDate(orderDateVal);
      if (dateFilter === 'WEEK') return isWithinDaysIST(orderDateVal, 7) || isSameIstDate(orderDateVal);
      if (dateFilter === 'MONTH') return isWithinDaysIST(orderDateVal, 30) || isSameIstDate(orderDateVal);
      return true;
    });
  }, [orders, dateFilter]);

  const activeOrders = useMemo(
    () => dateFilteredOrders.filter((o) => !isStatusCompleted(o.status)),
    [dateFilteredOrders]
  );

  const completedOrders = useMemo(
    () => dateFilteredOrders.filter((o) => isStatusCompleted(o.status)),
    [dateFilteredOrders]
  );

  const summaryMetrics = useMemo(() => {
    const total = dateFilteredOrders.length;
    const newOrders = dateFilteredOrders.filter((o) => isStatusPlaced(o.status)).length;
    const preparing = dateFilteredOrders.filter((o) => isStatusPreparing(o.status) || isStatusAccepted(o.status)).length;
    const ready = dateFilteredOrders.filter((o) => isStatusReady(o.status)).length;
    const completed = dateFilteredOrders.filter((o) => isStatusCompleted(o.status)).length;
    const cancelled = dateFilteredOrders.filter((o) => isStatusCancelled(o.status)).length;

    return { total, newOrders, preparing, ready, completed, cancelled };
  }, [dateFilteredOrders]);

  const currentScopeOrders = viewMode === 'active' ? activeOrders : completedOrders;

  const filteredOrders = useMemo(() => {
    return currentScopeOrders.filter((order) => {
      const q = searchQuery.trim().toLowerCase();
      if (q) {
        const id = String(order.id || '').toLowerCase();
        const token = String(order.token || '').toLowerCase();
        const customerName = String(order.customer?.name || order.customerName || '').toLowerCase();
        if (!id.includes(q) && !token.includes(q) && !customerName.includes(q)) return false;
      }

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

      if (orderTypeFilter !== 'ALL') {
        const type = String(order.orderType || order.type || 'Pickup').toLowerCase();
        if (!type.includes(String(orderTypeFilter).toLowerCase())) return false;
      }

      return true;
    });
  }, [currentScopeOrders, searchQuery, statusFilter, orderTypeFilter, viewMode]);

  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredOrders.slice(start, start + pageSize);
  }, [filteredOrders, currentPage, pageSize]);

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

  const handleStartCooking = async (orderId) => {
    try {
      setActionLoadingId(orderId);
      const updated = await startPreparation(orderId);
      success('Cooking Started', `Order #${updated.token || orderId} moved to Preparing.`);
      if (selectedOrderForView && String(selectedOrderForView.id) === String(orderId)) {
        setSelectedOrderForView(updated);
      }
    } catch (err) {
      toastError('Preparation Error', err.message || 'Failed to start cooking.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleMarkReady = async (orderId) => {
    try {
      setActionLoadingId(orderId);
      const updated = await markReadyForPickup(orderId);
      success('Marked Ready', `Order #${updated.token || orderId} is ready for customer pickup.`);
      if (selectedOrderForView && String(selectedOrderForView.id) === String(orderId)) {
        setSelectedOrderForView(updated);
      }
    } catch (err) {
      toastError('Action Error', err.message || 'Failed to mark order ready.');
    } finally {
      setActionLoadingId(null);
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
      const updated = await rejectOrder(rejectModalOrder.id, rejectReason.trim() || 'Kitchen unavailable');
      success('Order Rejected', `Order #${rejectModalOrder.token || rejectModalOrder.id} has been cancelled.`);
      setRejectModalOrder(null);
      setRejectReason('');
      if (selectedOrderForView && String(selectedOrderForView.id) === String(rejectModalOrder.id)) {
        setSelectedOrderForView(updated);
      }
    } catch (err) {
      toastError('Rejection Error', err.message || 'Failed to reject order.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleUpdateStatusConfirm = async (orderId, newStatus, note) => {
    try {
      setActionLoadingId(orderId);
      const updated = await advanceOrderStatus(orderId, newStatus, note);
      success('Status Updated', `Order #${updated.token || orderId} updated to ${newStatus}.`);
      if (selectedOrderForView && String(selectedOrderForView.id) === String(orderId)) {
        setSelectedOrderForView(updated);
      }
    } catch (err) {
      toastError('Update Failed', err.message || 'Failed to update order status.');
      throw err;
    } finally {
      setActionLoadingId(null);
    }
  };

  const todayDateString = new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  const summaryCards = [
    {
      label: 'Total Orders',
      value: summaryMetrics.total,
      icon: ShoppingBag,
      color: 'var(--color-accent)',
      bg: 'var(--color-primary-light)'
    },
    {
      label: 'New Orders',
      value: summaryMetrics.newOrders,
      icon: Clock,
      color: 'var(--color-warning)',
      bg: 'var(--color-warning-bg)',
      highlight: summaryMetrics.newOrders > 0
    },
    {
      label: 'Preparing',
      value: summaryMetrics.preparing,
      icon: ChefHat,
      color: 'var(--color-primary)',
      bg: 'var(--color-info-bg)'
    },
    {
      label: 'Ready for Pickup',
      value: summaryMetrics.ready,
      icon: BellRing,
      color: 'var(--color-success)',
      bg: 'var(--color-success-bg)'
    },
    {
      label: 'Collected',
      value: summaryMetrics.completed,
      icon: CheckCheck,
      color: 'var(--color-success)',
      bg: 'var(--color-success-bg)',
      onClick: () => {
        setViewMode('history');
        setCurrentPage(1);
      },
      title: 'Click to view Completed / Collected Order History'
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Page Header */}
      <PageHeader
        title="Order Management"
        description="View and manage all canteen orders."
        badge={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {activeOutletName && (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '3px 10px',
                borderRadius: 'var(--border-radius-full)',
                backgroundColor: 'var(--color-primary-light)',
                color: 'var(--color-primary)',
                fontSize: '11.5px',
                fontWeight: 600,
                border: '1px solid var(--color-primary-border)'
              }}>
                <Store size={12} />
                {[activeOutletName, activeCampusName].filter(Boolean).join(' • ')}
              </span>
            )}

            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 10px',
              borderRadius: 'var(--border-radius-full)',
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

      {/* API Error Banner */}
      {error && (
        <div className={styles.errorBanner} role="alert">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
          <Button variant="secondary" size="sm" icon={RefreshCw} onClick={refreshOrders}>
            Retry
          </Button>
        </div>
      )}

      {/* Order History Mode Banner */}
      {viewMode === 'history' && (
        <div className={styles.infoBanner} style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <History size={18} style={{ color: 'var(--color-primary)' }} />
            <div>
              <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>Order History (Completed Orders)</strong>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '8px' }}>
                — Historical completed orders saved in database
              </span>
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setViewMode('active');
              setDateFilter('TODAY');
              setCurrentPage(1);
            }}
          >
            ← Back to Active Orders
          </Button>
        </div>
      )}

      {/* Compact Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(175px, 1fr))',
        gap: '10px'
      }}>
        {summaryCards.map((card) => {
          const IconComp = card.icon;
          return (
            <div
              key={card.label}
              onClick={card.onClick}
              title={card.title}
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: card.highlight ? '1.5px solid var(--color-warning)' : '1px solid var(--border-color)',
                borderRadius: 'var(--border-radius-md)',
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                boxShadow: 'var(--shadow-xs)',
                cursor: card.onClick ? 'pointer' : 'default'
              }}
            >
              <div style={{
                width: '34px',
                height: '34px',
                borderRadius: 'var(--border-radius-sm)',
                backgroundColor: card.bg,
                color: card.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <IconComp size={16} />
              </div>
              <div>
                <div style={{ fontSize: '10.5px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                  {card.label}
                </div>
                <div style={{ fontSize: '18px', fontWeight: 700, color: card.color, lineHeight: 1.2 }}>
                  {card.value}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Search & Filter Toolbar matching Admin OrderFilters */}
      <div className={styles.filterToolbar}>
        <div style={{ position: 'relative', flex: '1 1 220px', minWidth: '180px' }}>
          <Search
            size={14}
            style={{
              position: 'absolute',
              left: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
              pointerEvents: 'none'
            }}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleFilterChange(setSearchQuery, e.target.value)}
            placeholder="Search by Order ID, Token, or Customer..."
            style={{
              width: '100%',
              height: '34px',
              padding: '0 28px 0 30px',
              fontSize: '12.5px',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--border-radius-md)',
              backgroundColor: 'var(--bg-app)',
              color: 'var(--text-primary)',
              outline: 'none'
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => handleFilterChange(setSearchQuery, '')}
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
                padding: 0
              }}
            >
              <X size={13} />
            </button>
          )}
        </div>

        <select
          value={dateFilter}
          onChange={(e) => handleFilterChange(setDateFilter, e.target.value)}
          className={styles.filterSelect}
          aria-label="Filter by date range"
        >
          <option value="ALL">All Dates</option>
          <option value="TODAY">Today (IST)</option>
          <option value="WEEK">This Week (7 days)</option>
          <option value="MONTH">This Month (30 days)</option>
        </select>

        {viewMode === 'active' && (
          <select
            value={statusFilter}
            onChange={(e) => handleFilterChange(setStatusFilter, e.target.value)}
            className={styles.filterSelect}
            aria-label="Filter by order status"
          >
            <option value="ALL">All Order Statuses</option>
            <option value={ORDER_STATUS.PLACED}>Placed (New)</option>
            <option value={ORDER_STATUS.ACCEPTED}>Accepted</option>
            <option value={ORDER_STATUS.PREPARING}>Preparing</option>
            <option value={ORDER_STATUS.READY_FOR_PICKUP}>Ready for Pickup</option>
            <option value={ORDER_STATUS.CANCELLED}>Cancelled</option>
          </select>
        )}

        <select
          value={orderTypeFilter}
          onChange={(e) => handleFilterChange(setOrderTypeFilter, e.target.value)}
          className={styles.filterSelect}
          aria-label="Filter by order type"
        >
          <option value="ALL">All Order Types</option>
          <option value="Pickup">Pickup</option>
          <option value="Dine-in">Dine-in</option>
          <option value="Takeaway">Takeaway</option>
          <option value="Delivery">Delivery</option>
        </select>

        <span style={{ fontSize: '12px', color: 'var(--text-secondary)', marginLeft: 'auto', whiteSpace: 'nowrap' }}>
          Showing <strong>{filteredOrders.length}</strong> of {currentScopeOrders.length} {viewMode === 'active' ? 'active' : 'completed'} orders
        </span>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleClearFilters}
            title="Reset all filters"
            aria-label="Reset all filters"
            style={{
              width: '34px',
              height: '34px',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--border-radius-md)',
              backgroundColor: 'var(--bg-surface)',
              color: 'var(--text-secondary)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <RotateCcw size={14} />
          </button>
        )}
      </div>

      {/* Data Table with Pagination Footer matching Admin OrderListPage */}
      {viewMode === 'active' ? (
        <StaffOrderTable
          orders={paginatedOrders}
          loading={loading}
          actionLoadingId={actionLoadingId}
          currentPage={currentPage}
          pageSize={pageSize}
          onViewDetails={(order) => setSelectedOrderForView(order)}
          onStartCooking={handleStartCooking}
          onMarkReady={handleMarkReady}
          onReject={handleOpenReject}
          footer={
            <Pagination
              currentPage={currentPage}
              totalItems={filteredOrders.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={(newSize) => {
                setPageSize(newSize);
                setCurrentPage(1);
              }}
              pageSizeOptions={[5, 10, 15, 20]}
            />
          }
        />
      ) : (
        <StaffOrderHistoryTable
          orders={paginatedOrders}
          loading={loading}
          currentPage={currentPage}
          pageSize={pageSize}
          onViewDetails={(order) => setSelectedOrderForView(order)}
          footer={
            <Pagination
              currentPage={currentPage}
              totalItems={filteredOrders.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={(newSize) => {
                setPageSize(newSize);
                setCurrentPage(1);
              }}
              pageSizeOptions={[5, 10, 15, 20]}
            />
          }
        />
      )}

      {/* View Order Details Modal */}
      {selectedOrderForView && (
        <StaffOrderDetailsModal
          isOpen={Boolean(selectedOrderForView)}
          onClose={() => setSelectedOrderForView(null)}
          order={selectedOrderForView}
          onStartCooking={handleStartCooking}
          onMarkReady={handleMarkReady}
          onReject={handleOpenReject}
        />
      )}

      {/* Edit Order Status Modal */}
      {selectedOrderForEdit && (
        <StaffOrderStatusModal
          isOpen={Boolean(selectedOrderForEdit)}
          onClose={() => setSelectedOrderForEdit(null)}
          order={selectedOrderForEdit}
          onConfirm={handleUpdateStatusConfirm}
        />
      )}

      {/* Reject Order Modal */}
      <Modal
        isOpen={Boolean(rejectModalOrder)}
        onClose={() => setRejectModalOrder(null)}
        title={`Reject Order #${rejectModalOrder?.token || rejectModalOrder?.id || ''}`}
        subtitle={rejectModalOrder?.customer?.name ? `Customer: ${rejectModalOrder.customer.name}` : undefined}
        maxWidth="440px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
            Please specify the reason for rejecting this order:
          </p>
          <textarea
            rows={3}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="e.g., Ingredient out of stock, high kitchen rush..."
            className={styles.formTextarea}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '8px', borderTop: '1px solid var(--border-color)' }}>
            <Button variant="secondary" onClick={() => setRejectModalOrder(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={Boolean(rejectModalOrder && actionLoadingId === rejectModalOrder.id)}
              onClick={handleConfirmReject}
            >
              Confirm Rejection
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default StaffOrderBoardPage;
