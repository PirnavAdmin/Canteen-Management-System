import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../../../app/providers/AuthProvider';
import { customerOrderService } from '../services/customerOrderService';
import { ORDER_STATUS } from '../../../../constants/appConstants';
import { formatDateTime } from '../../../../utils/formatters';
import { PageHeader } from '../../../../components/common/PageHeader';
import { Card } from '../../../../components/common/Card';
import { Button } from '../../../../components/common/Button';
import { StatusBadge } from '../../../../components/common/StatusBadge';
import {
  ShoppingBag,
  Store,
  Clock,
  QrCode,
  CheckCircle,
  AlertCircle,
  XCircle,
  RefreshCw,
  UtensilsCrossed,
  X,
  CreditCard,
  Wallet,
  ArrowRight,
  ShieldCheck,
  FileText,
  RotateCcw,
  Info
} from 'lucide-react';

export const MyOrdersPage = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL'); // ALL, ACTIVE, CANCELLED, COMPLETED

  // Modals state
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState(null);
  const [cancelReason, setCancelReason] = useState('Class / lecture schedule rescheduled');
  const [customReason, setCustomReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [feedbackToast, setFeedbackToast] = useState(null);

  const [qrModalOrder, setQrModalOrder] = useState(null);
  const [detailsModalOrder, setDetailsModalOrder] = useState(null);
  const [refundModalOrder, setRefundModalOrder] = useState(null);

  // Show toast when redirected from successful checkout payment
  useEffect(() => {
    if (location.state?.newOrderId) {
      setFeedbackToast({
        type: 'success',
        title: `Order Placed Successfully! (Token: ${location.state.token || 'T-101'})`,
        message: `Order #${location.state.newOrderId} confirmed via ${location.state.paymentMethod || 'Authorized Payment'}. Token flashed on kitchen line.`
      });
      try {
        window.history.replaceState({}, document.title);
      } catch {
        // ignore
      }
    }
  }, [location.state]);

  const loadUserOrders = useCallback(async () => {
    try {
      setLoading(true);
      const userOrders = await customerOrderService.getCustomerOrders(user);
      setOrders(Array.isArray(userOrders) ? userOrders : []);
    } catch (err) {
      console.error('Failed to load customer orders:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadUserOrders();
  }, [loadUserOrders]);

  // Handle Cancel & Refund Action
  const handleInitiateCancel = (order) => {
    const eligibility = customerOrderService.evaluateCancellationEligibility(order);
    if (!eligibility.eligible) {
      alert(`Cannot Cancel Order: ${eligibility.reason}`);
      return;
    }
    setOrderToCancel(order);
    setCancelReason('Class / lecture schedule rescheduled');
    setCustomReason('');
    setCancelModalOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!orderToCancel) return;
    const finalReason = cancelReason === 'Other' ? (customReason.trim() || 'Customer requested cancellation') : cancelReason;

    try {
      setCancelling(true);
      const updated = await customerOrderService.cancelAndRefundOrder(orderToCancel.id, finalReason, user);
      setCancelModalOpen(false);
      setOrderToCancel(null);

      if (updated.refundDetails && updated.refundDetails.status === 'Refund Successful') {
        setFeedbackToast({
          type: 'success',
          title: `Order #${updated.id} Cancelled & Refunded`,
          message: `Full refund of ₹${Number(updated.refundDetails.amount).toFixed(2)} has been credited back to your ${updated.refundDetails.sourceAccount}. (Refund ID: ${updated.refundDetails.refundId})`
        });
      } else {
        setFeedbackToast({
          type: 'info',
          title: `Order #${updated.id} Cancelled`,
          message: 'The order was cancelled. No payment was charged as cash was uncollected.'
        });
      }

      await loadUserOrders();
    } catch (err) {
      alert(`Cancellation Error: ${err.message}`);
    } finally {
      setCancelling(false);
    }
  };

  // Kitchen Progression Simulator (For demonstration purposes)
  const handleAdvanceStatus = async (orderId, currentStatus) => {
    let nextStatus = ORDER_STATUS.ACCEPTED;
    if (currentStatus === ORDER_STATUS.PLACED) nextStatus = ORDER_STATUS.ACCEPTED;
    else if (currentStatus === ORDER_STATUS.ACCEPTED) nextStatus = ORDER_STATUS.PREPARING;
    else if (currentStatus === ORDER_STATUS.PREPARING) nextStatus = ORDER_STATUS.READY_FOR_PICKUP;
    else if (currentStatus === ORDER_STATUS.READY_FOR_PICKUP) nextStatus = ORDER_STATUS.COMPLETED;

    try {
      const allOrders = JSON.parse(localStorage.getItem('cms_canteen_management_orders') || '[]');
      const updated = allOrders.map(o => o.id === orderId ? { ...o, status: nextStatus } : o);
      localStorage.setItem('cms_canteen_management_orders', JSON.stringify(updated));
      loadUserOrders();
    } catch (err) {
      console.error('Failed to advance order status:', err);
    }
  };

  const getStepIndex = (status) => {
    switch (status) {
      case ORDER_STATUS.PLACED: return 0;
      case ORDER_STATUS.ACCEPTED: return 1;
      case ORDER_STATUS.PREPARING: return 2;
      case ORDER_STATUS.READY_FOR_PICKUP: return 3;
      case ORDER_STATUS.COMPLETED: return 4;
      default: return -1;
    }
  };

  const STEPS = [
    { label: 'Placed', desc: 'Received by kitchen' },
    { label: 'Accepted', desc: 'Station confirmed' },
    { label: 'Preparing', desc: 'Chef cooking on stove' },
    { label: 'Ready for Pickup', desc: 'Packed at counter' },
    { label: 'Completed', desc: 'Collected & closed' }
  ];

  // Filtering by active tab
  const filteredOrders = orders.filter((o) => {
    if (activeTab === 'ACTIVE') {
      return [ORDER_STATUS.PLACED, ORDER_STATUS.ACCEPTED, ORDER_STATUS.PREPARING, ORDER_STATUS.READY_FOR_PICKUP].includes(o.status);
    }
    if (activeTab === 'CANCELLED') {
      return o.status === ORDER_STATUS.CANCELLED || o.status === ORDER_STATUS.REFUNDED;
    }
    if (activeTab === 'COMPLETED') {
      return o.status === ORDER_STATUS.COMPLETED;
    }
    return true;
  });

  return (
    <div>
      {/* Admin-styled PageHeader */}
      <PageHeader
        title="My Orders & Refund Management"
        description="Monitor real-time kitchen preparation, view payment transaction IDs, cancel eligible pre-orders, and track instant refund settlements."
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Button
              variant="secondary"
              icon={RefreshCw}
              onClick={loadUserOrders}
              loading={loading}
            >
              Refresh
            </Button>
            <Link to="/customer/menu">
              <Button variant="primary" icon={UtensilsCrossed}>
                Order Food
              </Button>
            </Link>
          </div>
        }
      />

      {/* Toast alert banner if action performed */}
      {feedbackToast && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 18px',
          borderRadius: 'var(--border-radius-md)',
          backgroundColor: feedbackToast.type === 'success' ? 'var(--color-success-bg)' : 'var(--color-info-bg)',
          color: feedbackToast.type === 'success' ? 'var(--color-success-text)' : 'var(--color-info-text)',
          border: `1px solid ${feedbackToast.type === 'success' ? 'var(--color-success-border)' : 'var(--color-info-border)'}`,
          marginBottom: '20px',
          fontSize: '13px'
        }}>
          <div>
            <strong style={{ display: 'block', fontSize: '13.5px', marginBottom: '2px' }}>{feedbackToast.title}</strong>
            <span>{feedbackToast.message}</span>
          </div>
          <button
            onClick={() => setFeedbackToast(null)}
            style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'inherit' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Filter Tabs Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '20px',
        borderBottom: '1px solid var(--border-color)',
        paddingBottom: '12px'
      }}>
        {[
          { id: 'ALL', label: `All Orders (${orders.length})` },
          { id: 'ACTIVE', label: `Active In-Progress (${orders.filter(o => [ORDER_STATUS.PLACED, ORDER_STATUS.ACCEPTED, ORDER_STATUS.PREPARING, ORDER_STATUS.READY_FOR_PICKUP].includes(o.status)).length})` },
          { id: 'CANCELLED', label: `Cancelled & Refunds (${orders.filter(o => o.status === ORDER_STATUS.CANCELLED || o.status === ORDER_STATUS.REFUNDED).length})` },
          { id: 'COMPLETED', label: `Completed (${orders.filter(o => o.status === ORDER_STATUS.COMPLETED).length})` }
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--border-radius-md)',
              border: '1px solid',
              borderColor: activeTab === tab.id ? 'var(--color-accent)' : 'var(--border-color)',
              backgroundColor: activeTab === tab.id ? 'var(--color-accent)' : 'var(--bg-surface)',
              color: activeTab === tab.id ? '#ffffff' : 'var(--text-secondary)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all var(--transition-fast)'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders List / Empty State */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          <p>Loading your orders and refund status...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <Card padding="48px 24px" style={{ textAlign: 'center' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: 'var(--color-primary-light)',
            color: 'var(--color-accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px auto'
          }}>
            <ShoppingBag size={32} />
          </div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
            No Orders Found in this Category
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '420px', margin: '0 auto 20px auto' }}>
            You do not have any orders matching the selected view. Browse campus canteens to order delicious meals.
          </p>
          <Link to="/customer/menu">
            <Button variant="primary" icon={UtensilsCrossed}>
              Explore Campus Menus
            </Button>
          </Link>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {filteredOrders.map((order) => {
            const currentStep = getStepIndex(order.status);
            const isCancelled = order.status === ORDER_STATUS.CANCELLED || order.status === ORDER_STATUS.REFUNDED;
            const eligibility = customerOrderService.evaluateCancellationEligibility(order);
            const canCancel = eligibility.eligible;
            const totalAmt = Number(order.totalAmount || order.pricing?.totalAmount || 0);
            const txnId = order.payment?.transactionId || order.transactionId || 'TXN-CAMPUS-DEMO';
            const payMethod = order.payment?.method || order.paymentMethod || 'Campus Wallet';
            const payStatus = order.payment?.status || order.paymentStatus || 'Paid';

            return (
              <Card
                key={order.id}
                title={`Order #${order.id}`}
                subtitle={`Placed: ${formatDateTime(order.createdAt || order.orderDate)} • ${order.outletName || 'Central Dining Hall'}`}
                actions={
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <StatusBadge status={order.status} />
                    {order.refundDetails && (
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color: order.refundDetails.status === 'Refund Successful' ? 'var(--color-success)' : 'var(--color-warning)',
                        backgroundColor: order.refundDetails.status === 'Refund Successful' ? 'var(--color-success-bg)' : 'var(--color-warning-bg)',
                        border: `1px solid ${order.refundDetails.status === 'Refund Successful' ? 'var(--color-success-border)' : 'var(--color-warning-border)'}`,
                        padding: '3px 8px',
                        borderRadius: 'var(--border-radius-full)'
                      }}>
                        {order.refundDetails.status}
                      </span>
                    )}
                    <Button
                      variant="secondary"
                      icon={QrCode}
                      onClick={() => setQrModalOrder(order)}
                    >
                      Pickup Token
                    </Button>
                  </div>
                }
                padding="20px"
              >
                {/* 5-Step Progress Bar (for active orders) */}
                {!isCancelled && (
                  <div style={{
                    padding: '20px 16px',
                    backgroundColor: 'var(--bg-app)',
                    borderRadius: 'var(--border-radius-md)',
                    border: '1px solid var(--border-color)',
                    marginBottom: '20px'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      position: 'relative'
                    }}>
                      <div style={{
                        position: 'absolute',
                        top: '14px',
                        left: '40px',
                        right: '40px',
                        height: '3px',
                        backgroundColor: 'var(--border-color)',
                        zIndex: 1
                      }}>
                        <div style={{
                          height: '100%',
                          backgroundColor: 'var(--color-accent)',
                          width: `${Math.max(0, (currentStep / (STEPS.length - 1)) * 100)}%`,
                          transition: 'width 0.4s ease'
                        }} />
                      </div>

                      {STEPS.map((step, idx) => {
                        const isDone = currentStep >= idx;
                        const isCurrent = currentStep === idx;

                        return (
                          <div
                            key={step.label}
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              zIndex: 2,
                              textAlign: 'center',
                              width: '120px'
                            }}
                          >
                            <div style={{
                              width: '30px',
                              height: '30px',
                              borderRadius: '50%',
                              backgroundColor: isDone ? 'var(--color-accent)' : 'var(--bg-surface)',
                              border: '2px solid',
                              borderColor: isDone ? 'var(--color-accent)' : 'var(--border-color)',
                              color: isDone ? '#ffffff' : 'var(--text-muted)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '12px',
                              fontWeight: 700,
                              boxShadow: isCurrent ? '0 0 0 4px var(--color-primary-border)' : 'none'
                            }}>
                              {isDone ? <CheckCircle size={14} /> : idx + 1}
                            </div>
                            <span style={{
                              fontSize: '12px',
                              fontWeight: isCurrent ? 700 : 500,
                              color: isDone ? 'var(--text-primary)' : 'var(--text-muted)',
                              marginTop: '8px'
                            }}>
                              {step.label}
                            </span>
                            <span style={{ fontSize: '10.5px', color: 'var(--text-placeholder)', marginTop: '2px' }}>
                              {step.desc}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Refund & Cancellation Status Card (if Cancelled/Refunded) */}
                {isCancelled && order.refundDetails && (
                  <div style={{
                    padding: '16px',
                    borderRadius: 'var(--border-radius-md)',
                    backgroundColor: order.refundDetails.status === 'Refund Successful' ? 'var(--color-success-bg)' : 'var(--color-warning-bg)',
                    border: `1px solid ${order.refundDetails.status === 'Refund Successful' ? 'var(--color-success-border)' : 'var(--color-warning-border)'}`,
                    marginBottom: '20px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <RotateCcw size={20} style={{ color: order.refundDetails.status === 'Refund Successful' ? 'var(--color-success)' : 'var(--color-warning)' }} />
                        <div>
                          <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                            {order.refundDetails.status}: ₹{Number(order.refundDetails.amount).toFixed(2)}
                          </h4>
                          <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
                            Reversal Destination: <strong>{order.refundDetails.sourceAccount}</strong> • Refund ID: <code>{order.refundDetails.refundId}</code>
                          </p>
                        </div>
                      </div>

                      <Button
                        variant="secondary"
                        onClick={() => setRefundModalOrder(order)}
                        style={{ padding: '4px 10px', fontSize: '12px' }}
                      >
                        Track Refund Settlement
                      </Button>
                    </div>

                    {order.cancellationReason && (
                      <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', margin: '8px 0 0 0', borderTop: '1px dashed var(--border-color)', paddingTop: '6px' }}>
                        <strong>Reason for cancellation:</strong> "{order.cancellationReason}"
                      </p>
                    )}
                  </div>
                )}

                {/* Order Details Grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '20px',
                  borderTop: '1px solid var(--border-color)',
                  paddingTop: '16px'
                }}>
                  {/* Left: Dishes list */}
                  <div>
                    <h4 style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', margin: '0 0 8px 0' }}>
                      Ordered Dishes:
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {(order.items || []).map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                          <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                            {item.quantity}x {item.name} {item.variant ? `(${typeof item.variant === 'object' ? (item.variant.name || item.variant.id) : item.variant})` : ''}
                          </span>
                          <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
                            ₹{(Number(item.price) * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right: Payment & Transaction Details Card */}
                  <div style={{
                    padding: '14px 18px',
                    borderRadius: 'var(--border-radius-md)',
                    backgroundColor: 'var(--bg-app)',
                    border: '1px solid var(--border-color)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '6px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Payment Method:</span>
                      <strong style={{ color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {payMethod.toLowerCase().includes('wallet') ? <Wallet size={13} /> : <CreditCard size={13} />}
                        {payMethod}
                      </strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '6px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Transaction ID:</span>
                      <code style={{ fontSize: '12px', color: 'var(--color-accent)' }}>{txnId}</code>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '6px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Payment Status:</span>
                      <strong style={{ color: payStatus === 'Paid' ? 'var(--color-success)' : payStatus === 'Refunded' ? 'var(--color-accent)' : 'var(--color-warning)' }}>
                        {payStatus}
                      </strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13.5px', borderTop: '1px solid var(--border-color-subtle)', paddingTop: '6px', marginTop: '6px' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Total Amount:</span>
                      <strong style={{ fontSize: '16px', color: 'var(--text-primary)' }}>₹{totalAmt.toFixed(2)}</strong>
                    </div>
                  </div>
                </div>

                {/* Bottom Action Bar */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px',
                  borderTop: '1px solid var(--border-color)',
                  paddingTop: '14px',
                  marginTop: '16px'
                }}>
                  {/* Left: View Full Details */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Button
                      variant="secondary"
                      icon={FileText}
                      onClick={() => setDetailsModalOrder(order)}
                    >
                      View Order Details
                    </Button>

                    {!isCancelled && order.status !== ORDER_STATUS.COMPLETED && (
                      <button
                        type="button"
                        onClick={() => handleAdvanceStatus(order.id, order.status)}
                        style={{
                          fontSize: '11px',
                          fontWeight: 600,
                          padding: '5px 10px',
                          borderRadius: 'var(--border-radius-sm)',
                          backgroundColor: 'var(--bg-muted)',
                          border: '1px solid var(--border-color)',
                          color: 'var(--text-primary)',
                          cursor: 'pointer'
                        }}
                        title="Simulate kitchen state advancement"
                      >
                        Advance Kitchen Stage ➔
                      </button>
                    )}
                  </div>

                  {/* Right: Cancel button OR Ineligibility Explanation */}
                  <div>
                    {canCancel ? (
                      <Button
                        variant="danger"
                        onClick={() => handleInitiateCancel(order)}
                      >
                        Cancel Order & Get Refund
                      </Button>
                    ) : !isCancelled && order.status !== ORDER_STATUS.COMPLETED ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
                        <Info size={14} style={{ color: 'var(--color-warning)' }} />
                        <span>{eligibility.reason}</span>
                      </div>
                    ) : null}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Cancellation Confirmation Modal */}
      {cancelModalOpen && (
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
        }} onClick={() => setCancelModalOpen(false)}>
          <div style={{
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--border-radius-xl)',
            padding: '28px',
            maxWidth: '480px',
            width: '100%',
            boxShadow: 'var(--shadow-modal)',
            border: '1px solid var(--border-color)'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-danger-bg)',
                color: 'var(--color-danger)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <AlertCircle size={20} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Cancel Order #{orderToCancel?.id}?
              </h3>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '16px' }}>
              Are you sure you want to cancel this meal order? An automatic refund of <strong>₹{Number(orderToCancel?.totalAmount || orderToCancel?.pricing?.totalAmount || 0).toFixed(2)}</strong> will be credited directly back to your payment account.
            </p>

            {/* Reason Selector */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                Please select a cancellation reason:
              </label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 'var(--border-radius-md)',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-app)',
                  color: 'var(--text-primary)',
                  fontSize: '13px'
                }}
              >
                <option value="Class / lecture schedule rescheduled">Class / lecture schedule rescheduled</option>
                <option value="Accidentally placed duplicate order">Accidentally placed duplicate order</option>
                <option value="Wait time too long / change of dining plan">Wait time too long / change of dining plan</option>
                <option value="Selected wrong canteen outlet">Selected wrong canteen outlet</option>
                <option value="Other">Other reason...</option>
              </select>
            </div>

            {cancelReason === 'Other' && (
              <div style={{ marginBottom: '18px' }}>
                <textarea
                  rows={2}
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Please specify why you are cancelling..."
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--border-radius-md)',
                    border: '1px solid var(--border-color)',
                    fontSize: '13px',
                    backgroundColor: 'var(--bg-app)',
                    color: 'var(--text-primary)'
                  }}
                />
              </div>
            )}

            {/* Refund Settlement Notice */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 14px',
              borderRadius: 'var(--border-radius-md)',
              backgroundColor: 'var(--color-primary-light)',
              color: 'var(--color-primary)',
              fontSize: '12px',
              marginBottom: '20px'
            }}>
              <ShieldCheck size={16} style={{ flexShrink: 0 }} />
              <span>Full refund guarantee: Funds are credited immediately to your Smartcard Dining Wallet or reversed via UPI.</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <Button variant="secondary" onClick={() => setCancelModalOpen(false)}>
                Keep Order
              </Button>
              <Button variant="danger" loading={cancelling} onClick={handleConfirmCancel}>
                Confirm Cancellation & Refund
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {detailsModalOrder && (
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
        }} onClick={() => setDetailsModalOrder(null)}>
          <div style={{
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--border-radius-xl)',
            padding: '28px',
            maxWidth: '520px',
            width: '100%',
            boxShadow: 'var(--shadow-modal)',
            border: '1px solid var(--border-color)',
            maxHeight: '90vh',
            overflowY: 'auto',
            position: 'relative'
          }} onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setDetailsModalOrder(null)}
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

            <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px 0' }}>
              Order Specification #{detailsModalOrder.id}
            </h3>
            <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Token: <strong>{detailsModalOrder.token || 'T-101'}</strong> • {detailsModalOrder.outletName || 'Central Dining Hall'}
            </p>

            {/* Customer Details */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '10px',
              padding: '12px',
              backgroundColor: 'var(--bg-app)',
              borderRadius: 'var(--border-radius-md)',
              fontSize: '12.5px',
              marginBottom: '16px'
            }}>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Customer:</span>
                <div style={{ fontWeight: 600 }}>{detailsModalOrder.customer?.name || user?.fullName}</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>ID / Roll No:</span>
                <div style={{ fontWeight: 600 }}>{detailsModalOrder.customer?.rollNo || user?.rollNo || '2023-CSE-042'}</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Payment Mode:</span>
                <div style={{ fontWeight: 600 }}>{detailsModalOrder.payment?.method || detailsModalOrder.paymentMethod || 'Campus Wallet'}</div>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Transaction ID:</span>
                <div style={{ fontWeight: 600, color: 'var(--color-accent)' }}>{detailsModalOrder.payment?.transactionId || 'TXN-994102'}</div>
              </div>
            </div>

            {/* Items Table */}
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', margin: '0 0 8px 0' }}>
                Itemized Dishes:
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {(detailsModalOrder.items || []).map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', borderBottom: '1px solid var(--border-color-subtle)', paddingBottom: '6px' }}>
                    <div>
                      <span style={{ fontWeight: 500 }}>{item.quantity}x {item.name}</span>
                      {item.variant && (
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>
                          ({typeof item.variant === 'object' ? (item.variant.name || item.variant.id) : item.variant})
                        </span>
                      )}
                    </div>
                    <span style={{ fontWeight: 600 }}>₹{(Number(item.price) * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Total */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '16px',
              fontWeight: 800,
              borderTop: '1px solid var(--border-color)',
              paddingTop: '10px',
              marginBottom: '20px'
            }}>
              <span>Total Paid:</span>
              <span style={{ color: 'var(--color-accent)' }}>
                ₹{Number(detailsModalOrder.totalAmount || detailsModalOrder.pricing?.totalAmount || 0).toFixed(2)}
              </span>
            </div>

            {/* Timeline */}
            {detailsModalOrder.timeline && detailsModalOrder.timeline.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', margin: '0 0 8px 0' }}>
                  Lifecycle Audit Trail:
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                  {detailsModalOrder.timeline.map((t, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                      <span style={{ color: 'var(--color-accent)', fontWeight: 700 }}>•</span>
                      <div>
                        <strong>{t.status}</strong> <span style={{ color: 'var(--text-muted)' }}>({t.timestamp})</span>: {t.note}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="primary" onClick={() => setDetailsModalOrder(null)}>
                Close Details
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Track Refund Details Modal */}
      {refundModalOrder && refundModalOrder.refundDetails && (
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
        }} onClick={() => setRefundModalOrder(null)}>
          <div style={{
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--border-radius-xl)',
            padding: '28px',
            maxWidth: '460px',
            width: '100%',
            boxShadow: 'var(--shadow-modal)',
            border: '1px solid var(--border-color)',
            position: 'relative'
          }} onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setRefundModalOrder(null)}
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

            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-success-bg)',
                color: 'var(--color-success)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 10px auto'
              }}>
                <CheckCircle size={26} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                Refund Settlement Confirmation
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                Order #{refundModalOrder.id}
              </p>
            </div>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              padding: '16px',
              backgroundColor: 'var(--bg-app)',
              borderRadius: 'var(--border-radius-md)',
              fontSize: '13px',
              marginBottom: '20px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Refund Amount:</span>
                <strong style={{ fontSize: '16px', color: 'var(--color-success)' }}>
                  ₹{Number(refundModalOrder.refundDetails.amount).toFixed(2)}
                </strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Refund Status:</span>
                <span style={{
                  fontWeight: 700,
                  color: 'var(--color-success)',
                  backgroundColor: 'var(--color-success-bg)',
                  padding: '1px 8px',
                  borderRadius: 'var(--border-radius-full)',
                  fontSize: '11.5px'
                }}>
                  {refundModalOrder.refundDetails.status}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Refund Reference ID:</span>
                <code style={{ color: 'var(--color-accent)' }}>{refundModalOrder.refundDetails.refundId}</code>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Reversal Gateway Ref:</span>
                <code>{refundModalOrder.refundDetails.referenceId}</code>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Credited Destination:</span>
                <strong>{refundModalOrder.refundDetails.sourceAccount}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Settlement Timestamp:</span>
                <span>{formatDateTime(refundModalOrder.refundDetails.processedAt)}</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="primary" onClick={() => setRefundModalOrder(null)}>
                Acknowledged
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Pickup Token QR Modal */}
      {qrModalOrder && (
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
        }} onClick={() => setQrModalOrder(null)}>
          <div style={{
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--border-radius-xl)',
            padding: '32px',
            maxWidth: '380px',
            width: '100%',
            textAlign: 'center',
            boxShadow: 'var(--shadow-modal)',
            border: '1px solid var(--border-color)',
            position: 'relative'
          }} onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setQrModalOrder(null)}
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

            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Counter Pickup Token
            </span>
            <h1 style={{ fontSize: '42px', fontWeight: 900, color: 'var(--color-accent)', margin: '8px 0' }}>
              {qrModalOrder.token || 'T-101'}
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              {qrModalOrder.outletName || 'Campus Canteen'} • Counter 02
            </p>

            <div style={{
              width: '180px',
              height: '180px',
              margin: '0 auto 20px auto',
              backgroundColor: '#ffffff',
              border: '2px solid var(--border-color)',
              borderRadius: 'var(--border-radius-lg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px'
            }}>
              <QrCode size={148} color="#0f172a" />
            </div>

            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
              Show this screen to the canteen counter attendant upon token announcement.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyOrdersPage;
