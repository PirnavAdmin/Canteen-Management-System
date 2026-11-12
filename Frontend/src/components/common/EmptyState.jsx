import React from 'react';
import { Inbox } from 'lucide-react';
import { Button } from './Button';

export const EmptyState = ({
  icon: Icon = Inbox,
  title = 'No records found',
  message = 'There are no items matching your criteria or no data has been added yet.',
  actionLabel,
  onAction,
  actionIcon
}) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '48px 24px',
      textAlign: 'center',
      backgroundColor: 'var(--bg-surface)',
      borderRadius: 'var(--border-radius-lg)',
      border: '1px dashed var(--border-color)'
    }}>
      <div style={{
        width: '52px',
        height: '52px',
        borderRadius: '50%',
        backgroundColor: 'var(--bg-muted)',
        color: 'var(--text-muted)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '16px'
      }}>
        <Icon size={24} />
      </div>
      <h3 style={{
        fontSize: '16px',
        fontWeight: 600,
        color: 'var(--text-primary)',
        margin: '0 0 6px 0'
      }}>
        {title}
      </h3>
      <p style={{
        fontSize: '13.5px',
        color: 'var(--text-secondary)',
        maxWidth: '420px',
        margin: '0 0 20px 0',
        lineHeight: 1.5
      }}>
        {message}
      </p>
      {actionLabel && onAction && (
        <Button
          variant="primary"
          size="sm"
          onClick={onAction}
          icon={actionIcon}
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

