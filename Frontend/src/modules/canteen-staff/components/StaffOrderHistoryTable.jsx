import React from 'react';
import {
  Eye,
  ShoppingBag,
  Utensils,
  Truck,
  CheckCheck,
  Calendar,
  Clock
} from 'lucide-react';
import { formatCurrency } from '../../../utils/formatters';

export const StaffOrderHistoryTable = ({
  orders = [],
  loading = false,
  currentPage = 1,
  pageSize = 10,
  onViewDetails
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

  return (
    <div style={{
      backgroundColor: 'var(--bg-surface)',
      borderRadius: 'var(--border-radius-lg)',
      border: '1px solid var(--border-color)',
      boxShadow: 'var(--shadow-xs)',
      overflow: 'hidden'
    }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '12.5px',
          textAlign: 'left'
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
              <th style={{ width: '160px', padding: '12px 14px', fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Completed Date / Time
              </th>
              <th style={{ width: '100px', padding: '12px 14px', fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'right' }}>
                Total
              </th>
              <th style={{ width: '130px', padding: '12px 14px', fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'center' }}>
                Final Status
              </th>
              <th style={{ width: '80px', padding: '12px 14px', fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'center' }}>
                Details
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      border: '3px solid var(--border-color)',
                      borderTopColor: 'var(--color-primary)',
                      animation: 'spin 0.8s linear infinite'
                    }} />
                    <span>Loading completed order records...</span>
                  </div>
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: '48px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                    <CheckCheck size={36} style={{ color: '#10b981', marginBottom: '4px' }} />
                    <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      No Completed Orders Found
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      Completed orders will appear in this history view once fulfilled at the counter.
                    </span>
                  </div>
                </td>
              </tr>
            ) : (
              orders.map((order, index) => {
                const serialNumber = (currentPage - 1) * pageSize + index + 1;
                // Use completion timestamp if available, else order date
                const completionTimestamp = order.completedAt || order.updatedAt || order.orderDate || order.createdAt;
                const { date, time } = formatDateTime(completionTimestamp);

                const itemsList = Array.isArray(order.items) ? order.items : [];
                const totalAmount = Number(order.totalAmount || order.total || 0);

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
                            onClick={() => onViewDetails && onViewDetails(order)}
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
                          {order.customer?.name || order.customerName || 'Guest Diner'} {order.customer?.rollNo ? `(${order.customer.rollNo})` : ''}
                        </div>
                      </div>
                    </td>

                    {/* COLUMN 3: FOOD ORDER DETAILS */}
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {itemsList.length > 0 ? (
                          itemsList.map((item, i) => (
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
                              <span style={{ color: '#ea580c', fontWeight: 800 }}>
                                {item.quantity}x
                              </span>
                              <span>{item.name || item.itemName}</span>
                            </span>
                          ))
                        ) : (
                          <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Food Items</span>
                        )}
                      </div>
                    </td>

                    {/* COLUMN 4: ORDER TYPE */}
                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                      {renderOrderTypeBadge(order.orderType || order.type)}
                    </td>

                    {/* COLUMN 5: COMPLETION DATE & TIME */}
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '12px' }}>
                          {date}
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {time}
                        </span>
                      </div>
                    </td>

                    {/* COLUMN 6: TOTAL AMOUNT */}
                    <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {formatCurrency(totalAmount)}
                    </td>

                    {/* COLUMN 7: FINAL STATUS */}
                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        backgroundColor: '#ecfdf5',
                        color: '#10b981',
                        border: '1px solid #a7f3d0',
                        whiteSpace: 'nowrap'
                      }}>
                        <CheckCheck size={12} />
                        Completed
                      </span>
                    </td>

                    {/* COLUMN 8: VIEW DETAILS ACTION */}
                    <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => onViewDetails && onViewDetails(order)}
                        title="View order details and item breakdown"
                        style={{
                          width: '30px',
                          height: '30px',
                          borderRadius: '6px',
                          border: '1px solid var(--border-color)',
                          backgroundColor: 'var(--bg-surface)',
                          color: 'var(--color-primary)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: 'all var(--transition-fast)'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-primary-light)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-surface)'; }}
                      >
                        <Eye size={14} />
                      </button>
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

export default StaffOrderHistoryTable;
