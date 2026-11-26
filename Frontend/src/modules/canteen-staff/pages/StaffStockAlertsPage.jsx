import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Send,
  Package,
  RefreshCw,
  AlertCircle,
  AlertTriangle
} from 'lucide-react';
import { useStaffInventory } from '../hooks/useStaffInventory';
import { PageHeader } from '../../../components/common/PageHeader';
import { Button } from '../../../components/common/Button';
import { EmptyState } from '../../../components/common/EmptyState';
import { StatusBadge } from '../../../components/common/StatusBadge';
import styles from '../styles/staff.module.css';

export const StaffStockAlertsPage = () => {
  const navigate = useNavigate();
  const { lowStockItems, loading, error, refreshInventory, activeOutletName } = useStaffInventory();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <PageHeader
        title="Real-Time Low Stock & Threshold Alerts"
        description="Items that have breached safe buffer limits and require replenishment from Central Admin."
        actions={
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Button
              variant="secondary"
              icon={RefreshCw}
              loading={loading}
              onClick={() => refreshInventory()}
            >
              Refresh
            </Button>
            <Link
              to="/staff/stock-requests"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: 'var(--border-radius-md)',
                backgroundColor: 'var(--color-danger)',
                color: '#ffffff',
                fontSize: '13.5px',
                fontWeight: 500,
                textDecoration: 'none'
              }}
            >
              <Send size={15} />
              <span>Emergency Request</span>
            </Link>
          </div>
        }
      />

      {error && (
        <div className={styles.errorBanner} role="alert">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
          <Button variant="secondary" size="sm" icon={RefreshCw} onClick={refreshInventory}>
            Retry
          </Button>
        </div>
      )}

      {loading && lowStockItems.length === 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
          {[1, 2, 3].map((n) => (
            <div key={n} className="skeleton-box" style={{ height: '210px', borderRadius: 'var(--border-radius-lg)' }} />
          ))}
        </div>
      ) : lowStockItems.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No Low Stock Warnings"
          message="All raw material inventory counts are currently above their minimum safety thresholds."
          actionLabel="View Inventory Overview"
          onAction={() => navigate('/staff/inventory')}
        />
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '16px'
        }}>
          {lowStockItems.map((item) => {
            const deficit = Math.max(0, Number(item.reorderLevel) - Number(item.availableQuantity));
            const isCritical = Number(item.availableQuantity) <= Number(item.reorderLevel) * 0.3;

            return (
              <div
                key={item.id}
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderRadius: 'var(--border-radius-lg)',
                  border: isCritical ? '1.5px solid var(--color-danger)' : '1px solid var(--color-warning-border)',
                  padding: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  boxShadow: 'var(--shadow-xs)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <StatusBadge status={isCritical ? 'Out of Stock' : 'Low Stock'} size="sm" />
                  <code style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                    {item.itemCode}
                  </code>
                </div>

                <div>
                  <h3 style={{ fontSize: '15.5px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px 0' }}>
                    {item.ingredientName}
                  </h3>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Batch: {item.batchNumber || '—'} • Outlet: {item.outletName || activeOutletName || '—'}
                  </div>
                </div>

                <div style={{
                  backgroundColor: 'var(--bg-app)',
                  borderRadius: 'var(--border-radius-md)',
                  border: '1px solid var(--border-color)',
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Current Stock</div>
                    <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-danger)' }}>
                      {item.availableQuantity} {item.unit}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Safety Min</div>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {item.reorderLevel} {item.unit}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--color-danger-text)', fontWeight: 600 }}>
                  <AlertTriangle size={14} />
                  <span>Deficit: {deficit} {item.unit} needed to reach safety stock.</span>
                </div>

                <Link
                  to={`/staff/stock-requests?item=${encodeURIComponent(item.ingredientName)}&unit=${item.unit}&urgency=${isCritical ? 'Emergency' : 'High'}&qty=${deficit + 10}`}
                  style={{
                    width: '100%',
                    padding: '9px 14px',
                    borderRadius: 'var(--border-radius-md)',
                    backgroundColor: isCritical ? 'var(--color-danger)' : 'var(--color-primary)',
                    color: '#ffffff',
                    textDecoration: 'none',
                    fontSize: '13px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    marginTop: 'auto'
                  }}
                >
                  <Send size={14} />
                  <span>Request Restock from Admin</span>
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StaffStockAlertsPage;
