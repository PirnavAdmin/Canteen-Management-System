import React from 'react';
import { Breadcrumb } from './Breadcrumb';

export const PageHeader = ({
  title,
  description,
  breadcrumbItems,
  actions,
  badge
}) => {
  return (
    <div style={{ marginBottom: '24px' }}>
      {breadcrumbItems && <Breadcrumb items={breadcrumbItems} />}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
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
              fontSize: '13.5px',
              color: 'var(--text-secondary)',
              marginTop: '4px',
              marginBottom: 0
            }}>
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

