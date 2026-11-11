import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '../../../../components/common/Button';

export const SupplierModal = ({ isOpen, onClose, onAddSupplier }) => {
  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    suppliedCategories: ''
  });
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) {
      setError('Vendor name and contact phone are required.');
      return;
    }
    onAddSupplier(formData);
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
        backgroundColor: '#ffffff',
        borderRadius: 'var(--border-radius-xl)',
        maxWidth: '500px',
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
              Register Vendor / Supplier
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
              Add a trusted kitchen raw material supplier.
            </p>
          </div>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
              Company / Vendor Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Amul Dairy Cooperative"
              style={{ width: '100%', height: '36px', padding: '0 8px', fontSize: '13px', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-md)' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                Contact Person
              </label>
              <input
                type="text"
                value={formData.contactPerson}
                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                placeholder="e.g. Suresh Patel"
                style={{ width: '100%', height: '36px', padding: '0 8px', fontSize: '13px', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-md)' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                Phone Number *
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="e.g. +91 98250 44332"
                style={{ width: '100%', height: '36px', padding: '0 8px', fontSize: '13px', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-md)' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
              Email Address
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="e.g. orders@supplier.com"
              style={{ width: '100%', height: '36px', padding: '0 8px', fontSize: '13px', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-md)' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
              Supplied Categories / Ingredients
            </label>
            <input
              type="text"
              value={formData.suppliedCategories}
              onChange={(e) => setFormData({ ...formData, suppliedCategories: e.target.value })}
              placeholder="e.g. Dairy Products, Milk, Paneer, Butter"
              style={{ width: '100%', height: '36px', padding: '0 8px', fontSize: '13px', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-md)' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
              Physical Address / Warehouse
            </label>
            <textarea
              rows={2}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="e.g. GIDC Industrial Estate, Anand, Gujarat"
              style={{ width: '100%', padding: '8px', fontSize: '13px', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-md)' }}
            />
          </div>

          {error && <div style={{ fontSize: '11.5px', color: 'var(--color-danger)' }}>{error}</div>}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '14px' }}>
            <Button variant="secondary" onClick={onClose} type="button">
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Register Supplier
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SupplierModal;
