import React, { useState } from 'react';
import { X, XCircle, AlertCircle, Package } from 'lucide-react';
import { Button } from '../../../../components/common/Button';

const QUICK_REASONS = [
  'Out of Stock at Central Warehouse',
  'Insufficient Quantity Available',
  'Item Temporarily Unavailable',
  'Duplicate Requisition',
  'Exceeds Kitchen Quota'
];

export const RejectKitchenRequestModal = ({
  isOpen,
  onClose,
  request,
  loading = false,
  onReject
}) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  if (!isOpen || !request) return null;

  const reqId = request.requestId || request.id || 'REQ';
  const displayId = String(reqId).startsWith('REQ-') ? reqId : `REQ-${reqId}`;
  const itemName = request.itemName || request.ingredientName || 'Stock Material';
  const qty = request.requestedQuantity || request.quantity || 0;
  const unit = request.unit || 'kg';
  const kitchenName = request.outletName || (request.outletId === 1 ? 'Main Canteen' : `Outlet #${request.outletId}`);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Please provide a reason for rejecting this requisition.');
      return;
    }

    await onReject(request, reason.trim());
    onClose();
  };

  const handleSelectQuickReason = (r) => {
    setReason(r);
    setError('');
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
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-danger-light, #fee2e2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-danger, #ef4444)'
            }}>
              <XCircle size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '15.5px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                Reject Stock Requisition
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                Requisition #{displayId} • From <strong>{kitchenName} Kitchen</strong>
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
            <X size={18} />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Requested item summary */}
          <div style={{
            padding: '10px 14px',
            backgroundColor: 'var(--bg-app)',
            borderRadius: 'var(--border-radius-md)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Package size={16} style={{ color: 'var(--text-secondary)' }} />
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Material Requested</div>
                <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{itemName}</strong>
              </div>
            </div>
            <strong style={{ fontSize: '13px', color: 'var(--color-primary)' }}>
              {qty} {unit}
            </strong>
          </div>

          {/* Quick Reasons Chips */}
          <div>
            <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Quick Reason Suggestions:
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {QUICK_REASONS.map((qr) => (
                <button
                  key={qr}
                  type="button"
                  onClick={() => handleSelectQuickReason(qr)}
                  style={{
                    fontSize: '11px',
                    padding: '3px 8px',
                    borderRadius: 'var(--border-radius-full)',
                    border: reason === qr ? '1px solid var(--color-danger)' : '1px solid var(--border-color)',
                    backgroundColor: reason === qr ? 'var(--color-danger-light, #fee2e2)' : 'var(--bg-surface)',
                    color: reason === qr ? 'var(--color-danger, #ef4444)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {qr}
                </button>
              ))}
            </div>
          </div>

          {/* Reason Textarea */}
          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
              Rejection Reason *
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setError('');
              }}
              required
              autoFocus
              placeholder="State the reason why this requisition is being rejected (will be visible to the kitchen)..."
              style={{
                width: '100%',
                padding: '10px 12px',
                fontSize: '13px',
                border: '1.5px solid var(--border-color)',
                borderRadius: 'var(--border-radius-md)',
                backgroundColor: 'var(--bg-surface)',
                color: 'var(--text-primary)',
                boxSizing: 'border-box',
                resize: 'none'
              }}
            />
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
              This reason will be recorded and displayed directly to {kitchenName} Kitchen under their Kitchen Requests status.
            </p>
          </div>

          {error && (
            <div style={{ fontSize: '12px', color: 'var(--color-danger)', backgroundColor: '#fef2f2', padding: '8px 12px', borderRadius: '4px', border: '1px solid #fecaca' }}>
              {error}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px', borderTop: '1px solid var(--border-color)', paddingTop: '14px' }}>
            <Button variant="secondary" onClick={onClose} type="button" disabled={loading}>
              Cancel
            </Button>
            <Button variant="danger" type="submit" loading={loading} style={{ backgroundColor: 'var(--color-danger, #ef4444)', color: '#fff' }}>
              <XCircle size={14} style={{ marginRight: '6px' }} />
              <span>Confirm Rejection</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RejectKitchenRequestModal;
