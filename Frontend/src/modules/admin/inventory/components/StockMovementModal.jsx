import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '../../../../components/common/Button';

export const StockMovementModal = ({ isOpen, onClose, item, defaultType = 'Stock In', onRecordMovement }) => {
  const [movementType, setMovementType] = useState(defaultType);
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [reference, setReference] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const performedBy = 'Dr. Rajesh Sharma (Administrator)';
  const [error, setError] = useState('');

  useEffect(() => {
    if (item) {
      setMovementType(defaultType);
      setQuantity('');
      setReason('');
      setReference('');
      setBatchNumber(item.batchNumber || '');
      setExpiryDate(item.expiryDate || '');
      setError('');
    }
  }, [item, defaultType, isOpen]);

  if (!isOpen || !item) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const qty = Number(quantity);
    if (!qty || qty === 0) {
      setError('Please provide a valid non-zero quantity.');
      return;
    }
    if (!reason.trim()) {
      setError('An audit reason is required for traceable institutional inventory changes.');
      return;
    }

    onRecordMovement({
      ingredientId: item.id,
      movementType,
      quantity: movementType === 'Stock Out' || movementType === 'Wastage' ? -Math.abs(qty) : qty,
      reason,
      reference,
      batchNumber,
      expiryDate,
      performedBy
    });
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
      zIndex: 65,
      padding: '16px'
    }}>
      <div style={{
        backgroundColor: 'var(--modal-bg)',
        color: 'var(--text-primary)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--border-radius-xl)',
        maxWidth: '520px',
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
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              Log Stock Movement
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
              Ingredient: {item.ingredientName} ({item.itemCode})
            </p>
          </div>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '10px 14px',
            backgroundColor: 'var(--bg-app)',
            borderRadius: 'var(--border-radius-md)',
            fontSize: '12.5px',
            border: '1px solid var(--border-color)'
          }}>
            <span>Current Available Stock:</span>
            <strong style={{ color: 'var(--color-primary)' }}>{item.availableQuantity} {item.unit}</strong>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                Movement Type *
              </label>
              <select
                value={movementType}
                onChange={(e) => setMovementType(e.target.value)}
                style={{
                  width: '100%',
                  height: '36px',
                  padding: '0 8px',
                  fontSize: '13px',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--border-radius-md)'
                }}
              >
                <option value="Stock In">Stock In (+ Inward Receiving)</option>
                <option value="Stock Out">Stock Out (- Kitchen Issue)</option>
                <option value="Wastage">Wastage (- Spoilage / Expired)</option>
                <option value="Adjustment">Adjustment (Physical Audit Variance)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                Quantity ({item.unit}) *
              </label>
              <input
                type="number"
                step="0.1"
                value={quantity}
                onChange={(e) => { setQuantity(e.target.value); setError(''); }}
                placeholder={`e.g. 10`}
                style={{
                  width: '100%',
                  height: '36px',
                  padding: '0 8px',
                  fontSize: '13px',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--border-radius-md)'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                Batch / Lot #
              </label>
              <input
                type="text"
                value={batchNumber}
                onChange={(e) => setBatchNumber(e.target.value)}
                placeholder="e.g. B-AML-882"
                style={{
                  width: '100%',
                  height: '36px',
                  padding: '0 8px',
                  fontSize: '13px',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--border-radius-md)'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                Expiry Date
              </label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                style={{
                  width: '100%',
                  height: '36px',
                  padding: '0 8px',
                  fontSize: '13px',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--border-radius-md)'
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
              Reference Document (PO / Requisition / Ticket #)
            </label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g. PO-2026-0881 or REQ-KIT-LUNCH"
              style={{
                width: '100%',
                height: '36px',
                padding: '0 8px',
                fontSize: '13px',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--border-radius-md)'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
              Movement Reason & Audit Justification *
            </label>
            <textarea
              rows={2}
              value={reason}
              onChange={(e) => { setReason(e.target.value); setError(''); }}
              placeholder="Explain the reason for this stock adjustment or kitchen issue..."
              style={{
                width: '100%',
                padding: '8px',
                fontSize: '13px',
                border: `1px solid ${error ? 'var(--color-danger)' : 'var(--border-color)'}`,
                borderRadius: 'var(--border-radius-md)'
              }}
            />
            {error && <span style={{ fontSize: '11px', color: 'var(--color-danger)' }}>{error}</span>}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '14px' }}>
            <Button variant="secondary" onClick={onClose} type="button">
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Log Movement to Ledger
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StockMovementModal;
