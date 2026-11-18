import React from 'react';
import { Store } from 'lucide-react';
import { formatCurrency, formatNumber } from '../../../../utils/formatters';

export const OutletSalesCard = ({ outletSales = [] }) => {
  return (
    <div style={{
      backgroundColor: 'var(--bg-surface)',
      borderRadius: 'var(--border-radius-lg)',
      border: '1px solid var(--border-color)',
      padding: '16px 20px',
      boxShadow: 'var(--shadow-xs)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
        <Store size={18} style={{ color: 'var(--color-primary)' }} />
        <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
          Outlet-Wise Sales Performance
        </h3>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {!Array.isArray(outletSales) || outletSales.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '13px' }}>
            No outlet sales records found today.
          </div>
        ) : (
          outletSales.map((outlet, idx) => (
            <div key={outlet.outletId || idx}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{outlet.name || outlet.outletName || 'Outlet'}</span>
                <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                  {formatCurrency(outlet.revenue ?? outlet.grossSales ?? 0)} ({outlet.percentage ?? 0}%)
                </span>
              </div>

              <div style={{
                width: '100%',
                height: '6px',
                backgroundColor: 'var(--bg-muted)',
                borderRadius: 'var(--border-radius-full)',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${Math.min(100, Math.max(0, outlet.percentage ?? 0))}%`,
                  height: '100%',
                  backgroundColor: 'var(--color-accent)',
                  borderRadius: 'var(--border-radius-full)'
                }} />
              </div>

              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                {formatNumber(outlet.orders || 0)} orders completed today
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default OutletSalesCard;
