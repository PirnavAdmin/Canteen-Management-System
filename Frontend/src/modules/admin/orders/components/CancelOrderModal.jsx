import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { Button } from '../../../../components/common/Button';

export const CancelOrderModal = ({ isOpen, onClose, order, loading = false, onConfirmCancel }) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  if (!isOpen || !order) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('A cancellation reason is required for audit and refund initiation.');
      return;
    }
    await onConfirmCancel(order.id, reason);
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.6)',
      backdropFilter: 'blur(3px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 70,
      padding: '16px'
    }}>
      <div style={{
        backgroundColor: 'var(--modal-bg)',
        color: 'var(--text-primary)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--border-radius-xl)',
        maxWidth: '480px',
        width: '100%',
        boxShadow: 'var(--shadow-modal)',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-danger)' }}>
            <AlertTriangle size={18} />
            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              Cancel Order ({order.token})
            </h3>
          </div>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '20px' }}>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 14px 0' }}>
            Cancelling this order will stop kitchen preparation and notify customer <strong>{order.customer?.name}</strong>. A reverse refund will be initiated to the original payment source.
          </p>

          <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
            Reason for Cancellation *
          </label>
          <select
            value={reason}
            onChange={(e) => { setReason(e.target.value); setError(''); }}
            style={{
              width: '100%',
              height: '36px',
              padding: '0 10px',
              fontSize: '13px',
              border: `1px solid ${error ? 'var(--color-danger)' : 'var(--border-color)'}`,
              borderRadius: 'var(--border-radius-md)',
              marginBottom: '8px'
            }}
          >
            <option value="">Select cancellation reason...</option>
            <option value="Ingredient stock depleted in kitchen">Ingredient stock depleted in kitchen</option>
            <option value="Kitchen equipment technical breakdown">Kitchen equipment technical breakdown</option>
            <option value="Customer requested cancellation before prep">Customer requested cancellation before prep</option>
            <option value="Severe preparation delay past pickup slot">Severe preparation delay past pickup slot</option>
            <option value="Duplicate order mistakenly placed">Duplicate order mistakenly placed</option>
          </select>

          {error && <div style={{ fontSize: '11.5px', color: 'var(--color-danger)', marginBottom: '10px' }}>{error}</div>}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
            <Button variant="secondary" onClick={onClose} type="button" disabled={loading}>
              Dismiss
            </Button>
            <Button variant="danger" type="submit" loading={loading}>
              Confirm Cancellation
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CancelOrderModal;
