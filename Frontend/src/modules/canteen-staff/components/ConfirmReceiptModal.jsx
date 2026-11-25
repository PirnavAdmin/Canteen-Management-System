import React, { useState, useEffect } from 'react';
import { Truck, CheckCircle2, AlertTriangle, X, Package } from 'lucide-react';
import { Button } from '../../../components/common/Button';

export const ConfirmReceiptModal = ({
  isOpen,
  onClose,
  transfer,
  onConfirm,
  loading = false
}) => {
  const [receivedQty, setReceivedQty] = useState('');
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (transfer) {
      setReceivedQty(String(transfer.dispatchedQuantity || transfer.approvedQuantity || 0));
      setRemarks('');
      setError('');
    }
  }, [transfer]);

  if (!isOpen || !transfer) return null;

  const dispatchedQty = Number(transfer.dispatchedQuantity || transfer.approvedQuantity || 0);
  const enteredQty = Number(receivedQty) || 0;
  const isPartial = enteredQty < dispatchedQty && enteredQty > 0;
  const isOver = enteredQty > dispatchedQty;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!receivedQty || enteredQty <= 0) {
      setError('Please enter a valid received quantity greater than zero.');
      return;
    }
    if (dispatchedQty > 0 && enteredQty > dispatchedQty) {
      setError(`Received quantity cannot exceed dispatched quantity (${dispatchedQty} ${transfer.unit || 'kg'}).`);
      return;
    }

    try {
      setError('');
      await onConfirm({
        transferId: transfer.transferId || transfer.id,
        requestId: transfer.requestId,
        ingredientName: transfer.ingredientName,
        dispatchedQuantity: dispatchedQty,
        receivedQuantity: enteredQty,
        unit: transfer.unit || 'kg',
        notes: remarks.trim()
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Error confirming receipt');
    }
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
      zIndex: 100,
      padding: '16px'
    }}>
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        borderRadius: 'var(--border-radius-lg)',
        border: '1px solid var(--border-color)',
        width: '100%',
        maxWidth: '480px',
        boxShadow: 'var(--shadow-modal)',
        overflow: 'hidden',
        animation: 'fadeIn 0.15s ease'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'var(--bg-muted)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--border-radius-sm)',
              backgroundColor: 'var(--color-primary-light)',
              color: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Truck size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Confirm Stock Inward
              </h3>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>
                Verify received delivery from Central Warehouse
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
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

        {/* Modal Form */}
        <form onSubmit={handleSubmit} style={{ padding: '20px' }}>
          {error && (
            <div style={{
              padding: '10px 14px',
              backgroundColor: 'var(--color-danger-bg, #fee2e2)',
              border: '1px solid var(--color-danger-border, #fca5a5)',
              borderRadius: 'var(--border-radius-md)',
              color: 'var(--color-danger, #b91c1c)',
              fontSize: '12.5px',
              marginBottom: '16px'
            }}>
              {error}
            </div>
          )}

          {/* Delivery Item Details Summary Card */}
          <div style={{
            padding: '12px 14px',
            backgroundColor: 'var(--bg-app)',
            borderRadius: 'var(--border-radius-md)',
            border: '1px solid var(--border-color)',
            marginBottom: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                Transfer ID: {transfer.transferId || transfer.id}
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>
                Ref: {transfer.requestId || 'REQ-CENTRAL'}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <strong style={{ fontSize: '14px', color: 'var(--text-primary)', display: 'block' }}>
                  {transfer.ingredientName}
                </strong>
                <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                  {transfer.category || 'General Supplies'}
                </span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Dispatched Quantity</div>
                <strong style={{ fontSize: '15px', color: 'var(--color-primary)' }}>
                  {dispatchedQty} {transfer.unit || 'kg'}
                </strong>
              </div>
            </div>
          </div>

          {/* Received Quantity Input */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              fontSize: '12.5px',
              fontWeight: 600,
              color: 'var(--text-primary)',
              marginBottom: '6px'
            }}>
              Actual Received Quantity ({transfer.unit || 'kg'}) <span style={{ color: 'var(--color-danger)' }}>*</span>
            </label>
            <input
              type="number"
              step="any"
              min="0.1"
              value={receivedQty}
              onChange={(e) => setReceivedQty(e.target.value)}
              placeholder={`Enter received ${transfer.unit || 'kg'}`}
              required
              autoFocus
              style={{
                width: '100%',
                height: '38px',
                padding: '0 12px',
                fontSize: '14px',
                fontWeight: 600,
                borderRadius: 'var(--border-radius-md)',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-app)',
                color: 'var(--text-primary)',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Partial Receipt Notice */}
          {isPartial && (
            <div style={{
              padding: '10px 12px',
              backgroundColor: '#fffbeb',
              border: '1px solid #fde68a',
              borderRadius: 'var(--border-radius-md)',
              color: '#92400e',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '16px'
            }}>
              <AlertTriangle size={16} style={{ flexShrink: 0, color: '#d97706' }} />
              <div>
                <strong>Partial Receipt:</strong> Dispatched {dispatchedQty} {transfer.unit}, receiving {enteredQty} {transfer.unit}. Shortage of {(dispatchedQty - enteredQty).toFixed(2)} {transfer.unit} will be recorded.
              </div>
            </div>
          )}

          {/* Quality Remarks / Inspection Notes */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '12.5px',
              fontWeight: 600,
              color: 'var(--text-primary)',
              marginBottom: '6px'
            }}>
              Condition & Receipt Notes (Optional)
            </label>
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Quality verified, packages intact"
              style={{
                width: '100%',
                height: '36px',
                padding: '0 12px',
                fontSize: '13px',
                borderRadius: 'var(--border-radius-md)',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-app)',
                color: 'var(--text-primary)',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Stock Inward Preview */}
          <div style={{
            padding: '10px 14px',
            backgroundColor: 'var(--color-success-bg, #ecfdf5)',
            border: '1px solid var(--color-success-border, #a7f3d0)',
            borderRadius: 'var(--border-radius-md)',
            color: 'var(--color-success, #065f46)',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '20px'
          }}>
            <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
            <span>
              Confirming will immediately add <strong>+{enteredQty} {transfer.unit || 'kg'}</strong> to your kitchen stock and log an inward entry in the Kitchen Stock Ledger.
            </span>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              icon={CheckCircle2}
              loading={loading}
            >
              Confirm & Inward to Kitchen
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ConfirmReceiptModal;
