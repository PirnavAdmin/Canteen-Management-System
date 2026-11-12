import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Clock } from 'lucide-react';
import { StatusBadge } from '../../../../components/common/StatusBadge';
import { formatCurrency } from '../../../../utils/formatters';

export const LiveOrderQueue = ({ orders = [] }) => {
  const navigate = useNavigate();

  return (
    <div style={{
      backgroundColor: 'var(--bg-surface)',
      borderRadius: 'var(--border-radius-lg)',
      border: '1px solid var(--border-color)',
      padding: '16px 20px',
      boxShadow: 'var(--shadow-xs)'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '14px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: '#10b981',
            boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.2)'
          }} />
          <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
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
            fontSize: '12.5px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <span>View All Orders</span>
          <ArrowRight size={14} />
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {!Array.isArray(orders) || orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '13px' }}>
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
                padding: '12px 14px',
                borderRadius: 'var(--border-radius-md)',
                backgroundColor: 'var(--bg-app)',
                border: '1px solid var(--border-color-subtle)',
                gap: '12px',
                flexWrap: 'wrap'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  backgroundColor: '#1e3a8a',
                  color: '#ffffff',
                  padding: '6px 10px',
                  borderRadius: 'var(--border-radius-sm)',
                  fontWeight: 700,
                  fontSize: '13px',
                  letterSpacing: '0.04em'
                }}>
                  {ord.token || 'TKN'}
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {ord.customer || ord.customerName || 'Customer'}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      • {ord.customerRole || 'Student'}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {Array.isArray(ord.items) && ord.items.length > 0
                      ? ord.items.map(i => `${i.name || i.itemName || 'Item'} (x${i.qty || i.quantity || 1})`).join(', ')
                      : (ord.itemCount ? `${ord.itemCount} items` : 'Standard Order')}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: 'auto' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {formatCurrency(ord.total ?? ord.totalAmount ?? 0)}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={11} />
                    <span>{ord.slot || ord.elapsedTime || 'Live'}</span>
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
