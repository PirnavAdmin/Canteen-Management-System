import React from 'react';
import { useToast } from '../../hooks/useToast';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export const ToastContainer = () => {
  const { toasts, removeToast } = useToast();

  if (!toasts.length) return null;

  return (
    <aside aria-label="Notifications" style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      maxWidth: '380px',
      width: 'calc(100% - 40px)',
      pointerEvents: 'none'
    }}>
      {toasts.map(toast => {
        let IconComponent = Info;
        let borderColor = 'var(--color-info-border)';
        let bgColor = 'var(--color-info-bg)';
        let iconColor = 'var(--color-info)';

        if (toast.type === 'success') {
          IconComponent = CheckCircle2;
          borderColor = 'var(--color-success-border)';
          bgColor = 'var(--color-success-bg)';
          iconColor = 'var(--color-success)';
        } else if (toast.type === 'error') {
          IconComponent = AlertCircle;
          borderColor = 'var(--color-danger-border)';
          bgColor = 'var(--color-danger-bg)';
          iconColor = 'var(--color-danger)';
        } else if (toast.type === 'warning') {
          IconComponent = AlertTriangle;
          borderColor = 'var(--color-warning-border)';
          bgColor = 'var(--color-warning-bg)';
          iconColor = 'var(--color-warning)';
        }

        return (
          <div
            key={toast.id}
            role="status"
            aria-live="polite"
            style={{
              pointerEvents: 'auto',
              background: 'var(--bg-surface)',
              border: `1px solid ${borderColor}`,
              borderLeft: `4px solid ${iconColor}`,
              borderRadius: 'var(--border-radius-md)',
              padding: '12px 14px',
              boxShadow: 'var(--shadow-md)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              animation: 'slideIn 0.2s ease'
            }}
          >
            <div style={{
              color: iconColor,
              backgroundColor: bgColor,
              borderRadius: '50%',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <IconComponent size={16} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              {toast.title && (
                <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)', marginBottom: '2px' }}>
                  {toast.title}
                </div>
              )}
              {toast.message && (
                <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  {toast.message}
                </div>
              )}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '2px',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: '1px'
              }}
              title="Dismiss"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </aside>
  );
};
