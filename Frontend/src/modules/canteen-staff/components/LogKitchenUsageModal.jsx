import React, { useState, useEffect } from 'react';
import { Utensils, Trash2, ArrowDownRight, AlertCircle } from 'lucide-react';
import { Modal } from '../../../components/modals/Modal';
import { Button } from '../../../components/common/Button';
import styles from '../styles/staff.module.css';

export const LogKitchenUsageModal = ({
  isOpen,
  onClose,
  kitchenStock = [],
  preselectedItem = null,
  onLogUsage,
  loading = false
}) => {
  const [selectedItemId, setSelectedItemId] = useState('');
  const [usageType, setUsageType] = useState('KITCHEN CONSUMPTION');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (preselectedItem) {
        setSelectedItemId(String(preselectedItem.id));
      } else if (kitchenStock.length > 0) {
        setSelectedItemId((prev) => prev || String(kitchenStock[0].id));
      }
      setQuantity('');
      setReason('');
      setError('');
    }
  }, [isOpen, preselectedItem, kitchenStock]);

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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={usageType === 'WASTAGE' ? 'Record Kitchen Wastage' : 'Log Kitchen Consumption'}
      subtitle="Deduct ingredient stock used in cooking or discarded"
      maxWidth="480px"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {error && (
          <div className={styles.errorBanner} role="alert">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <AlertCircle size={14} />
              <span>{error}</span>
            </div>
          </div>
        )}

        <div style={{
          display: 'flex',
          gap: '8px',
          backgroundColor: 'var(--bg-app)',
          padding: '4px',
          borderRadius: 'var(--border-radius-md)',
          border: '1px solid var(--border-color)'
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

        <div>
          <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
            Select Ingredient <span style={{ color: 'var(--color-danger)' }}>*</span>
          </label>
          <select
            value={selectedItemId}
            onChange={(e) => setSelectedItemId(e.target.value)}
            required
            className={styles.formInput}
          >
            {kitchenStock.length === 0 ? (
              <option value="">No ingredients available in kitchen stock</option>
            ) : (
              kitchenStock.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.ingredientName} — Current Stock: {item.availableQuantity} {item.unit}
                </option>
              ))
            )}
          </select>
        </div>

        {currentItem && (
          <div style={{
            padding: '10px 14px',
            backgroundColor: 'var(--bg-app)',
            borderRadius: 'var(--border-radius-md)',
            border: '1px solid var(--border-color)',
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
              <div style={{ fontSize: '14px', fontWeight: 700, color: currentStock <= currentItem.reorderLevel ? 'var(--color-warning)' : 'var(--text-primary)' }}>
                {currentStock} {currentItem.unit}
              </div>
            </div>
          </div>
        )}

        <div>
          <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
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
            className={styles.formInput}
            style={{
              fontWeight: 600,
              borderColor: isOver ? 'var(--color-danger)' : undefined
            }}
          />
        </div>

        {enteredQty > 0 && (
          <div style={{
            padding: '8px 12px',
            borderRadius: 'var(--border-radius-md)',
            backgroundColor: isOver ? 'var(--color-danger-bg)' : 'var(--color-success-bg)',
            border: `1px solid ${isOver ? 'var(--color-danger-border)' : 'var(--color-success-border)'}`,
            fontSize: '12px',
            color: isOver ? 'var(--color-danger-text)' : 'var(--color-success-text)',
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

        <div>
          <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
            {usageType === 'WASTAGE' ? 'Reason for Spoilage / Wastage' : 'Preparation Batch / Meal Notes'}
          </label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={usageType === 'WASTAGE' ? 'e.g. Expired batch, container leak' : 'e.g. Lunch preparation'}
            className={styles.formInput}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '8px', borderTop: '1px solid var(--border-color)' }}>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant={usageType === 'WASTAGE' ? 'danger' : 'primary'}
            icon={ArrowDownRight}
            loading={loading}
            disabled={!currentItem || isOver || enteredQty <= 0}
          >
            Record Deduction
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default LogKitchenUsageModal;
