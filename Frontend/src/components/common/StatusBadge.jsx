import React from 'react';
import { CheckCircle2, XCircle, AlertCircle, Clock } from 'lucide-react';

export const StatusBadge = ({ status, size = 'md' }) => {
  const isStatusActive = status === 'Active' || status === true || status === 'true';
  const isStatusInactive = status === 'Inactive' || status === false || status === 'false';

  const normalized = String(status || '').toLowerCase();
  const isSuccess = isStatusActive || ['collected', 'completed', 'open', 'in stock', 'resolved', 'paid'].includes(normalized);
  const isWarning = ['fast filling', 'expiring soon', 'paused', 'pending', 'under review', 'refunded'].includes(normalized);
  const isDanger = ['full', 'low stock', 'out of stock', 'cancelled', 'dismissed'].includes(normalized);
  const isMuted = isStatusInactive || normalized === 'closed';

  const style = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: size === 'sm' ? '3px' : '5px',
    borderRadius: 'var(--border-radius-full)',
    fontWeight: 600,
    fontSize: size === 'sm' ? '10.5px' : '12px',
    padding: size === 'sm' ? '2px 7px' : '3px 10px',
    letterSpacing: '0.01em',
    lineHeight: 1.2,
    whiteSpace: 'nowrap'
  };

  const iconSize = size === 'sm' ? 11 : 13;

  if (isSuccess) {
    return (
      <span
        style={{
          ...style,
          backgroundColor: 'var(--color-success-bg)',
          color: 'var(--color-success-text)',
          border: '1px solid var(--color-success-border)'
        }}
      >
        <CheckCircle2 size={iconSize} />
        {isStatusActive ? 'Active' : status}
      </span>
    );
  }

  if (isMuted) {
    return (
      <span
        style={{
          ...style,
          backgroundColor: 'var(--bg-muted)',
          color: 'var(--text-muted)',
          border: '1px solid var(--border-color)'
        }}
      >
        <XCircle size={iconSize} />
        {isStatusInactive ? 'Inactive' : status}
      </span>
    );
  }

  if (isWarning) {
    return (
      <span
        style={{
          ...style,
          backgroundColor: 'var(--color-warning-bg)',
          color: 'var(--color-warning-text)',
          border: '1px solid var(--color-warning-border)'
        }}
      >
        <Clock size={iconSize} />
        {status}
      </span>
    );
  }

  if (isDanger) {
    return (
      <span
        style={{
          ...style,
          backgroundColor: 'var(--color-danger-bg)',
          color: 'var(--color-danger-text)',
          border: '1px solid var(--color-danger-border)'
        }}
      >
        <AlertCircle size={iconSize} />
        {status}
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
      <AlertCircle size={iconSize} />
      {status || 'Unknown'}
    </span>
  );
};

