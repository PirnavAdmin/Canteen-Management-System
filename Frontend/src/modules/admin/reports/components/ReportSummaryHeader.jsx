import React from 'react';
import { formatCurrency, formatNumber } from '../../../../utils/formatters';

export const ReportSummaryHeader = ({ metrics = {} }) => {
  if (!metrics || Object.keys(metrics).length === 0) return null;

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
      gap: '12px',
      marginBottom: '16px'
    }}>
      {Object.entries(metrics).map(([key, val], idx) => {
        const formattedKey = key
          .replace(/([A-Z])/g, ' $1')
          .replace(/^./, str => str.toUpperCase());

        const displayVal = typeof val === 'number' && key.toLowerCase().includes('amount') || key.toLowerCase().includes('revenue') || key.toLowerCase().includes('sales') || key.toLowerCase().includes('tax')
          ? formatCurrency(val)
          : typeof val === 'number'
            ? formatNumber(val)
            : String(val);

        return (
          <div
            key={idx}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 'var(--border-radius-md)',
              border: '1px solid var(--border-color)',
              padding: '12px 16px',
              boxShadow: 'var(--shadow-xs)'
            }}
          >
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {formattedKey}
            </div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-primary)', marginTop: '2px' }}>
              {displayVal}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ReportSummaryHeader;
