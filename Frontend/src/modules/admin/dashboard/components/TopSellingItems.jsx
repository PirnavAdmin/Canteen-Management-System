import React from 'react';
import { Award } from 'lucide-react';

export const TopSellingItems = ({ items = [], loading = false }) => {
  const sortedItems = React.useMemo(() => {
    if (!Array.isArray(items)) return [];
    return [...items].sort((a, b) => {
      const countA = Number(a.count ?? a.qtySold ?? a.orders ?? 0);
      const countB = Number(b.count ?? b.qtySold ?? b.orders ?? 0);
      return countB - countA;
    });
  }, [items]);

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
          <div className="skeleton-box" style={{ width: '140px', height: '14px' }} />
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              style={{
                padding: '7px 10px',
                borderRadius: 'var(--border-radius-sm)',
                border: '1px solid var(--border-color-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                <div className="skeleton-box" style={{ width: '18px', height: '18px', borderRadius: '50%' }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                  <div className="skeleton-box" style={{ width: '130px', height: '12px' }} />
                  <div className="skeleton-box" style={{ width: '75px', height: '9px' }} />
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', flexShrink: 0 }}>
                <div className="skeleton-box" style={{ width: '38px', height: '12px' }} />
                <div className="skeleton-box" style={{ width: '56px', height: '9px' }} />
              </div>
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
        <Award size={16} style={{ color: '#d97706' }} />
        <h3 style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
          Top-Selling Menu Items
        </h3>
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
        {!Array.isArray(sortedItems) || sortedItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 20px', color: 'var(--text-muted)', fontSize: '12.5px' }}>
            No sales data available yet today.
          </div>
        ) : (
          sortedItems.map((item, idx) => {
            const typeColor = item.foodType === 'Veg' ? '#059669' : item.foodType === 'Non-veg' ? '#dc2626' : '#d97706';
            
            // Genuine ratings from live feedback API: strictly 0 if no ratings given
            const reviewsCount = Number(item.reviewCount ?? item.reviewsCount ?? 0);
            const rawAvg = item.averageRating ?? item.rating;
            const avgRating = reviewsCount > 0 && rawAvg !== undefined && rawAvg !== null && rawAvg !== '0' && rawAvg !== 0
              ? String(rawAvg)
              : '0';

            return (
              <div
                key={item.id || item.code || idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '7px 10px',
                  borderRadius: 'var(--border-radius-sm)',
                  backgroundColor: 'var(--bg-app)',
                  border: '1px solid var(--border-color-subtle)',
                  gap: '10px'
                }}
              >
                {/* Left: Rank, Veg/Non-veg Indicator, Name, Category */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                  <span style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10px',
                    fontWeight: 700,
                    color: 'var(--text-secondary)',
                    flexShrink: 0
                  }}>
                    {idx + 1}
                  </span>

                  <div style={{
                    width: '11px',
                    height: '11px',
                    border: `1.5px solid ${typeColor}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '1px',
                    flexShrink: 0
                  }}>
                    <div style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: typeColor }} />
                  </div>

                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{
                      fontSize: '12.5px',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {item.name}
                    </div>
                    {item.category && (
                      <div style={{
                        fontSize: '10.5px',
                        color: 'var(--text-muted)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {typeof item.category === 'object' ? (item.category?.name || item.category?.id || '') : (item.category || '')}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Average Rating & Review Count */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-end',
                  justifyContent: 'center',
                  textAlign: 'right',
                  flexShrink: 0,
                  minWidth: '58px'
                }}>
                  <div style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '3px',
                    lineHeight: 1.2
                  }}>
                    <span>{avgRating}</span>
                    <span style={{ fontSize: '11.5px', color: '#f59e0b', display: 'inline-block' }}>⭐</span>
                  </div>
                  <div style={{
                    fontSize: '10px',
                    color: 'var(--text-muted)',
                    marginTop: '1px',
                    whiteSpace: 'nowrap',
                    lineHeight: 1.1
                  }}>
                    {reviewsCount === 1 ? '1 review' : `${reviewsCount} reviews`}
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
