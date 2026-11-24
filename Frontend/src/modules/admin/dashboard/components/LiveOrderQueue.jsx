import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Clock } from 'lucide-react';
import { StatusBadge } from '../../../../components/common/StatusBadge';
import { formatCurrency } from '../../../../utils/formatters';

export const LiveOrderQueue = ({ orders = [], loading = false }) => {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        borderRadius: 'var(--border-radius-md)',
        border: '1px solid var(--border-color)',
        padding: '12px 16px',
        boxShadow: 'var(--shadow-xs)',
        height: '300px',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="skeleton-box" style={{ width: '8px', height: '8px', borderRadius: '50%' }} />
            <div className="skeleton-box" style={{ width: '150px', height: '14px' }} />
          </div>
          <div className="skeleton-box" style={{ width: '90px', height: '14px' }} />
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[1, 2, 3].map((n) => (
            <div key={n} style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid var(--border-color-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className="skeleton-box" style={{ width: '38px', height: '24px', borderRadius: '4px' }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div className="skeleton-box" style={{ width: '100px', height: '12px' }} />
                  <div className="skeleton-box" style={{ width: '140px', height: '9px' }} />
                </div>
              </div>
              <div className="skeleton-box" style={{ width: '60px', height: '20px', borderRadius: '12px' }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: 'var(--bg-surface)',
      borderRadius: 'var(--border-radius-md)',
      border: '1px solid var(--border-color)',
      padding: '12px 16px',
      boxShadow: 'var(--shadow-xs)',
      height: '300px',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '10px',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: '#10b981',
            boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.2)'
          }} />
          <h3 style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
            Live Order Kitchen Queue
          </h3>
        </div>

        <button
          type="button"
          onClick={() => navigate('/admin/orders')}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--color-accent)',
            fontSize: '11.5px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <span>View All Orders</span>
          <ArrowRight size={13} />
        </button>
      </div>

      <div
        className="thin-scrollbar"
        style={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          overflowY: 'auto',
          paddingRight: '4px'
        }}
      >
        {!Array.isArray(orders) || orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 20px', color: 'var(--text-muted)', fontSize: '12.5px' }}>
            No active orders in live queue right now.
          </div>
        ) : (
          orders.map((ord, idx) => (
            <div
              key={ord.id || ord.orderId || idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                borderRadius: 'var(--border-radius-sm)',
                backgroundColor: 'var(--bg-app)',
                border: '1px solid var(--border-color-subtle)',
                gap: '10px',
                flexWrap: 'wrap'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                <div style={{
                  backgroundColor: '#1e3a8a',
                  color: '#ffffff',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontWeight: 700,
                  fontSize: '11.5px',
                  letterSpacing: '0.04em',
                  flexShrink: 0
                }}>
                  {ord.token || 'TKN'}
                </div>

                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{
                      fontSize: '12.5px',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {typeof ord.customer === 'object'
                        ? (ord.customer?.name || ord.customer?.fullName || ord.customer?.id || 'Customer')
                        : (ord.customer || ord.customerName || 'Customer')}
                    </span>
                    <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                      • {ord.customerRole || (typeof ord.customer === 'object' ? ord.customer?.role : null) || 'Student'}
                    </span>
                  </div>
                  <div style={{
                    fontSize: '11px',
                    color: 'var(--text-secondary)',
                    marginTop: '1px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {Array.isArray(ord.items) && ord.items.length > 0
                      ? ord.items.map(i => `${i.name || i.itemName || 'Item'} (x${i.qty || i.quantity || 1})`).join(', ')
                      : (ord.itemCount ? `${ord.itemCount} items` : 'Standard Order')}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: 'auto', flexShrink: 0 }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {formatCurrency(ord.total ?? ord.totalAmount ?? 0)}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <Clock size={10} />
                    <span>{ord.elapsedTime || ord.orderTime || 'Live'}</span>
                  </div>
                </div>

                <StatusBadge status={ord.status || 'Preparing'} size="sm" />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default LiveOrderQueue;
