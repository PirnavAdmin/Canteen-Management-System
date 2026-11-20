import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ClipboardList, Box, CreditCard, Clock, ArrowRight, ArrowLeft, Check, UtensilsCrossed, X, MapPin, Ticket, ReceiptText } from 'lucide-react';
import { useAuth } from '../../../../app/providers/AuthProvider';
import { customerOrderService } from '../services/customerOrderService';
import { customerMenuService } from '../../menu/services/customerMenuService';
import styles from '../styles/myOrdersReference.module.css';

const flow = ['Placed', 'Accepted', 'Preparing', 'Ready for Pickup', 'Completed'];
const terminal = ['Completed', 'Cancelled', 'Refunded'];
const money = value => `₹${Number(value || 0).toFixed(0)}`;
const dateTime = value => value ? new Date(value).toLocaleString([], { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '—';

const Timeline = ({ status }) => {
  const current = flow.indexOf(status);
  return <div className={styles.timeline}>{flow.map((step, index) => <div key={step} className={`${styles.step} ${index < current ? styles.done : ''} ${index === current ? styles.current : ''}`}><div className={styles.dot}>{index <= current && <Check size={13}/>}</div><div>{step}</div></div>)}</div>;
};

export const MyOrdersPage = () => {
  const { user } = useAuth(); const location = useLocation();
  const [orders, setOrders] = useState([]); const [loading, setLoading] = useState(true); const [tab, setTab] = useState('active'); const [notice, setNotice] = useState(null); const [menuImages, setMenuImages] = useState({}); const [trackedOrder, setTrackedOrder] = useState(null);
  const load = useCallback(async () => { try { setLoading(true); setOrders(await customerOrderService.getCustomerOrders(user)); } catch { setOrders([]); } finally { setLoading(false); } }, [user]);
  useEffect(() => { load(); }, [load]);
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
    return <div className={styles.order}><div className={styles.orderTop}><img className={styles.thumbnail} src={firstItem.imageUrl || matchingImage || 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=300&q=80'} alt={firstItem.name || 'Order meal'}/><div className={styles.orderInfo}><h3>Order #{order.id}</h3><div className={styles.items}>{(order.items || []).map(item => `${item.name} × ${item.quantity}`).join(', ') || 'Order items'}</div><div className={styles.meta}><span>▣ {dateTime(order.orderDate || order.createdAt)}</span><span>│</span><span>▣ {order.outletName || order.outlet?.name || 'Campus Canteen'}</span></div></div><strong className={styles.amount}>{money(order.totalAmount || order.pricing?.totalAmount)}</strong><button type="button" className={styles.track} onClick={() => setTrackedOrder(order)}>Track Order <ArrowRight size={16}/></button></div><span className={`${styles.status} ${order.status === 'Accepted' ? styles.accepted : ''}`}>{order.status}</span></div>;
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
      title="Back to Dashboard"
    >
      <ArrowLeft size={15} />
      <span>Back to Dashboard</span>
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
    {trackedOrder && <div className={styles.modalBackdrop} role="presentation" onClick={() => setTrackedOrder(null)}><section className={styles.trackingModal} role="dialog" aria-modal="true" aria-label={`Track order ${trackedOrder.id}`} onClick={event => event.stopPropagation()}><button type="button" className={styles.close} onClick={() => setTrackedOrder(null)} aria-label="Close tracking details"><X size={21}/></button><span className={styles.trackLabel}>LIVE ORDER TRACKING</span><h2>Order #{trackedOrder.id}</h2><p className={styles.muted}>Follow your order from kitchen acceptance to pickup.</p><div className={styles.trackSummary}><div><Ticket size={18}/><span><small>Pickup token</small><strong>{trackedOrder.token || 'Awaiting token'}</strong></span></div><div><MapPin size={18}/><span><small>Pickup outlet</small><strong>{trackedOrder.outletName || trackedOrder.outlet?.name || 'Campus Canteen'}</strong></span></div><div><ReceiptText size={18}/><span><small>Order total</small><strong>{money(trackedOrder.totalAmount || trackedOrder.pricing?.totalAmount)}</strong></span></div></div><div className={styles.modalTimeline}><Timeline status={trackedOrder.status}/></div><h3 className={styles.modalTitle}>Order items</h3><div className={styles.trackItems}>{(trackedOrder.items || []).map((item, index) => <div key={`${item.id || item.name}-${index}`} className={styles.trackItem}><img src={item.imageUrl || menuImages[`id:${String(item.id || '')}`] || menuImages[`name:${String(item.name || '').trim().toLowerCase()}`]} alt=""/><span>{item.name} × {item.quantity}</span><b>{money(Number(item.price || 0) * Number(item.quantity || 1))}</b></div>)}</div><div className={styles.trackFooter}><span className={`${styles.status} ${trackedOrder.status === 'Accepted' ? styles.accepted : ''}`}>{trackedOrder.status}</span><span>Payment: <b>{trackedOrder.payment?.status || trackedOrder.paymentStatus || 'Pending'}</b></span></div></section></div>}
  </div>;
};
export default MyOrdersPage;
