import React, { useState, useEffect } from 'react';
import { Button } from '../../../../components/common/Button';
import { CreditCard, QrCode, Wallet, Banknote, AlertCircle, CheckCircle } from 'lucide-react';

export const PaymentSettingsTab = ({ initialData = {}, onSave }) => {
  const [formData, setFormData] = useState({
    upiEnabled: initialData.upiEnabled ?? initialData.allowUpi ?? true,
    upiVpa: initialData.upiVpa || 'canteen.apex@icici',
    upiMerchantName: initialData.upiMerchantName || 'Apex Institute Canteen',
    cardNetBankingEnabled: initialData.cardNetBankingEnabled ?? initialData.allowCards ?? false,
    gatewayProvider: initialData.gatewayProvider || 'Razorpay',
    campusWalletEnabled: initialData.campusWalletEnabled ?? initialData.allowWallet ?? true,
    campusWalletMaxBalance: initialData.campusWalletMaxBalance || 2000,
    cashOnCounterEnabled: initialData.cashOnCounterEnabled ?? initialData.allowCash ?? true,
    ...initialData
  });

  const [saving, setSaving] = useState(false);
  const [validationError, setValidationError] = useState(null);

  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      setFormData(prev => ({
        ...prev,
        upiEnabled: initialData.upiEnabled ?? initialData.allowUpi ?? prev.upiEnabled,
        upiVpa: initialData.upiVpa || prev.upiVpa || 'canteen.apex@icici',
        upiMerchantName: initialData.upiMerchantName || prev.upiMerchantName || 'Apex Institute Canteen',
        cardNetBankingEnabled: initialData.cardNetBankingEnabled ?? initialData.allowCards ?? prev.cardNetBankingEnabled,
        gatewayProvider: initialData.gatewayProvider || prev.gatewayProvider || 'Razorpay',
        campusWalletEnabled: initialData.campusWalletEnabled ?? initialData.allowWallet ?? prev.campusWalletEnabled,
        campusWalletMaxBalance: initialData.campusWalletMaxBalance || prev.campusWalletMaxBalance || 2000,
        cashOnCounterEnabled: initialData.cashOnCounterEnabled ?? initialData.allowCash ?? prev.cashOnCounterEnabled,
        ...initialData
      }));
    }
  }, [initialData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError(null);

    // Validation
    if (formData.upiEnabled && (!formData.upiVpa || !formData.upiVpa.includes('@'))) {
      setValidationError('Please enter a valid Merchant VPA handle containing "@" (e.g. canteen.apex@icici).');
      return;
    }

    if (formData.campusWalletEnabled && Number(formData.campusWalletMaxBalance) <= 0) {
      setValidationError('Maximum per-order wallet limit must be greater than ₹0.');
      return;
    }

    try {
      setSaving(true);
      await onSave({
        ...formData,
        allowUpi: formData.upiEnabled,
        allowCards: formData.cardNetBankingEnabled,
        allowWallet: formData.campusWalletEnabled,
        allowCash: formData.cashOnCounterEnabled
      });
    } finally {
      setSaving(false);
    }
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
          Payment Gateway & Campus Wallet Gateway
        </h3>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
          Configure institutional payment channels, UPI merchant virtual addresses, and direct student wallet debits.
        </p>
      </div>

      {validationError && (
        <div style={{
          padding: '10px 14px',
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: 'var(--border-radius-md)',
          color: '#b91c1c',
          fontSize: '12.5px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <AlertCircle size={16} style={{ flexShrink: 0 }} />
          <span>{validationError}</span>
        </div>
      )}

      {/* UPI Section */}
      <div style={{
        padding: '16px',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--border-radius-md)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <QrCode size={18} style={{ color: 'var(--color-primary)' }} />
            <div>
              <strong style={{ fontSize: '14px', color: 'var(--text-primary)' }}>UPI Fast Pay (Dynamic QR & Intent)</strong>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>GPay, PhonePe, Paytm & Institutional UPI BHIM</div>
            </div>
          </div>
          <input
            type="checkbox"
            checked={Boolean(formData.upiEnabled)}
            onChange={(e) => setFormData({ ...formData, upiEnabled: e.target.checked })}
            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
          />
        </div>

        {formData.upiEnabled && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '6px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '3px' }}>
                Merchant VPA Handle
              </label>
              <input
                type="text"
                value={formData.upiVpa || ''}
                onChange={(e) => setFormData({ ...formData, upiVpa: e.target.value })}
                placeholder="e.g. canteen.apex@icici"
                style={{ width: '100%', height: '34px', padding: '0 8px', fontSize: '12.5px', border: '1px solid var(--border-color)', borderRadius: '4px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '3px' }}>
                Merchant Legal Name
              </label>
              <input
                type="text"
                value={formData.upiMerchantName || ''}
                onChange={(e) => setFormData({ ...formData, upiMerchantName: e.target.value })}
                placeholder="e.g. Apex Institute Canteen"
                style={{ width: '100%', height: '34px', padding: '0 8px', fontSize: '12.5px', border: '1px solid var(--border-color)', borderRadius: '4px' }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Card / Net Banking */}
      <div style={{
        padding: '16px',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--border-radius-md)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CreditCard size={18} style={{ color: 'var(--color-primary)' }} />
            <div>
              <strong style={{ fontSize: '14px', color: 'var(--text-primary)' }}>Cards & Institutional Net Banking</strong>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Debit, Credit Card & Net Banking via Campus Payment Gateway</div>
            </div>
          </div>
          <input
            type="checkbox"
            checked={Boolean(formData.cardNetBankingEnabled)}
            onChange={(e) => setFormData({ ...formData, cardNetBankingEnabled: e.target.checked })}
            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
          />
        </div>

        {formData.cardNetBankingEnabled && (
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '3px' }}>
              Connected Gateway Provider
            </label>
            <input
              type="text"
              value={formData.gatewayProvider || ''}
              onChange={(e) => setFormData({ ...formData, gatewayProvider: e.target.value })}
              placeholder="e.g. Razorpay / Cashfree"
              style={{ width: '100%', height: '34px', padding: '0 8px', fontSize: '12.5px', border: '1px solid var(--border-color)', borderRadius: '4px' }}
            />
          </div>
        )}
      </div>

      {/* Campus Student / Faculty Wallet */}
      <div style={{
        padding: '16px',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--border-radius-md)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Wallet size={18} style={{ color: 'var(--color-primary)' }} />
            <div>
              <strong style={{ fontSize: '14px', color: 'var(--text-primary)' }}>Campus Smart ID Card / Student Wallet</strong>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Direct debit from student portal account balance with instant refund capability</div>
            </div>
          </div>
          <input
            type="checkbox"
            checked={Boolean(formData.campusWalletEnabled)}
            onChange={(e) => setFormData({ ...formData, campusWalletEnabled: e.target.checked })}
            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
          />
        </div>

        {formData.campusWalletEnabled && (
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '3px' }}>
              Maximum Per-Order Wallet Transaction Limit (₹)
            </label>
            <input
              type="number"
              value={formData.campusWalletMaxBalance || 2000}
              onChange={(e) => setFormData({ ...formData, campusWalletMaxBalance: Number(e.target.value) })}
              style={{ width: '100%', height: '34px', padding: '0 8px', fontSize: '12.5px', border: '1px solid var(--border-color)', borderRadius: '4px' }}
            />
          </div>
        )}
      </div>

      {/* Cash On Counter */}
      <div style={{
        padding: '16px',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--border-radius-md)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Banknote size={18} style={{ color: 'var(--color-primary)' }} />
          <div>
            <strong style={{ fontSize: '14px', color: 'var(--text-primary)' }}>Cash Settlement at Counter</strong>
            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Allow pay-on-counter mode (cash handling at POS terminal)</div>
          </div>
        </div>
        <input
          type="checkbox"
          checked={Boolean(formData.cashOnCounterEnabled)}
          onChange={(e) => setFormData({ ...formData, cashOnCounterEnabled: e.target.checked })}
          style={{ width: '18px', height: '18px', cursor: 'pointer' }}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
        <Button variant="primary" type="submit" loading={saving} disabled={saving}>
          Save Payment Configurations
        </Button>
      </div>
    </form>
  );
};

export default PaymentSettingsTab;
