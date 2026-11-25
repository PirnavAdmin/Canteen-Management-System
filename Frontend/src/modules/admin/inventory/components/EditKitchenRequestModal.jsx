import React, { useState, useEffect } from 'react';
import { X, Save, Edit3, Package } from 'lucide-react';
import { Button } from '../../../../components/common/Button';

export const EditKitchenRequestModal = ({
  isOpen,
  onClose,
  request,
  loading = false,
  onSave
}) => {
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');
  const [requiredByDate, setRequiredByDate] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && request) {
      setQuantity(String(request.requestedQuantity || request.quantity || ''));
      setNotes(request.notes || '');
      setRequiredByDate(request.requiredByDate ? String(request.requiredByDate).split('T')[0] : '');
      setError('');
    }
  }, [isOpen, request]);

  if (!isOpen || !request) return null;

  const reqId = request.requestId || request.id || 'REQ';
  const displayId = String(reqId).startsWith('REQ-') ? reqId : `REQ-${reqId}`;
  const itemName = request.itemName || request.ingredientName || 'Stock Material';
  const unit = request.unit || 'kg';

  const handleSubmit = async (e) => {
    e.preventDefault();
    const qtyNum = Number(quantity);
    if (!qtyNum || qtyNum <= 0) {
      setError('Please specify a valid positive requested quantity.');
      return;
    }

    await onSave(request, qtyNum, { notes, requiredByDate });
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
        maxWidth: '460px',
        width: '100%',
        boxShadow: 'var(--shadow-modal)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              Edit Stock Requisition
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
              Requisition #{displayId} • {request.outletName || 'Kitchen Requisition'}
            </p>
          </div>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
            <X size={18} />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Item Info Banner */}
          <div style={{
            padding: '10px 12px',
            backgroundColor: 'var(--bg-app)',
            borderRadius: 'var(--border-radius-md)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Package size={16} style={{ color: 'var(--color-primary)' }} />
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Material / Item</div>
                <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{itemName}</strong>
              </div>
            </div>
            <span style={{
              fontSize: '11px',
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: '4px',
              backgroundColor: 'var(--bg-muted)',
              color: 'var(--text-primary)'
            }}>
              Unit: {unit}
            </span>
          </div>

          {/* Requested Quantity Input */}
          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
              Requested Quantity ({unit}) *
            </label>
            <input
              type="number"
              step="0.1"
              min="0.1"
              value={quantity}
              onChange={(e) => {
                setQuantity(e.target.value);
                setError('');
              }}
              required
              autoFocus
              style={{
                width: '100%',
                height: '38px',
                padding: '0 12px',
                fontSize: '13px',
                border: '1.5px solid var(--border-color)',
                borderRadius: 'var(--border-radius-md)',
                backgroundColor: 'var(--bg-surface)',
                color: 'var(--text-primary)',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Needed By Date */}
          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
              Needed By Date
            </label>
            <input
              type="date"
              value={requiredByDate}
              onChange={(e) => setRequiredByDate(e.target.value)}
              style={{
                width: '100%',
                height: '36px',
                padding: '0 10px',
                fontSize: '13px',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--border-radius-md)',
                backgroundColor: 'var(--bg-surface)',
                color: 'var(--text-primary)',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Requisition Notes */}
          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
              Notes / Instructions
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Urgent morning preparation batch"
              style={{
                width: '100%',
                padding: '8px 10px',
                fontSize: '12.5px',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--border-radius-md)',
                backgroundColor: 'var(--bg-surface)',
                color: 'var(--text-primary)',
                boxSizing: 'border-box',
                resize: 'none'
              }}
            />
          </div>

          {error && (
            <div style={{ fontSize: '12px', color: 'var(--color-danger)', backgroundColor: '#fef2f2', padding: '8px 12px', borderRadius: '4px', border: '1px solid #fecaca' }}>
              {error}
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px', borderTop: '1px solid var(--border-color)', paddingTop: '14px' }}>
            <Button variant="secondary" onClick={onClose} type="button" disabled={loading}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={loading}>
              <Save size={13} style={{ marginRight: '6px' }} />
              <span>Update Requisition</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditKitchenRequestModal;
