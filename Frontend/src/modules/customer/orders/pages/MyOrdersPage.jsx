import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ClipboardList, Box, CreditCard, Clock, ArrowRight, ArrowLeft, Check, UtensilsCrossed, X, MapPin, Ticket, ReceiptText, RefreshCw, Ban, Star } from 'lucide-react';
import { useAuth } from '../../../../app/providers/AuthProvider';
import { SafeImage } from '../../../../components/common/SafeImage';
import { customerOrderService } from '../services/customerOrderService';
import { customerMenuService } from '../../menu/services/customerMenuService';
import { orderService } from '../../../admin/orders/services/orderService';
import { feedbackService } from '../../../admin/feedback/services/feedbackService';
import { inMemoryRatedOrderIds } from '../../feedback/components/FoodRatingModal';
import { notifyOrderStatusUpdated, subscribeToOrderSync } from '../../../../utils/orderSync';
import { Pagination } from '../../../../components/common/Pagination';
import styles from '../styles/myOrdersReference.module.css';

const flow = ['Placed', 'Accepted', 'Preparing', 'Ready for Pickup', 'Completed'];
const terminal = ['Completed', 'Collected', 'Cancelled', 'Refunded'];
const money = value => `₹${Number(value || 0).toFixed(0)}`;
const dateTime = value => value ? new Date(value).toLocaleString([], { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

const Timeline = ({ status }) => {
  const normalizedStatus = (status === 'Collected') ? 'Completed' : status;
  const current = flow.indexOf(normalizedStatus);
  return <div className={styles.timeline}>{flow.map((step, index) => <div key={step} className={`${styles.step} ${index < current ? styles.done : ''} ${index === current ? styles.current : ''}`}><div className={styles.dot}>{index <= current && <Check size={13} />}</div><div>{step}</div></div>)}</div>;
};

export const MyOrdersPage = () => {
  const { user } = useAuth(); const location = useLocation();
  const [orders, setOrders] = useState([]); const [loading, setLoading] = useState(true); const [tab, setTab] = useState('active'); const [notice, setNotice] = useState(null); const [menuImages, setMenuImages] = useState({}); const [trackedOrder, setTrackedOrder] = useState(null);
  const [ratedOrderIds, setRatedOrderIds] = useState(new Set());
  const [trackingRefreshing, setTrackingRefreshing] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState(null);
  const [cancelReason, setCancelReason] = useState('Changed my mind');
  const [cancelling, setCancelling] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPageSize, setHistoryPageSize] = useState(5);
  const [paymentPage, setPaymentPage] = useState(1);
  const [paymentPageSize, setPaymentPageSize] = useState(5);
  const isFetchingRef = useRef(false);
  const isTrackingFetchingRef = useRef(false);

  const handleConfirmCancel = async () => {
    if (!orderToCancel) return;
    const finalReason = cancelReason.trim() || 'Cancelled by customer';
    try {
      setCancelling(true);
      await customerOrderService.cancelAndRefundOrder(orderToCancel.id, finalReason, user);
      setOrders(prev => prev.map(o => String(o.id) === String(orderToCancel.id) ? { ...o, status: 'Cancelled', cancellationReason: finalReason } : o));
      if (trackedOrder && String(trackedOrder.id) === String(orderToCancel.id)) {
        setTrackedOrder(prev => ({ ...prev, status: 'Cancelled', cancellationReason: finalReason }));
      }
      notifyOrderStatusUpdated({ ...orderToCancel, status: 'Cancelled', cancellationReason: finalReason });
      setNotice(`Order #${orderToCancel.id} has been cancelled successfully.`);
      setOrderToCancel(null);
      setCancelReason('Changed my mind');
    } catch (err) {
      alert(err.message || 'Could not cancel order.');
    } finally {
      setCancelling(false);
    }
  };
  const handleRefreshTracked = async () => {
    if (!trackedOrder?.id || isTrackingFetchingRef.current) return;
    try {
      isTrackingFetchingRef.current = true;
      setTrackingRefreshing(true);
      const fresh = await orderService.getById(trackedOrder.id);
      if (fresh && fresh.id) {
        setTrackedOrder(prev => (prev && String(prev.id) === String(fresh.id) ? { ...prev, ...fresh } : prev));
        setOrders(prev => prev.map(o => String(o.id) === String(fresh.id) ? { ...o, ...fresh } : o));
        notifyOrderStatusUpdated(fresh);
      }
    } catch { }
    finally {
      setTrackingRefreshing(false);
      isTrackingFetchingRef.current = false;
    }
  };
  const load = useCallback(async () => {
    if (isFetchingRef.current) return;
    try {
      isFetchingRef.current = true;
      setLoading(true);
      const list = await customerOrderService.getCustomerOrders(user);
      setOrders(Array.isArray(list) ? list : []);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [user]);

  useEffect(() => {
    load();
    const handleSync = () => load();
    const unsubscribe = subscribeToOrderSync(handleSync, handleSync);
    return () => {
      unsubscribe();
    };
  }, [load]);

  // Gentle background poll for active order ONLY when tracking modal is open
  useEffect(() => {
    if (!trackedOrder?.id || terminal.includes(trackedOrder.status)) return;
    const interval = setInterval(async () => {
      if (isTrackingFetchingRef.current) return;
      try {
        isTrackingFetchingRef.current = true;
        const fresh = await orderService.getById(trackedOrder.id);
        if (fresh && fresh.id) {
          setTrackedOrder(prev => (prev && String(prev.id) === String(fresh.id) ? { ...prev, ...fresh } : prev));
          setOrders(prev => prev.map(o => String(o.id) === String(fresh.id) ? { ...o, ...fresh } : o));
          notifyOrderStatusUpdated(fresh);
        }
      } catch { }
      finally {
        isTrackingFetchingRef.current = false;
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [trackedOrder?.id, trackedOrder?.status]);
  useEffect(() => {
    customerMenuService.getAllFoodItems().then((items) => {
      const imageIndex = (Array.isArray(items) ? items : []).reduce((index, item) => {
        if (!item?.imageUrl) return index;
        if (item.id) index[`id:${String(item.id)}`] = item.imageUrl;
        if (item.name) index[`name:${item.name.trim().toLowerCase()}`] = item.imageUrl;
        return index;
      }, {});
      setMenuImages(imageIndex);
    });
  }, []);

  // Fetch already rated order IDs from backend feedback service
  useEffect(() => {
    feedbackService.getAll().then((list) => {
      const ids = new Set((Array.isArray(list) ? list : []).map(f => String(f.orderId || '').trim()).filter(Boolean));
      setRatedOrderIds(ids);
    }).catch(() => { });
  }, []);

  // Listen for real-time feedback submissions to immediately hide the Rate Food button
  useEffect(() => {
    const handleFeedbackCreated = (e) => {
      const ordId = String(e.detail?.orderId || '').trim();
      if (ordId) {
        setRatedOrderIds(prev => new Set([...prev, ordId]));
      }
    };
    window.addEventListener('cms:feedback_created', handleFeedbackCreated);
    return () => window.removeEventListener('cms:feedback_created', handleFeedbackCreated);
  }, []);

  // Listen for direct event triggers to open live order tracking modal
  useEffect(() => {
    const handleOpenTracker = (e) => {
      const ord = e.detail?.order;
      if (ord) {
        setTrackedOrder(ord);
        setTab('active');
      }
    };
    window.addEventListener('cms:open-order-tracker', handleOpenTracker);
    return () => window.removeEventListener('cms:open-order-tracker', handleOpenTracker);
  }, []);

  // Handle new order notice & external tracking requests from floating bubble or profile status
  useEffect(() => {
    if (location.state?.newOrderId) {
      setNotice(`Order #${location.state.newOrderId} has been placed successfully.`);
      window.history.replaceState({}, document.title);
    }
    if (location.state?.trackOrder) {
      setTrackedOrder(location.state.trackOrder);
      setTab('active');
      window.history.replaceState({}, document.title);
    } else if (location.state?.trackOrderId && orders.length > 0) {
      const match = orders.find(o => String(o.id) === String(location.state.trackOrderId));
      if (match) {
        setTrackedOrder(match);
        setTab('active');
        window.history.replaceState({}, document.title);
      }
    }
  }, [location.state, orders]);
  const active = useMemo(() => orders.filter(order => !terminal.includes(order.status)), [orders]);
  const history = useMemo(() => {
    const list = orders.filter(order => terminal.includes(order.status));
    return list.sort((a, b) => {
      const timeA = new Date(a.orderDate || a.createdAt || 0).getTime();
      const timeB = new Date(b.orderDate || b.createdAt || 0).getTime();
      return timeB - timeA;
    });
  }, [orders]);

  const paginatedHistory = useMemo(() => {
    const start = (historyPage - 1) * historyPageSize;
    return history.slice(start, start + historyPageSize);
  }, [history, historyPage, historyPageSize]);

  const payments = useMemo(() => {
    const list = orders
      .filter(order => order.payment || order.paymentStatus)
      .map(order => ({
        ...order,
        payment: order.payment || {
          status: order.paymentStatus,
          amount: order.totalAmount,
          transactionId: '—'
        }
      }));
    // Sort recently paid payments to the top of the table
    return list.sort((a, b) => {
      const timeA = new Date(a.payment?.paidAt || a.orderDate || a.createdAt || 0).getTime();
      const timeB = new Date(b.payment?.paidAt || b.orderDate || b.createdAt || 0).getTime();
      return timeB - timeA;
    });
  }, [orders]);

  const paginatedPayments = useMemo(() => {
    const start = (paymentPage - 1) * paymentPageSize;
    return payments.slice(start, start + paymentPageSize);
  }, [payments, paymentPage, paymentPageSize]);

  const displayed = tab === 'active' ? active : tab === 'history' ? paginatedHistory : paginatedPayments;

  const Order = ({ order }) => {
    const firstItem = order.items?.[0] || {};
    const matchingImage = menuImages[`id:${String(firstItem.id || '')}`] || menuImages[`name:${String(firstItem.name || '').trim().toLowerCase()}`];
    const isCompletedOrTerminal = terminal.includes(order.status);
    const isCancellable = order.status === 'Placed' || order.status === 'Accepted';
    const orderKey = String(order.id || order.orderId || '').trim();
    const isOrderRated = ratedOrderIds.has(orderKey) ||
      inMemoryRatedOrderIds.has(orderKey) ||
      (order.id && (ratedOrderIds.has(`ORD-${order.id}`) || inMemoryRatedOrderIds.has(`ORD-${order.id}`))) ||
      (order.orderId && (ratedOrderIds.has(String(order.orderId)) || inMemoryRatedOrderIds.has(String(order.orderId))));

    const getStatusClass = (st) => {
      const s = String(st || '').toLowerCase();
      if (s.includes('accept')) return styles.accepted;
      if (s.includes('cancel') || s.includes('refund')) return styles.cancelled;
      if (s.includes('prep') || s.includes('cook')) return styles.preparing;
      return styles.completedBadge;
    };

    return (
      <div className={styles.order}>
        <div className={styles.orderTop}>
          <SafeImage
            className={styles.thumbnail}
            src={firstItem.imageUrl || matchingImage}
            alt={firstItem.name || 'Order meal'}
            fallback={
              <div className={styles.thumbnail} style={{ display: 'grid', placeItems: 'center', background: 'var(--bg-muted, #f1f5f9)', color: 'var(--text-muted, #94a3b8)' }}>
                <UtensilsCrossed size={20} />
              </div>
            }
          />
          <div className={styles.orderInfo}>
            <h3 style={{ margin: 0, fontSize: '14.5px', fontWeight: 700 }}>Order #{order.id}</h3>
            <div className={styles.items}>
              {(order.items || []).map(item => `${item.name} × ${item.quantity}`).join(', ') || 'Order items'}
            </div>
            <div className={styles.meta}>
              <span>▣ {dateTime(order.orderDate || order.createdAt)}</span>
              <span>│</span>
              <span>▣ {order.outletName || order.outlet?.name || 'Campus Canteen'}</span>
              {order.token && <span>│ ▣ Token: <b>{order.token}</b></span>}
            </div>
            {String(order.payment?.status || order.paymentStatus || '').toLowerCase() === 'pending verification' && (
              <div style={{ marginTop: '4px', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#c2410c', backgroundColor: '#fff7ed', padding: '2px 8px', borderRadius: '4px', border: '1px solid #ffedd5', fontWeight: 600 }}>
                <span>⏳ Payment Under Verification</span>
                {order.payment?.transactionId && !order.payment.transactionId.startsWith('TXN-') && (
                  <span>({order.payment.transactionId})</span>
                )}
              </div>
            )}
            {order.cancellationReason && (
              <div style={{ fontSize: '11px', color: '#dc2626', marginTop: '3px' }}>
                Cancellation Reason: {order.cancellationReason}
              </div>
            )}
          </div>
          <div className={styles.orderRight}>
            <strong className={styles.amount}>{money(order.totalAmount || order.pricing?.totalAmount)}</strong>
            {!isCompletedOrTerminal ? (
              <button type="button" className={styles.track} onClick={() => setTrackedOrder(order)} title="Track live order status">
                Track Order <ArrowRight size={12} />
              </button>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                <span className={`${styles.status} ${getStatusClass(order.status)}`} style={{ padding: '3px 10px', fontSize: '11px' }}>
                  {order.status}
                </span>
                {(order.status === 'Completed' || order.status === 'Collected') && !isOrderRated && (
                  <button
                    type="button"
                    onClick={() => {
                      const enriched = {
                        ...order,
                        imageUrl: order.imageUrl || matchingImage,
                        items: (order.items || []).map((it, idx) => ({
                          ...it,
                          imageUrl: it.imageUrl || (idx === 0 ? matchingImage : (menuImages[`id:${String(it.id || '')}`] || menuImages[`name:${String(it.name || '').trim().toLowerCase()}`]))
                        }))
                      };
                      window.dispatchEvent(new CustomEvent('cms:open-dish-feedback', { detail: { order: enriched } }));
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      border: '1px solid #fde68a',
                      backgroundColor: '#fffbeb',
                      color: '#b45309',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    title="Rate & Review Dish"
                  >
                    <Star size={11} fill="#f59e0b" color="#f59e0b" />
                    <span>Rate Food</span>
                  </button>
                )}
              </div>
            )}
            {isCancellable && (
              <button
                type="button"
                onClick={() => setOrderToCancel(order)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  border: '1px solid #fecaca',
                  backgroundColor: '#fef2f2',
                  color: '#dc2626',
                  fontSize: '10.5px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
                title="Cancel this order"
              >
                <Ban size={11} />
                <span>Cancel Order</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };
  return <div className={styles.page}>
    <Link
      to="/customer/dashboard"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 14px',
        borderRadius: '8px',
        border: '1px solid var(--border-color, #e2e8f0)',
        backgroundColor: 'var(--bg-surface, #ffffff)',
        color: 'var(--text-primary, #1e293b)',
        fontSize: '12.5px',
        fontWeight: 600,
        textDecoration: 'none',
        marginBottom: '14px',
        width: 'fit-content',
        transition: 'all 0.2s ease',
        boxShadow: 'var(--shadow-xs, 0 1px 2px rgba(0,0,0,0.05))'
      }}
      title="Back to Menu"
    >
      <ArrowLeft size={15} />
      <span>Back to Menu</span>
    </Link>
    <div className={styles.heading}><span className={styles.headingIcon}><ClipboardList size={32} /></span><div><h1>My Orders</h1><p>Track your orders, view past orders and payment details.</p></div></div>
    {notice && <div style={{ background: '#e8f1ff', border: '1px solid #aecaff', color: '#1d4ed8', padding: 12, borderRadius: 12, marginBottom: 12, fontWeight: 700 }}>{notice}<button type="button" onClick={() => setNotice(null)} style={{ float: 'right', border: 0, background: 'none', cursor: 'pointer' }}>×</button></div>}
    <div className={styles.tabs}>
      <button type="button" className={`${styles.tab} ${tab === 'active' ? styles.tabActive : ''}`} onClick={() => { setTab('active'); }}>
        <Box size={14} /> Active Orders ({active.length})
      </button>
      <button type="button" className={`${styles.tab} ${tab === 'history' ? styles.tabActive : ''}`} onClick={() => { setTab('history'); setHistoryPage(1); }}>
        <Clock size={14} /> Order History ({history.length})
      </button>
      <button type="button" className={`${styles.tab} ${tab === 'payments' ? styles.tabActive : ''}`} onClick={() => { setTab('payments'); setPaymentPage(1); }}>
        <CreditCard size={14} /> Payments ({payments.length})
      </button>
    </div>
    <div className={styles.grid}>
      <section className={styles.card}>
        <div className={styles.cardHead}>
          <div>
            <h2>{tab === 'active' ? `Active Orders (${active.length})` : tab === 'history' ? `Order History (${history.length})` : `Payment History (${payments.length})`}</h2>
            <p className={styles.muted}>{tab === 'active' ? 'Your current and in-progress orders.' : tab === 'history' ? 'Your completed and cancelled orders.' : 'Your authorised canteen payment transactions.'}</p>
          </div>
          {tab !== 'payments' && <Link className={styles.link} to="/customer/dashboard">Order food <ArrowRight size={16} /></Link>}
        </div>
        {loading ? (
          <div className={styles.empty}>Loading your orders…</div>
        ) : tab === 'payments' ? (
          <>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Transaction ID</th>
                  <th>Order ID</th>
                  <th>Date & Time</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {paginatedPayments.map(order => (
                  <tr key={order.id}>
                    <td>{order.payment?.transactionId || '—'}</td>
                    <td>#{order.id}</td>
                    <td>{dateTime(order.payment?.paidAt || order.orderDate)}</td>
                    <td><b>{money(order.payment?.amount || order.totalAmount)}</b></td>
                    <td><span className={styles.pay}>{order.payment?.status || 'Pending'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {payments.length === 0 && (
              <div className={styles.empty}>
                <CreditCard size={38} />
                <h3>No Payment Records Found</h3>
                <p>You do not have completed payment transactions yet.</p>
              </div>
            )}
            {payments.length > 0 && (
              <div style={{ marginTop: '14px' }}>
                <Pagination
                  currentPage={paymentPage}
                  totalItems={payments.length}
                  pageSize={paymentPageSize}
                  onPageChange={setPaymentPage}
                  onPageSizeChange={(size) => {
                    setPaymentPageSize(size);
                    setPaymentPage(1);
                  }}
                  pageSizeOptions={[5, 10, 15, 20]}
                />
              </div>
            )}
          </>
        ) : displayed.length ? (
          <>
            {displayed.map(order => <Order key={order.id} order={order} />)}
            {tab === 'history' && history.length > 0 && (
              <div style={{ marginTop: '14px' }}>
                <Pagination
                  currentPage={historyPage}
                  totalItems={history.length}
                  pageSize={historyPageSize}
                  onPageChange={setHistoryPage}
                  onPageSizeChange={(size) => {
                    setHistoryPageSize(size);
                    setHistoryPage(1);
                  }}
                  pageSizeOptions={[5, 10, 15, 20]}
                />
              </div>
            )}
          </>
        ) : (
          <div className={styles.empty}>
            <ClipboardList size={42} />
            <h3>No Orders Found</h3>
            <p>You do not have orders in this category yet.</p>
            <Link className={styles.link} to="/customer/dashboard"><UtensilsCrossed size={16} /> Browse Food Menu</Link>
          </div>
        )}
      </section>
    </div>
    {trackedOrder && <div className={styles.modalBackdrop} role="presentation" onClick={() => setTrackedOrder(null)}><section className={styles.trackingModal} role="dialog" aria-modal="true" aria-label={`Track order ${trackedOrder.id}`} onClick={event => event.stopPropagation()}><div style={{ position: 'absolute', right: 18, top: 18, display: 'flex', alignItems: 'center', gap: 8 }}><button type="button" onClick={handleRefreshTracked} disabled={trackingRefreshing} style={{ border: '1px solid var(--border-color, #cbd5e1)', background: 'var(--bg-muted, #edf4fc)', borderRadius: 8, padding: '5px 12px', display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, color: 'var(--color-accent, #2563eb)', cursor: 'pointer' }} title="Refresh live status"><RefreshCw size={13} style={{ animation: trackingRefreshing ? 'spin 0.8s linear infinite' : 'none' }} /><span>{trackingRefreshing ? 'Checking…' : 'Refresh'}</span></button><button type="button" className={styles.close} style={{ position: 'static' }} onClick={() => setTrackedOrder(null)} aria-label="Close tracking details"><X size={21} /></button></div><span className={styles.trackLabel}>LIVE ORDER TRACKING</span><h2>Order #{trackedOrder.id}</h2><p className={styles.muted}>Follow your order from kitchen acceptance to pickup.</p><div className={styles.trackSummary}><div><Ticket size={18} /><span><small>Pickup token</small><strong>{trackedOrder.token || 'Awaiting token'}</strong></span></div><div><MapPin size={18} /><span><small>Pickup outlet</small><strong>{trackedOrder.outletName || trackedOrder.outlet?.name || 'Campus Canteen'}</strong></span></div><div><ReceiptText size={18} /><span><small>Order total</small><strong>{money(trackedOrder.totalAmount || trackedOrder.pricing?.totalAmount)}</strong></span></div></div>{(trackedOrder.notes || trackedOrder.cookingNotes) && (<div style={{ margin: '12px 0 6px', padding: '10px 14px', borderRadius: 10, backgroundColor: '#fffbeb', border: '1px solid #fde68a', color: '#92400e', fontSize: 12.5 }}><strong style={{ color: '#b45309', display: 'block', marginBottom: 2 }}>Special Cooking Notes:</strong><span>{trackedOrder.notes || trackedOrder.cookingNotes}</span></div>)}<div className={styles.modalTimeline}><Timeline status={trackedOrder.status} /></div><h3 className={styles.modalTitle}>Order items</h3><div className={styles.trackItems}>{(trackedOrder.items || []).map((item, index) => <div key={`${item.id || item.name}-${index}`} className={styles.trackItem}><SafeImage src={item.imageUrl || menuImages[`id:${String(item.id || '')}`] || menuImages[`name:${String(item.name || '').trim().toLowerCase()}`]} alt="" fallback={<div style={{ width: 44, height: 44, borderRadius: 8, display: 'grid', placeItems: 'center', background: 'var(--bg-muted, #f1f5f9)', color: 'var(--text-muted, #94a3b8)' }}><UtensilsCrossed size={16} /></div>} /><span>{item.name} × {item.quantity}</span><b>{money(Number(item.price || 0) * Number(item.quantity || 1))}</b></div>)}</div><div className={styles.trackFooter}><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span className={`${styles.status} ${trackedOrder.status === 'Accepted' ? styles.accepted : trackedOrder.status === 'Cancelled' ? styles.cancelled : ''}`}>{trackedOrder.status}</span>{trackedOrder.cancellationReason && <span style={{ fontSize: 11, color: '#dc2626' }}>Reason: {trackedOrder.cancellationReason}</span>}</div><div style={{ display: 'flex', alignItems: 'center', gap: 12 }}><span>Payment: <b>{trackedOrder.payment?.status || trackedOrder.paymentStatus || 'Pending'}</b></span>{(() => {
      const trackedKey = String(trackedOrder.id || trackedOrder.orderId || '').trim();
      const isTrackedRated = ratedOrderIds.has(trackedKey) ||
        inMemoryRatedOrderIds.has(trackedKey) ||
        (trackedOrder.id && (ratedOrderIds.has(`ORD-${trackedOrder.id}`) || inMemoryRatedOrderIds.has(`ORD-${trackedOrder.id}`))) ||
        (trackedOrder.orderId && (ratedOrderIds.has(String(trackedOrder.orderId)) || inMemoryRatedOrderIds.has(String(trackedOrder.orderId))));
      return (trackedOrder.status === 'Completed' || trackedOrder.status === 'Collected') && !isTrackedRated && (<button type="button" onClick={() => {
        const firstTrackItem = trackedOrder.items?.[0] || {};
        const matchingTrackImage = menuImages[`id:${String(firstTrackItem.id || '')}`] || menuImages[`name:${String(firstTrackItem.name || '').trim().toLowerCase()}`];
        const enriched = {
          ...trackedOrder,
          imageUrl: trackedOrder.imageUrl || matchingTrackImage,
          items: (trackedOrder.items || []).map((it, idx) => ({
            ...it,
            imageUrl: it.imageUrl || (idx === 0 ? matchingTrackImage : (menuImages[`id:${String(it.id || '')}`] || menuImages[`name:${String(it.name || '').trim().toLowerCase()}`]))
          }))
        };
        window.dispatchEvent(new CustomEvent('cms:open-dish-feedback', { detail: { order: enriched } }));
      }} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, border: '1px solid #fde68a', backgroundColor: '#fffbeb', color: '#b45309', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}><Star size={13} fill="#f59e0b" color="#f59e0b" /><span>Rate Food</span></button>);
    })()}{(trackedOrder.status === 'Placed' || trackedOrder.status === 'Accepted') && (<button type="button" onClick={() => setOrderToCancel(trackedOrder)} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, border: '1px solid #fecaca', backgroundColor: '#fef2f2', color: '#dc2626', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}><Ban size={13} /><span>Cancel Order</span></button>)}</div></div></section></div>}
    {orderToCancel && (
      <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: '16px' }} onClick={() => !cancelling && setOrderToCancel(null)}>
        <div style={{ backgroundColor: 'var(--bg-surface, #ffffff)', borderRadius: '16px', border: '1px solid var(--border-color, #e2e8f0)', maxWidth: '460px', width: '100%', padding: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.25)', color: 'var(--text-primary)' }} onClick={(e) => e.stopPropagation()}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#fee2e2', color: '#dc2626', display: 'grid', placeItems: 'center', flexShrink: 0 }}><Ban size={20} /></div>
            <div>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700 }}>Cancel Order #{orderToCancel.id}</h3>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>This order will be cancelled immediately.</span>
            </div>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: 1.5 }}>
            Are you sure you want to cancel this order? Kitchen preparation will be cancelled and cancellation will be recorded.
          </p>
          <div style={{ marginBottom: '14px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Reason for Cancellation:</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
              {['Ordered wrong item', 'Changed my mind', 'Taking too long', 'Leaving campus'].map((r) => (
                <button key={r} type="button" onClick={() => setCancelReason(r)} style={{ padding: '4px 9px', borderRadius: '6px', border: '1px solid', borderColor: cancelReason === r ? '#dc2626' : 'var(--border-color, #cbd5e1)', backgroundColor: cancelReason === r ? '#fee2e2' : 'var(--bg-muted, #f1f5f9)', color: cancelReason === r ? '#dc2626' : 'var(--text-secondary)', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>{r}</button>
              ))}
            </div>
            <input type="text" placeholder="Or type custom reason..." value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border-color, #cbd5e1)', fontSize: '13px', outline: 'none', backgroundColor: 'var(--bg-app, #f8fafc)', color: 'var(--text-primary)' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button type="button" disabled={cancelling} onClick={() => setOrderToCancel(null)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border-color, #cbd5e1)', backgroundColor: 'transparent', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Keep Order</button>
            <button type="button" disabled={cancelling} onClick={handleConfirmCancel} style={{ padding: '8px 18px', borderRadius: '8px', border: 'none', backgroundColor: '#dc2626', color: '#ffffff', fontSize: '13px', fontWeight: 700, cursor: cancelling ? 'not-allowed' : 'pointer', opacity: cancelling ? 0.7 : 1, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>{cancelling ? 'Cancelling...' : 'Confirm Cancellation'}</button>
          </div>
        </div>
      </div>
    )}
  </div>;
};
export default MyOrdersPage;
