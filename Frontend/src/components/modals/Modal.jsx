import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export const Modal = ({
  isOpen = false,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = '540px'
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'auto';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(3px)',
          animation: 'fadeIn 0.2s ease'
        }}
      />

      {/* Modal Box */}
      <div
        style={{
          position: 'relative',
          backgroundColor: 'var(--modal-bg)',
          color: 'var(--text-primary)',
          borderRadius: 'var(--border-radius-xl)',
          boxShadow: 'var(--shadow-modal)',
          width: '100%',
          maxWidth,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 1001,
          animation: 'scaleIn 0.2s ease',
          overflow: 'hidden',
          border: '1px solid var(--border-color)'
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '18px 24px',
          borderBottom: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-app)'
        }}>
          <div>
            <h3 style={{
              margin: 0,
              fontSize: '16px',
              fontWeight: 600,
              color: 'var(--text-primary)'
            }}>
              {title}
            </h3>
            {subtitle && (
              <p style={{
                margin: '2px 0 0 0',
                fontSize: '12.5px',
                color: 'var(--text-muted)'
              }}>
                {subtitle}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              padding: '6px',
              borderRadius: 'var(--border-radius-sm)',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        <div style={{
          padding: '24px',
          overflowY: 'auto',
          flex: 1
        }}>
          {children}
        </div>
      </div>
    </div>
  );
};

