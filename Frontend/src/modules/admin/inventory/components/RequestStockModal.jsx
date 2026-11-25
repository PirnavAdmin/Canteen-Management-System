import React, { useState, useMemo, useEffect } from 'react';
import { X, Plus, Trash2, Send, ChefHat, Building2, Store } from 'lucide-react';
import { Button } from '../../../../components/common/Button';
import { IngredientMultiSelectDropdown, DEFAULT_BASIC_INGREDIENTS } from './IngredientMultiSelectDropdown';

export const RequestStockModal = ({
  isOpen,
  onClose,
  currentOutlet,
  warehouseOutlet,
  centralItems = [],
  loading = false,
  onSubmitRequest
}) => {
  const [neededByDate, setNeededByDate] = useState('');
  const [urgency, setUrgency] = useState('Normal');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');

  // Default needed-by date to tomorrow
  useEffect(() => {
    if (isOpen) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setNeededByDate(tomorrow.toISOString().split('T')[0]);
      setUrgency('Normal');
      setNotes('');
      setItems([]);
      setError('');
    }
  }, [isOpen]);

  // Extract ingredients available in the Central Warehouse
  const warehouseIngredientNames = useMemo(() => {
    const fromStock = (centralItems || [])
      .map(i => i.ingredientName || i.name)
      .filter(Boolean);
    const combined = Array.from(new Set([...fromStock, ...DEFAULT_BASIC_INGREDIENTS]));
    return combined;
  }, [centralItems]);

  const selectedIngredientNames = useMemo(() => {
    return items.map(it => it.ingredientName).filter(Boolean);
  }, [items]);

  if (!isOpen) return null;

  const handleClose = () => {
    setItems([]);
    setError('');
    onClose();
  };

  const handleRemoveItem = (index) => {
    setItems(prev => prev.filter((_, i) => i !== index));
    setError('');
  };

  const handleItemChange = (index, field, val) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: val };
    setItems(updated);
    setError('');
  };

  const handleAddManualCustomItem = () => {
    setItems(prev => [
      ...prev,
      {
        ingredientName: '',
        qty: '',
        unit: 'kg',
        isCustom: true,
        category: 'Groceries'
      }
    ]);
  };

  // Sync with Multi-Select Dropdown
  const handleMultiSelectChange = (newSelected) => {
    const updated = [];
    newSelected.forEach(name => {
      const existing = items.find(it => (it.ingredientName || '').trim().toLowerCase() === name.trim().toLowerCase());
      if (existing) {
        updated.push(existing);
      } else {
        const matchedCentral = (centralItems || []).find(
          c => (c.ingredientName || '').trim().toLowerCase() === name.trim().toLowerCase()
        );
        const lower = name.toLowerCase();
        let defaultUnit = matchedCentral?.unit || 'kg';
        if (!matchedCentral?.unit) {
          if (lower.includes('milk') || lower.includes('oil') || lower.includes('beverage') || lower.includes('syrup')) {
            defaultUnit = 'liters';
          } else if (lower.includes('bun') || lower.includes('bread') || lower.includes('packet')) {
            defaultUnit = 'packets';
          } else if (lower.includes('egg') || lower.includes('box')) {
            defaultUnit = 'boxes';
          }
        }

        updated.push({
          ingredientName: name,
          itemId: matchedCentral?.id || matchedCentral?.itemId || null,
          itemCode: matchedCentral?.itemCode || matchedCentral?.code || null,
          category: matchedCentral?.category || 'Groceries',
          qty: '',
          unit: defaultUnit,
          isCustom: !matchedCentral
        });
      }
    });

    // Retain any manual custom items that user added with empty or custom names
    items.forEach(it => {
      if (it.isCustom && it.ingredientName && !newSelected.includes(it.ingredientName)) {
        updated.push(it);
      }
    });

    setItems(updated);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!neededByDate) {
      setError('Please select a date when these items are needed.');
      return;
    }
    if (items.length === 0) {
      setError('Please select or add at least one item to request.');
      return;
    }
    for (const it of items) {
      if (!it.ingredientName || !it.ingredientName.trim()) {
        setError('All requested items must have a valid name.');
        return;
      }
      if (!it.qty || Number(it.qty) <= 0) {
        setError(`Please enter a valid quantity for "${it.ingredientName}".`);
        return;
      }
    }

    const outletId = currentOutlet?.outletId || currentOutlet?.id || 1;
    const outletName = currentOutlet?.name || 'Main Canteen';

    await onSubmitRequest(items, {
      outletId,
      outletName,
      requiredByDate: neededByDate,
      urgency,
      notes,
      requestedBy: `${outletName} Kitchen Staff`
    });

    handleClose();
  };

  const outletDisplayName = currentOutlet?.name
    ? `${currentOutlet.name} (Kitchen Inventory)`
    : 'Main Canteen Kitchen';
  const warehouseDisplayName = warehouseOutlet?.name
    ? `${warehouseOutlet.name} (Admin Master Store)`
    : 'Central Warehouse (Admin Master Store)';

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
        maxWidth: '820px',
        width: '100%',
        boxShadow: 'var(--shadow-modal)',
        overflow: 'hidden',
        maxHeight: '92vh',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0
        }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ChefHat size={18} style={{ color: 'var(--color-primary)' }} />
              Request Items / Goods
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
              Issue formal stock requisition from kitchen outlet to Central Warehouse.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
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

        {/* Modal Body */}
        <form onSubmit={handleSubmit} style={{ padding: '20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {error && (
            <div style={{
              backgroundColor: 'var(--color-danger-light, #fee2e2)',
              color: 'var(--color-danger, #ef4444)',
              padding: '10px 14px',
              borderRadius: 'var(--border-radius-md)',
              fontSize: '12.5px',
              fontWeight: 500
            }}>
              {error}
            </div>
          )}

          {/* Source Outlet & Target Warehouse Info */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '14px',
            backgroundColor: 'var(--bg-app)',
            padding: '14px',
            borderRadius: 'var(--border-radius-lg)',
            border: '1px solid var(--border-color)'
          }}>
            <div>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                Requesting Kitchen Outlet
              </label>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                height: '36px',
                padding: '0 12px',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--border-radius-md)',
                fontSize: '12.5px',
                fontWeight: 600,
                color: 'var(--text-primary)'
              }}>
                <Store size={14} style={{ color: 'var(--color-primary)' }} />
                <span>{outletDisplayName}</span>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                Requisition Target (Warehouse)
              </label>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                height: '36px',
                padding: '0 12px',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--border-radius-md)',
                fontSize: '12.5px',
                fontWeight: 600,
                color: 'var(--text-primary)'
              }}>
                <Building2 size={14} style={{ color: '#2563eb' }} />
                <span>{warehouseDisplayName}</span>
              </div>
            </div>
          </div>

          {/* Date & Urgency Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                Needed By Date *
              </label>
              <input
                type="date"
                required
                value={neededByDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setNeededByDate(e.target.value)}
                style={{
                  width: '100%',
                  height: '36px',
                  padding: '0 12px',
                  fontSize: '12.5px',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--border-radius-md)',
                  backgroundColor: 'var(--bg-surface)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                Urgency Level
              </label>
              <select
                value={urgency}
                onChange={(e) => setUrgency(e.target.value)}
                style={{
                  width: '100%',
                  height: '36px',
                  padding: '0 12px',
                  fontSize: '12.5px',
                  fontWeight: 500,
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--border-radius-md)',
                  backgroundColor: 'var(--bg-surface)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              >
                <option value="Normal">Normal (Standard Daily Requisition)</option>
                <option value="High">High (Kitchen Running Out of Stock)</option>
                <option value="Emergency">Emergency (Immediate Dining Hall Requirement)</option>
              </select>
            </div>
          </div>

          {/* Ingredients Multi-Select Section */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Required Ingredients / Requisition Items *
              </label>
              <button
                type="button"
                onClick={handleAddManualCustomItem}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-primary)',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Plus size={13} />
                <span>+ Custom Item</span>
              </button>
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '0 0 8px 0' }}>
              Multi-select from ingredients available in Central Warehouse, or type to add custom items:
            </p>

            <IngredientMultiSelectDropdown
              options={warehouseIngredientNames}
              selected={selectedIngredientNames}
              onChange={handleMultiSelectChange}
              placeholder="Select Central Warehouse ingredients or type custom item..."
              allowCustom={true}
            />
          </div>

          {/* Selected Items Requisition Table */}
          {items.length > 0 && (
            <div>
              <div style={{
                fontSize: '12px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <span>Requisition Item Quantities ({items.length} items selected):</span>
              </div>
              <div style={{
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--border-radius-md)',
                overflow: 'hidden'
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--bg-muted)', borderBottom: '1px solid var(--border-color)' }}>
                      <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)' }}>Item Name *</th>
                      <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', width: '130px' }}>Quantity *</th>
                      <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', width: '110px' }}>Unit</th>
                      <th style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 600, color: 'var(--text-secondary)', width: '45px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((it, idx) => (
                      <tr key={idx} style={{ borderBottom: idx === items.length - 1 ? 'none' : '1px solid var(--border-color)' }}>
                        <td style={{ padding: '8px 12px' }}>
                          {it.isCustom ? (
                            <input
                              type="text"
                              value={it.ingredientName}
                              onChange={(e) => handleItemChange(idx, 'ingredientName', e.target.value)}
                              placeholder="Type custom item name..."
                              style={{
                                width: '100%',
                                height: '32px',
                                padding: '0 8px',
                                fontSize: '12px',
                                border: '1px solid var(--border-color)',
                                borderRadius: 'var(--border-radius-sm)',
                                backgroundColor: 'var(--bg-surface)',
                                color: 'var(--text-primary)',
                                outline: 'none'
                              }}
                            />
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <strong style={{ color: 'var(--text-primary)', fontSize: '12.5px' }}>{it.ingredientName}</strong>
                              <span style={{
                                fontSize: '10px',
                                padding: '1px 5px',
                                borderRadius: '3px',
                                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                color: '#2563eb',
                                fontWeight: 600
                              }}>
                                Warehouse Catalog
                              </span>
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '8px 12px' }}>
                          <input
                            type="number"
                            step="any"
                            min="0.01"
                            required
                            value={it.qty}
                            onChange={(e) => handleItemChange(idx, 'qty', e.target.value)}
                            placeholder="e.g. 15"
                            style={{
                              width: '100%',
                              height: '32px',
                              padding: '0 8px',
                              fontSize: '12px',
                              fontWeight: 600,
                              border: '1px solid var(--border-color)',
                              borderRadius: 'var(--border-radius-sm)',
                              backgroundColor: 'var(--bg-surface)',
                              color: 'var(--text-primary)',
                              outline: 'none'
                            }}
                          />
                        </td>
                        <td style={{ padding: '8px 12px' }}>
                          <select
                            value={it.unit}
                            onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}
                            style={{
                              width: '100%',
                              height: '32px',
                              padding: '0 6px',
                              fontSize: '12px',
                              border: '1px solid var(--border-color)',
                              borderRadius: 'var(--border-radius-sm)',
                              backgroundColor: 'var(--bg-surface)',
                              color: 'var(--text-primary)',
                              outline: 'none'
                            }}
                          >
                            <option value="kg">kg</option>
                            <option value="liters">liters</option>
                            <option value="packets">packets</option>
                            <option value="boxes">boxes</option>
                            <option value="pieces">pieces</option>
                            <option value="units">units</option>
                            <option value="grams">grams</option>
                            <option value="cans">cans</option>
                          </select>
                        </td>
                        <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--color-danger, #ef4444)',
                              cursor: 'pointer',
                              padding: '4px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                            title="Remove item"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Reason / Notes */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
              Requisition Reason & Justification (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Daily lunch prep replenishment, emergency shortage..."
              style={{
                width: '100%',
                padding: '8px 12px',
                fontSize: '12.5px',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--border-radius-md)',
                backgroundColor: 'var(--bg-surface)',
                color: 'var(--text-primary)',
                outline: 'none',
                resize: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Modal Footer */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '10px',
            marginTop: '8px',
            paddingTop: '12px',
            borderTop: '1px solid var(--border-color)'
          }}>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              icon={Send}
              loading={loading}
              disabled={loading || items.length === 0}
            >
              Submit Request to Warehouse
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RequestStockModal;
