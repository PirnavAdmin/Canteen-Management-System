import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ClipboardList, Box, CreditCard, Clock, ArrowRight, ArrowLeft, Check, UtensilsCrossed, X, MapPin, Ticket, ReceiptText, RefreshCw, Ban } from 'lucide-react';
import { useAuth } from '../../../../app/providers/AuthProvider';
import { customerOrderService } from '../services/customerOrderService';
import { customerMenuService } from '../../menu/services/customerMenuService';
import { orderService } from '../../../admin/orders/services/orderService';
import { notifyOrderStatusUpdated, subscribeToOrderSync } from '../../../../utils/orderSync';
import styles from '../styles/myOrdersReference.module.css';

const flow = ['Placed', 'Accepted', 'Preparing', 'Ready for Pickup', 'Completed'];
const terminal = ['Completed', 'Collected', 'Cancelled', 'Refunded'];
const money = value => `₹${Number(value || 0).toFixed(0)}`;
const dateTime = value => value ? new Date(value).toLocaleString([], { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '—';

const Timeline = ({ status }) => {
  const normalizedStatus = (status === 'Collected') ? 'Completed' : status;
  const current = flow.indexOf(normalizedStatus);
  return <div className={styles.timeline}>{flow.map((step, index) => <div key={step} className={`${styles.step} ${index < current ? styles.done : ''} ${index === current ? styles.current : ''}`}><div className={styles.dot}>{index <= current && <Check size={13}/>}</div><div>{step}</div></div>)}</div>;
};

export const MyOrdersPage = () => {
  const { user } = useAuth(); const location = useLocation();
  const [orders, setOrders] = useState([]); const [loading, setLoading] = useState(true); const [tab, setTab] = useState('active'); const [notice, setNotice] = useState(null); const [menuImages, setMenuImages] = useState({}); const [trackedOrder, setTrackedOrder] = useState(null);
  const [trackingRefreshing, setTrackingRefreshing] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState(null);
  const [cancelReason, setCancelReason] = useState('Changed my mind');
  const [cancelling, setCancelling] = useState(false);

  const handleConfirmCancel = async () => {
    if (!orderToCancel) return;
    const finalReason = cancelReason.trim() || 'Cancelled by customer';
    try {
      setCancelling(true);
      try {
        await orderService.cancelOrder(orderToCancel.id, finalReason);
      } catch (beErr) {
        console.warn('Backend cancelOrder call note:', beErr);
      }
      try {
        await customerOrderService.cancelAndRefundOrder(orderToCancel.id, finalReason, user);
      } catch (locErr) {
        console.warn('Local cancellation note:', locErr);
      }
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
    if (!trackedOrder?.id) return;
    try {
      setTrackingRefreshing(true);
      const fresh = await orderService.getById(trackedOrder.id);
      if (fresh && fresh.id) {
        setTrackedOrder(prev => (prev && String(prev.id) === String(fresh.id) ? { ...prev, ...fresh } : prev));
        setOrders(prev => prev.map(o => String(o.id) === String(fresh.id) ? { ...o, ...fresh } : o));
        notifyOrderStatusUpdated(fresh);
      }
    } catch {}
    finally {
      setTrackingRefreshing(false);
    }
  };
  const load = useCallback(async () => { try { setLoading(true); setOrders(await customerOrderService.getCustomerOrders(user)); } catch { setOrders([]); } finally { setLoading(false); } }, [user]);
  useEffect(() => {
    load();
    const handleSync = () => load();
    const unsubscribe = subscribeToOrderSync(handleSync, handleSync);
    window.addEventListener('focus', handleSync);
    const handleVisibility = () => { if (!document.hidden) handleSync(); };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      unsubscribe();
      window.removeEventListener('focus', handleSync);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [load]);

  // Live background polling for active order when tracking modal is open
  useEffect(() => {
    if (!trackedOrder?.id || terminal.includes(trackedOrder.status)) return;
    const interval = setInterval(async () => {
      try {
        const fresh = await orderService.getById(trackedOrder.id);
        if (fresh && fresh.id) {
          setTrackedOrder(prev => (prev && String(prev.id) === String(fresh.id) ? { ...prev, ...fresh } : prev));
          setOrders(prev => prev.map(o => String(o.id) === String(fresh.id) ? { ...o, ...fresh } : o));
          notifyOrderStatusUpdated(fresh);
        }
      } catch {}
    }, 3000);
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
  useEffect(() => { if (location.state?.newOrderId) { setNotice(`Order #${location.state.newOrderId} has been placed successfully.`); window.history.replaceState({}, document.title); } }, [location.state]);
  const active = useMemo(() => orders.filter(order => !terminal.includes(order.status)), [orders]);
  const history = useMemo(() => orders.filter(order => terminal.includes(order.status)), [orders]);
  const payments = useMemo(() => orders.filter(order => order.payment || order.paymentStatus).map(order => ({ ...order, payment: order.payment || { status: order.paymentStatus, amount: order.totalAmount, transactionId: '—' } })), [orders]);
  const displayed = tab === 'active' ? active : tab === 'history' ? history : payments;
  const Order = ({ order }) => {
    const firstItem = order.items?.[0] || {};
    const matchingImage = menuImages[`id:${String(firstItem.id || '')}`] || menuImages[`name:${String(firstItem.name || '').trim().toLowerCase()}`];
    const isCancellable = order.status === 'Placed' || order.status === 'Accepted';
    return (
      <div className={styles.order}>
        <div className={styles.orderTop}>
          <img className={styles.thumbnail} src={firstItem.imageUrl || matchingImage || 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=300&q=80'} alt={firstItem.name || 'Order meal'}/>
          <div className={styles.orderInfo}>
            <h3>Order #{order.id}</h3>
            <div className={styles.items}>{(order.items || []).map(item => `${item.name} × ${item.quantity}`).join(', ') || 'Order items'}</div>
            <div className={styles.meta}>
              <span>▣ {dateTime(order.orderDate || order.createdAt)}</span>
              <span>│</span>
              <span>▣ {order.outletName || order.outlet?.name || 'Campus Canteen'}</span>
              {order.token && <span>│ ▣ Token: <b>{order.token}</b></span>}
            </div>
            {order.cancellationReason && (
              <div style={{ fontSize: '11px', color: '#dc2626', marginTop: '4px' }}>
                Cancellation Reason: {order.cancellationReason}
              </div>
            )}
          </div>
          <strong className={styles.amount}>{money(order.totalAmount || order.pricing?.totalAmount)}</strong>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end', marginLeft: 'auto' }}>
            <button type="button" className={styles.track} onClick={() => setTrackedOrder(order)}>
              Track Order <ArrowRight size={15}/>
            </button>
            {isCancellable && (
              <button
                type="button"
                onClick={() => setOrderToCancel(order)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '5px 10px',
                  borderRadius: '7px',
                  border: '1px solid #fecaca',
                  backgroundColor: '#fef2f2',
                  color: '#dc2626',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                title="Cancel this order"
              >
                <Ban size={12} />
                <span>Cancel Order</span>
              </button>
            )}
          </div>
        </div>
        <span className={`${styles.status} ${order.status === 'Accepted' ? styles.accepted : order.status === 'Cancelled' ? styles.cancelled : ''}`}>
          {order.status}
        </span>
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
    <div className={styles.heading}><span className={styles.headingIcon}><ClipboardList size={32}/></span><div><h1>My Orders</h1><p>Track your orders, view past orders and payment details.</p></div></div>
    {notice && <div style={{background:'#e8f1ff',border:'1px solid #aecaff',color:'#1d4ed8',padding:12,borderRadius:12,marginBottom:12,fontWeight:700}}>{notice}<button type="button" onClick={() => setNotice(null)} style={{float:'right',border:0,background:'none',cursor:'pointer'}}>×</button></div>}
    <div className={styles.tabs}>
      <button type="button" className={`${styles.tab} ${tab==='active'?styles.tabActive:''}`} onClick={() => setTab('active')}>
        <Box size={14}/> Active Orders ({active.length})
      </button>
      <button type="button" className={`${styles.tab} ${tab==='history'?styles.tabActive:''}`} onClick={() => setTab('history')}>
        <Clock size={14}/> Order History ({history.length})
      </button>
      <button type="button" className={`${styles.tab} ${tab==='payments'?styles.tabActive:''}`} onClick={() => setTab('payments')}>
        <CreditCard size={14}/> Payments ({payments.length})
      </button>
    </div>
    <div className={styles.grid}><section className={styles.card}><div className={styles.cardHead}><div><h2>{tab==='active' ? `Active Orders (${active.length})` : tab==='history' ? `Order History (${history.length})` : `Payment History (${payments.length})`}</h2><p className={styles.muted}>{tab==='active' ? 'Your current and in-progress orders.' : tab==='history' ? 'Your completed and cancelled orders.' : 'Your authorised canteen payment transactions.'}</p></div>{tab!=='payments' && <Link className={styles.link} to="/customer/dashboard">Order food <ArrowRight size={16}/></Link>}</div>{loading ? <div className={styles.empty}>Loading your orders…</div> : tab === 'payments' ? <table className={styles.table}><thead><tr><th>Transaction ID</th><th>Order ID</th><th>Date & Time</th><th>Amount</th><th>Status</th></tr></thead><tbody>{payments.map(order => <tr key={order.id}><td>{order.payment?.transactionId || '—'}</td><td>#{order.id}</td><td>{dateTime(order.payment?.paidAt || order.orderDate)}</td><td><b>{money(order.payment?.amount || order.totalAmount)}</b></td><td><span className={styles.pay}>{order.payment?.status || 'Pending'}</span></td></tr>)}</tbody></table> : displayed.length ? displayed.map(order => <Order key={order.id} order={order}/>) : <div className={styles.empty}><ClipboardList size={42}/><h3>No Orders Found</h3><p>You do not have orders in this category yet.</p><Link className={styles.link} to="/customer/dashboard"><UtensilsCrossed size={16}/> Browse Food Menu</Link></div>}</section>
    <aside className={styles.card}><div className={styles.cardHead}><div><h2><CreditCard size={22}/> Payment History</h2><p className={styles.muted}>Recent canteen payment transactions.</p></div><button className={styles.track} onClick={() => setTab('payments')}>View All <ArrowRight size={16}/></button></div><table className={styles.table}><thead><tr><th>Order</th><th>Amount</th><th>Status</th></tr></thead><tbody>{payments.slice(0,5).map(order => <tr key={order.id}><td>#{order.id}</td><td><b>{money(order.totalAmount)}</b></td><td><span className={styles.pay}>{order.payment?.status || order.paymentStatus || 'Pending'}</span></td></tr>)}</tbody></table>{!payments.length && <p className={styles.empty}>No payment records yet.</p>}</aside></div>
    {trackedOrder && <div className={styles.modalBackdrop} role="presentation" onClick={() => setTrackedOrder(null)}><section className={styles.trackingModal} role="dialog" aria-modal="true" aria-label={`Track order ${trackedOrder.id}`} onClick={event => event.stopPropagation()}><div style={{ position: 'absolute', right: 18, top: 18, display: 'flex', alignItems: 'center', gap: 8 }}><button type="button" onClick={handleRefreshTracked} disabled={trackingRefreshing} style={{ border: '1px solid var(--border-color, #cbd5e1)', background: 'var(--bg-muted, #edf4fc)', borderRadius: 8, padding: '5px 12px', display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, color: 'var(--color-accent, #2563eb)', cursor: 'pointer' }} title="Refresh live status"><RefreshCw size={13} style={{ animation: trackingRefreshing ? 'spin 0.8s linear infinite' : 'none' }} /><span>{trackingRefreshing ? 'Checking…' : 'Refresh'}</span></button><button type="button" className={styles.close} style={{ position: 'static' }} onClick={() => setTrackedOrder(null)} aria-label="Close tracking details"><X size={21}/></button></div><span className={styles.trackLabel}>LIVE ORDER TRACKING</span><h2>Order #{trackedOrder.id}</h2><p className={styles.muted}>Follow your order from kitchen acceptance to pickup.</p><div className={styles.trackSummary}><div><Ticket size={18}/><span><small>Pickup token</small><strong>{trackedOrder.token || 'Awaiting token'}</strong></span></div><div><MapPin size={18}/><span><small>Pickup outlet</small><strong>{trackedOrder.outletName || trackedOrder.outlet?.name || 'Campus Canteen'}</strong></span></div><div><ReceiptText size={18}/><span><small>Order total</small><strong>{money(trackedOrder.totalAmount || trackedOrder.pricing?.totalAmount)}</strong></span></div></div>{(trackedOrder.notes || trackedOrder.cookingNotes) && (<div style={{ margin: '12px 0 6px', padding: '10px 14px', borderRadius: 10, backgroundColor: '#fffbeb', border: '1px solid #fde68a', color: '#92400e', fontSize: 12.5 }}><strong style={{ color: '#b45309', display: 'block', marginBottom: 2 }}>Special Cooking Notes:</strong><span>{trackedOrder.notes || trackedOrder.cookingNotes}</span></div>)}<div className={styles.modalTimeline}><Timeline status={trackedOrder.status}/></div><h3 className={styles.modalTitle}>Order items</h3><div className={styles.trackItems}>{(trackedOrder.items || []).map((item, index) => <div key={`${item.id || item.name}-${index}`} className={styles.trackItem}><img src={item.imageUrl || menuImages[`id:${String(item.id || '')}`] || menuImages[`name:${String(item.name || '').trim().toLowerCase()}`]} alt=""/><span>{item.name} × {item.quantity}</span><b>{money(Number(item.price || 0) * Number(item.quantity || 1))}</b></div>)}</div><div className={styles.trackFooter}><div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span className={`${styles.status} ${trackedOrder.status === 'Accepted' ? styles.accepted : trackedOrder.status === 'Cancelled' ? styles.cancelled : ''}`}>{trackedOrder.status}</span>{trackedOrder.cancellationReason && <span style={{ fontSize: 11, color: '#dc2626' }}>Reason: {trackedOrder.cancellationReason}</span>}</div><div style={{ display: 'flex', alignItems: 'center', gap: 12 }}><span>Payment: <b>{trackedOrder.payment?.status || trackedOrder.paymentStatus || 'Pending'}</b></span>{(trackedOrder.status === 'Placed' || trackedOrder.status === 'Accepted') && (<button type="button" onClick={() => setOrderToCancel(trackedOrder)} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, border: '1px solid #fecaca', backgroundColor: '#fef2f2', color: '#dc2626', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}><Ban size={13} /><span>Cancel Order</span></button>)}</div></div></section></div>}
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
