import React, { useState, useEffect, useMemo } from 'react';
import { X, Send, AlertTriangle, CheckCircle, Package } from 'lucide-react';
import { Button } from '../../../../components/common/Button';

export const ApproveKitchenRequestModal = ({
  isOpen,
  onClose,
  request,
  rawMaterials = [],
  loading = false,
  onApprove
}) => {
  const [sendQty, setSendQty] = useState('');
  const [error, setError] = useState('');

  // Find corresponding raw material item in current stock
  const matchedItem = useMemo(() => {
    if (!request) return null;
    const reqItemName = (request.itemName || request.ingredientName || '').trim().toLowerCase();
    const reqItemCode = (request.itemCode || '').trim().toLowerCase();

    return rawMaterials.find(i =>
      (request.ingredientId && String(i.id) === String(request.ingredientId)) ||
      (reqItemName && (i.ingredientName || '').trim().toLowerCase() === reqItemName) ||
      (reqItemCode && (i.itemCode || '').trim().toLowerCase() === reqItemCode)
    ) || null;
  }, [request, rawMaterials]);

  const availableStock = matchedItem ? Number(matchedItem.availableQuantity || 0) : 0;
  const unit = matchedItem?.unit || request?.unit || 'kg';
  const requestedQty = Number(request?.requestedQuantity || request?.quantity || 0);

  useEffect(() => {
    if (request) {
      // Default to requested quantity, capped by available stock if matched item exists
      const initial = matchedItem
        ? Math.min(requestedQty, availableStock > 0 ? requestedQty : 0)
        : requestedQty;
      setSendQty(initial > 0 ? String(initial) : (availableStock > 0 ? String(availableStock) : String(requestedQty || '')));
      setError('');
    }
  }, [request, matchedItem, availableStock, requestedQty, isOpen]);

  if (!isOpen || !request) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const qtyNum = Number(sendQty);

    if (!qtyNum || qtyNum <= 0) {
      setError('Please enter a valid positive quantity to send.');
      return;
    }

    if (matchedItem && qtyNum > availableStock) {
      setError(`Cannot issue ${qtyNum} ${unit}. Current available stock in raw materials is only ${availableStock} ${unit}.`);
      return;
    }

    await onApprove(request, qtyNum);
    onClose();
  };

  const isStockSufficient = matchedItem ? availableStock >= requestedQty : true;

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
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              Approve & Dispatch Stock Requisition
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
              Requisition #{request.requestId || request.id || 'REQ-001'} • Issuing from <strong>Central Warehouse</strong> to <strong>{request.outletName || (request.outletId === 1 ? 'Main Canteen' : `Outlet #${request.outletId}`)} Kitchen</strong>
            </p>
          </div>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
            <X size={18} />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Requested item summary */}
          <div style={{
            padding: '12px 14px',
            backgroundColor: 'var(--bg-app)',
            borderRadius: 'var(--border-radius-md)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Requested Material:</span>
              <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                {request.itemName || request.ingredientName}
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Kitchen Required Qty:</span>
              <strong style={{ fontSize: '13px', color: 'var(--color-primary)' }}>
                {requestedQty} {unit}
              </strong>
            </div>
          </div>

          {/* Current Raw Material Stock Availability display */}
          <div style={{
            padding: '12px 14px',
            backgroundColor: isStockSufficient ? 'var(--color-success-bg, #ecfdf5)' : 'var(--color-danger-light, #fef2f2)',
            borderRadius: 'var(--border-radius-md)',
            border: `1px solid ${isStockSufficient ? 'var(--color-success-border, #a7f3d0)' : 'var(--color-danger-border, #fecaca)'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {isStockSufficient ? (
                <CheckCircle size={18} style={{ color: 'var(--color-success)' }} />
              ) : (
                <AlertTriangle size={18} style={{ color: 'var(--color-danger)' }} />
              )}
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Central Warehouse Available Stock
                </div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: isStockSufficient ? 'var(--color-success-text, #065f46)' : 'var(--color-danger, #b91c1c)' }}>
                  {availableStock} {unit}
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <span style={{
                fontSize: '11px',
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: '4px',
                backgroundColor: isStockSufficient ? '#d1fae5' : '#fee2e2',
                color: isStockSufficient ? '#065f46' : '#991b1b'
              }}>
                {isStockSufficient ? 'Stock Available' : 'Insufficient Stock'}
              </span>
            </div>
          </div>

          {/* Quantity to send input */}
          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
              Quantity to Issue & Send ({unit}) *
            </label>
            <input
              type="number"
              step="0.1"
              min="0.1"
              max={availableStock}
              value={sendQty}
              onChange={(e) => {
                setSendQty(e.target.value);
                setError('');
              }}
              placeholder={`Enter quantity to send (max ${availableStock})`}
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
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
              Upon approval, this quantity will be automatically deducted from Raw Materials inventory and logged as a Kitchen Issue in the stock movement ledger.
            </p>
          </div>

          {error && (
            <div style={{ fontSize: '12px', color: 'var(--color-danger)', backgroundColor: '#fef2f2', padding: '8px 12px', borderRadius: '4px', border: '1px solid #fecaca' }}>
              {error}
            </div>
          )}

          {/* Footer actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px', borderTop: '1px solid var(--border-color)', paddingTop: '14px' }}>
            <Button variant="secondary" onClick={onClose} type="button" disabled={loading}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={loading} disabled={matchedItem ? availableStock <= 0 : false}>
              <Send size={13} style={{ marginRight: '6px' }} />
              <span>Approve & Dispatch Stock</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApproveKitchenRequestModal;
