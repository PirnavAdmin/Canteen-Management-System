import React, { useState, useEffect } from 'react';
import { Button } from '../../../../components/common/Button';
import { Percent, Package, ShieldCheck } from 'lucide-react';

export const OrderRulesTab = ({ initialData = {}, onSave }) => {
  const [formData, setFormData] = useState({
    gstPercent: 5.0,
    packagingFee: 5.0,
    enablePackagingFee: true,
    ...initialData
  });

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      ...initialData,
      gstPercent: initialData.gstPercent !== undefined ? initialData.gstPercent : (prev.gstPercent ?? 5.0),
      packagingFee: initialData.packagingFee !== undefined ? initialData.packagingFee : (prev.packagingFee ?? 5.0),
      enablePackagingFee: initialData.enablePackagingFee !== undefined ? initialData.enablePackagingFee : (prev.enablePackagingFee ?? true)
    }));
  }, [initialData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      gstPercent: Number(formData.gstPercent) >= 0 ? Number(formData.gstPercent) : 5.0,
      packagingFee: Number(formData.packagingFee) >= 0 ? Number(formData.packagingFee) : 5.0,
      enablePackagingFee: formData.enablePackagingFee !== false
    });
  };

  return (
    <form onSubmit={handleSubmit} style={{
      backgroundColor: 'var(--bg-surface)',
      borderRadius: 'var(--border-radius-lg)',
      border: '1px solid var(--border-color)',
      padding: '24px',
      boxShadow: 'var(--shadow-xs)',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px'
    }}>
      <div>
        <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 4px 0', color: 'var(--text-primary)' }}>
          Order Billing & Taxation Governance
        </h3>
        <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: 0 }}>
          Configure institutional Goods & Services Tax (GST) percentage rate and takeaway packaging fees applied across all meal orders.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '18px' }}>
        {/* GST Rate (%) */}
        <div style={{
          padding: '16px',
          backgroundColor: 'var(--bg-app)',
          borderRadius: 'var(--border-radius-md)',
          border: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Percent size={18} style={{ color: 'var(--color-primary)' }} />
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
              GST Rate (%) *
            </label>
          </div>
          <input
            type="number"
            min="0"
            max="28"
            step="0.1"
            value={formData.gstPercent ?? 5.0}
            onChange={(e) => setFormData({ ...formData, gstPercent: parseFloat(e.target.value) || 0 })}
            style={{
              width: '100%',
              height: '38px',
              padding: '0 12px',
              fontSize: '13.5px',
              fontWeight: 600,
              backgroundColor: 'var(--bg-surface)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--border-radius-md)'
            }}
          />
          <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
            Applicable GST rate applied directly to customer & admin food order subtotals (default: 5.0%)
          </span>
        </div>

        {/* Takeaway Packaging Fee (₹) */}
        <div style={{
          padding: '16px',
          backgroundColor: 'var(--bg-app)',
          borderRadius: 'var(--border-radius-md)',
          border: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Package size={18} style={{ color: 'var(--color-primary)' }} />
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
              Takeaway Packaging Fee (₹) *
            </label>
          </div>
          <input
            type="number"
            min="0"
            max="100"
            step="1"
            disabled={formData.enablePackagingFee === false}
            value={formData.packagingFee ?? 5.0}
            onChange={(e) => setFormData({ ...formData, packagingFee: parseFloat(e.target.value) || 0 })}
            style={{
              width: '100%',
              height: '38px',
              padding: '0 12px',
              fontSize: '13.5px',
              fontWeight: 600,
              backgroundColor: formData.enablePackagingFee === false ? 'var(--bg-muted)' : 'var(--bg-surface)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--border-radius-md)',
              opacity: formData.enablePackagingFee === false ? 0.6 : 1
            }}
          />
          <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
            Standard food parcel packaging charge (automatically waived on cart subtotals exceeding ₹200)
          </span>
        </div>
      </div>

      {/* Enable Packaging Fee Toggle */}
      <div style={{
        padding: '14px 18px',
        backgroundColor: 'var(--bg-app)',
        borderRadius: 'var(--border-radius-md)',
        border: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        cursor: 'pointer'
      }} onClick={() => setFormData({ ...formData, enablePackagingFee: !formData.enablePackagingFee })}>
        <div>
          <strong style={{ fontSize: '13.5px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={16} style={{ color: '#10b981' }} />
            Enable Takeaway Packaging Fee
          </strong>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
            When active, dining hall meal checkouts apply the configured packaging fee to takeaway orders.
          </p>
        </div>

        <input
          type="checkbox"
          checked={formData.enablePackagingFee !== false}
          onChange={(e) => setFormData({ ...formData, enablePackagingFee: e.target.checked })}
          style={{ width: '18px', height: '18px', cursor: 'pointer' }}
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
        <Button variant="primary" type="submit">
          Save Order Rules & Billing
        </Button>
      </div>
    </form>
  );
};

export default OrderRulesTab;
