import React from 'react';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

export const StatusBadge = ({ status, size = 'md' }) => {
  const isStatusActive = status === 'Active' || status === true || status === 'true';
  const isStatusInactive = status === 'Inactive' || status === false || status === 'false';

  const style = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    borderRadius: 'var(--border-radius-full)',
    fontWeight: 600,
    fontSize: size === 'sm' ? '11px' : '12px',
    padding: size === 'sm' ? '2px 8px' : '3px 10px',
    letterSpacing: '0.01em',
    lineHeight: 1.2
  };

  if (isStatusActive) {
    return (
      <span
        style={{
          ...style,
          backgroundColor: 'var(--color-success-bg)',
          color: 'var(--color-success-text)',
          border: '1px solid var(--color-success-border)'
        }}
      >
        <CheckCircle2 size={size === 'sm' ? 12 : 13} />
        Active
      </span>
    );
  }

  if (isStatusInactive) {
    return (
      <span
        style={{
          ...style,
          backgroundColor: '#f8fafc',
          color: '#64748b',
          border: '1px solid #cbd5e1'
        }}
      >
        <XCircle size={size === 'sm' ? 12 : 13} />
        Inactive
      </span>
    );
  }

  return (
    <span
      style={{
        ...style,
        backgroundColor: 'var(--color-info-bg)',
        color: 'var(--color-info-text)',
        border: '1px solid var(--color-info-border)'
      }}
    >
      <AlertCircle size={size === 'sm' ? 12 : 13} />
      {status || 'Unknown'}
    </span>
  );
};

