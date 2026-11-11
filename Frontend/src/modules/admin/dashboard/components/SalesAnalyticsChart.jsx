import React, { useState } from 'react';
import { BarChart2 } from 'lucide-react';
import { formatCurrency } from '../../../../utils/formatters';

export const SalesAnalyticsChart = ({ data = [] }) => {
  const [activeTab, setActiveTab] = useState('sales'); // 'sales' | 'orders'
  const [hoveredPoint, setHoveredPoint] = useState(null);

  if (!data || data.length === 0) {
    return null;
  }

  const maxVal = Math.max(...data.map(d => activeTab === 'sales' ? d.sales : d.orders), 1);
  const chartHeight = 160;

  return (
    <div style={{
      backgroundColor: '#ffffff',
      borderRadius: 'var(--border-radius-lg)',
      border: '1px solid var(--border-color)',
      padding: '16px 20px',
      boxShadow: 'var(--shadow-xs)',
      marginBottom: '20px'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        marginBottom: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart2 size={18} style={{ color: 'var(--color-accent)' }} />
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
              Sales & Order Velocity
            </h3>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
            Live hourly breakdown of sales revenue and kitchen order volume today.
          </p>
        </div>

        {/* Toggle metric */}
        <div style={{
          display: 'inline-flex',
          backgroundColor: 'var(--bg-muted)',
          padding: '3px',
          borderRadius: 'var(--border-radius-md)'
        }}>
          <button
            type="button"
            onClick={() => setActiveTab('sales')}
            style={{
              padding: '4px 12px',
              fontSize: '12px',
              fontWeight: activeTab === 'sales' ? 600 : 500,
              backgroundColor: activeTab === 'sales' ? '#ffffff' : 'transparent',
              color: activeTab === 'sales' ? 'var(--color-primary)' : 'var(--text-secondary)',
              border: 'none',
              borderRadius: 'var(--border-radius-sm)',
              boxShadow: activeTab === 'sales' ? 'var(--shadow-xs)' : 'none',
              cursor: 'pointer'
            }}
          >
            Hourly Sales (₹)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            style={{
              padding: '4px 12px',
              fontSize: '12px',
              fontWeight: activeTab === 'orders' ? 600 : 500,
              backgroundColor: activeTab === 'orders' ? '#ffffff' : 'transparent',
              color: activeTab === 'orders' ? 'var(--color-primary)' : 'var(--text-secondary)',
              border: 'none',
              borderRadius: 'var(--border-radius-sm)',
              boxShadow: activeTab === 'orders' ? 'var(--shadow-xs)' : 'none',
              cursor: 'pointer'
            }}
          >
            Order Volume (Count)
          </button>
        </div>
      </div>

      {/* Bar / Column Chart */}
      <div style={{ position: 'relative', paddingTop: '10px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: '8px',
          height: `${chartHeight}px`,
          borderBottom: '1px solid var(--border-color)',
          paddingBottom: '4px'
        }}>
          {data.map((item, idx) => {
            const currentVal = activeTab === 'sales' ? item.sales : item.orders;
            const barHeightPercent = Math.max(8, Math.round((currentVal / maxVal) * 100));
            const isHovered = hoveredPoint === idx;

            return (
              <div
                key={idx}
                onMouseEnter={() => setHoveredPoint(idx)}
                onMouseLeave={() => setHoveredPoint(null)}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  height: '100%',
                  justifyContent: 'flex-end',
                  position: 'relative',
                  cursor: 'pointer'
                }}
              >
                {/* Tooltip */}
                {isHovered && (
                  <div style={{
                    position: 'absolute',
                    bottom: `${barHeightPercent + 10}%`,
                    backgroundColor: '#0f172a',
                    color: '#ffffff',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    whiteSpace: 'nowrap',
                    zIndex: 20,
                    pointerEvents: 'none',
                    boxShadow: 'var(--shadow-md)'
                  }}>
                    <div style={{ fontWeight: 600 }}>{item.hour}</div>
                    <div>{activeTab === 'sales' ? formatCurrency(item.sales) : `${item.orders} orders`}</div>
                  </div>
                )}

                <div
                  style={{
                    width: '100%',
                    maxWidth: '38px',
                    height: `${barHeightPercent}%`,
                    backgroundColor: isHovered
                      ? 'var(--color-primary)'
                      : activeTab === 'sales'
                        ? 'var(--color-accent)'
                        : '#0ea5e9',
                    borderRadius: '4px 4px 0 0',
                    transition: 'all 200ms ease'
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* X-axis labels */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
          {data.map((item, idx) => (
            <div
              key={idx}
              style={{
                flex: 1,
                textAlign: 'center',
                fontSize: '10.5px',
                color: 'var(--text-muted)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {item.hour.split(' ')[0]}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SalesAnalyticsChart;
