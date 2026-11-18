import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../../app/providers/AuthProvider';
import { useCart } from '../../cart/hooks/useCart';
import { customerOrderService } from '../../orders/services/customerOrderService';
import { ORDER_STATUS } from '../../../../constants/appConstants';
import { PageHeader } from '../../../../components/common/PageHeader';
import { Card } from '../../../../components/common/Card';
import { Button } from '../../../../components/common/Button';
import { StatusBadge } from '../../../../components/common/StatusBadge';
import { Pagination } from '../../../../components/common/Pagination';
import {
  Search,
  Repeat,
  Eye,
  FileText,
  Printer,
  X,
  Store,
  CreditCard,
  Wallet,
  AlertCircle,
  CheckCircle2,
  Clock,
  RotateCcw,
  Ban,
  ShieldCheck,
  Receipt,
  Download
} from 'lucide-react';

export const OrderHistoryPage = () => {
  const { user } = useAuth();
  const { addToCart, setIsDrawerOpen } = useCart();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals state
  const [receiptModalOrder, setReceiptModalOrder] = useState(null);
  const [refundAdviceOrder, setRefundAdviceOrder] = useState(null);
  const [cancelModalOrder, setCancelModalOrder] = useState(null);
  const [cancelReason, setCancelReason] = useState('Class / lecture schedule rescheduled');
  const [customReason, setCustomReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [feedbackToast, setFeedbackToast] = useState(null);

  // Pagination states matching Admin standards
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch authenticated customer's orders strictly
      const userOrders = await customerOrderService.getCustomerOrders(user);
      setOrders(Array.isArray(userOrders) ? userOrders : []);
    } catch (err) {
      console.error('Failed to load order history:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Handle Cancel from History
  const handleInitiateCancel = (order) => {
    const eligibility = customerOrderService.evaluateCancellationEligibility(order);
    if (!eligibility.eligible) {
      alert(`Cannot Cancel Order: ${eligibility.reason}`);
      return;
    }
    setCancelModalOrder(order);
    setCancelReason('Class / lecture schedule rescheduled');
    setCustomReason('');
  };

  const handleConfirmCancel = async () => {
    if (!cancelModalOrder) return;
    const finalReason = cancelReason === 'Other' ? (customReason.trim() || 'Customer requested cancellation') : cancelReason;

    try {
      setCancelling(true);
      const updated = await customerOrderService.cancelAndRefundOrder(cancelModalOrder.id, finalReason, user);
      setCancelModalOrder(null);

      if (updated.refundDetails && updated.refundDetails.status === 'Refund Successful') {
        setFeedbackToast({
          type: 'success',
          title: `Order #${updated.id} Cancelled & Refunded`,
          message: `Refund of ₹${Number(updated.refundDetails.amount).toFixed(2)} credited back to ${updated.refundDetails.sourceAccount}.`
        });
      } else {
        setFeedbackToast({
          type: 'info',
          title: `Order #${updated.id} Cancelled`,
          message: 'Order cancelled successfully.'
        });
      }

      await fetchHistory();
    } catch (err) {
      alert(`Cancellation Error: ${err.message}`);
    } finally {
      setCancelling(false);
    }
  };

  // Reorder handler
  const handleReorder = (order) => {
    (order.items || []).forEach(item => {
      addToCart({
        id: item.id || `reorder-${Date.now()}`,
        name: item.name,
        foodType: 'Veg',
        price: item.price,
        imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80',
        outletId: order.outletId,
        outletName: order.outletName
      }, item.quantity);
    });

    setIsDrawerOpen(true);
  };

  // Status Filter options
  const filterTabs = [
    { id: 'ALL', label: 'All Orders & Invoices' },
    { id: 'COLLECTED', label: 'Completed' },
    { id: 'ACTIVE', label: 'In-Progress Queue' },
    { id: 'CANCELLED', label: 'Cancelled Orders' },
    { id: 'REFUND_SUCCESS', label: 'Refund Completed' },
    { id: 'REFUND_PENDING', label: 'Refund Pending / Processing' }
  ];

  // Filtering
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch = !query ||
        order.id.toLowerCase().includes(query) ||
        (order.outletName && order.outletName.toLowerCase().includes(query)) ||
        (order.payment?.transactionId && order.payment.transactionId.toLowerCase().includes(query)) ||
        (order.refundDetails?.refundId && order.refundDetails.refundId.toLowerCase().includes(query)) ||
        (order.refundDetails?.referenceId && order.refundDetails.referenceId.toLowerCase().includes(query)) ||
        (order.items || []).some(i => i.name.toLowerCase().includes(query));

      let matchesStatus = true;
      const refStatus = order.refundDetails?.status || '';

      if (statusFilter === 'COLLECTED') {
        matchesStatus = order.status === ORDER_STATUS.COMPLETED;
      } else if (statusFilter === 'CANCELLED') {
        matchesStatus = order.status === ORDER_STATUS.CANCELLED || order.status === ORDER_STATUS.REFUNDED;
      } else if (statusFilter === 'ACTIVE') {
        matchesStatus = [ORDER_STATUS.PLACED, ORDER_STATUS.ACCEPTED, ORDER_STATUS.PREPARING, ORDER_STATUS.READY].includes(order.status);
      } else if (statusFilter === 'REFUND_SUCCESS') {
        matchesStatus = refStatus.toLowerCase().includes('success') || order.status === ORDER_STATUS.REFUNDED;
      } else if (statusFilter === 'REFUND_PENDING') {
        matchesStatus = refStatus.toLowerCase().includes('pending') || refStatus.toLowerCase().includes('process');
      }

      return matchesSearch && matchesStatus;
    });
  }, [orders, searchQuery, statusFilter]);

  // Pagination calculation
  const totalItems = filteredOrders.length;
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredOrders.slice(start, start + pageSize);
  }, [filteredOrders, currentPage, pageSize]);

  return (
    <div>
      {/* Toast Feedback */}
      {feedbackToast && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          zIndex: 9999,
          backgroundColor: feedbackToast.type === 'success' ? '#10b981' : '#3b82f6',
          color: '#ffffff',
          padding: '14px 20px',
          borderRadius: '8px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          maxWidth: '450px'
        }}>
          {feedbackToast.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: '13px' }}>{feedbackToast.title}</div>
            <div style={{ fontSize: '12px', opacity: 0.95 }}>{feedbackToast.message}</div>
          </div>
          <button
            onClick={() => setFeedbackToast(null)}
            style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Admin PageHeader */}
      <PageHeader
        title="Order History & Refund Management"
        description="Comprehensive audit of all past campus orders, GST tax invoices, refund settlement records, and reordering."
      />

      {/* Tabs Filter Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        overflowX: 'auto',
        paddingBottom: '4px',
        marginBottom: '16px'
      }}>
        {filterTabs.map((tab) => {
          const isActive = statusFilter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setStatusFilter(tab.id);
                setCurrentPage(1);
              }}
              style={{
                padding: '8px 16px',
                borderRadius: 'var(--border-radius-md)',
                fontSize: '13px',
                fontWeight: isActive ? 600 : 500,
                border: isActive ? '1px solid var(--color-primary)' : '1px solid var(--border-color)',
                backgroundColor: isActive ? 'var(--color-primary-light)' : 'var(--bg-surface)',
                color: isActive ? 'var(--color-accent)' : 'var(--text-secondary)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all var(--transition-fast)'
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Search and Filters Toolbar Card */}
      <Card padding="16px" style={{ marginBottom: '20px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: 1, minWidth: '240px', maxWidth: '440px' }}>
            <Search
              size={15}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)'
              }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by Order ID, Txn ID, Refund Ref, Dish name..."
              style={{
                width: '100%',
                height: '38px',
                padding: '0 12px 0 36px',
                fontSize: '13px',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--border-radius-md)',
                backgroundColor: 'var(--bg-app)',
                color: 'var(--text-primary)',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Showing <strong>{filteredOrders.length}</strong> {filteredOrders.length === 1 ? 'record' : 'records'}
          </div>
        </div>
      </Card>

      {/* Orders DataTable matching Admin Design */}
      <Card padding="0" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '13px',
            textAlign: 'left'
          }}>
            <thead>
              <tr style={{
                backgroundColor: 'var(--bg-app)',
                borderBottom: '1px solid var(--border-color)',
                color: 'var(--text-secondary)'
              }}>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Order ID & Token</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Date & Time</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Canteen Outlet</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Dishes Ordered</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Payment & Transaction</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Total Amount</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'center' }}>Order Status</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'center' }}>Refund Status</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    Loading order history and refund ledger...
                  </td>
                </tr>
              ) : paginatedOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--text-muted)' }}>
                    <FileText size={32} style={{ margin: '0 auto 8px auto', opacity: 0.5 }} />
                    <p style={{ margin: 0, fontSize: '14px', fontWeight: 500 }}>No matching order transactions found</p>
                    <span style={{ fontSize: '12px' }}>Try switching the status filter tab or search keywords.</span>
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((order) => {
                  const payMethod = order.payment?.method || order.paymentMethod || 'Campus Wallet';
                  const txnId = order.payment?.transactionId || (order.payment?.status === 'Paid' ? `TXN-CMS-${order.id}` : 'Pending');
                  const refund = order.refundDetails;
                  const isCancelled = order.status === ORDER_STATUS.CANCELLED || order.status === ORDER_STATUS.REFUNDED;
                  const isEligibleForCancel = [ORDER_STATUS.PLACED, ORDER_STATUS.ACCEPTED].includes(order.status);

                  return (
                    <tr
                      key={order.id}
                      style={{
                        borderBottom: '1px solid var(--border-color-subtle)',
                        transition: 'background-color var(--transition-fast)'
                      }}
                    >
                      {/* Order ID & Token */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          #{order.id}
                        </div>
                        {order.token && (
                          <span style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            color: 'var(--color-accent)',
                            backgroundColor: 'var(--color-primary-light)',
                            padding: '1px 6px',
                            borderRadius: '4px',
                            display: 'inline-block',
                            marginTop: '2px'
                          }}>
                            Token: {order.token}
                          </span>
                        )}
                      </td>

                      {/* Date */}
                      <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>
                        {new Date(order.createdAt || order.orderDate).toLocaleDateString()}
                        <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'block' }}>
                          {new Date(order.createdAt || order.orderDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>

                      {/* Outlet */}
                      <td style={{ padding: '14px 16px', color: 'var(--text-primary)', fontWeight: 500 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Store size={14} style={{ color: 'var(--text-muted)' }} />
                          <span>{order.outletName || 'Central Dining Hall'}</span>
                        </div>
                      </td>

                      {/* Dishes summary */}
                      <td style={{ padding: '14px 16px', color: 'var(--text-secondary)', maxWidth: '200px' }}>
                        <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {(order.items || []).map(i => `${i.quantity}x ${i.name}`).join(', ') || 'Campus Meal'}
                        </div>
                      </td>

                      {/* Payment & Txn ID */}
                      <td style={{ padding: '14px 16px', fontSize: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 500, color: 'var(--text-primary)' }}>
                          {payMethod.toLowerCase().includes('wallet') ? (
                            <Wallet size={13} style={{ color: 'var(--color-primary)' }} />
                          ) : (
                            <CreditCard size={13} style={{ color: 'var(--color-accent)' }} />
                          )}
                          <span>{payMethod}</span>
                        </div>
                        <div style={{
                          fontFamily: 'monospace',
                          fontSize: '11px',
                          color: 'var(--text-muted)',
                          marginTop: '2px'
                        }}>
                          {txnId}
                        </div>
                      </td>

                      {/* Total Amount */}
                      <td style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        ₹{Number(order.totalAmount || order.pricing?.totalAmount || 0).toFixed(2)}
                      </td>

                      {/* Order Status Badge */}
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        <StatusBadge status={order.status} />
                      </td>

                      {/* Refund Status */}
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        {refund ? (
                          <div>
                            {refund.status === 'Refund Successful' && (
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '3px 8px',
                                borderRadius: '12px',
                                fontSize: '11px',
                                fontWeight: 600,
                                backgroundColor: '#dcfce7',
                                color: '#15803d'
                              }}>
                                <CheckCircle2 size={11} />
                                Refund Successful
                              </span>
                            )}
                            {refund.status === 'Refund Processing' && (
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '3px 8px',
                                borderRadius: '12px',
                                fontSize: '11px',
                                fontWeight: 600,
                                backgroundColor: '#e0f2fe',
                                color: '#0369a1'
                              }}>
                                <Clock size={11} />
                                Refund Processing
                              </span>
                            )}
                            {refund.status === 'Refund Pending' && (
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '3px 8px',
                                borderRadius: '12px',
                                fontSize: '11px',
                                fontWeight: 600,
                                backgroundColor: '#fef3c7',
                                color: '#b45309'
                              }}>
                                <Clock size={11} />
                                Refund Pending
                              </span>
                            )}
                            {refund.status === 'Refund Failed' && (
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '3px 8px',
                                borderRadius: '12px',
                                fontSize: '11px',
                                fontWeight: 600,
                                backgroundColor: '#fee2e2',
                                color: '#b91c1c'
                              }}>
                                <AlertCircle size={11} />
                                Refund Failed
                              </span>
                            )}
                            {refund.status === 'Not Applicable' && (
                              <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                                Cash Uncollected
                              </span>
                            )}
                            {refund.refundId && refund.refundId !== 'N/A' && (
                              <div style={{
                                fontFamily: 'monospace',
                                fontSize: '10px',
                                color: 'var(--text-muted)',
                                marginTop: '2px'
                              }}>
                                {refund.refundId}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>—</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          {/* Receipt */}
                          <button
                            type="button"
                            onClick={() => setReceiptModalOrder(order)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '5px 9px',
                              borderRadius: 'var(--border-radius-sm)',
                              border: '1px solid var(--border-color)',
                              backgroundColor: 'var(--bg-surface)',
                              color: 'var(--text-primary)',
                              fontSize: '12px',
                              fontWeight: 500,
                              cursor: 'pointer'
                            }}
                            title="View Digital Tax Invoice"
                          >
                            <Eye size={12} />
                            <span>Receipt</span>
                          </button>

                          {/* Refund Advice Voucher if refunded */}
                          {refund && refund.status !== 'Not Applicable' && (
                            <button
                              type="button"
                              onClick={() => setRefundAdviceOrder(order)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '5px 9px',
                                borderRadius: 'var(--border-radius-sm)',
                                border: '1px solid #bbf7d0',
                                backgroundColor: '#f0fdf4',
                                color: '#15803d',
                                fontSize: '12px',
                                fontWeight: 600,
                                cursor: 'pointer'
                              }}
                              title="View Official Refund Settlement Advice"
                            >
                              <RotateCcw size={12} />
                              <span>Refund Advice</span>
                            </button>
                          )}

                          {/* Cancel Button if eligible */}
                          {isEligibleForCancel && (
                            <button
                              type="button"
                              onClick={() => handleInitiateCancel(order)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '5px 9px',
                                borderRadius: 'var(--border-radius-sm)',
                                border: '1px solid #fecaca',
                                backgroundColor: '#fef2f2',
                                color: '#dc2626',
                                fontSize: '12px',
                                fontWeight: 600,
                                cursor: 'pointer'
                              }}
                              title="Cancel order and initiate immediate refund"
                            >
                              <Ban size={12} />
                              <span>Cancel</span>
                            </button>
                          )}

                          {/* Reorder */}
                          <button
                            type="button"
                            onClick={() => handleReorder(order)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '5px 9px',
                              borderRadius: 'var(--border-radius-sm)',
                              border: '1px solid var(--color-primary-border)',
                              backgroundColor: 'var(--color-primary-light)',
                              color: 'var(--color-accent)',
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                            title="Reorder dishes to meal tray"
                          >
                            <Repeat size={12} />
                            <span>Reorder</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Real Pagination Component matching Admin */}
        <Pagination
          currentPage={currentPage}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={(page) => setCurrentPage(page)}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setCurrentPage(1);
          }}
          pageSizeOptions={[5, 10, 20]}
        />
      </Card>

      {/* Detailed Digital Receipt Modal */}
      {receiptModalOrder && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '20px'
        }} onClick={() => setReceiptModalOrder(null)}>
          <div style={{
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--border-radius-xl)',
            padding: '28px',
            maxWidth: '500px',
            width: '100%',
            boxShadow: 'var(--shadow-modal)',
            border: '1px solid var(--border-color)',
            position: 'relative'
          }} onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setReceiptModalOrder(null)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                color: 'var(--text-muted)'
              }}
            >
              <X size={20} />
            </button>

            {/* Receipt Header */}
            <div style={{ textAlign: 'center', borderBottom: '1px dashed var(--border-color)', paddingBottom: '16px', marginBottom: '16px' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-primary-light)',
                color: 'var(--color-accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 8px auto'
              }}>
                <Receipt size={22} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                Campus Dining Services
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                Official Dining Receipt • {receiptModalOrder.outletName || 'Main Dining Hall'}
              </p>
            </div>

            {/* Meta details */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', fontSize: '12.5px', marginBottom: '16px' }}>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Receipt / Order #: </span>
                <strong style={{ color: 'var(--text-primary)', display: 'block' }}>{receiptModalOrder.id}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Counter Token: </span>
                <strong style={{ color: 'var(--color-accent)', display: 'block' }}>{receiptModalOrder.token || 'T-101'}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Customer: </span>
                <span style={{ color: 'var(--text-primary)', display: 'block' }}>{receiptModalOrder.customer?.name || user?.fullName}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Payment Status: </span>
                <span style={{ color: receiptModalOrder.paymentStatus === 'Refunded' ? '#dc2626' : 'var(--color-success)', fontWeight: 600, display: 'block' }}>
                  {receiptModalOrder.paymentStatus || 'Paid'}
                </span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Txn Reference: </span>
                <span style={{ fontFamily: 'monospace', fontSize: '11px', display: 'block', color: 'var(--text-primary)' }}>
                  {receiptModalOrder.payment?.transactionId || `TXN-CMS-${receiptModalOrder.id}`}
                </span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Order Date: </span>
                <span style={{ color: 'var(--text-primary)', display: 'block' }}>
                  {new Date(receiptModalOrder.createdAt || receiptModalOrder.orderDate).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Items table */}
            <div style={{ borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', padding: '12px 0', marginBottom: '16px' }}>
              {(receiptModalOrder.items || []).map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                  <span>{item.quantity}x {item.name}</span>
                  <span style={{ fontWeight: 600 }}>₹{(Number(item.price) * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            {/* Bill Total */}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '20px' }}>
              <span>Total Paid:</span>
              <span style={{ color: 'var(--color-accent)' }}>
                ₹{Number(receiptModalOrder.totalAmount || receiptModalOrder.pricing?.totalAmount || 0).toFixed(2)}
              </span>
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <Button variant="secondary" icon={Printer} onClick={() => window.print()}>
                Print Tax Receipt
              </Button>
              <Button variant="primary" onClick={() => setReceiptModalOrder(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Official Refund Settlement Advice Modal */}
      {refundAdviceOrder && refundAdviceOrder.refundDetails && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '20px'
        }} onClick={() => setRefundAdviceOrder(null)}>
          <div style={{
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--border-radius-xl)',
            padding: '28px',
            maxWidth: '520px',
            width: '100%',
            boxShadow: 'var(--shadow-modal)',
            border: '1px solid var(--border-color)',
            position: 'relative'
          }} onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setRefundAdviceOrder(null)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                color: 'var(--text-muted)'
              }}
            >
              <X size={20} />
            </button>

            {/* Refund Header */}
            <div style={{ textAlign: 'center', borderBottom: '1px dashed #bbf7d0', paddingBottom: '16px', marginBottom: '18px' }}>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '50%',
                backgroundColor: '#dcfce7',
                color: '#15803d',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 10px auto'
              }}>
                <RotateCcw size={24} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#15803d' }}>
                Refund Settlement Advice
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                Payment Gateway & Campus Wallet Reversal Certificate
              </p>
            </div>

            {/* Refund Amount Badge */}
            <div style={{
              backgroundColor: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '8px',
              padding: '14px',
              textAlign: 'center',
              marginBottom: '18px'
            }}>
              <div style={{ fontSize: '12px', color: '#166534', fontWeight: 600 }}>Refund Credited Amount</div>
              <div style={{ fontSize: '26px', fontWeight: 800, color: '#15803d', marginTop: '2px' }}>
                ₹{Number(refundAdviceOrder.refundDetails.amount).toFixed(2)}
              </div>
              <div style={{ fontSize: '11px', color: '#166534', marginTop: '4px' }}>
                Status: <strong>{refundAdviceOrder.refundDetails.status}</strong>
              </div>
            </div>

            {/* Itemized Audit Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '12px',
              fontSize: '12.5px',
              backgroundColor: 'var(--bg-app)',
              padding: '14px',
              borderRadius: '8px',
              marginBottom: '18px'
            }}>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block' }}>Refund Reference ID:</span>
                <strong style={{ fontFamily: 'monospace', color: 'var(--text-primary)' }}>
                  {refundAdviceOrder.refundDetails.refundId}
                </strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block' }}>Gateway Bank Ref:</span>
                <strong style={{ fontFamily: 'monospace', color: 'var(--text-primary)' }}>
                  {refundAdviceOrder.refundDetails.referenceId}
                </strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block' }}>Credited Destination:</span>
                <strong style={{ color: 'var(--text-primary)' }}>
                  {refundAdviceOrder.refundDetails.sourceAccount}
                </strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block' }}>Processed Timestamp:</span>
                <span style={{ color: 'var(--text-primary)' }}>
                  {new Date(refundAdviceOrder.refundDetails.processedAt).toLocaleString()}
                </span>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <span style={{ color: 'var(--text-muted)', display: 'block' }}>Original Order #:</span>
                <strong style={{ color: 'var(--text-primary)' }}>#{refundAdviceOrder.id}</strong> (Token: {refundAdviceOrder.token})
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <span style={{ color: 'var(--text-muted)', display: 'block' }}>Cancellation Reason Stated:</span>
                <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                  "{refundAdviceOrder.refundDetails.reason || refundAdviceOrder.cancellationReason || 'Customer requested'}"
                </span>
              </div>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '11.5px',
              color: 'var(--text-muted)',
              marginBottom: '20px'
            }}>
              <ShieldCheck size={16} style={{ color: '#10b981' }} />
              <span>Audited under Campus Dining Services automated refund SLA standards.</span>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <Button variant="secondary" icon={Printer} onClick={() => window.print()}>
                Print Advice
              </Button>
              <Button variant="primary" onClick={() => setRefundAdviceOrder(null)}>
                Acknowledge & Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal from History */}
      {cancelModalOrder && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '20px'
        }} onClick={() => setCancelModalOrder(null)}>
          <div style={{
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--border-radius-xl)',
            padding: '28px',
            maxWidth: '480px',
            width: '100%',
            boxShadow: 'var(--shadow-modal)',
            border: '1px solid var(--border-color)',
            position: 'relative'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                backgroundColor: '#fee2e2',
                color: '#dc2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Ban size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                  Cancel Order #{cancelModalOrder.id}?
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Amount: ₹{Number(cancelModalOrder.totalAmount || cancelModalOrder.pricing?.totalAmount || 0).toFixed(2)}
                </span>
              </div>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '16px' }}>
              Because your order is still in <strong>{cancelModalOrder.status}</strong> state, it is eligible for full cancellation and an immediate refund.
            </p>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                Reason for Cancellation:
              </label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                style={{
                  width: '100%',
                  height: '38px',
                  padding: '0 12px',
                  fontSize: '13px',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--border-radius-md)',
                  backgroundColor: 'var(--bg-app)',
                  color: 'var(--text-primary)',
                  marginBottom: '10px'
                }}
              >
                <option value="Class / lecture schedule rescheduled">Class / lecture schedule rescheduled</option>
                <option value="Ordered duplicate items by mistake">Ordered duplicate items by mistake</option>
                <option value="Break duration changed by faculty">Break duration changed by faculty</option>
                <option value="Selected incorrect canteen outlet">Selected incorrect canteen outlet</option>
                <option value="Other">Other Reason (enter details)</option>
              </select>

              {cancelReason === 'Other' && (
                <textarea
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Please specify why you are cancelling..."
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: '13px',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--border-radius-md)',
                    backgroundColor: 'var(--bg-app)',
                    color: 'var(--text-primary)',
                    boxSizing: 'border-box'
                  }}
                />
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <Button
                variant="secondary"
                onClick={() => setCancelModalOrder(null)}
                disabled={cancelling}
              >
                Keep Order
              </Button>
              <Button
                variant="danger"
                onClick={handleConfirmCancel}
                disabled={cancelling}
              >
                {cancelling ? 'Processing Refund...' : 'Confirm Cancellation'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderHistoryPage;
