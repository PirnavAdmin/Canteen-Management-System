import React, { useState, useEffect } from 'react';
import { X, Package, Layers, Hash, Calendar, DollarSign, Store } from 'lucide-react';
import { Button } from '../../../../components/common/Button';

const CATEGORIES = [
  'Groceries',
  'Dairy',
  'Vegetables',
  'Fruits',
  'Spices',
  'Beverages',
  'Grains',
  'Oils',
  'Bakery',
  'Packaging',
  'Other'
];

const UNITS = ['kg', 'g', 'ltr', 'ml', 'pcs', 'packets', 'boxes', 'bags'];

export const InventoryItemModal = ({
  isOpen,
  onClose,
  onSave,
  loading = false,
  initialData = null,
  outlets = [],
  defaultOutletId = 4
}) => {
  const isEdit = Boolean(initialData);

  const [formData, setFormData] = useState({
    ingredientName: '',
    category: 'Groceries',
    availableQuantity: '',
    unit: 'kg',
    reorderLevel: '10',
    costPerUnit: '0',
    outletId: String(defaultOutletId || 4),
    batchNumber: '',
    expiryDate: '',
    status: 'In Stock'
  });

  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          ingredientName: initialData.ingredientName || initialData.name || '',
          category: initialData.category || 'Groceries',
          availableQuantity: initialData.availableQuantity !== undefined ? String(initialData.availableQuantity) : '0',
          unit: initialData.unit || 'kg',
          reorderLevel: initialData.reorderLevel !== undefined ? String(initialData.reorderLevel) : '10',
          costPerUnit: initialData.costPerUnit !== undefined ? String(initialData.costPerUnit) : '0',
          outletId: String(initialData.outletId || defaultOutletId || '4'),
          batchNumber: initialData.batchNumber || '',
          expiryDate: initialData.expiryDate ? initialData.expiryDate.split('T')[0] : '',
          status: initialData.status || 'In Stock'
        });
      } else {
        setFormData({
          ingredientName: '',
          category: 'Groceries',
          availableQuantity: '',
          unit: 'kg',
          reorderLevel: '10',
          costPerUnit: '0',
          outletId: String(defaultOutletId || (outlets.length > 0 ? (outlets[0].outletId || outlets[0].id || '4') : '4')),
          batchNumber: '',
          expiryDate: '',
          status: 'In Stock'
        });
      }
      setError('');
    }
  }, [initialData, isOpen, outlets, defaultOutletId]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.ingredientName.trim()) {
      setError('Item / Ingredient name is required.');
      return;
    }

    const qty = Number(formData.availableQuantity);
    if (isNaN(qty) || qty < 0) {
      setError('Available stock quantity must be a non-negative number.');
      return;
    }

    const reorder = Number(formData.reorderLevel);
    if (isNaN(reorder) || reorder < 0) {
      setError('Reorder level must be a non-negative number.');
      return;
    }

    const cost = Number(formData.costPerUnit);
    if (isNaN(cost) || cost < 0) {
      setError('Cost per unit must be a valid number.');
      return;
    }

    const payload = {
      ingredientName: formData.ingredientName.trim(),
      category: formData.category,
      availableQuantity: qty,
      unit: formData.unit,
      reorderLevel: reorder,
      costPerUnit: cost,
      outletId: Number(formData.outletId) || 1,
      batchNumber: formData.batchNumber.trim() || null,
      expiryDate: formData.expiryDate ? new Date(formData.expiryDate).toISOString() : null,
      status: qty <= 0 ? 'Out of Stock' : (qty <= reorder ? 'Low Stock' : 'In Stock')
    };

    try {
      await onSave(payload);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save inventory item.');
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
      zIndex: 70,
      padding: '16px'
    }}>
      <div style={{
        backgroundColor: 'var(--modal-bg, #ffffff)',
        color: 'var(--text-primary)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--border-radius-xl, 12px)',
        maxWidth: '560px',
        width: '100%',
        boxShadow: 'var(--shadow-modal, 0 20px 25px -5px rgba(0, 0, 0, 0.1))',
        overflow: 'hidden',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'var(--bg-surface)'
        }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Package size={18} style={{ color: 'var(--color-primary)' }} />
              {isEdit ? 'Edit Main Inventory Stock Item' : 'Add Raw Material / Stock Item'}
            </h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
              {isEdit ? 'Update stock quantity, thresholds, and item specifications' : 'Register a new raw material or kitchen stock ingredient in central inventory'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: 'var(--border-radius-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} style={{ padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {error && (
            <div style={{
              padding: '10px 14px',
              backgroundColor: 'var(--color-danger-bg, #fee2e2)',
              border: '1px solid var(--color-danger-border, #fca5a5)',
              borderRadius: 'var(--border-radius-md, 6px)',
              color: 'var(--color-danger, #ef4444)',
              fontSize: '12.5px',
              fontWeight: 500
            }}>
              {error}
            </div>
          )}

          {/* Item Name */}
          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '5px' }}>
              Raw Material / Ingredient Name <span style={{ color: 'var(--color-danger)' }}>*</span>
            </label>
            <input
              type="text"
              value={formData.ingredientName}
              onChange={(e) => setFormData(prev => ({ ...prev, ingredientName: e.target.value }))}
              placeholder="e.g. Basmati Rice, Full Cream Milk, Sunflower Oil"
              required
              style={{
                width: '100%',
                padding: '8px 12px',
                fontSize: '13px',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--border-radius-md, 6px)',
                backgroundColor: 'var(--bg-app)',
                color: 'var(--text-primary)',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Category & Unit */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '5px' }}>
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  fontSize: '13px',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--border-radius-md, 6px)',
                  backgroundColor: 'var(--bg-app)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '5px' }}>
                Measurement Unit
              </label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  fontSize: '13px',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--border-radius-md, 6px)',
                  backgroundColor: 'var(--bg-app)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              >
                {UNITS.map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Available Quantity & Reorder Threshold */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '5px' }}>
                Available Stock Quantity <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={formData.availableQuantity}
                  onChange={(e) => setFormData(prev => ({ ...prev, availableQuantity: e.target.value }))}
                  placeholder="0.00"
                  required
                  style={{
                    width: '100%',
                    padding: '8px 45px 8px 12px',
                    fontSize: '13px',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--border-radius-md, 6px)',
                    backgroundColor: 'var(--bg-app)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
                <span style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: '11.5px',
                  color: 'var(--text-muted)',
                  pointerEvents: 'none'
                }}>
                  {formData.unit}
                </span>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '5px' }}>
                Low Stock Alert Threshold
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={formData.reorderLevel}
                  onChange={(e) => setFormData(prev => ({ ...prev, reorderLevel: e.target.value }))}
                  placeholder="10.00"
                  style={{
                    width: '100%',
                    padding: '8px 45px 8px 12px',
                    fontSize: '13px',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--border-radius-md, 6px)',
                    backgroundColor: 'var(--bg-app)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
                <span style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: '11.5px',
                  color: 'var(--text-muted)',
                  pointerEvents: 'none'
                }}>
                  {formData.unit}
                </span>
              </div>
            </div>
          </div>

          {/* Cost Per Unit & Outlet Assignment */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '5px' }}>
                Estimated Cost / Unit (₹)
              </label>
              <input
                type="number"
                step="any"
                min="0"
                value={formData.costPerUnit}
                onChange={(e) => setFormData(prev => ({ ...prev, costPerUnit: e.target.value }))}
                placeholder="0.00"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  fontSize: '13px',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--border-radius-md, 6px)',
                  backgroundColor: 'var(--bg-app)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '5px' }}>
                Central Store / Outlet
              </label>
              <select
                value={formData.outletId}
                onChange={(e) => setFormData(prev => ({ ...prev, outletId: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  fontSize: '13px',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--border-radius-md, 6px)',
                  backgroundColor: 'var(--bg-app)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              >
                {outlets.map(out => (
                  <option key={out.outletId || out.id} value={out.outletId || out.id}>
                    {out.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Batch Number & Expiry Date */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '5px' }}>
                Batch / Lot Number (Optional)
              </label>
              <input
                type="text"
                value={formData.batchNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, batchNumber: e.target.value }))}
                placeholder="e.g. BAT-2026-004"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  fontSize: '13px',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--border-radius-md, 6px)',
                  backgroundColor: 'var(--bg-app)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '5px' }}>
                Expiry Date (Optional)
              </label>
              <input
                type="date"
                value={formData.expiryDate}
                onChange={(e) => setFormData(prev => ({ ...prev, expiryDate: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  fontSize: '13px',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--border-radius-md, 6px)',
                  backgroundColor: 'var(--bg-app)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          {/* Footer actions */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '8px',
            marginTop: '10px',
            paddingTop: '16px',
            borderTop: '1px solid var(--border-color)'
          }}>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={loading}
            >
              {isEdit ? 'Save Changes' : 'Register Stock Item'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InventoryItemModal;
