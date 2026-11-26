import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';
import { Modal } from '../../../components/modals/Modal';
import { Button } from '../../../components/common/Button';
import styles from '../styles/staff.module.css';

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
      setReceivedQty(String(transfer.dispatchedQuantity || transfer.issuedQuantity || transfer.approvedQuantity || transfer.requestedQuantity || 0));
      setRemarks('');
      setError('');
    }
  }, [transfer]);

  if (!isOpen || !transfer) return null;

  const dispatchedQty = Number(transfer.dispatchedQuantity || transfer.issuedQuantity || transfer.approvedQuantity || transfer.requestedQuantity || 0);
  const enteredQty = Number(receivedQty) || 0;
  const isPartial = enteredQty < dispatchedQty && enteredQty > 0;
  const unitLabel = transfer.unit || 'kg';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!receivedQty || enteredQty <= 0) {
      setError('Please enter a valid received quantity greater than zero.');
      return;
    }
    if (dispatchedQty > 0 && enteredQty > dispatchedQty) {
      setError(`Received quantity cannot exceed dispatched quantity (${dispatchedQty} ${unitLabel}).`);
      return;
    }

    try {
      setError('');
      await onConfirm({
        transferId: transfer.transferId || transfer.id,
        requestId: transfer.requestId || transfer.id,
        ingredientId: transfer.ingredientId || transfer.itemId,
        ingredientName: transfer.ingredientName || transfer.itemName,
        category: transfer.category,
        dispatchedQuantity: dispatchedQty,
        receivedQuantity: enteredQty,
        unit: unitLabel,
        notes: remarks.trim()
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Error confirming receipt');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Confirm Stock Inward"
      subtitle="Verify received delivery from Central Warehouse"
      maxWidth="480px"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {error && (
          <div className={styles.errorBanner} role="alert">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <AlertCircle size={14} />
              <span>{error}</span>
            </div>
          </div>
        )}

        <div style={{
          padding: '12px 14px',
          backgroundColor: 'var(--bg-app)',
          borderRadius: 'var(--border-radius-md)',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
              Transfer ID: {transfer.transferId || `TRF-${transfer.id}`}
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>
              Ref: {transfer.requestId || `REQ-${transfer.id}`}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <strong style={{ fontSize: '14px', color: 'var(--text-primary)', display: 'block' }}>
                {transfer.ingredientName || transfer.itemName}
              </strong>
              <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
                {transfer.category || 'General Supplies'}
              </span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Dispatched Quantity</div>
              <strong style={{ fontSize: '15px', color: 'var(--color-primary)' }}>
                {dispatchedQty} {unitLabel}
              </strong>
            </div>
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
            Actual Received Quantity ({unitLabel}) <span style={{ color: 'var(--color-danger)' }}>*</span>
          </label>
          <input
            type="number"
            step="any"
            min="0.1"
            value={receivedQty}
            onChange={(e) => setReceivedQty(e.target.value)}
            placeholder={`Enter received ${unitLabel}`}
            required
            autoFocus
            className={styles.formInput}
            style={{ fontWeight: 600 }}
          />
        </div>

        {isPartial && (
          <div style={{
            padding: '10px 12px',
            backgroundColor: 'var(--color-warning-bg)',
            border: '1px solid var(--color-warning-border)',
            borderRadius: 'var(--border-radius-md)',
            color: 'var(--color-warning-text)',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertTriangle size={16} style={{ flexShrink: 0 }} />
            <div>
              <strong>Partial Receipt:</strong> Dispatched {dispatchedQty} {unitLabel}, receiving {enteredQty} {unitLabel}. Shortage of {(dispatchedQty - enteredQty).toFixed(2)} {unitLabel} will be recorded.
            </div>
          </div>
        )}

        <div>
          <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
            Condition &amp; Receipt Notes (Optional)
          </label>
          <input
            type="text"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="e.g. Quality verified, packages intact"
            className={styles.formInput}
          />
        </div>

        <div style={{
          padding: '10px 14px',
          backgroundColor: 'var(--color-success-bg)',
          border: '1px solid var(--color-success-border)',
          borderRadius: 'var(--border-radius-md)',
          color: 'var(--color-success-text)',
          fontSize: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
          <span>
            Confirming will add <strong>+{enteredQty} {unitLabel}</strong> to your kitchen stock and log an inward entry in the Stock Ledger.
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '8px', borderTop: '1px solid var(--border-color)' }}>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" icon={CheckCircle2} loading={loading}>
            Confirm &amp; Inward to Kitchen
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ConfirmReceiptModal;
