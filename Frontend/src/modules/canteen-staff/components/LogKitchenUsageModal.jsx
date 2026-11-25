import React, { useState, useEffect } from 'react';
import { Utensils, Trash2, ArrowDownRight, X, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Button } from '../../../components/common/Button';

export const LogKitchenUsageModal = ({
  isOpen,
  onClose,
  kitchenStock = [],
  preselectedItem = null,
  onLogUsage,
  loading = false
}) => {
  const [selectedItemId, setSelectedItemId] = useState('');
  const [usageType, setUsageType] = useState('KITCHEN CONSUMPTION'); // 'KITCHEN CONSUMPTION' | 'WASTAGE'
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (preselectedItem) {
      setSelectedItemId(String(preselectedItem.id));
    } else if (kitchenStock.length > 0 && !selectedItemId) {
      setSelectedItemId(String(kitchenStock[0].id));
    }
  }, [preselectedItem, kitchenStock, selectedItemId]);

  if (!isOpen) return null;

  const currentItem = kitchenStock.find((item) => String(item.id) === String(selectedItemId)) || kitchenStock[0] || null;
  const currentStock = currentItem ? Number(currentItem.availableQuantity) : 0;
  const enteredQty = Number(quantity) || 0;
  const newStock = Math.max(0, currentStock - enteredQty);
  const isOver = enteredQty > currentStock;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentItem) {
      setError('Please select an ingredient.');
      return;
    }
    if (!quantity || enteredQty <= 0) {
      setError('Please enter a valid quantity greater than zero.');
      return;
    }
    if (isOver) {
      setError(`Cannot deduct ${enteredQty} ${currentItem.unit}. Only ${currentStock} ${currentItem.unit} available in kitchen.`);
      return;
    }

    try {
      setError('');
      await onLogUsage({
        ingredientId: currentItem.id,
        ingredientName: currentItem.ingredientName,
        quantity: enteredQty,
        type: usageType,
        reason: reason.trim() || (usageType === 'WASTAGE' ? 'Kitchen spoilage / waste' : 'Daily cooking preparation')
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Error recording kitchen usage');
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
              backgroundColor: usageType === 'WASTAGE' ? 'var(--color-danger-light, #fee2e2)' : 'var(--color-primary-light)',
              color: usageType === 'WASTAGE' ? 'var(--color-danger, #ef4444)' : 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {usageType === 'WASTAGE' ? <Trash2 size={18} /> : <Utensils size={18} />}
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {usageType === 'WASTAGE' ? 'Record Kitchen Wastage' : 'Log Kitchen Consumption'}
              </h3>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>
                Deduct ingredient stock used in cooking or discarded
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

          {/* Usage Type Selector Tabs */}
          <div style={{
            display: 'flex',
            gap: '8px',
            backgroundColor: 'var(--bg-app)',
            padding: '4px',
            borderRadius: 'var(--border-radius-md)',
            marginBottom: '16px'
          }}>
            <button
              type="button"
              onClick={() => setUsageType('KITCHEN CONSUMPTION')}
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: 'var(--border-radius-sm)',
                border: 'none',
                backgroundColor: usageType === 'KITCHEN CONSUMPTION' ? 'var(--bg-surface)' : 'transparent',
                color: usageType === 'KITCHEN CONSUMPTION' ? 'var(--color-primary)' : 'var(--text-secondary)',
                fontWeight: usageType === 'KITCHEN CONSUMPTION' ? 700 : 500,
                fontSize: '12.5px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                boxShadow: usageType === 'KITCHEN CONSUMPTION' ? 'var(--shadow-xs)' : 'none'
              }}
            >
              <Utensils size={14} />
              <span>Cooking Usage</span>
            </button>
            <button
              type="button"
              onClick={() => setUsageType('WASTAGE')}
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: 'var(--border-radius-sm)',
                border: 'none',
                backgroundColor: usageType === 'WASTAGE' ? 'var(--bg-surface)' : 'transparent',
                color: usageType === 'WASTAGE' ? 'var(--color-danger)' : 'var(--text-secondary)',
                fontWeight: usageType === 'WASTAGE' ? 700 : 500,
                fontSize: '12.5px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                boxShadow: usageType === 'WASTAGE' ? 'var(--shadow-xs)' : 'none'
              }}
            >
              <Trash2 size={14} />
              <span>Spoilage / Waste</span>
            </button>
          </div>

          {/* Ingredient Dropdown */}
          <div style={{ marginBottom: '14px' }}>
            <label style={{
              display: 'block',
              fontSize: '12.5px',
              fontWeight: 600,
              color: 'var(--text-primary)',
              marginBottom: '6px'
            }}>
              Select Ingredient <span style={{ color: 'var(--color-danger)' }}>*</span>
            </label>
            <select
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(e.target.value)}
              required
              style={{
                width: '100%',
                height: '38px',
                padding: '0 12px',
                fontSize: '13px',
                fontWeight: 500,
                borderRadius: 'var(--border-radius-md)',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-app)',
                color: 'var(--text-primary)',
                boxSizing: 'border-box'
              }}
            >
              {kitchenStock.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.ingredientName} — Current Stock: {item.availableQuantity} {item.unit}
                </option>
              ))}
            </select>
          </div>

          {/* Current Stock Preview Card */}
          {currentItem && (
            <div style={{
              padding: '10px 14px',
              backgroundColor: 'var(--bg-app)',
              borderRadius: 'var(--border-radius-md)',
              border: '1px solid var(--border-color)',
              marginBottom: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Category</span>
                <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {currentItem.category}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Available In Kitchen</span>
                <div style={{ fontSize: '14px', fontWeight: 700, color: currentStock <= currentItem.reorderLevel ? '#d97706' : 'var(--text-primary)' }}>
                  {currentStock} {currentItem.unit}
                </div>
              </div>
            </div>
          )}

          {/* Quantity to Deduct */}
          <div style={{ marginBottom: '14px' }}>
            <label style={{
              display: 'block',
              fontSize: '12.5px',
              fontWeight: 600,
              color: 'var(--text-primary)',
              marginBottom: '6px'
            }}>
              Quantity to Deduct ({currentItem?.unit || 'kg'}) <span style={{ color: 'var(--color-danger)' }}>*</span>
            </label>
            <input
              type="number"
              step="any"
              min="0.1"
              max={currentStock}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder={`Enter amount to deduct (max ${currentStock})`}
              required
              autoFocus
              style={{
                width: '100%',
                height: '38px',
                padding: '0 12px',
                fontSize: '14px',
                fontWeight: 600,
                borderRadius: 'var(--border-radius-md)',
                border: isOver ? '1px solid var(--color-danger)' : '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-app)',
                color: 'var(--text-primary)',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Live Balance Change Preview */}
          {enteredQty > 0 && (
            <div style={{
              padding: '8px 12px',
              borderRadius: 'var(--border-radius-md)',
              backgroundColor: isOver ? '#fee2e2' : '#f0fdf4',
              border: isOver ? '1px solid #fca5a5' : '1px solid #bbf7d0',
              fontSize: '12px',
              color: isOver ? '#b91c1c' : '#166534',
              marginBottom: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <span>Stock After Deduction:</span>
              <strong>
                {currentStock} → {newStock} {currentItem?.unit}
              </strong>
            </div>
          )}

          {/* Reason / Cooking Batch notes */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '12.5px',
              fontWeight: 600,
              color: 'var(--text-primary)',
              marginBottom: '6px'
            }}>
              {usageType === 'WASTAGE' ? 'Reason for Spoilage / Wastage' : 'Preparation Batch / Meal Notes'}
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={usageType === 'WASTAGE' ? 'e.g. Expired batch, container leak' : 'e.g. Lunch Biryani preparation'}
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
              variant={usageType === 'WASTAGE' ? 'danger' : 'primary'}
              icon={ArrowDownRight}
              loading={loading}
              disabled={isOver || enteredQty <= 0}
            >
              Record Deduction
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LogKitchenUsageModal;
