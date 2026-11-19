import React from 'react';
import { Link } from 'react-router-dom';
import {
  Send,
  Package,
  RefreshCw
} from 'lucide-react';
import { useStaffInventory } from '../hooks/useStaffInventory';
import { PageHeader } from '../../../components/common/PageHeader';
import { Button } from '../../../components/common/Button';

export const StaffStockAlertsPage = () => {
  const { lowStockItems, refreshInventory } = useStaffInventory();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <PageHeader
        title="Real-Time Low Stock & Threshold Alerts"
        description="Items that have breached safe buffer limits and require urgent replenishment from Central Admin"
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button
              variant="secondary"
              icon={RefreshCw}
              onClick={() => refreshInventory()}
            >
              Refresh
            </Button>
            <Link
              to="/staff/stock-requests"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '0 16px',
                height: '36px',
                borderRadius: 'var(--border-radius-md)',
                backgroundColor: 'var(--color-danger)',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 700,
                textDecoration: 'none'
              }}
            >
              <Send size={14} />
              <span>Emergency Request</span>
            </Link>
          </div>
        }
      />

      {lowStockItems.length === 0 ? (
        <div style={{
          padding: '60px 20px',
          textAlign: 'center',
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--border-radius-lg)',
          border: '1px solid var(--border-color)'
        }}>
          <Package size={44} style={{ color: 'var(--color-success)', margin: '0 auto 12px auto' }} />
          <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            No Low Stock Warnings!
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '6px 0 16px 0' }}>
            All raw material inventory counts are currently above their minimum safety thresholds.
          </p>
          <Link
            to="/staff/inventory"
            style={{ color: 'var(--color-accent)', fontWeight: 700, fontSize: '13px', textDecoration: 'none' }}
          >
            Check Inventory Overview →
          </Link>
        </div>
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
                  border: isCritical ? '2px solid var(--color-danger)' : '1px solid var(--color-warning-border)',
                  padding: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  boxShadow: 'var(--shadow-xs)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    padding: '3px 8px',
                    borderRadius: '6px',
                    backgroundColor: isCritical ? 'var(--color-danger-bg)' : 'var(--color-warning-bg)',
                    color: isCritical ? 'var(--color-danger)' : 'var(--color-warning)',
                    border: '1px solid var(--border-color)'
                  }}>
                    {isCritical ? 'CRITICAL DEFICIT' : 'LOW STOCK WARNING'}
                  </span>
                  <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                    {item.itemCode}
                  </span>
                </div>

                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 4px 0' }}>
                    {item.ingredientName}
                  </h3>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                    Batch: {item.batchNumber || 'N/A'} • Supplier: {item.supplierName || 'Campus Main Store'}
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
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Current Stock:</div>
                    <div style={{ fontSize: '18px', fontWeight: 900, color: 'var(--color-danger)' }}>
                      {item.availableQuantity} {item.unit}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Safety Min:</div>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {item.reorderLevel} {item.unit}
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: '11.5px', color: 'var(--color-danger)', fontWeight: 600 }}>
                  ⚠️ Deficit: {deficit} {item.unit} needed to reach safety stock.
                </div>

                <Link
                  to={`/staff/stock-requests?item=${encodeURIComponent(item.ingredientName)}&unit=${item.unit}&urgency=${isCritical ? 'Emergency' : 'High'}&qty=${deficit + 10}`}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--border-radius-sm)',
                    backgroundColor: isCritical ? 'var(--color-danger)' : 'var(--color-accent)',
                    color: '#ffffff',
                    textDecoration: 'none',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    marginTop: 'auto',
                    boxSizing: 'border-box'
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
