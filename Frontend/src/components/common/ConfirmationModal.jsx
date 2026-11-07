import React from 'react';
import { Modal } from '../modals/Modal';
import { Button } from './Button';
import { AlertTriangle, AlertCircle, HelpCircle } from 'lucide-react';

export const ConfirmationModal = ({
  isOpen = false,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger', // 'danger' | 'warning' | 'primary'
  loading = false,
  icon: CustomIcon
}) => {
  let IconComponent = CustomIcon || (variant === 'danger' ? AlertCircle : variant === 'warning' ? AlertTriangle : HelpCircle);
  let iconColor = variant === 'danger' ? 'var(--color-danger)' : variant === 'warning' ? 'var(--color-warning)' : 'var(--color-primary)';
  let iconBg = variant === 'danger' ? 'var(--color-danger-bg)' : variant === 'warning' ? 'var(--color-warning-bg)' : 'var(--color-primary-light)';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="480px">
      <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div style={{
          width: '42px',
          height: '42px',
          borderRadius: '50%',
          backgroundColor: iconBg,
          color: iconColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <IconComponent size={22} />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{
            fontSize: '13.5px',
            color: 'var(--text-secondary)',
            lineHeight: 1.5,
            margin: 0
          }}>
            {message}
          </p>
        </div>
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: '12px',
        paddingTop: '16px',
        borderTop: '1px solid var(--border-color)'
      }}>
        <Button
          variant="secondary"
          onClick={onClose}
          disabled={loading}
        >
          {cancelText}
        </Button>
        <Button
          variant={variant}
          onClick={onConfirm}
          loading={loading}
        >
          {confirmText}
        </Button>
      </div>
    </Modal>
  );
};

