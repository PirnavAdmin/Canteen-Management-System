import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { ORDER_LIFECYCLE_NEXT_STEPS } from '../../../constants/appConstants';

export const StaffOrderStatusModal = ({
  isOpen,
  onClose,
  order,
  onConfirm
}) => {
  const [selectedStatus, setSelectedStatus] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (order) {
      const allowedNext = ORDER_LIFECYCLE_NEXT_STEPS[order.status] || [];
      setSelectedStatus(allowedNext[0] || order.status);
      setNote('');
      setError(null);
    }
  }, [order]);

  if (!isOpen || !order) return null;

  const currentStatus = order.status;
  const allowedNextSteps = ORDER_LIFECYCLE_NEXT_STEPS[currentStatus] || [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStatus) {
      setError('Please select a valid target status.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onConfirm(order.id, selectedStatus, note);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update order status');
    } finally {
      setLoading(false);
    }
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
      zIndex: 1000,
      padding: '16px'
    }}>
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        color: 'var(--text-primary)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--border-radius-lg)',
        maxWidth: '460px',
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
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              Update Order Status
            </h3>
            <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
              Order {order.token || order.id} • {order.customer?.name}
            </span>
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
        <form onSubmit={handleSubmit} style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
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
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
              Current Status
            </label>
            <div style={{
              padding: '8px 12px',
              borderRadius: '6px',
              backgroundColor: 'var(--bg-app)',
              border: '1px solid var(--border-color)',
              fontSize: '12.5px',
              fontWeight: 700,
              color: 'var(--text-primary)'
            }}>
              {currentStatus}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
              Target Next Status
            </label>
            {allowedNextSteps.length === 0 ? (
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '6px 0' }}>
                This order has reached terminal status ({currentStatus}) and cannot be transitioned further.
              </div>
            ) : (
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-surface)',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  fontWeight: 600,
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                {allowedNextSteps.map(st => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
              Staff Note / Audit Remark (Optional)
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Prepared at Station 2, Token flashed on pickup counter"
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-surface)',
                color: 'var(--text-primary)',
                fontSize: '12.5px',
                outline: 'none',
                resize: 'none'
              }}
            />
          </div>

          {/* Modal Actions */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '8px',
            marginTop: '6px'
          }}>
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
              disabled={loading || allowedNextSteps.length === 0}
              style={{
                padding: '7px 16px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: 'var(--color-primary)',
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: 700,
                cursor: allowedNextSteps.length === 0 ? 'not-allowed' : 'pointer',
                opacity: allowedNextSteps.length === 0 ? 0.6 : 1
              }}
            >
              {loading ? 'Updating...' : 'Save Status Update'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StaffOrderStatusModal;
