import React from 'react';

export const StatCard = ({
  title,
  value,
  description,
  icon: Icon,
  color = 'var(--color-accent)',
  bgColor = 'var(--color-primary-light)'
}) => {
  return (
    <div style={{
      backgroundColor: '#ffffff',
      borderRadius: 'var(--border-radius-lg)',
      border: '1px solid var(--border-color)',
      padding: '20px',
      boxShadow: 'var(--shadow-xs)',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: '16px'
    }}>
      <div>
        <p style={{
          fontSize: '12.5px',
          fontWeight: 500,
          color: 'var(--text-secondary)',
          margin: '0 0 6px 0',
          textTransform: 'uppercase',
          letterSpacing: '0.04em'
        }}>
          {title}
        </p>
        <h3 style={{
          fontSize: '26px',
          fontWeight: 700,
          color: 'var(--text-primary)',
          letterSpacing: '-0.02em',
          margin: 0
        }}>
          {value}
        </h3>
        {description && (
          <p style={{
            fontSize: '12px',
            color: 'var(--text-muted)',
            margin: '6px 0 0 0'
          }}>
            {description}
          </p>
        )}
      </div>
      {Icon && (
        <div style={{
          width: '44px',
          height: '44px',
          borderRadius: 'var(--border-radius-md)',
          backgroundColor: bgColor,
          color: color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <Icon size={22} />
        </div>
      )}
    </div>
  );
};
