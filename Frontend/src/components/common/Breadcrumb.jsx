import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export const Breadcrumb = ({ items = [] }) => {
  if (!items || items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', color: 'var(--text-muted)', marginBottom: '12px' }}>
      <Link to="/canteen" style={{ display: 'inline-flex', alignItems: 'center', color: 'var(--text-muted)' }} title="SMS/CMS Home">
        <Home size={13} />
      </Link>
      <ChevronRight size={12} style={{ color: 'var(--text-placeholder)' }} />
      <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>CMS / SMS Portal</span>

      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <React.Fragment key={index}>
            <ChevronRight size={12} style={{ color: 'var(--text-placeholder)' }} />
            {isLast || !item.path ? (
              <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                {item.label}
              </span>
            ) : (
              <Link to={item.path} style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
                {item.label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

