import React from 'react';

export const Card = ({
  children,
  title,
  subtitle,
  actions,
  padding = '24px',
  style = {},
  className = '',
  ...props
}) => {
  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        borderRadius: 'var(--border-radius-lg)',
        border: '1px solid var(--border-color)',
        boxShadow: 'var(--shadow-xs)',
        overflow: 'hidden',
        ...style
      }}
      className={className}
      {...props}
    >
      {(title || actions) && (
        <div style={{
          padding: '16px 24px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div>
            {title && (
              <h3 style={{
                fontSize: '15px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                margin: 0
              }}>
                {title}
              </h3>
            )}
            {subtitle && (
              <p style={{
                fontSize: '12.5px',
                color: 'var(--text-muted)',
                margin: '2px 0 0 0'
              }}>
                {subtitle}
              </p>
            )}
          </div>
          {actions && <div>{actions}</div>}
        </div>
      )}
      <div style={{ padding }}>
        {children}
      </div>
    </div>
  );
};

