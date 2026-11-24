import React, { useState, useMemo, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { Button } from '../../../../components/common/Button';
import { IngredientMultiSelectDropdown, DEFAULT_BASIC_INGREDIENTS } from './IngredientMultiSelectDropdown';

export const PurchaseOrderModal = ({ isOpen, onClose, suppliers = [], outlets = [], defaultOutletId = 1, loading = false, onCreatePO }) => {
  // Only show Active suppliers in the purchase order modal dropdown
  const activeSuppliers = useMemo(() => {
    return (suppliers || []).filter(s => (s.status || 'Active').toLowerCase() === 'active');
  }, [suppliers]);

  const [outletId, setOutletId] = useState(defaultOutletId || (outlets[0]?.outletId || 1));
  const [supplierId, setSupplierId] = useState('');
  const [expectedDelivery, setExpectedDelivery] = useState('');
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');

  // Reset all modal fields when opened afresh
  useEffect(() => {
    if (isOpen) {
      if (defaultOutletId) setOutletId(defaultOutletId);
      if (activeSuppliers.length > 0) {
        setSupplierId(activeSuppliers[0].id);
      } else {
        setSupplierId('');
      }
      setExpectedDelivery('');
      setItems([]);
      setError('');
    }
  }, [isOpen, activeSuppliers, defaultOutletId]);

  useEffect(() => {
    // Reset items when switching supplier
    setItems([]);
    setError('');
  }, [supplierId]);

  const handleClose = () => {
    setExpectedDelivery('');
    setItems([]);
    setError('');
    onClose();
  };

  // Selected supplier details & ingredients provided by this active supplier
  const selectedSup = useMemo(() => {
    return activeSuppliers.find(s => String(s.id) === String(supplierId)) || activeSuppliers[0] || null;
  }, [activeSuppliers, supplierId]);

  const supplierIngredients = useMemo(() => {
    if (!selectedSup?.suppliedCategories) return [];
    const raw = Array.isArray(selectedSup.suppliedCategories)
      ? selectedSup.suppliedCategories
      : String(selectedSup.suppliedCategories).split(',');
    return raw.map(s => s.trim()).filter(Boolean);
  }, [selectedSup]);

  if (!isOpen) return null;

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

  // Multi-select sync: selecting ingredients provided by the supplier adds/removes requisition rows
  const handleMultiSelectIngredients = (newSelected) => {
    const updated = [];
    newSelected.forEach(name => {
      const existing = items.find(it => it.ingredientName.trim().toLowerCase() === name.trim().toLowerCase());
      if (existing) {
        updated.push(existing);
      } else {
        const lower = name.toLowerCase();
        let defaultUnit = 'kg';
        if (lower.includes('milk') || lower.includes('oil') || lower.includes('beverage') || lower.includes('syrup')) {
          defaultUnit = 'liters';
        } else if (lower.includes('bun') || lower.includes('bread') || lower.includes('packet')) {
          defaultUnit = 'packets';
        } else if (lower.includes('egg') || lower.includes('box')) {
          defaultUnit = 'boxes';
        }

        updated.push({
          ingredientName: name,
          qty: '',
          unit: defaultUnit,
          unitPrice: '',
          mfgDate: '',
          expiryDate: ''
        });
      }
    });

    setItems(updated);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!expectedDelivery) {
      setError('Please select an expected delivery date.');
      return;
    }
    if (items.length === 0) {
      setError('Please select at least one ingredient from the dropdown above.');
      return;
    }
    for (const it of items) {
      if (!it.ingredientName.trim() || !it.qty || !it.unitPrice) {
        setError('All items must have valid name, quantity, and unit price.');
        return;
      }
      if (it.mfgDate && it.expiryDate) {
        if (new Date(it.expiryDate) < new Date(it.mfgDate)) {
          setError(`Expiry date cannot be earlier than manufacturing date for "${it.ingredientName}".`);
          return;
        }
      }
    }

    if (!supplierId || !selectedSup) {
      setError('Please select an active supplier.');
      return;
    }

    const processedItems = items.map(it => ({
      ...it,
      qty: Number(it.qty),
      unitPrice: Number(it.unitPrice),
      total: Number(it.qty) * Number(it.unitPrice),
      mfgDate: it.mfgDate || null,
      expiryDate: it.expiryDate || null
    }));
    const totalAmount = processedItems.reduce((acc, curr) => acc + curr.total, 0);

    await onCreatePO({
      outletId: Number(outletId) || 1,
      supplierId,
      supplierName: selectedSup.name || 'Institutional Vendor',
      expectedDelivery,
      items: processedItems,
      totalAmount
    });
    handleClose();
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
        maxWidth: '840px',
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
              Create Purchase Order
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
              Issue formal purchase requisition to registered campus kitchen suppliers.
            </p>
          </div>
          <button type="button" onClick={handleClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                Supplier *
              </label>
              <select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                style={{
                  width: '100%',
                  height: '36px',
                  padding: '0 8px',
                  fontSize: '13px',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--border-radius-md)',
                  backgroundColor: 'var(--bg-surface)',
                  color: 'var(--text-primary)'
                }}
              >
                {activeSuppliers.length === 0 ? (
                  <option value="" disabled>No active suppliers available</option>
                ) : (
                  activeSuppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                Expected Delivery Date *
              </label>
              <input
                type="date"
                value={expectedDelivery}
                onChange={(e) => { setExpectedDelivery(e.target.value); setError(''); }}
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
            <div style={{ marginBottom: '8px' }}>
              <label style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)', display: 'block' }}>
                Required Ingredients / Requisition Items
              </label>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                Multi-select from ingredients provided by <strong>{selectedSup?.name || 'Supplier'}</strong>:
              </span>
            </div>

            {/* Reference 3 styled multi-select dropdown for supplier provided ingredients (NO Others button here!) */}
            <div style={{ marginBottom: '12px' }}>
              <IngredientMultiSelectDropdown
                options={supplierIngredients}
                selected={items.map(it => it.ingredientName).filter(Boolean)}
                onChange={handleMultiSelectIngredients}
                allowCustom={false}
                placeholder={
                  supplierIngredients.length > 0
                    ? `Select from ingredients provided by ${selectedSup?.name || 'supplier'}...`
                    : `No ingredients registered for ${selectedSup?.name || 'this supplier'}`
                }
              />
            </div>

            {/* Datalist for ingredient suggestions inside individual item rows */}
            <datalist id="supplier-ingredients-datalist">
              {supplierIngredients.map((ing, idx) => (
                <option key={idx} value={ing} />
              ))}
            </datalist>

            {items.length === 0 ? (
              <div style={{
                padding: '14px',
                textAlign: 'center',
                border: '1px dashed var(--border-color)',
                borderRadius: 'var(--border-radius-md)',
                color: 'var(--text-secondary)',
                fontSize: '12px',
                backgroundColor: 'var(--bg-app)'
              }}>
                No ingredients selected. Multi-select ingredients from the dropdown above to add them to this purchase order.
              </div>
            ) : (
              <div style={{ overflowX: 'auto', paddingBottom: '4px' }}>
                {/* Compact column headers for requisition items */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(140px, 2fr) 65px 75px 85px 125px 125px 28px',
                  gap: '8px',
                  marginBottom: '6px',
                  padding: '0 4px',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  minWidth: '650px'
                }}>
                  <div>Item Name *</div>
                  <div>Qty *</div>
                  <div>Unit</div>
                  <div>Price (₹) *</div>
                  <div>Mfg Date</div>
                  <div>Expiry Date</div>
                  <div></div>
                </div>

                {items.map((it, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'minmax(140px, 2fr) 65px 75px 85px 125px 125px 28px',
                      gap: '8px',
                      marginBottom: '8px',
                      alignItems: 'center',
                      minWidth: '650px'
                    }}
                  >
                    <input
                      type="text"
                      list="supplier-ingredients-datalist"
                      placeholder="Ingredient name"
                      value={it.ingredientName}
                      onChange={(e) => handleItemChange(idx, 'ingredientName', e.target.value)}
                      style={{ height: '34px', padding: '0 8px', fontSize: '12px', border: '1px solid var(--border-color)', borderRadius: '4px', backgroundColor: 'var(--bg-surface)', color: 'var(--text-primary)', width: '100%', boxSizing: 'border-box' }}
                    />
                    <input
                      type="number"
                      placeholder="Qty"
                      value={it.qty}
                      onChange={(e) => handleItemChange(idx, 'qty', e.target.value)}
                      style={{ height: '34px', padding: '0 6px', fontSize: '12px', border: '1px solid var(--border-color)', borderRadius: '4px', backgroundColor: 'var(--bg-surface)', color: 'var(--text-primary)', width: '100%', boxSizing: 'border-box' }}
                    />
                    <select
                      value={it.unit}
                      onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}
                      style={{ height: '34px', padding: '0 4px', fontSize: '12px', border: '1px solid var(--border-color)', borderRadius: '4px', backgroundColor: 'var(--bg-surface)', color: 'var(--text-primary)', width: '100%', boxSizing: 'border-box' }}
                    >
                      <option value="kg">kg</option>
                      <option value="liters">liters</option>
                      <option value="packets">packets</option>
                      <option value="boxes">boxes</option>
                      <option value="pcs">pcs</option>
                    </select>
                    <input
                      type="number"
                      placeholder="Price"
                      value={it.unitPrice}
                      onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
                      style={{ height: '34px', padding: '0 6px', fontSize: '12px', border: '1px solid var(--border-color)', borderRadius: '4px', backgroundColor: 'var(--bg-surface)', color: 'var(--text-primary)', width: '100%', boxSizing: 'border-box' }}
                    />
                    <input
                      type="date"
                      title="Manufacturing Date (Optional)"
                      placeholder="Mfg date"
                      value={it.mfgDate || ''}
                      onChange={(e) => handleItemChange(idx, 'mfgDate', e.target.value)}
                      style={{ height: '34px', padding: '0 4px', fontSize: '11px', border: '1px solid var(--border-color)', borderRadius: '4px', backgroundColor: 'var(--bg-surface)', color: 'var(--text-primary)', width: '100%', boxSizing: 'border-box' }}
                    />
                    <input
                      type="date"
                      title="Expiry Date (Optional)"
                      placeholder="Expiry date"
                      min={it.mfgDate || undefined}
                      value={it.expiryDate || ''}
                      onChange={(e) => handleItemChange(idx, 'expiryDate', e.target.value)}
                      style={{ height: '34px', padding: '0 4px', fontSize: '11px', border: '1px solid var(--border-color)', borderRadius: '4px', backgroundColor: 'var(--bg-surface)', color: 'var(--text-primary)', width: '100%', boxSizing: 'border-box' }}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      title={`Delete ${it.ingredientName || 'item'}`}
                      style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && <div style={{ fontSize: '11.5px', color: 'var(--color-danger)' }}>{error}</div>}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '14px' }}>
            <Button variant="secondary" onClick={handleClose} type="button" disabled={loading}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={loading}>
              Submit Purchase Order
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PurchaseOrderModal;
