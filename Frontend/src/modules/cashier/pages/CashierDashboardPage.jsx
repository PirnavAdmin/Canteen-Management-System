import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Banknote, CheckCircle2, Clock3, CreditCard, ShoppingCart, RefreshCw, AlertTriangle } from 'lucide-react';
import { dashboardService } from '../../admin/dashboard/services/dashboardService';
import { orderService } from '../../admin/orders/services/orderService';
import { formatCurrency } from '../../../utils/formatters';
import { useAuth } from '../../../app/providers/AuthProvider';
import { subscribeToOrderSync } from '../../../utils/orderSync';
import '../styles/cashier.css';

export default function CashierDashboardPage() {
  const { user } = useAuth();
  const assignedOutlet = user?.outletId ?? user?.assignedOutletId ?? user?.canteenOutletId ?? user?.assignedOutlet?.outletId ?? user?.assignedOutlet?.id;
  const [summary, setSummary] = useState(null);
  const [liveOrders, setLiveOrders] = useState([]);
  const [todayOrders, setTodayOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchDashboardData = useCallback(async (isRefresh = false) => {
    if (!assignedOutlet) {
      setSummary(null); setLiveOrders([]); setTodayOrders([]);
      setError('No canteen is assigned to this cashier. Please contact an administrator.');
      setLoading(false); setRefreshing(false);
      return;
    }
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const [summaryRes, liveOrdersRes, ordersRes] = await Promise.allSettled([
        dashboardService.getSummary(assignedOutlet),
        dashboardService.getLiveOrders(assignedOutlet),
        orderService.getAll({ dateFilter: 'today', outletId: assignedOutlet })
      ]);

      if ([summaryRes, liveOrdersRes, ordersRes].some(result => result.status === 'rejected')) {
        throw new Error('Dashboard data could not be loaded. Please refresh and try again.');
      }

      if (summaryRes.status === 'fulfilled') {
        setSummary(summaryRes.value?.data || summaryRes.value || {});
      }
      if (liveOrdersRes.status === 'fulfilled') {
        const live = liveOrdersRes.value?.data || liveOrdersRes.value || [];
        setLiveOrders(Array.isArray(live) ? live : []);
      }
      if (ordersRes.status === 'fulfilled') {
        const ords = ordersRes.value?.data || ordersRes.value || [];
        setTodayOrders(Array.isArray(ords) ? ords : []);
      }
    } catch (err) {
      setSummary(null); setLiveOrders([]); setTodayOrders([]);
      setError(err?.message || 'Failed to load cashier dashboard metrics.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [assignedOutlet]);

  useEffect(() => {
    fetchDashboardData();
    if (!assignedOutlet) return undefined;
    const timer = window.setInterval(() => fetchDashboardData(true), 30000);
    const unsubscribe = subscribeToOrderSync(() => fetchDashboardData(true), () => fetchDashboardData(true));
    return () => { window.clearInterval(timer); unsubscribe(); };
  }, [assignedOutlet, fetchDashboardData]);

  // Payment Breakdown calculated from today's orders
  const paymentBreakdown = useMemo(() => {
    let cash = 0, upi = 0, card = 0, other = 0;
    const orders = Array.isArray(todayOrders) ? todayOrders : [];

    orders.forEach(o => {
      const status = String(o.payment?.status || o.paymentStatus || '').toLowerCase();
      if (status !== 'paid' || /cancel|refund|void/i.test(String(o.status || ''))) return;
      const amt = Number(o.totalAmount || o.total || 0);
      const method = String(o.payment?.method || o.paymentMethod || '').toUpperCase();
      if (method.includes('CASH')) cash += amt;
      else if (method.includes('UPI') || method.includes('QR')) upi += amt;
      else if (method.includes('CARD') || method.includes('WALLET')) card += amt;
      else other += amt;
    });

    const total = cash + upi + card + other || 1;
    const cashPct = Math.round((cash / total) * 100);
    const upiPct = Math.round((upi / total) * 100);
    const cardPct = Math.round((card / total) * 100);

    return {
      cash,
      upi,
      card,
      other,
      cashPct,
      upiPct,
      cardPct,
      totalSales: cash + upi + card + other
    };
  }, [todayOrders]);

  // Queue table rows from live orders
  const queueRows = useMemo(() => {
    if (!liveOrders || liveOrders.length === 0) return [];
    return liveOrders.slice(0, 5).map(o => [
      o.token || o.orderId || '-',
      (typeof o.customer === 'object' ? o.customer?.name || o.customer?.fullName : o.customer) || o.customerName || '—',
      o.itemCount ?? (Array.isArray(o.items) ? o.items.length : '—'),
      formatCurrency(o.total || o.totalAmount || 0),
      o.payment?.status || o.paymentStatus || 'Unknown',
      o.status || 'Unknown'
    ]);
  }, [liveOrders]);

  // Recent transactions from today's orders
  const recentTransactions = useMemo(() => {
    if (!todayOrders || todayOrders.length === 0) return [];
    return todayOrders.filter(o => String(o.payment?.status || o.paymentStatus || '').toLowerCase() === 'paid' && !/cancel|refund|void/i.test(String(o.status || ''))).sort((a, b) => new Date(b.orderDate || 0) - new Date(a.orderDate || 0)).slice(0, 5).map(o => {
      let timeStr = '--:--';
      if (o.orderDate) {
        try {
          timeStr = new Date(o.orderDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
        } catch {
          timeStr = '--:--';
        }
      }
      return [
        o.token || o.id || o.orderId || '-',
        o.payment?.method || o.paymentMethod || 'Unknown',
        formatCurrency(o.totalAmount || o.total || 0),
        timeStr
      ];
    });
  }, [todayOrders]);

  const activeCount = summary?.activeOrders !== undefined ? summary.activeOrders : liveOrders.length;
  const todaySales = summary?.todayRevenue !== undefined ? summary.todayRevenue : paymentBreakdown.totalSales;
  const totalOrdersCount = summary?.todayOrders !== undefined ? summary.todayOrders : todayOrders.length;
  const completedCount = todayOrders.filter(o => /^(collected|completed)$/i.test(String(o.status || ''))).length;

  return (
    <>
      <div className="cashier-page-title">
        <div>
          <h1>Cashier Dashboard</h1>
          <p>Live counter billing, payment reconciliation, and kitchen queue overview.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{
            fontSize: '12px',
            color: error ? 'var(--color-danger-text)' : 'var(--color-success-text)',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            backgroundColor: error ? 'var(--color-danger-bg)' : 'var(--color-success-bg)',
            padding: '4px 10px',
            borderRadius: '99px'
          }}>
            {error ? 'Some data unavailable' : loading ? 'Loading data…' : 'Live System Data'}
          </span>
          <button
            type="button"
            onClick={() => fetchDashboardData(true)}
            disabled={refreshing}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-surface)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              fontSize: '12.5px',
              fontWeight: 500
            }}
          >
            <RefreshCw size={14} className={refreshing ? 'spin' : ''} />
            {refreshing ? 'Updating…' : 'Refresh'}
          </button>
        </div>
      </div>

      {error && (
        <div style={{
          marginBottom: '16px',
          padding: '12px 16px',
          borderRadius: '8px',
          backgroundColor: 'var(--color-danger-bg)',
          border: '1px solid var(--color-danger-border)',
          color: 'var(--color-danger-text)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '13px'
        }}>
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      {!error && !loading && <>
      {/* KPI Summary Cards */}
      <section className="cashier-kpis">
        <Kpi
          icon={<Banknote size={22} />}
          label="Today's Sales"
          value={formatCurrency(todaySales)}
          trend="Live Revenue"
        />
        <Kpi
          icon={<ShoppingCart size={22} />}
          label="Total Orders"
          value={String(totalOrdersCount)}
          trend="Today's Total"
        />
        <Kpi
          icon={<Clock3 size={22} />}
          label="Active Queue"
          value={String(activeCount)}
          trend="In Preparation"
          warn={activeCount > 5}
        />
        <Kpi
          icon={<CheckCircle2 size={22} />}
          label="Completed Orders"
          value={String(completedCount)}
          trend="Collected"
        />
      </section>

      {/* Main Grid: Order Queue & Payment Methods */}
      <div className="dashboard-only-grid">
        <section className="cashier-card">
          <div className="card-heading">
            <Clock3 size={17} />
            <b>Current Order Queue ({liveOrders.length})</b>
          </div>
          {queueRows.length > 0 ? (
            <Table
              heads={['Token', 'Customer', 'Items', 'Amount', 'Payment', 'Status']}
              rows={queueRows}
            />
          ) : (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
              No active orders waiting in the live queue.
            </div>
          )}
        </section>

        <section className="cashier-card breakdown">
          <div className="donut" style={{ background: paymentBreakdown.totalSales > 0 ? `conic-gradient(#2563eb 0 ${paymentBreakdown.cash / paymentBreakdown.totalSales * 100}%, #8b5cf6 0 ${(paymentBreakdown.cash + paymentBreakdown.upi) / paymentBreakdown.totalSales * 100}%, #059669 0 ${(paymentBreakdown.cash + paymentBreakdown.upi + paymentBreakdown.card) / paymentBreakdown.totalSales * 100}%, #94a3b8 0 100%)` : 'var(--bg-subtle)' }}>
            <b>{formatCurrency(paymentBreakdown.totalSales).split('.')[0]}</b>
            <small>Today's Sales</small>
          </div>
          <div>
            <b>Payment Methods Breakdown</b>
            <p>🔵 Cash — {formatCurrency(paymentBreakdown.cash)} ({paymentBreakdown.cashPct}%)</p>
            <p>🟣 UPI / QR — {formatCurrency(paymentBreakdown.upi)} ({paymentBreakdown.upiPct}%)</p>
            <p>🟢 Card / Wallet — {formatCurrency(paymentBreakdown.card)} ({paymentBreakdown.cardPct}%)</p>
            {paymentBreakdown.other > 0 && <p>Other — {formatCurrency(paymentBreakdown.other)}</p>}
          </div>
        </section>
      </div>
      {/* Bottom Grid: Recent Transactions & Alerts */}
      <div className="dashboard-only-grid">
        <section className="cashier-card">
          <div className="card-heading">
            <CreditCard size={17} />
            <b>Recent Counter Transactions</b>
          </div>
          {recentTransactions.length > 0 ? (
            <Table
              heads={['Token / Bill', 'Payment Mode', 'Amount', 'Time']}
              rows={recentTransactions}
            />
          ) : (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
              No transactions recorded today yet.
            </div>
          )}
        </section>

        <section className="cashier-card mini">
          <b>Operational Status & Counter Alerts</b>
          <p>{activeCount} orders currently in kitchen preparation queue</p>
          <p>{todayOrders.filter(o => String(o.payment?.status || o.paymentStatus || '').toLowerCase() === 'pending').length} orders pending payment confirmation</p>
        </section>
      </div>
      </>}
    </>
  );
}

function Kpi({ icon, label, value, trend, warn }) {
  return (
    <article className={`kpi ${warn ? 'warn' : ''}`}>
      <span>{icon}</span>
      <div>
        <small>{label}</small>
        <strong>{value}</strong>
      </div>
      <em>{trend}</em>
    </article>
  );
}

function Table({ heads, rows }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {heads.map(x => <th key={x}>{x}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j}>
                  {j === 5 ? (
                    <span className="status" style={{
                      backgroundColor: String(cell).toLowerCase().includes('ready') ? 'var(--color-success-bg)' : 'var(--color-info-bg)',
                      color: String(cell).toLowerCase().includes('ready') ? 'var(--color-success-text)' : 'var(--color-info-text)'
                    }}>
                      {cell}
                    </span>
                  ) : cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
