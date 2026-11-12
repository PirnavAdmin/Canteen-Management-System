import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, ArrowRight } from 'lucide-react';

export const StockAlertsCard = ({ alerts = [] }) => {
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
          <AlertTriangle size={18} style={{ color: 'var(--color-danger)' }} />
          <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
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
            fontSize: '12.5px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <span>Manage Inventory</span>
          <ArrowRight size={14} />
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {!Array.isArray(alerts) || alerts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '13px' }}>
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
                  padding: '10px 12px',
                  borderRadius: 'var(--border-radius-md)',
                  backgroundColor: isExpiring ? '#fffbeb' : '#fef2f2',
                  border: `1px solid ${isExpiring ? '#fde68a' : '#fecaca'}`
                }}
              >
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: isExpiring ? '#92400e' : '#991b1b' }}>
                    {alert.ingredient || alert.ingredientName || 'Item'}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {alert.outlet || 'Main Canteen'} • Available: <strong>{alert.available || `${alert.availableQuantity ?? 0} ${alert.unit || 'units'}`}</strong> (Reorder at: {alert.reorderLevel ?? 0})
                  </div>
                </div>

                <div style={{
                  padding: '3px 8px',
                  borderRadius: 'var(--border-radius-xs)',
                  fontSize: '11px',
                  fontWeight: 600,
                  backgroundColor: 'var(--bg-surface)',
                  color: isExpiring ? '#d97706' : '#dc2626',
                  border: `1px solid ${isExpiring ? '#fde68a' : '#fecaca'}`,
                  whiteSpace: 'nowrap'
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
