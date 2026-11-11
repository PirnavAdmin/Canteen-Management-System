import React from 'react';

export const PageHeader = ({
  title,
  description,
  actions,
  badge
}) => {
  return (
    <div style={{ marginBottom: '20px' }}>
      {/* Navigation path removed as requested for a cleaner, compact workspace */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ flex: 1, minWidth: '260px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{
              fontSize: '22px',
              fontWeight: 700,
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
              margin: 0
            }}>
              {title}
            </h1>
            {badge}
          </div>
          {description && (
            <p style={{
              fontSize: '13px',
              color: 'var(--text-secondary)',
              marginTop: '4px',
              marginBottom: 0,
              maxWidth: '800px'
            }}>
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

export default PageHeader;

