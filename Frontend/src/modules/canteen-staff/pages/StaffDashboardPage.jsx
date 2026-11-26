import React, { useMemo } from 'react';
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
  ArrowRight
} from 'lucide-react';
import { useStaffOrders } from '../hooks/useStaffOrders';
import { useStaffInventory } from '../hooks/useStaffInventory';
import { STAFF_APP_CONFIG } from '../constants/staffNavigation';
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
import { formatNumber, isSameIstDate } from '../../../utils/formatters';

export const StaffDashboardPage = () => {
  const {
    orders,
    loading: ordersLoading,
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
    refreshInventory
  } = useStaffInventory();

  const handleRefresh = async () => {
    await Promise.all([refreshOrders(), refreshInventory()]);
  };

  // 1. Calculate Exact Order Status Counts (No double counting)
  const newOrdersCount = useMemo(() => {
    return orders.filter(o => isStatusPlaced(o.status)).length;
  }, [orders]);

  const acceptedOrdersCount = useMemo(() => {
    return orders.filter(o => isStatusAccepted(o.status)).length;
  }, [orders]);

  const preparingOrdersCount = useMemo(() => {
    return orders.filter(o => isStatusPreparing(o.status)).length;
  }, [orders]);

  const readyOrdersCount = useMemo(() => {
    return orders.filter(o => isStatusReady(o.status)).length;
  }, [orders]);

  // Collected Today strictly checks local IST business date
  const completedOrdersCount = useMemo(() => {
    return orders.filter(o => isOrderCompletedToday(o)).length;
  }, [orders]);

  // 2. Calculate Inventory Alerts (Low stock, critical stock, out of stock, expiring)
  const inventoryAlerts = useMemo(() => {
    const alerts = [];

    // Low stock & critical stock threshold scanning
    inventory.forEach(item => {
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
          badgeColor: '#dc2626',
          badgeBg: '#fef2f2',
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
          badgeColor: '#dc2626',
          badgeBg: '#fef2f2',
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
          badgeColor: '#d97706',
          badgeBg: '#fffbeb',
          priority: 3
        });
      }
    });

    // Expiring batches scanning
    expiringItems.forEach(item => {
      const existing = alerts.find(a => a.itemId === item.id);
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
          badgeColor: days <= 1 ? '#dc2626' : '#d97706',
          badgeBg: days <= 1 ? '#fef2f2' : '#fffbeb',
          priority: days < 0 ? 1 : 4
        });
      }
    });

    alerts.sort((a, b) => a.priority - b.priority);
    return alerts.slice(0, 5);
  }, [inventory, expiringItems]);

  // 3. Live Order Activity Stream (Active orders created today in local Asia/Kolkata timezone only, sorted newest first)
  const activeOrders = useMemo(() => {
    return orders
      .filter((o) => {
        if (isStatusCompleted(o.status) || isStatusCancelled(o.status)) return false;
        const orderTimestamp = o.createdAt || o.orderDate;
        return isSameIstDate(orderTimestamp);
      })
      .sort((a, b) => new Date(b.orderDate || b.createdAt || 0) - new Date(a.orderDate || a.createdAt || 0))
      .slice(0, 5);
  }, [orders]);

  // Format order relative time
  const formatOrderTime = (dateString) => {
    if (!dateString) return 'Just now';
    const orderDate = new Date(dateString);
    if (isNaN(orderDate.getTime())) return 'Recently';

    const now = new Date();
    const diffMs = now.getTime() - orderDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const hours = Math.floor(diffMins / 60);
    if (hours < 24) return `${hours}h ago`;
    return orderDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* 1. Page Header matching Admin aesthetic */}
      <PageHeader
        title="Canteen Staff Dashboard"
        description="Daily operational queue, kitchen preparation stages, and inventory alerts."
        badge={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span
              style={{
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
              }}
            >
              <Store size={12} />
              {activeOutletName || STAFF_APP_CONFIG.canteenOutlet} ({STAFF_APP_CONFIG.counterName})
            </span>

            {/* Secondary Compact Completed Orders Metric */}
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '3px 10px',
                borderRadius: '9999px',
                backgroundColor: 'var(--color-success-bg)',
                color: 'var(--color-success)',
                fontSize: '12px',
                fontWeight: 600,
                border: '1px solid var(--color-success-border)'
              }}
              title="Orders successfully collected by students & faculty"
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

      {/* 2. Order Status Cards – All 4 in One Row (Neat, Compact, Equal Size & Height) */}
      <style>{`
        .staff-status-cards-row {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
          align-items: stretch;
        }
        @media (max-width: 1024px) {
          .staff-status-cards-row {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 10px;
          }
        }
        @media (max-width: 580px) {
          .staff-status-cards-row {
            grid-template-columns: 1fr;
            gap: 8px;
          }
        }
      `}</style>
      <div className="staff-status-cards-row">
        {/* CARD 1: NEW ORDERS */}
        <Link
          to="/staff/board"
          style={{
            textDecoration: 'none',
            color: 'inherit',
            backgroundColor: 'var(--bg-surface)',
            border: newOrdersCount > 0 ? '1.5px solid #f59e0b' : '1px solid var(--border-color)',
            borderRadius: 'var(--border-radius-lg)',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            boxShadow: 'var(--shadow-xs)',
            transition: 'transform var(--transition-fast), box-shadow var(--transition-fast)',
            cursor: 'pointer',
            height: '100%',
            minHeight: '74px',
            boxSizing: 'border-box'
          }}
        >
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: 'var(--border-radius-md)',
            backgroundColor: '#fffbeb',
            color: '#d97706',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            position: 'relative'
          }}>
            <Clock size={18} />
            {newOrdersCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-2px',
                right: '-2px',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#ef4444',
                border: '2px solid var(--bg-surface)'
              }} />
            )}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{
                fontSize: '10.5px',
                fontWeight: 700,
                color: 'var(--text-muted)',
                letterSpacing: '0.04em'
              }}>
                NEW ORDERS
              </div>
              {newOrdersCount > 0 && (
                <span style={{
                  fontSize: '9px',
                  fontWeight: 700,
                  backgroundColor: '#fef2f2',
                  color: '#dc2626',
                  padding: '1px 5px',
                  borderRadius: '4px'
                }}>
                  Action Req
                </span>
              )}
            </div>
            <div style={{
              fontSize: '20px',
              fontWeight: 800,
              color: '#d97706',
              lineHeight: 1.15,
              marginTop: '1px'
            }}>
              {formatNumber(newOrdersCount)}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              Awaiting Staff acceptance →
            </div>
          </div>
        </Link>

        {/* CARD 2: ACCEPTED ORDERS */}
        <Link
          to="/staff/board"
          style={{
            textDecoration: 'none',
            color: 'inherit',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--border-radius-lg)',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            boxShadow: 'var(--shadow-xs)',
            transition: 'transform var(--transition-fast), box-shadow var(--transition-fast)',
            cursor: 'pointer',
            height: '100%',
            minHeight: '74px',
            boxSizing: 'border-box'
          }}
        >
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: 'var(--border-radius-md)',
            backgroundColor: '#f0f9ff',
            color: '#0284c7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <CheckCircle2 size={18} />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: '10.5px',
              fontWeight: 700,
              color: 'var(--text-muted)',
              letterSpacing: '0.04em'
            }}>
              ACCEPTED ORDERS
            </div>
            <div style={{
              fontSize: '20px',
              fontWeight: 800,
              color: '#0284c7',
              lineHeight: 1.15,
              marginTop: '1px'
            }}>
              {formatNumber(acceptedOrdersCount)}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              Queued to start cooking →
            </div>
          </div>
        </Link>

        {/* CARD 3: PREPARING */}
        <Link
          to="/staff/kitchen"
          style={{
            textDecoration: 'none',
            color: 'inherit',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--border-radius-lg)',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            boxShadow: 'var(--shadow-xs)',
            transition: 'transform var(--transition-fast), box-shadow var(--transition-fast)',
            cursor: 'pointer',
            height: '100%',
            minHeight: '74px',
            boxSizing: 'border-box'
          }}
        >
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: 'var(--border-radius-md)',
            backgroundColor: '#f5f3ff',
            color: '#8b5cf6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <ChefHat size={18} />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: '10.5px',
              fontWeight: 700,
              color: 'var(--text-muted)',
              letterSpacing: '0.04em'
            }}>
              PREPARING
            </div>
            <div style={{
              fontSize: '20px',
              fontWeight: 800,
              color: '#8b5cf6',
              lineHeight: 1.15,
              marginTop: '1px'
            }}>
              {formatNumber(preparingOrdersCount)}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              Cooking at kitchen stations →
            </div>
          </div>
        </Link>

        {/* CARD 4: READY FOR PICKUP */}
        <Link
          to="/staff/verify"
          style={{
            textDecoration: 'none',
            color: 'inherit',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--border-radius-lg)',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            boxShadow: 'var(--shadow-xs)',
            transition: 'transform var(--transition-fast), box-shadow var(--transition-fast)',
            cursor: 'pointer',
            height: '100%',
            minHeight: '74px',
            boxSizing: 'border-box'
          }}
        >
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: 'var(--border-radius-md)',
            backgroundColor: '#ecfdf5',
            color: '#059669',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <BellRing size={18} />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: '10.5px',
              fontWeight: 700,
              color: 'var(--text-muted)',
              letterSpacing: '0.04em'
            }}>
              READY FOR PICKUP
            </div>
            <div style={{
              fontSize: '20px',
              fontWeight: 800,
              color: '#059669',
              lineHeight: 1.15,
              marginTop: '1px'
            }}>
              {formatNumber(readyOrdersCount)}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              Waiting at pickup counter →
            </div>
          </div>
        </Link>
      </div>

      {/* 3. Operational Triad: Inventory Alerts | Live Order Activity | Admin Requisitions (Equal Width & Equal Height Row) */}
      <style>{`
        .staff-operations-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
          align-items: stretch;
          width: 100%;
          box-sizing: border-box;
        }
        @media (max-width: 1080px) {
          .staff-operations-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 14px;
          }
        }
        @media (max-width: 680px) {
          .staff-operations-grid {
            grid-template-columns: 1fr;
            gap: 12px;
          }
        }
      `}</style>
      <div className="staff-operations-grid">
        {/* SECTION 1: INVENTORY ALERTS */}
        <div style={{
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--border-radius-lg)',
          border: '1px solid var(--border-color)',
          padding: '20px',
          boxShadow: 'var(--shadow-xs)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          height: '100%',
          minHeight: '430px',
          minWidth: 0,
          boxSizing: 'border-box'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
              <div style={{
                width: '30px',
                height: '30px',
                borderRadius: '6px',
                backgroundColor: '#fffbeb',
                color: '#d97706',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <AlertTriangle size={16} />
              </div>
              <div style={{ minWidth: 0 }}>
                <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  INVENTORY ALERTS
                </h2>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  Items requiring kitchen staff attention
                </div>
              </div>
            </div>

            <span style={{
              fontSize: '11.5px',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '9999px',
              backgroundColor: inventoryAlerts.length > 0 ? '#fef2f2' : 'var(--color-success-bg)',
              color: inventoryAlerts.length > 0 ? '#dc2626' : 'var(--color-success)',
              border: '1px solid var(--border-color)',
              flexShrink: 0
            }}>
              {inventoryAlerts.length} {inventoryAlerts.length === 1 ? 'alert' : 'alerts'}
            </span>
          </div>

          {inventoryAlerts.length === 0 ? (
            <div style={{
              padding: '36px 16px',
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
              <Sparkles size={28} style={{ color: 'var(--color-success)', marginBottom: '8px' }} />
              <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                All ingredients are well-stocked!
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                No low stock, out of stock, or expiring items detected in {STAFF_APP_CONFIG.canteenOutlet}.
              </div>
            </div>
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              flex: 1,
              maxHeight: '280px',
              overflowY: 'auto',
              paddingRight: '2px'
            }}>
              {inventoryAlerts.map(alert => (
                <div
                  key={alert.id}
                  style={{
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--border-radius-md)',
                    padding: '10px 12px',
                    backgroundColor: 'var(--bg-app)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px'
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{
                        fontSize: '13px',
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {alert.ingredientName}
                      </span>
                    </div>

                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {alert.itemCode}
                      {alert.reorderLevel > 0 && ` • Min: ${alert.reorderLevel} ${alert.unit}`}
                      {alert.expiryDate && ` • Exp: ${alert.expiryDate}`}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: '12.5px', fontWeight: 800, color: alert.badgeColor }}>
                      {alert.availableQuantity} {alert.unit}
                    </div>
                    <span style={{
                      display: 'inline-block',
                      marginTop: '2px',
                      fontSize: '10px',
                      fontWeight: 700,
                      padding: '1px 6px',
                      borderRadius: '4px',
                      backgroundColor: alert.badgeBg,
                      color: alert.badgeColor
                    }}>
                      {alert.statusLabel}
                    </span>
                  </div>

                  <Link
                    to={`/staff/stock-requests?item=${encodeURIComponent(alert.ingredientName)}&unit=${alert.unit}`}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '6px',
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

          {/* Quick Access Links */}
          <div style={{
            marginTop: 'auto',
            paddingTop: '12px',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px'
          }}>
            <Link
              to="/staff/inventory"
              style={{
                fontSize: '11.5px',
                fontWeight: 600,
                color: 'var(--color-accent)',
                textDecoration: 'none'
              }}
            >
              View All Inventory →
            </Link>

            <Link
              to="/staff/inventory/expiry"
              style={{
                fontSize: '11.5px',
                fontWeight: 600,
                color: 'var(--color-accent)',
                textDecoration: 'none'
              }}
            >
              View Expiry Tracking →
            </Link>

            <Link
              to="/staff/stock-requests"
              style={{
                fontSize: '11.5px',
                fontWeight: 600,
                color: 'var(--color-primary)',
                textDecoration: 'none'
              }}
            >
              Send Request to Admin →
            </Link>
          </div>
        </div>

        {/* SECTION 2: LIVE ORDER ACTIVITY */}
        <div style={{
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--border-radius-lg)',
          border: '1px solid var(--border-color)',
          padding: '20px',
          boxShadow: 'var(--shadow-xs)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          height: '100%',
          minHeight: '430px',
          minWidth: 0,
          boxSizing: 'border-box'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#10b981', flexShrink: 0 }} />
              <div style={{ minWidth: 0 }}>
                <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  LIVE ORDER ACTIVITY
                </h2>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  Active queue requiring kitchen & counter actions
                </div>
              </div>
            </div>

            <Link
              to="/staff/board"
              style={{ fontSize: '12px', color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none', flexShrink: 0 }}
            >
              View All Orders →
            </Link>
          </div>

          {activeOrders.length === 0 ? (
            <div style={{
              padding: '36px 16px',
              textAlign: 'center',
              backgroundColor: 'var(--bg-app)',
              borderRadius: 'var(--border-radius-md)',
              border: '1px dashed var(--border-color)',
              color: 'var(--text-muted)',
              fontSize: '13px',
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              No active orders in live queue right now. All orders have been completed or served!
            </div>
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              flex: 1,
              maxHeight: '280px',
              overflowY: 'auto',
              paddingRight: '2px'
            }}>
              {activeOrders.map(order => {
                const isReady = isStatusReady(order.status);
                const isPrep = isStatusPreparing(order.status);
                const isPlaced = isStatusPlaced(order.status);
                const isAccepted = isStatusAccepted(order.status);

                return (
                  <div
                    key={order.id}
                    style={{
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--border-radius-md)',
                      padding: '10px 12px',
                      backgroundColor: 'var(--bg-app)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '8px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                      <div style={{
                        padding: '3px 7px',
                        borderRadius: '6px',
                        backgroundColor: 'var(--color-primary)',
                        color: '#ffffff',
                        fontWeight: 800,
                        fontSize: '11.5px',
                        flexShrink: 0
                      }}>
                        {order.token || 'T-ORD'}
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {order.customer?.name || 'Customer'}
                          <span style={{
                            marginLeft: '5px',
                            fontSize: '9.5px',
                            padding: '1px 5px',
                            borderRadius: '4px',
                            backgroundColor: 'var(--bg-muted)',
                            color: 'var(--text-secondary)',
                            fontWeight: 600
                          }}>
                            {order.customer?.role || 'Student'}
                          </span>
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {Array.isArray(order.items)
                            ? order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')
                            : 'Order items'}
                          <span style={{ marginLeft: '4px', color: 'var(--text-secondary)' }}>
                            • {formatOrderTime(order.orderDate || order.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                      {/* Current Status Pill */}
                      <span style={{
                        fontSize: '10.5px',
                        padding: '2px 7px',
                        borderRadius: '6px',
                        fontWeight: 600,
                        backgroundColor: isReady
                          ? 'var(--color-success-bg)'
                          : isPrep
                          ? '#f5f3ff'
                          : isAccepted
                          ? '#f0f9ff'
                          : 'var(--color-warning-bg)',
                        color: isReady
                          ? 'var(--color-success)'
                          : isPrep
                          ? '#8b5cf6'
                          : isAccepted
                          ? '#0284c7'
                          : 'var(--color-warning)',
                        border: '1px solid var(--border-color)'
                      }}>
                        {order.status}
                      </span>

                      {/* Required Action Button / Status Badge */}
                      {isPlaced && (
                        <span style={{
                          fontSize: '10.5px',
                          padding: '2px 7px',
                          borderRadius: '6px',
                          fontWeight: 600,
                          backgroundColor: '#fef3c7',
                          color: '#b45309',
                          border: '1px solid #fde68a'
                        }}>
                          Awaiting Cashier
                        </span>
                      )}

                      {isAccepted && (
                        <button
                          type="button"
                          onClick={() => startPreparation(order.id)}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '6px',
                            backgroundColor: '#ea580c',
                            color: '#ffffff',
                            border: 'none',
                            fontSize: '11px',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          Start Preparing
                        </button>
                      )}

                      {isPrep && (
                        <button
                          type="button"
                          onClick={() => markReadyForPickup(order.id)}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '6px',
                            backgroundColor: '#059669',
                            color: '#ffffff',
                            border: 'none',
                            fontSize: '11px',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          Ready
                        </button>
                      )}

                      {isReady && (
                        <span style={{
                          fontSize: '10.5px',
                          padding: '2px 7px',
                          borderRadius: '6px',
                          fontWeight: 600,
                          backgroundColor: '#eff6ff',
                          color: '#2563eb',
                          border: '1px solid #bfdbfe'
                        }}>
                          At Pickup Counter
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Quick Orders Link Footer */}
          <div style={{ marginTop: 'auto', paddingTop: '10px' }}>
            <Link
              to="/staff/board"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                width: '100%',
                padding: '9px 16px',
                borderRadius: 'var(--border-radius-md)',
                backgroundColor: 'var(--bg-app)',
                border: '1px solid var(--border-color)',
                color: 'var(--color-primary)',
                fontSize: '12px',
                fontWeight: 700,
                textDecoration: 'none',
                boxSizing: 'border-box'
              }}
            >
              <span>View All in Order Management</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>

        {/* SECTION 3: ADMIN REQUISITIONS */}
        <div style={{
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--border-radius-lg)',
          border: '1px solid var(--border-color)',
          padding: '20px',
          boxShadow: 'var(--shadow-xs)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          height: '100%',
          minHeight: '430px',
          minWidth: 0,
          boxSizing: 'border-box'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
              <div style={{
                width: '30px',
                height: '30px',
                borderRadius: '6px',
                backgroundColor: '#f5f3ff',
                color: '#7c3aed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Send size={16} />
              </div>
              <div style={{ minWidth: 0 }}>
                <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  ADMIN REQUISITIONS
                </h2>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  Recent stock requests sent to Admin
                </div>
              </div>
            </div>

            <Link
              to="/staff/inventory?view=history"
              style={{ fontSize: '12px', color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none', flexShrink: 0 }}
            >
              View All Requests →
            </Link>
          </div>

          {stockRequests.length === 0 ? (
            <div style={{
              padding: '36px 16px',
              textAlign: 'center',
              backgroundColor: 'var(--bg-app)',
              borderRadius: 'var(--border-radius-md)',
              border: '1px dashed var(--border-color)',
              color: 'var(--text-muted)',
              fontSize: '13px',
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              No active stock requests at this time.
            </div>
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              flex: 1,
              maxHeight: '280px',
              overflowY: 'auto',
              paddingRight: '2px'
            }}>
              {stockRequests.map(req => {
                const isPending = req.status === 'Pending Review';
                const isApproved = req.status === 'Approved';

                return (
                  <Link
                    key={req.id}
                    to="/staff/inventory?view=history"
                    style={{
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--border-radius-md)',
                      padding: '10px 12px',
                      backgroundColor: 'var(--bg-app)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '8px',
                      textDecoration: 'none',
                      color: 'inherit',
                      transition: 'border-color var(--transition-fast)'
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {req.itemName}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        Requested: <strong>{req.requestedQuantity} {req.unit}</strong> • {req.id}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <span style={{
                        fontSize: '10.5px',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        backgroundColor: isPending
                          ? 'var(--color-warning-bg)'
                          : isApproved
                          ? '#eff6ff'
                          : 'var(--color-success-bg)',
                        color: isPending
                          ? 'var(--color-warning)'
                          : isApproved
                          ? '#2563eb'
                          : 'var(--color-success)',
                        border: '1px solid var(--border-color)'
                      }}>
                        {req.status}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Quick Request Button */}
          <div style={{ marginTop: 'auto', paddingTop: '10px' }}>
            <Link
              to="/staff/inventory?view=request"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                width: '100%',
                padding: '9px 16px',
                borderRadius: 'var(--border-radius-md)',
                backgroundColor: 'var(--bg-app)',
                border: '1px solid var(--border-color)',
                color: 'var(--color-primary)',
                fontSize: '12px',
                fontWeight: 700,
                textDecoration: 'none',
                boxSizing: 'border-box'
              }}
            >
              + Submit New Stock Requisition
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffDashboardPage;
