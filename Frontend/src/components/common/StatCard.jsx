import React from 'react';

export const StatCard = ({
  title,
  value,
  description,
  icon: Icon,
  color = 'var(--color-accent)',
  bgColor = 'var(--color-primary-light)',
  compact = false
}) => {
  return (
    <div style={{
      backgroundColor: 'var(--bg-surface)',
      color: 'var(--text-primary)',
      borderRadius: 'var(--border-radius-lg)',
      border: '1px solid var(--border-color)',
      padding: compact ? '12px 14px' : '20px',
      boxShadow: 'var(--shadow-xs)',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: compact ? '10px' : '16px'
    }}>
      <div style={{ minWidth: 0 }}>
        <p style={{
          fontSize: compact ? '11px' : '12.5px',
          fontWeight: 500,
          color: 'var(--text-secondary)',
          margin: compact ? '0 0 3px 0' : '0 0 6px 0',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          {title}
        </p>
        <h3 style={{
          fontSize: compact ? '20px' : '26px',
          fontWeight: 700,
          color: 'var(--text-primary)',
          letterSpacing: '-0.02em',
          margin: 0,
          lineHeight: 1.2
        }}>
          {value}
        </h3>
        {description && (
          <p style={{
            fontSize: compact ? '11px' : '12px',
            color: 'var(--text-muted)',
            margin: compact ? '4px 0 0 0' : '6px 0 0 0',
            lineHeight: 1.3
          }}>
            {description}
          </p>
        )}
      </div>
      {Icon && (
        <div style={{
          width: compact ? '34px' : '44px',
          height: compact ? '34px' : '44px',
          borderRadius: 'var(--border-radius-md)',
          backgroundColor: bgColor,
          color: color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <Icon size={compact ? 17 : 22} />
        </div>
      )}
    </div>
  );
};
