import React from 'react';
import { Award } from 'lucide-react';
import { formatCurrency, formatNumber } from '../../../../utils/formatters';

export const TopSellingItems = ({ items = [] }) => {
  return (
    <div style={{
      backgroundColor: 'var(--bg-surface)',
      borderRadius: 'var(--border-radius-lg)',
      border: '1px solid var(--border-color)',
      padding: '16px 20px',
      boxShadow: 'var(--shadow-xs)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
        <Award size={18} style={{ color: '#d97706' }} />
        <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
          Top-Selling Menu Items
        </h3>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {!Array.isArray(items) || items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '13px' }}>
            No sales data available yet today.
          </div>
        ) : (
          items.map((item, idx) => {
            const typeColor = item.foodType === 'Veg' ? '#059669' : item.foodType === 'Non-veg' ? '#dc2626' : '#d97706';
            return (
              <div
                key={item.id || item.code || idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  borderRadius: 'var(--border-radius-md)',
                  backgroundColor: 'var(--bg-app)',
                  border: '1px solid var(--border-color-subtle)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    fontWeight: 700,
                    color: 'var(--text-secondary)'
                  }}>
                    {idx + 1}
                  </span>

                  <div style={{
                    width: '12px',
                    height: '12px',
                    border: `1.5px solid ${typeColor}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '1px'
                  }}>
                    <div style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: typeColor }} />
                  </div>

                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {item.name}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {item.category}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {formatCurrency(item.revenue || 0)}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    {formatNumber(item.count || item.qtySold || 0)} sold
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default TopSellingItems;
