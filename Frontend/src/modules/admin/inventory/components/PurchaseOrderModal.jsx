import React, { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { Button } from '../../../../components/common/Button';

export const PurchaseOrderModal = ({ isOpen, onClose, suppliers = [], onCreatePO }) => {
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id || 'sup-01');
  const [expectedDelivery, setExpectedDelivery] = useState('');
  const [items, setItems] = useState([
    { ingredientName: '', qty: '', unit: 'kg', unitPrice: '' }
  ]);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleAddItem = () => {
    setItems([...items, { ingredientName: '', qty: '', unit: 'kg', unitPrice: '' }]);
  };

  const handleRemoveItem = (index) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index, field, val) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: val };
    setItems(updated);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!expectedDelivery) {
      setError('Please select an expected delivery date.');
      return;
    }
    const invalidItem = items.find(it => !it.ingredientName.trim() || !it.qty || !it.unitPrice);
    if (invalidItem) {
      setError('All items must have valid name, quantity, and unit price.');
      return;
    }

    const selectedSup = suppliers.find(s => s.id === supplierId) || { name: 'Institutional Vendor' };
    const processedItems = items.map(it => ({
      ...it,
      qty: Number(it.qty),
      unitPrice: Number(it.unitPrice),
      total: Number(it.qty) * Number(it.unitPrice)
    }));
    const totalAmount = processedItems.reduce((acc, curr) => acc + curr.total, 0);

    onCreatePO({
      supplierId,
      supplierName: selectedSup.name,
      expectedDelivery,
      items: processedItems,
      totalAmount
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
        maxWidth: '620px',
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
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
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
                  borderRadius: 'var(--border-radius-md)'
                }}
              >
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <label style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Requisition Items
              </label>
              <button
                type="button"
                onClick={handleAddItem}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-accent)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Plus size={13} />
                <span>Add Item</span>
              </button>
            </div>

            {items.map((it, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <input
                  type="text"
                  placeholder="Ingredient name (e.g. Basmati Rice)"
                  value={it.ingredientName}
                  onChange={(e) => handleItemChange(idx, 'ingredientName', e.target.value)}
                  style={{ flex: 3, height: '34px', padding: '0 8px', fontSize: '12px', border: '1px solid var(--border-color)', borderRadius: '4px' }}
                />
                <input
                  type="number"
                  placeholder="Qty"
                  value={it.qty}
                  onChange={(e) => handleItemChange(idx, 'qty', e.target.value)}
                  style={{ flex: 1, height: '34px', padding: '0 8px', fontSize: '12px', border: '1px solid var(--border-color)', borderRadius: '4px' }}
                />
                <select
                  value={it.unit}
                  onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}
                  style={{ flex: 1, height: '34px', padding: '0 4px', fontSize: '12px', border: '1px solid var(--border-color)', borderRadius: '4px' }}
                >
                  <option value="kg">kg</option>
                  <option value="liters">liters</option>
                  <option value="packets">packets</option>
                  <option value="boxes">boxes</option>
                  <option value="pcs">pcs</option>
                </select>
                <input
                  type="number"
                  placeholder="Price (₹)"
                  value={it.unitPrice}
                  onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
                  style={{ flex: 1.5, height: '34px', padding: '0 8px', fontSize: '12px', border: '1px solid var(--border-color)', borderRadius: '4px' }}
                />
                <button
                  type="button"
                  onClick={() => handleRemoveItem(idx)}
                  disabled={items.length === 1}
                  style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', padding: '4px' }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          {error && <div style={{ fontSize: '11.5px', color: 'var(--color-danger)' }}>{error}</div>}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '14px' }}>
            <Button variant="secondary" onClick={onClose} type="button">
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Submit Purchase Order
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PurchaseOrderModal;
