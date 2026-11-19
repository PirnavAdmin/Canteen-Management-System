import React from 'react';
import { Link } from 'react-router-dom';
import {
  Eye,
  ShoppingBag,
  Utensils,
  Truck,
  Clock,
  CheckCircle2,
  ChefHat,
  BellRing,
  CheckCheck,
  XCircle,
  QrCode,
  Flame,
  ShieldCheck
} from 'lucide-react';
import { ORDER_STATUS } from '../../../constants/appConstants';

export const StaffOrderTable = ({
  orders = [],
  loading = false,
  actionLoadingId = null,
  currentPage = 1,
  pageSize = 10,
  onViewDetails,
  onAccept,
  onStartCooking,
  onMarkReady,
  onVerifyPickup,
  onReject
}) => {
  // Format Date and Time
  const formatDateTime = (dateString) => {
    if (!dateString) return { date: '—', time: '—' };
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return { date: '—', time: '—' };

    const date = d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
    const time = d.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    return { date, time };
  };

  // Order Type Badge
  const renderOrderTypeBadge = (type) => {
    const norm = String(type || 'Pickup').toLowerCase();
    let label = 'Pickup';
    let icon = ShoppingBag;
    let bg = '#eff6ff';
    let color = '#2563eb';
    let border = '#bfdbfe';

    if (norm.includes('dine')) {
      label = 'Dine-in';
      icon = Utensils;
      bg = '#fff7ed';
      color = '#ea580c';
      border = '#fed7aa';
    } else if (norm.includes('deliver')) {
      label = 'Delivery';
      icon = Truck;
      bg = '#f5f3ff';
      color = '#7c3aed';
      border = '#ddd6fe';
    } else if (norm.includes('takeaway')) {
      label = 'Takeaway';
      icon = ShoppingBag;
      bg = '#ecfdf5';
      color = '#059669';
      border = '#a7f3d0';
    }

    const IconComp = icon;

    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '3px 8px',
        borderRadius: '6px',
        fontSize: '11.5px',
        fontWeight: 600,
        backgroundColor: bg,
        color: color,
        border: `1px solid ${border}`,
        whiteSpace: 'nowrap'
      }}>
        <IconComp size={12} />
        {label}
      </span>
    );
  };

  // Order Lifecycle Status Badge
  const renderOrderStatusBadge = (status) => {
    const norm = String(status || '').toLowerCase();
    let bg = 'var(--bg-muted)';
    let color = 'var(--text-secondary)';
    let border = 'var(--border-color)';
    let IconComp = Clock;
    let label = status || 'Placed';

    if (norm === 'placed' || norm === 'new') {
      bg = '#fffbeb';
      color = '#d97706';
      border = '#fde68a';
      IconComp = Clock;
      label = 'Placed';
    } else if (norm === 'accepted') {
      bg = '#f0f9ff';
      color = '#0284c7';
      border = '#bae6fd';
      IconComp = CheckCircle2;
      label = 'Accepted';
    } else if (norm === 'preparing') {
      bg = '#f5f3ff';
      color = '#8b5cf6';
      border = '#ddd6fe';
      IconComp = ChefHat;
      label = 'Preparing';
    } else if (norm.includes('ready')) {
      bg = '#ecfdf5';
      color = '#059669';
      border = '#a7f3d0';
      IconComp = BellRing;
      label = 'Ready for Pickup';
    } else if (norm === 'completed' || norm === 'collected') {
      bg = '#ecfdf5';
      color = '#10b981';
      border = '#a7f3d0';
      IconComp = CheckCheck;
      label = 'Completed';
    } else if (norm === 'cancelled' || norm === 'rejected') {
      bg = '#fef2f2';
      color = '#dc2626';
      border = '#fecaca';
      IconComp = XCircle;
      label = 'Cancelled';
    }

    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '3px 10px',
        borderRadius: '9999px',
        fontSize: '11.5px',
        fontWeight: 700,
        backgroundColor: bg,
        color: color,
        border: `1px solid ${border}`,
        whiteSpace: 'nowrap'
      }}>
        <IconComp size={12} />
        {label}
      </span>
    );
  };

  return (
    <div style={{
      backgroundColor: 'var(--bg-surface)',
      borderRadius: 'var(--border-radius-lg)',
      border: '1px solid var(--border-color)',
      boxShadow: 'var(--shadow-xs)',
      overflow: 'hidden'
    }}>
      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          textAlign: 'left',
          fontSize: '12.5px',
          minWidth: '860px'
        }}>
          <thead>
            <tr style={{
              backgroundColor: 'var(--bg-app)',
              borderBottom: '1px solid var(--border-color)'
            }}>
              <th style={{ width: '45px', padding: '12px 14px', fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'center' }}>
                #
              </th>
              <th style={{ width: '180px', padding: '12px 14px', fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Order Info
              </th>
              <th style={{ minWidth: '240px', padding: '12px 14px', fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Food Order Details
              </th>
              <th style={{ width: '115px', padding: '12px 14px', fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'center' }}>
                Order Type
              </th>
              <th style={{ width: '145px', padding: '12px 14px', fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'center' }}>
                Order Status
              </th>
              <th style={{ minWidth: '180px', padding: '12px 14px', fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'center' }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      border: '3px solid var(--border-color)',
                      borderTopColor: 'var(--color-primary)',
                      animation: 'spin 0.8s linear infinite'
                    }} />
                    <span>Loading orders...</span>
                  </div>
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '48px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                    <ShoppingBag size={32} style={{ color: 'var(--text-muted)', marginBottom: '4px' }} />
                    <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      No orders match your filters
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      Try adjusting the search query, order status, or date range.
                    </span>
                  </div>
                </td>
              </tr>
            ) : (
              orders.map((order, index) => {
                const serialNumber = (currentPage - 1) * pageSize + index + 1;
                const { date, time } = formatDateTime(order.orderDate || order.createdAt);

                const isPlaced = order.status === ORDER_STATUS.PLACED;
                const isAccepted = order.status === ORDER_STATUS.ACCEPTED;
                const isPreparing = order.status === ORDER_STATUS.PREPARING;
                const isReady = order.status === ORDER_STATUS.READY_FOR_PICKUP || order.status === 'Ready for Pickup';
                const isCompleted = order.status === ORDER_STATUS.COMPLETED;
                const isCancelled = order.status === ORDER_STATUS.CANCELLED || order.status === ORDER_STATUS.REFUNDED;

                const isActionLoading = actionLoadingId === order.id;

                const itemsList = Array.isArray(order.items) ? order.items : [];
                const totalPortions = itemsList.reduce((sum, it) => sum + (Number(it.quantity) || 1), 0);

                return (
                  <tr
                    key={order.id}
                    style={{
                      borderBottom: '1px solid var(--border-color)',
                      transition: 'background-color var(--transition-fast)'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-app)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    {/* COLUMN 1: SERIAL NUMBER */}
                    <td style={{ padding: '12px 14px', color: 'var(--text-muted)', fontWeight: 600, textAlign: 'center' }}>
                      {serialNumber}
                    </td>

                    {/* COLUMN 2: ORDER INFO */}
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{
                            padding: '2px 7px',
                            borderRadius: '4px',
                            backgroundColor: '#1e3a8a',
                            color: '#ffffff',
                            fontWeight: 800,
                            fontSize: '11px',
                            letterSpacing: '0.02em'
                          }}>
                            {order.token || 'T-ORD'}
                          </span>
                          <span
                            onClick={() => onViewDetails(order)}
                            title="Click to view details"
                            style={{
                              fontWeight: 700,
                              color: 'var(--color-primary)',
                              fontSize: '12.5px',
                              cursor: 'pointer'
                            }}
                            onMouseEnter={(e) => { e.target.style.textDecoration = 'underline'; }}
                            onMouseLeave={(e) => { e.target.style.textDecoration = 'none'; }}
                          >
                            {order.id}
                          </span>
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {date} • {time}
                        </div>
                      </div>
                    </td>

                    {/* COLUMN 3: FOOD ORDER DETAILS */}
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {itemsList.length > 0 ? (
                            itemsList.slice(0, 3).map((item, i) => (
                              <span
                                key={i}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: '2px 8px',
                                  borderRadius: '6px',
                                  backgroundColor: 'var(--bg-app)',
                                  border: '1px solid var(--border-color)',
                                  fontSize: '11.5px',
                                  fontWeight: 600,
                                  color: 'var(--text-primary)'
                                }}
                              >
                                <span style={{
                                  color: '#ea580c',
                                  fontWeight: 800
                                }}>
                                  {item.quantity}x
                                </span>
                                <span>{item.name || item.itemName}</span>
                              </span>
                            ))
                          ) : (
                            <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>No items listed</span>
                          )}
                          {itemsList.length > 3 && (
                            <span style={{
                              fontSize: '11px',
                              fontWeight: 600,
                              color: 'var(--text-muted)',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              backgroundColor: 'var(--bg-muted)'
                            }}>
                              +{itemsList.length - 3} more
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {itemsList.length > 0 && `${totalPortions} total ${totalPortions === 1 ? 'portion' : 'portions'}`}
                          {order.notes && ` • Note: ${order.notes}`}
                        </div>
                      </div>
                    </td>

                    {/* COLUMN 4: ORDER TYPE */}
                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                      {renderOrderTypeBadge(order.orderType || order.type || 'Pickup')}
                    </td>

                    {/* COLUMN 5: ORDER STATUS */}
                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                      {renderOrderStatusBadge(order.status)}
                    </td>

                    {/* COLUMN 6: DYNAMIC ACTIONS PER ORDER STATUS */}
                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        flexWrap: 'wrap'
                      }}>
                        {/* Always Display: View Details Button */}
                        <button
                          type="button"
                          onClick={() => onViewDetails(order)}
                          title="View Order Details"
                          style={{
                            width: '30px',
                            height: '30px',
                            borderRadius: '6px',
                            border: '1px solid var(--border-color)',
                            backgroundColor: 'var(--bg-surface)',
                            color: 'var(--color-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer'
                          }}
                        >
                          <Eye size={14} />
                        </button>

                        {/* STATUS 1: NEW / PLACED -> Accept Order & Reject Order */}
                        {isPlaced && (
                          <>
                            <button
                              type="button"
                              disabled={isActionLoading}
                              onClick={() => onAccept(order.id)}
                              title="Accept order and send to kitchen preparation"
                              style={{
                                padding: '5px 12px',
                                borderRadius: '6px',
                                border: 'none',
                                backgroundColor: 'var(--color-primary)',
                                color: '#ffffff',
                                fontSize: '11px',
                                fontWeight: 700,
                                cursor: isActionLoading ? 'wait' : 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px'
                              }}
                            >
                              <CheckCircle2 size={12} />
                              {isActionLoading ? 'Accepting...' : 'Accept Order'}
                            </button>

                            <button
                              type="button"
                              disabled={isActionLoading}
                              onClick={() => onReject(order)}
                              title="Reject order with reason"
                              style={{
                                padding: '5px 8px',
                                borderRadius: '6px',
                                border: '1px solid var(--color-danger-border)',
                                backgroundColor: 'var(--color-danger-bg)',
                                color: 'var(--color-danger)',
                                fontSize: '11px',
                                fontWeight: 600,
                                cursor: 'pointer'
                              }}
                            >
                              Reject
                            </button>
                          </>
                        )}

                        {/* STATUS 2: ACCEPTED -> Send to Kitchen */}
                        {isAccepted && (
                          <button
                            type="button"
                            disabled={isActionLoading}
                            onClick={() => onStartCooking(order.id)}
                            title="Send order to kitchen for cooking"
                            style={{
                              padding: '5px 12px',
                              borderRadius: '6px',
                              border: 'none',
                              backgroundColor: '#ea580c',
                              color: '#ffffff',
                              fontSize: '11px',
                              fontWeight: 700,
                              cursor: isActionLoading ? 'wait' : 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <ChefHat size={12} />
                            {isActionLoading ? 'Sending...' : 'Send to Kitchen'}
                          </button>
                        )}

                        {/* STATUS 3: PREPARING -> Open KDS & Mark Ready */}
                        {isPreparing && (
                          <>
                            <Link
                              to="/staff/kitchen"
                              title="Open Kitchen Display (KDS)"
                              style={{
                                width: '30px',
                                height: '30px',
                                borderRadius: '6px',
                                border: '1px solid #fed7aa',
                                backgroundColor: '#fff7ed',
                                color: '#ea580c',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                textDecoration: 'none'
                              }}
                            >
                              <Flame size={14} />
                            </Link>

                            <button
                              type="button"
                              disabled={isActionLoading}
                              onClick={() => onMarkReady(order.id)}
                              title="Mark food preparation complete and ready for counter pickup"
                              style={{
                                padding: '5px 10px',
                                borderRadius: '6px',
                                border: 'none',
                                backgroundColor: '#059669',
                                color: '#ffffff',
                                fontSize: '11px',
                                fontWeight: 700,
                                cursor: isActionLoading ? 'wait' : 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <BellRing size={12} />
                              {isActionLoading ? 'Saving...' : 'Mark Ready'}
                            </button>
                          </>
                        )}

                        {/* STATUS 4: READY FOR PICKUP -> Verify Pickup (Mandatory Verification) */}
                        {isReady && (
                          <button
                            type="button"
                            onClick={() => onVerifyPickup(order)}
                            title="Verify customer counter token/QR and handover meal"
                            style={{
                              padding: '5px 12px',
                              borderRadius: '6px',
                              border: 'none',
                              backgroundColor: '#10b981',
                              color: '#ffffff',
                              fontSize: '11px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <QrCode size={12} />
                            Verify Pickup
                          </button>
                        )}

                        {/* STATUS 5: COMPLETED -> Verification Details */}
                        {isCompleted && (
                          <span
                            title={order.verifiedAt ? `Verified by ${order.verifiedBy || 'Counter Staff'} on ${new Date(order.verifiedAt).toLocaleTimeString()}` : 'Collected by customer'}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px',
                              fontSize: '11px',
                              fontWeight: 600,
                              color: 'var(--color-success)',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              backgroundColor: 'var(--color-success-bg)',
                              border: '1px solid var(--color-success-border)'
                            }}
                          >
                            <ShieldCheck size={11} />
                            Verified
                          </span>
                        )}

                        {/* CANCELLED STATUS */}
                        {isCancelled && (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                            fontSize: '11px',
                            fontWeight: 600,
                            color: 'var(--color-danger)',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            backgroundColor: 'var(--color-danger-bg)'
                          }}>
                            <XCircle size={11} />
                            Cancelled
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StaffOrderTable;
