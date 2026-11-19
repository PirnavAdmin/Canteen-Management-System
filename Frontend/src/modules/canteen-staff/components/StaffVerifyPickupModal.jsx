import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  X,
  QrCode,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { staffOrderService } from '../services/staffOrderService';

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
      setError('Please enter the customer token (e.g. ' + (order.token || 'T-101') + ') or scan the QR code.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // 1. Validate pickup token against this specific order
      await staffOrderService.verifyPickupHandover(tokenInput.trim(), order.id);

      // 2. Complete order handover and record verified timestamps
      const updated = await staffOrderService.confirmHandover(order.id);

      setVerifiedSuccess(true);
      setTimeout(() => {
        onConfirmSuccess(updated);
        onClose();
      }, 1200);
    } catch (err) {
      setError(err.message || 'Verification failed. Please check the token number.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = () => {
    setTokenInput(order.token || '');
    setError(null);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(3px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1050,
      padding: '16px'
    }}>
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        color: 'var(--text-primary)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--border-radius-xl)',
        maxWidth: '480px',
        width: '100%',
        boxShadow: 'var(--shadow-modal)',
        overflow: 'hidden'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '14px 18px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'var(--bg-app)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              backgroundColor: '#ecfdf5',
              color: '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <QrCode size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                Verify Counter Pickup
              </h3>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Order #{order.id} • Token: <strong>{order.token || 'T-ORD'}</strong>
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
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
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-success)' }}>
                Pickup Successfully Verified!
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Meal handed over successfully. Order marked as Completed.
              </div>
            </div>
          ) : (
            <>
              {/* Order Quick Summary Card */}
              <div style={{
                padding: '10px 12px',
                borderRadius: 'var(--border-radius-md)',
                backgroundColor: 'var(--bg-app)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '12px'
              }}>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                    Token #{order.token || 'T-ORD'} • Order #{order.id}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {Array.isArray(order.items) ? order.items.map(i => `${i.quantity}x ${i.name}`).join(', ') : 'Order Items'}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    backgroundColor: 'var(--color-success-bg)',
                    color: 'var(--color-success)',
                    border: '1px solid var(--border-color)'
                  }}>
                    Ready for Pickup
                  </span>
                </div>
              </div>

              {error && (
                <div style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  backgroundColor: 'var(--color-danger-bg)',
                  color: 'var(--color-danger)',
                  border: '1px solid var(--color-danger-border)',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <AlertCircle size={14} style={{ flexShrink: 0 }} />
                  <span>{error}</span>
                </div>
              )}

              {/* Code Input Form */}
              <form onSubmit={handleVerifyAndComplete} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <label style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-muted)' }}>
                      Enter Customer Token / Scan Code:
                    </label>
                    <button
                      type="button"
                      onClick={handleQuickFill}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--color-accent)',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        padding: 0
                      }}
                    >
                      Fill {order.token || 'T-101'}
                    </button>
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
                    style={{
                      width: '100%',
                      height: '40px',
                      padding: '0 12px',
                      fontSize: '14px',
                      fontWeight: 700,
                      letterSpacing: '0.04em',
                      borderRadius: '6px',
                      border: '1.5px solid var(--border-color)',
                      backgroundColor: 'var(--bg-app)',
                      color: 'var(--text-primary)',
                      outline: 'none'
                    }}
                  />
                  <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Verify token shown on student/faculty phone screen or physical receipt.
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px' }}>
                  <Link
                    to={`/staff/verify?token=${encodeURIComponent(order.token || '')}`}
                    onClick={onClose}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '11.5px',
                      fontWeight: 600,
                      color: 'var(--text-secondary)',
                      textDecoration: 'none'
                    }}
                  >
                    <ExternalLink size={12} />
                    Open Full Scanner Page
                  </Link>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={onClose}
                      disabled={loading}
                      style={{
                        padding: '7px 14px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-color)',
                        backgroundColor: 'var(--bg-app)',
                        color: 'var(--text-secondary)',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={loading || !tokenInput.trim()}
                      style={{
                        padding: '7px 16px',
                        borderRadius: '6px',
                        border: 'none',
                        backgroundColor: '#059669',
                        color: '#ffffff',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: (!tokenInput.trim() || loading) ? 'not-allowed' : 'pointer',
                        opacity: (!tokenInput.trim() || loading) ? 0.6 : 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <ShieldCheck size={14} />
                      {loading ? 'Verifying...' : 'Verify & Handover'}
                    </button>
                  </div>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default StaffVerifyPickupModal;
