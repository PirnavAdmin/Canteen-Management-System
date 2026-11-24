import React, { useState, useMemo } from 'react';
import { BarChart2, Calendar } from 'lucide-react';
import { formatCurrency, formatNumber } from '../../../../utils/formatters';

export const SalesAnalyticsChart = ({ salesData = {}, loading = false }) => {
  const [timeRange, setTimeRange] = useState('this_week'); // 'this_week' | 'last_week' | 'monthly'
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // Compute monthly report dynamically based on selectedMonth
  const monthlyData = useMemo(() => {
    const [yearStr, monthStr] = (selectedMonth || '').split('-');
    const year = parseInt(yearStr, 10) || new Date().getFullYear();
    const month = (parseInt(monthStr, 10) || (new Date().getMonth() + 1)) - 1; // 0-indexed
    const dObj = new Date(year, month, 1);
    const monthShort = dObj.toLocaleString('default', { month: 'short' });
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const weekDefs = [
      { label: '1st Week', fullLabel: `${monthShort} 1 - 7`, start: 1, end: 7 },
      { label: '2nd Week', fullLabel: `${monthShort} 8 - 14`, start: 8, end: 14 },
      { label: '3rd Week', fullLabel: `${monthShort} 15 - 21`, start: 15, end: 21 },
      { label: '4th Week', fullLabel: `${monthShort} 22 - 28`, start: 22, end: 28 }
    ];
    if (daysInMonth > 28) {
      weekDefs.push({ label: '5th Week', fullLabel: `${monthShort} 29 - ${daysInMonth}`, start: 29, end: daysInMonth });
    }

    const ordersList = Array.isArray(salesData?.orders) ? salesData.orders : [];
    return weekDefs.map(w => {
      let wSales = 0;
      let wItems = 0;
      let wOrders = 0;

      ordersList.forEach(o => {
        const oDate = new Date(o.orderDate || o.OrderDate || o.createdAt || o.CreatedAt || 0);
        if (
          !isNaN(oDate.getTime()) &&
          oDate.getMonth() === month &&
          oDate.getFullYear() === year &&
          oDate.getDate() >= w.start &&
          oDate.getDate() <= w.end
        ) {
          const amt = Number(o.totalAmount ?? o.TotalAmount ?? o.total ?? o.Total ?? 0);
          const itCount = (Array.isArray(o.items) && o.items.length > 0)
            ? o.items.reduce((s, it) => s + (Number(it.quantity ?? it.Quantity ?? it.qty ?? it.Qty ?? 1) || 1), 0)
            : (Number(o.itemCount ?? o.ItemCount ?? 1) || 1);
          wSales += amt;
          wItems += itCount;
          wOrders += 1;
        }
      });

      return {
        day: w.label,
        label: w.label,
        shortDate: w.fullLabel,
        fullLabel: `${w.label} (${w.fullLabel})`,
        sales: wSales,
        items: wItems,
        orders: wOrders
      };
    });
  }, [selectedMonth, salesData?.orders]);

  if (loading) {
    return (
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        borderRadius: 'var(--border-radius-md)',
        border: '1px solid var(--border-color)',
        padding: '12px 14px',
        boxShadow: 'var(--shadow-xs)',
        height: '300px',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header Skeleton */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="skeleton-box" style={{ width: '28px', height: '28px', borderRadius: '6px' }} />
            <div className="skeleton-box" style={{ width: '130px', height: '14px' }} />
          </div>
          <div className="skeleton-box" style={{ width: '120px', height: '28px', borderRadius: '4px' }} />
        </div>
        {/* Bars Skeleton */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: '8px', paddingBottom: '20px' }}>
          {[40, 65, 30, 80, 50, 90, 45].map((h, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
              <div className="skeleton-box" style={{ width: '100%', maxWidth: '28px', height: `${h}%`, borderRadius: '4px 4px 0 0' }} />
              <div className="skeleton-box" style={{ width: '20px', height: '8px' }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Select dataset based on timeRange
  let chartData = [];
  if (timeRange === 'this_week') {
    chartData = Array.isArray(salesData?.thisWeek) ? salesData.thisWeek : [];
  } else if (timeRange === 'last_week') {
    chartData = Array.isArray(salesData?.lastWeek) ? salesData.lastWeek : [];
  } else if (timeRange === 'monthly') {
    chartData = monthlyData;
  }

  // Fallback days if data not yet loaded
  if (!chartData || chartData.length === 0) {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    chartData = days.map(d => ({
      day: d,
      label: d,
      shortDate: '',
      fullLabel: d,
      sales: 0,
      items: 0,
      orders: 0
    }));
  }

  const values = chartData.map(d => Number(d.sales ?? 0));
  const totalSales = values.reduce((acc, v) => acc + v, 0);
  const maxVal = Math.max(...values, 1);
  const chartHeight = 150;

  return (
    <div style={{
      backgroundColor: 'var(--bg-surface)',
      borderRadius: 'var(--border-radius-md)',
      border: '1px solid var(--border-color)',
      padding: '12px 14px',
      boxShadow: 'var(--shadow-xs)',
      height: '300px',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header with Title, Badge & Filters */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '6px',
        marginBottom: '10px',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          <div style={{
            width: '26px',
            height: '26px',
            borderRadius: '6px',
            backgroundColor: 'var(--color-primary-light)',
            color: 'var(--color-accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <BarChart2 size={15} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <h3 style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                Sales Representation
              </h3>
              <span style={{
                fontSize: '10.5px',
                fontWeight: 700,
                color: 'var(--color-accent)',
                backgroundColor: 'var(--bg-muted)',
                padding: '1px 6px',
                borderRadius: '4px'
              }}>
                {formatCurrency(totalSales)}
              </span>
            </div>
            <p style={{ fontSize: '10.5px', color: 'var(--text-secondary)', margin: '1px 0 0 0' }}>
              {timeRange === 'this_week'
                ? "This week's day-wise sales"
                : timeRange === 'last_week'
                  ? "Last week's day-wise sales"
                  : 'Weekly distribution of selected month'}
            </p>
          </div>
        </div>

        {/* Filters: Range Dropdown + Month Calendar Picker if Monthly */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          {/* Time Range Dropdown */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Calendar size={12} style={{ position: 'absolute', left: '7px', color: 'var(--text-muted)', pointerEvents: 'none' }} />
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              aria-label="Filter sales time range"
              style={{
                height: '28px',
                padding: '0 8px 0 24px',
                fontSize: '11.5px',
                fontWeight: 600,
                borderRadius: 'var(--border-radius-sm)',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-surface)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <option value="this_week">This Week's Sales</option>
              <option value="last_week">Last Week's Sales</option>
              <option value="monthly">Monthly Report</option>
            </select>
          </div>

          {/* Month Calendar Picker: Visible when Monthly Report is selected */}
          {timeRange === 'monthly' && (
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                aria-label="Select month for monthly sales report"
                style={{
                  height: '28px',
                  padding: '0 6px',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  borderRadius: 'var(--border-radius-sm)',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-surface)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Bar / Column Chart Body (Representing Sales in Rupees) */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', position: 'relative' }}>
        <div style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: '6px',
          height: `${chartHeight}px`,
          borderBottom: '1px solid var(--border-color)',
          paddingBottom: '2px'
        }}>
          {chartData.map((item, idx) => {
            const currentVal = Number(item.sales ?? 0);
            const hasValue = currentVal > 0;
            const barHeightPercent = hasValue ? Math.max(12, Math.round((currentVal / (maxVal || 1)) * 100)) : 4;
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
                {/* Floating Tooltip displaying BOTH Sales in Rupees and Items Sold */}
                {isHovered && (
                  <div style={{
                    position: 'absolute',
                    bottom: `${Math.min(85, barHeightPercent + 10)}%`,
                    backgroundColor: '#0f172a',
                    color: '#ffffff',
                    padding: '5px 9px',
                    borderRadius: '4px',
                    fontSize: '10.5px',
                    whiteSpace: 'nowrap',
                    zIndex: 30,
                    pointerEvents: 'none',
                    boxShadow: 'var(--shadow-md)',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '2px', marginBottom: '2px' }}>
                      {item.fullLabel || item.label}
                    </div>
                    <div>Sales: <strong>{formatCurrency(item.sales || 0)}</strong></div>
                    <div>Items Sold: <strong>{formatNumber(item.items || 0)}</strong> ({formatNumber(item.orders || 0)} orders)</div>
                  </div>
                )}

                {/* Bar Element */}
                <div
                  style={{
                    width: '100%',
                    maxWidth: '30px',
                    height: `${barHeightPercent}%`,
                    backgroundColor: isHovered
                      ? 'var(--color-primary)'
                      : item.isToday
                        ? '#2563eb'
                        : hasValue
                          ? 'var(--color-accent)'
                          : 'var(--border-color)',
                    opacity: hasValue ? 1 : 0.45,
                    borderRadius: '3px 3px 0 0',
                    transition: 'all 160ms ease',
                    boxShadow: item.isToday ? '0 0 0 1px var(--color-primary)' : 'none'
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* X-axis labels */}
        <div style={{ display: 'flex', gap: '6px', marginTop: '4px', paddingTop: '2px' }}>
          {chartData.map((item, idx) => (
            <div
              key={idx}
              style={{
                flex: 1,
                textAlign: 'center',
                lineHeight: 1.15
              }}
            >
              <div style={{
                fontSize: '10.5px',
                fontWeight: item.isToday ? 700 : 600,
                color: item.isToday ? 'var(--color-primary)' : (hoveredPoint === idx ? 'var(--color-accent)' : 'var(--text-primary)'),
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {item.label}
              </div>
              {item.shortDate && (
                <div style={{
                  fontSize: '9px',
                  color: 'var(--text-muted)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {item.shortDate}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SalesAnalyticsChart;
