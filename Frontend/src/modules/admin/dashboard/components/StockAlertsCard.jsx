import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowRight } from 'lucide-react';

export const StockAlertsCard = ({ alerts = [], loading = false }) => {
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
            <div className="skeleton-box" style={{ width: '16px', height: '16px', borderRadius: '4px' }} />
            <div className="skeleton-box" style={{ width: '160px', height: '14px' }} />
          </div>
          <div className="skeleton-box" style={{ width: '100px', height: '14px' }} />
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[1, 2, 3].map((n) => (
            <div key={n} style={{ padding: '8px 10px', borderRadius: '4px', border: '1px solid var(--border-color-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div className="skeleton-box" style={{ width: '130px', height: '12px' }} />
                <div className="skeleton-box" style={{ width: '160px', height: '9px' }} />
              </div>
              <div className="skeleton-box" style={{ width: '65px', height: '18px', borderRadius: '4px' }} />
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
          <AlertTriangle size={16} style={{ color: 'var(--color-danger)' }} />
          <h3 style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
            Inventory Stock & Expiry Alerts
          </h3>
        </div>

        <button
          type="button"
          onClick={() => navigate('/admin/inventory')}
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
          <span>Manage Inventory</span>
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
          gap: '6px',
          overflowY: 'auto',
          paddingRight: '4px'
        }}
      >
        {!Array.isArray(alerts) || alerts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 20px', color: 'var(--text-muted)', fontSize: '12.5px' }}>
            All ingredient stock levels are optimal.
          </div>
        ) : (
          alerts.map((alert, idx) => {
            const isExpiring = alert.status === 'Expiring Soon';
            return (
              <div
                key={alert.id || alert.itemId || idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '7px 10px',
                  borderRadius: 'var(--border-radius-sm)',
                  backgroundColor: isExpiring ? '#fffbeb' : '#fef2f2',
                  border: `1px solid ${isExpiring ? '#fde68a' : '#fecaca'}`,
                  gap: '8px'
                }}
              >
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{
                    fontSize: '12.5px',
                    fontWeight: 600,
                    color: isExpiring ? '#92400e' : '#991b1b',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {alert.ingredient || alert.ingredientName || 'Item'}
                  </div>
                  <div style={{
                    fontSize: '10.5px',
                    color: 'var(--text-secondary)',
                    marginTop: '1px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {typeof alert.outlet === 'object' ? (alert.outlet?.name || alert.outlet?.id || 'Main Canteen') : (alert.outlet || 'Main Canteen')} • Stock: <strong>{alert.available || `${alert.availableQuantity ?? 0} ${alert.unit || 'units'}`}</strong> (Reorder: {alert.reorderLevel ?? 0})
                  </div>
                </div>

                <div style={{
                  padding: '2px 7px',
                  borderRadius: '4px',
                  fontSize: '10.5px',
                  fontWeight: 600,
                  backgroundColor: 'var(--bg-surface)',
                  color: isExpiring ? '#d97706' : '#dc2626',
                  border: `1px solid ${isExpiring ? '#fde68a' : '#fecaca'}`,
                  whiteSpace: 'nowrap',
                  flexShrink: 0
                }}>
                  {alert.status || 'Stock Alert'}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default StockAlertsCard;
