import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { Modal } from '../../../components/modals/Modal';
import { Button } from '../../../components/common/Button';
import { StatusBadge } from '../../../components/common/StatusBadge';
import { staffOrderService } from '../services/staffOrderService';
import styles from '../styles/staff.module.css';

export const StaffVerifyPickupModal = ({
  isOpen,
  onClose,
  order,
  onConfirmSuccess
}) => {
  const [tokenInput, setTokenInput] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [verifiedSuccess, setVerifiedSuccess] = useState(false);

  if (!isOpen || !order) return null;

  const handleVerifyAndComplete = async (e) => {
    e.preventDefault();
    if (!tokenInput.trim()) {
      setError(`Please enter the customer token (e.g. ${order.token || 'T-101'}) or scan the QR code.`);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await staffOrderService.verifyPickupHandover(tokenInput.trim(), order.id);
      const updated = await staffOrderService.confirmHandover(order.id);

      setVerifiedSuccess(true);
      setTimeout(() => {
        onConfirmSuccess(updated);
        onClose();
      }, 900);
    } catch (err) {
      setError(err.message || 'Verification failed. Please check the token number.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Verify Counter Pickup"
      subtitle={`Order #${order.id} • Token: ${order.token || '—'}`}
      maxWidth="480px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {verifiedSuccess ? (
          <div style={{
            padding: '24px 16px',
            textAlign: 'center',
            backgroundColor: 'var(--color-success-bg)',
            borderRadius: 'var(--border-radius-md)',
            border: '1px solid var(--color-success-border)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px'
          }}>
            <CheckCircle2 size={36} style={{ color: 'var(--color-success)' }} />
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-success-text)' }}>
              Pickup Successfully Verified
            </div>
            <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
              Meal handed over successfully. Order marked as Collected.
            </div>
          </div>
        ) : (
          <>
            <div style={{
              padding: '10px 12px',
              borderRadius: 'var(--border-radius-md)',
              backgroundColor: 'var(--bg-app)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px',
              fontSize: '12px'
            }}>
              <div>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                  Token #{order.token || '—'} • Order #{order.id}
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {Array.isArray(order.items) ? order.items.map((i) => `${i.quantity}x ${i.name}`).join(', ') : 'Order Items'}
                </div>
              </div>
              <StatusBadge status={order.status || 'Ready for Pickup'} size="sm" />
            </div>

            {error && (
              <div className={styles.errorBanner} role="alert">
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertCircle size={14} style={{ flexShrink: 0 }} />
                  <span>{error}</span>
                </div>
              </div>
            )}

            <form onSubmit={handleVerifyAndComplete} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Enter Customer Token / Scan Code
                  </label>
                  {order.token && (
                    <button
                      type="button"
                      onClick={() => {
                        setTokenInput(order.token);
                        setError(null);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--color-accent)',
                        fontSize: '11.5px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        padding: 0
                      }}
                    >
                      Fill {order.token}
                    </button>
                  )}
                </div>

                <input
                  type="text"
                  autoFocus
                  value={tokenInput}
                  onChange={(e) => {
                    setTokenInput(e.target.value);
                    setError(null);
                  }}
                  placeholder={`e.g. ${order.token || 'T-101'}`}
                  className={styles.formInput}
                  style={{ fontWeight: 700, letterSpacing: '0.04em' }}
                />
                <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Verify token shown on student/faculty screen or receipt.
                </span>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '10px',
                paddingTop: '12px',
                borderTop: '1px solid var(--border-color)'
              }}>
                <Link
                  to={`/staff/verify?token=${encodeURIComponent(order.token || '')}`}
                  onClick={onClose}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '12px',
                    fontWeight: 600
                  }}
                >
                  <ExternalLink size={12} />
                  Open Full Scanner Page
                </Link>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <Button variant="secondary" size="sm" onClick={onClose} disabled={loading}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    icon={ShieldCheck}
                    loading={loading}
                    disabled={!tokenInput.trim()}
                    style={{ backgroundColor: 'var(--color-success)', borderColor: 'var(--color-success)' }}
                  >
                    Verify &amp; Handover
                  </Button>
                </div>
              </div>
            </form>
          </>
        )}
      </div>
    </Modal>
  );
};

export default StaffVerifyPickupModal;
