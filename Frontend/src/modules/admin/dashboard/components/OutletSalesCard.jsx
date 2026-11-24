import React from 'react';
import { Store } from 'lucide-react';
import { formatCurrency, formatNumber } from '../../../../utils/formatters';

export const OutletSalesCard = ({ outletSales = [], loading = false }) => {
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <div className="skeleton-box" style={{ width: '16px', height: '16px', borderRadius: '4px' }} />
          <div className="skeleton-box" style={{ width: '160px', height: '14px' }} />
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[1, 2, 3].map((n) => (
            <div key={n} style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color-subtle)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div className="skeleton-box" style={{ width: '120px', height: '12px' }} />
                <div className="skeleton-box" style={{ width: '70px', height: '12px' }} />
              </div>
              <div className="skeleton-box" style={{ width: '100%', height: '5px' }} />
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
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', flexShrink: 0 }}>
        <Store size={16} style={{ color: 'var(--color-primary)' }} />
        <h3 style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
          Outlet-Wise Sales Performance
        </h3>
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
        {!Array.isArray(outletSales) || outletSales.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 20px', color: 'var(--text-muted)', fontSize: '12.5px' }}>
            No outlet sales records found today.
          </div>
        ) : (
          outletSales.map((outlet, idx) => (
            <div
              key={outlet.outletId || idx}
              style={{
                padding: '6px 8px',
                borderRadius: 'var(--border-radius-sm)',
                backgroundColor: 'var(--bg-app)',
                border: '1px solid var(--border-color-subtle)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '3px' }}>
                <span style={{
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {outlet.name || outlet.outletName || 'Outlet'}
                </span>
                <span style={{ fontWeight: 700, color: 'var(--color-primary)', marginLeft: '8px', whiteSpace: 'nowrap' }}>
                  {formatCurrency(outlet.revenue ?? outlet.grossSales ?? 0)} ({outlet.percentage ?? 0}%)
                </span>
              </div>

              <div style={{
                width: '100%',
                height: '5px',
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

              <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
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
