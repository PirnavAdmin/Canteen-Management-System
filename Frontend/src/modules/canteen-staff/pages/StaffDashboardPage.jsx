import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Clock,
  CheckCircle2,
  ChefHat,
  BellRing,
  CheckCheck,
  Send,
  Store,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import { useStaffOrders } from '../hooks/useStaffOrders';
import { useStaffInventory } from '../hooks/useStaffInventory';
import { useToast } from '../../../app/providers/ToastProvider';
import {
  isStatusPlaced,
  isStatusAccepted,
  isStatusPreparing,
  isStatusReady,
  isStatusCompleted,
  isStatusCancelled,
  isOrderCompletedToday
} from '../services/staffOrderService';
import { PageHeader } from '../../../components/common/PageHeader';
import { Button } from '../../../components/common/Button';
import { StatusBadge } from '../../../components/common/StatusBadge';
import { formatDate, formatNumber, isSameIstDate } from '../../../utils/formatters';
import styles from '../styles/staff.module.css';

export const StaffDashboardPage = () => {
  const { success, error: toastError } = useToast();
  const {
    orders,
    loading: ordersLoading,
    error: ordersError,
    startPreparation,
    markReadyForPickup,
    refreshOrders,
    activeOutletName
  } = useStaffOrders();

  const {
    inventory,
    expiringItems,
    stockRequests,
    loading: inventoryLoading,
    error: inventoryError,
    refreshInventory
  } = useStaffInventory();

  const [actionLoadingId, setActionLoadingId] = useState(null);

  const handleRefresh = async () => {
    await Promise.all([refreshOrders(), refreshInventory()]);
  };

  const handleStartPreparation = async (order) => {
    try {
      setActionLoadingId(order.id);
      await startPreparation(order.id);
      success('Cooking Started', `Order ${order.token || order.id} moved to Preparing.`);
    } catch (err) {
      toastError('Action Failed', err.message || 'Unable to start preparation.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleMarkReady = async (order) => {
    try {
      setActionLoadingId(order.id);
      await markReadyForPickup(order.id);
      success('Ready for Pickup', `Order ${order.token || order.id} moved to pickup counter.`);
    } catch (err) {
      toastError('Action Failed', err.message || 'Unable to mark order ready.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Exact Order Status Counts
  const newOrdersCount = useMemo(() => orders.filter((o) => isStatusPlaced(o.status)).length, [orders]);
  const acceptedOrdersCount = useMemo(() => orders.filter((o) => isStatusAccepted(o.status)).length, [orders]);
  const preparingOrdersCount = useMemo(() => orders.filter((o) => isStatusPreparing(o.status)).length, [orders]);
  const readyOrdersCount = useMemo(() => orders.filter((o) => isStatusReady(o.status)).length, [orders]);
  const completedOrdersCount = useMemo(() => orders.filter((o) => isOrderCompletedToday(o)).length, [orders]);

  // Inventory Alerts (Low stock, critical stock, out of stock, expiring)
  const inventoryAlerts = useMemo(() => {
    const alerts = [];

    inventory.forEach((item) => {
      const qty = Number(item.availableQuantity) || 0;
      const reorder = Number(item.reorderLevel) || 0;

      if (qty === 0) {
        alerts.push({
          id: `oos-${item.id}`,
          itemId: item.id,
          ingredientName: item.ingredientName,
          itemCode: item.itemCode,
          availableQuantity: qty,
          unit: item.unit,
          reorderLevel: reorder,
          expiryDate: item.expiryDate,
          statusLabel: 'Out of Stock',
          badgeColor: 'var(--color-danger-text)',
          badgeBg: 'var(--color-danger-bg)',
          badgeBorder: 'var(--color-danger-border)',
          priority: 1
        });
      } else if (qty <= reorder * 0.5) {
        alerts.push({
          id: `crit-${item.id}`,
          itemId: item.id,
          ingredientName: item.ingredientName,
          itemCode: item.itemCode,
          availableQuantity: qty,
          unit: item.unit,
          reorderLevel: reorder,
          expiryDate: item.expiryDate,
          statusLabel: 'Critical Stock',
          badgeColor: 'var(--color-danger-text)',
          badgeBg: 'var(--color-danger-bg)',
          badgeBorder: 'var(--color-danger-border)',
          priority: 2
        });
      } else if (qty <= reorder) {
        alerts.push({
          id: `low-${item.id}`,
          itemId: item.id,
          ingredientName: item.ingredientName,
          itemCode: item.itemCode,
          availableQuantity: qty,
          unit: item.unit,
          reorderLevel: reorder,
          expiryDate: item.expiryDate,
          statusLabel: 'Low Stock',
          badgeColor: 'var(--color-warning-text)',
          badgeBg: 'var(--color-warning-bg)',
          badgeBorder: 'var(--color-warning-border)',
          priority: 3
        });
      }
    });

    expiringItems.forEach((item) => {
      const existing = alerts.find((a) => a.itemId === item.id);
      if (!existing) {
        const days = item.daysToExpiry;
        const label = days < 0 ? 'Expired' : days === 0 ? 'Expires Today' : `Expires in ${days}d`;
        alerts.push({
          id: `exp-${item.id}`,
          itemId: item.id,
          ingredientName: item.ingredientName,
          itemCode: item.itemCode,
          availableQuantity: item.availableQuantity,
          unit: item.unit,
          reorderLevel: item.reorderLevel,
          expiryDate: item.expiryDate,
          statusLabel: label,
          badgeColor: days <= 1 ? 'var(--color-danger-text)' : 'var(--color-warning-text)',
          badgeBg: days <= 1 ? 'var(--color-danger-bg)' : 'var(--color-warning-bg)',
          badgeBorder: days <= 1 ? 'var(--color-danger-border)' : 'var(--color-warning-border)',
          priority: days < 0 ? 1 : 4
        });
      }
    });

    alerts.sort((a, b) => a.priority - b.priority);
    return alerts.slice(0, 5);
  }, [inventory, expiringItems]);

  // Live Order Activity Stream (Today IST)
  const activeOrders = useMemo(() => {
    return orders
      .filter((o) => {
        if (isStatusCompleted(o.status) || isStatusCancelled(o.status)) return false;
        const orderTimestamp = o.createdAt || o.orderDate;
        return orderTimestamp ? isSameIstDate(orderTimestamp) : true;
      })
      .sort((a, b) => new Date(b.orderDate || b.createdAt || 0) - new Date(a.orderDate || a.createdAt || 0))
      .slice(0, 5);
  }, [orders]);

  const formatOrderTime = (dateString) => {
    if (!dateString) return '—';
    const orderDate = new Date(dateString);
    if (isNaN(orderDate.getTime())) return '—';

    const now = new Date();
    const diffMs = now.getTime() - orderDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const hours = Math.floor(diffMins / 60);
    if (hours < 24) return `${hours}h ago`;
    return orderDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const kpiCards = [
    {
      to: '/staff/board',
      label: 'New Orders',
      value: formatNumber(newOrdersCount),
      subtext: 'Awaiting acceptance →',
      icon: Clock,
      color: 'var(--color-warning)',
      bg: 'var(--color-warning-bg)',
      highlight: newOrdersCount > 0,
      badge: newOrdersCount > 0 ? 'Action Req' : null
    },
    {
      to: '/staff/board',
      label: 'Accepted Orders',
      value: formatNumber(acceptedOrdersCount),
      subtext: 'Queued to start cooking →',
      icon: CheckCircle2,
      color: 'var(--color-info)',
      bg: 'var(--color-info-bg)'
    },
    {
      to: '/staff/kitchen',
      label: 'Preparing',
      value: formatNumber(preparingOrdersCount),
      subtext: 'Cooking at kitchen stations →',
      icon: ChefHat,
      color: 'var(--color-primary)',
      bg: 'var(--color-primary-light)'
    },
    {
      to: '/staff/verify',
      label: 'Ready for Pickup',
      value: formatNumber(readyOrdersCount),
      subtext: 'Waiting at pickup counter →',
      icon: BellRing,
      color: 'var(--color-success)',
      bg: 'var(--color-success-bg)'
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Page Header matching Admin */}
      <PageHeader
        title="Canteen Staff Dashboard"
        description="Daily operational queue, kitchen preparation stages, and inventory alerts."
        badge={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {activeOutletName && (
              <span
                style={{
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
                }}
              >
                <Store size={12} />
                {activeOutletName}
              </span>
            )}

            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '3px 10px',
                borderRadius: 'var(--border-radius-full)',
                backgroundColor: 'var(--color-success-bg)',
                color: 'var(--color-success-text)',
                fontSize: '11.5px',
                fontWeight: 600,
                border: '1px solid var(--color-success-border)'
              }}
              title="Orders collected by customers today"
            >
              <CheckCheck size={13} />
              {formatNumber(completedOrdersCount)} Collected Today
            </span>
          </div>
        }
        actions={
          <Button
            variant="secondary"
            icon={RefreshCw}
            onClick={handleRefresh}
            loading={ordersLoading || inventoryLoading}
          >
            Refresh
          </Button>
        }
      />

      {/* API Error Banner */}
      {(ordersError || inventoryError) && (
        <div className={styles.errorBanner} role="alert">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} />
            <span>{ordersError || inventoryError}</span>
          </div>
          <Button variant="secondary" size="sm" icon={RefreshCw} onClick={handleRefresh}>
            Retry
          </Button>
        </div>
      )}

      {/* 4 KPI Status Cards matching Admin DashboardKPICards */}
      {ordersLoading && orders.length === 0 ? (
        <div className={styles.kpiRow}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--border-radius-md)',
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                minHeight: '72px'
              }}
            >
              <div className="skeleton-box" style={{ width: '36px', height: '36px', borderRadius: 'var(--border-radius-md)', flexShrink: 0 }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div className="skeleton-box" style={{ width: '55%', height: '10px' }} />
                <div className="skeleton-box" style={{ width: '35%', height: '18px' }} />
                <div className="skeleton-box" style={{ width: '75%', height: '9px' }} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.kpiRow}>
          {kpiCards.map((card) => {
            const IconComp = card.icon;
            return (
              <Link
                key={card.label}
                to={card.to}
                style={{
                  textDecoration: 'none',
                  color: 'inherit',
                  backgroundColor: 'var(--bg-surface)',
                  border: card.highlight ? '1.5px solid var(--color-warning)' : '1px solid var(--border-color)',
                  borderRadius: 'var(--border-radius-md)',
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  boxShadow: 'var(--shadow-xs)',
                  minHeight: '72px',
                  transition: 'box-shadow var(--transition-fast)'
                }}
              >
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: 'var(--border-radius-md)',
                  backgroundColor: card.bg,
                  color: card.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <IconComp size={18} />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{
                      fontSize: '10.5px',
                      fontWeight: 600,
                      color: 'var(--text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em'
                    }}>
                      {card.label}
                    </span>
                    {card.badge && (
                      <span style={{
                        fontSize: '9px',
                        fontWeight: 700,
                        backgroundColor: 'var(--color-danger-bg)',
                        color: 'var(--color-danger-text)',
                        border: '1px solid var(--color-danger-border)',
                        padding: '1px 5px',
                        borderRadius: '4px'
                      }}>
                        {card.badge}
                      </span>
                    )}
                  </div>
                  <div style={{
                    fontSize: '20px',
                    fontWeight: 700,
                    color: card.color,
                    lineHeight: 1.2,
                    marginTop: '2px'
                  }}>
                    {card.value}
                  </div>
                  <div style={{
                    fontSize: '11px',
                    color: 'var(--text-secondary)',
                    marginTop: '2px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {card.subtext}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Operational Triad: Inventory Alerts | Live Order Activity | Admin Requisitions */}
      <div className={styles.operationsGrid}>
        {/* SECTION 1: INVENTORY ALERTS */}
        <section className={styles.panelCard} style={{ minHeight: '380px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
              <AlertTriangle size={16} style={{ color: 'var(--color-danger)', flexShrink: 0 }} />
              <div style={{ minWidth: 0 }}>
                <h2 style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                  Inventory Alerts
                </h2>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Items requiring kitchen attention
                </div>
              </div>
            </div>

            <span style={{
              fontSize: '11px',
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: 'var(--border-radius-full)',
              backgroundColor: inventoryAlerts.length > 0 ? 'var(--color-danger-bg)' : 'var(--color-success-bg)',
              color: inventoryAlerts.length > 0 ? 'var(--color-danger-text)' : 'var(--color-success-text)',
              border: `1px solid ${inventoryAlerts.length > 0 ? 'var(--color-danger-border)' : 'var(--color-success-border)'}`,
              flexShrink: 0
            }}>
              {inventoryAlerts.length} {inventoryAlerts.length === 1 ? 'alert' : 'alerts'}
            </span>
          </div>

          {inventoryLoading && inventory.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[1, 2, 3].map((n) => (
                <div key={n} className="skeleton-box" style={{ height: '52px', borderRadius: 'var(--border-radius-sm)' }} />
              ))}
            </div>
          ) : inventoryError ? (
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              padding: '24px',
              color: 'var(--color-danger-text)',
              fontSize: '12.5px',
              gap: '8px'
            }}>
              <AlertCircle size={24} />
              <span>{inventoryError}</span>
            </div>
          ) : inventoryAlerts.length === 0 ? (
            <div style={{
              padding: '30px 16px',
              textAlign: 'center',
              backgroundColor: 'var(--bg-app)',
              borderRadius: 'var(--border-radius-md)',
              border: '1px dashed var(--border-color)',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Sparkles size={26} style={{ color: 'var(--color-success)', marginBottom: '8px' }} />
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                All ingredients are well-stocked
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                No low stock, out of stock, or expiring items detected{activeOutletName ? ` in ${activeOutletName}` : ''}.
              </div>
            </div>
          ) : (
            <div className="thin-scrollbar" style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, maxHeight: '260px', overflowY: 'auto' }}>
              {inventoryAlerts.map((alert) => (
                <div
                  key={alert.id}
                  style={{
                    border: '1px solid var(--border-color-subtle)',
                    borderRadius: 'var(--border-radius-sm)',
                    padding: '9px 11px',
                    backgroundColor: 'var(--bg-app)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px'
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {alert.ingredientName}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {alert.itemCode}
                      {alert.reorderLevel > 0 && ` • Min: ${alert.reorderLevel} ${alert.unit}`}
                      {alert.expiryDate && ` • Exp: ${formatDate(alert.expiryDate)}`}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: alert.badgeColor }}>
                      {alert.availableQuantity} {alert.unit}
                    </div>
                    <span style={{
                      display: 'inline-block',
                      marginTop: '2px',
                      fontSize: '10px',
                      fontWeight: 600,
                      padding: '1px 6px',
                      borderRadius: '4px',
                      backgroundColor: alert.badgeBg,
                      color: alert.badgeColor,
                      border: `1px solid ${alert.badgeBorder}`
                    }}>
                      {alert.statusLabel}
                    </span>
                  </div>

                  <Link
                    to={`/staff/stock-requests?item=${encodeURIComponent(alert.ingredientName)}&unit=${alert.unit}`}
                    style={{
                      padding: '5px 9px',
                      borderRadius: 'var(--border-radius-sm)',
                      backgroundColor: 'var(--color-primary)',
                      color: '#ffffff',
                      textDecoration: 'none',
                      fontSize: '11px',
                      fontWeight: 600,
                      flexShrink: 0
                    }}
                  >
                    Reorder
                  </Link>
                </div>
              ))}
            </div>
          )}

          <div style={{
            marginTop: 'auto',
            paddingTop: '10px',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px'
          }}>
            <Link to="/staff/inventory" style={{ fontSize: '11.5px', fontWeight: 600 }}>
              View Inventory →
            </Link>
            <Link to="/staff/inventory/expiry" style={{ fontSize: '11.5px', fontWeight: 600 }}>
              Expiry Tracking →
            </Link>
            <Link to="/staff/stock-requests" style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--color-primary)' }}>
              Request Stock →
            </Link>
          </div>
        </section>

        {/* SECTION 2: LIVE ORDER ACTIVITY */}
        <section className={styles.panelCard} style={{ minHeight: '380px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-success)',
                boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.2)',
                flexShrink: 0
              }} />
              <div style={{ minWidth: 0 }}>
                <h2 style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                  Live Order Activity
                </h2>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Active queue requiring kitchen &amp; counter actions
                </div>
              </div>
            </div>

            <Link
              to="/staff/board"
              style={{ fontSize: '11.5px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}
            >
              <span>View All</span>
              <ArrowRight size={12} />
            </Link>
          </div>

          {ordersLoading && orders.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[1, 2, 3].map((n) => (
                <div key={n} className="skeleton-box" style={{ height: '54px', borderRadius: 'var(--border-radius-sm)' }} />
              ))}
            </div>
          ) : ordersError ? (
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              padding: '24px',
              color: 'var(--color-danger-text)',
              fontSize: '12.5px',
              gap: '8px'
            }}>
              <AlertCircle size={24} />
              <span>{ordersError}</span>
            </div>
          ) : activeOrders.length === 0 ? (
            <div style={{
              padding: '30px 16px',
              textAlign: 'center',
              backgroundColor: 'var(--bg-app)',
              borderRadius: 'var(--border-radius-md)',
              border: '1px dashed var(--border-color)',
              color: 'var(--text-muted)',
              fontSize: '12.5px',
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              No active orders in live queue right now.
            </div>
          ) : (
            <div className="thin-scrollbar" style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, maxHeight: '260px', overflowY: 'auto' }}>
              {activeOrders.map((order) => {
                const isReady = isStatusReady(order.status);
                const isPrep = isStatusPreparing(order.status);
                const isPlaced = isStatusPlaced(order.status);
                const isAccepted = isStatusAccepted(order.status);
                const isBusy = actionLoadingId === order.id;

                return (
                  <div
                    key={order.id}
                    style={{
                      border: '1px solid var(--border-color-subtle)',
                      borderRadius: 'var(--border-radius-sm)',
                      padding: '8px 11px',
                      backgroundColor: 'var(--bg-app)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '8px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                      <span className={styles.tokenBadge} style={{ flexShrink: 0 }}>
                        {order.token || `#${order.id}`}
                      </span>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {order.customer?.name || 'Customer'}
                          {order.customer?.role && (
                            <span style={{ marginLeft: '5px', fontSize: '10.5px', color: 'var(--text-muted)', fontWeight: 500 }}>
                              • {order.customer.role}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {Array.isArray(order.items) && order.items.length > 0
                            ? order.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')
                            : 'Order items'}
                          <span> • {formatOrderTime(order.orderDate || order.createdAt)}</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                      <StatusBadge status={order.status} size="sm" />

                      {isAccepted && (
                        <Button
                          variant="primary"
                          size="sm"
                          loading={isBusy}
                          onClick={() => handleStartPreparation(order)}
                          style={{ padding: '4px 9px', fontSize: '11px' }}
                        >
                          Start
                        </Button>
                      )}

                      {isPrep && (
                        <Button
                          variant="primary"
                          size="sm"
                          loading={isBusy}
                          onClick={() => handleMarkReady(order)}
                          style={{ padding: '4px 9px', fontSize: '11px', backgroundColor: 'var(--color-success)', borderColor: 'var(--color-success)' }}
                        >
                          Ready
                        </Button>
                      )}

                      {isPlaced && (
                        <span style={{ fontSize: '10.5px', color: 'var(--color-warning-text)', fontWeight: 600 }}>
                          Cashier
                        </span>
                      )}

                      {isReady && (
                        <span style={{ fontSize: '10.5px', color: 'var(--color-info-text)', fontWeight: 600 }}>
                          Counter
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div style={{ marginTop: 'auto', paddingTop: '10px' }}>
            <Link
              to="/staff/board"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                width: '100%',
                padding: '8px 14px',
                borderRadius: 'var(--border-radius-md)',
                backgroundColor: 'var(--bg-app)',
                border: '1px solid var(--border-color)',
                color: 'var(--color-primary)',
                fontSize: '12px',
                fontWeight: 600,
                textDecoration: 'none'
              }}
            >
              <span>View All in Order Management</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </section>

        {/* SECTION 3: ADMIN REQUISITIONS */}
        <section className={styles.panelCard} style={{ minHeight: '380px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
              <Send size={16} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
              <div style={{ minWidth: 0 }}>
                <h2 style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                  Admin Requisitions
                </h2>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Recent stock requests sent to Admin
                </div>
              </div>
            </div>

            <Link
              to="/staff/inventory?view=history"
              style={{ fontSize: '11.5px', fontWeight: 600, flexShrink: 0 }}
            >
              View All →
            </Link>
          </div>

          {inventoryLoading && stockRequests.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[1, 2, 3].map((n) => (
                <div key={n} className="skeleton-box" style={{ height: '52px', borderRadius: 'var(--border-radius-sm)' }} />
              ))}
            </div>
          ) : inventoryError ? (
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              padding: '24px',
              color: 'var(--color-danger-text)',
              fontSize: '12.5px',
              gap: '8px'
            }}>
              <AlertCircle size={24} />
              <span>{inventoryError}</span>
            </div>
          ) : stockRequests.length === 0 ? (
            <div style={{
              padding: '30px 16px',
              textAlign: 'center',
              backgroundColor: 'var(--bg-app)',
              borderRadius: 'var(--border-radius-md)',
              border: '1px dashed var(--border-color)',
              color: 'var(--text-muted)',
              fontSize: '12.5px',
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              No active stock requests at this time.
            </div>
          ) : (
            <div className="thin-scrollbar" style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, maxHeight: '260px', overflowY: 'auto' }}>
              {stockRequests.slice(0, 6).map((req) => (
                <Link
                  key={req.id}
                  to="/staff/inventory?view=history"
                  style={{
                    border: '1px solid var(--border-color-subtle)',
                    borderRadius: 'var(--border-radius-sm)',
                    padding: '9px 11px',
                    backgroundColor: 'var(--bg-app)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px',
                    textDecoration: 'none',
                    color: 'inherit'
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {req.itemName}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      Requested: <strong>{req.requestedQuantity} {req.unit}</strong> • REQ-{req.id}
                    </div>
                  </div>

                  <StatusBadge status={req.status} size="sm" />
                </Link>
              ))}
            </div>
          )}

          <div style={{ marginTop: 'auto', paddingTop: '10px' }}>
            <Link
              to="/staff/inventory?view=request"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                width: '100%',
                padding: '8px 14px',
                borderRadius: 'var(--border-radius-md)',
                backgroundColor: 'var(--bg-app)',
                border: '1px solid var(--border-color)',
                color: 'var(--color-primary)',
                fontSize: '12px',
                fontWeight: 600,
                textDecoration: 'none'
              }}
            >
              + Submit New Stock Requisition
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
};

export default StaffDashboardPage;
