import React, { useState, useEffect } from 'react';
import { Button } from '../../../../components/common/Button';
import { CreditCard, QrCode, Wallet, Banknote } from 'lucide-react';

export const PaymentSettingsTab = ({ initialData = {}, onSave }) => {
  const [formData, setFormData] = useState({ ...initialData });

  useEffect(() => {
    setFormData({ ...initialData });
  }, [initialData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
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
            checked={formData.upiEnabled || false}
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
            checked={formData.cardNetBankingEnabled || false}
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
            checked={formData.campusWalletEnabled || false}
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
          checked={formData.cashOnCounterEnabled || false}
          onChange={(e) => setFormData({ ...formData, cashOnCounterEnabled: e.target.checked })}
          style={{ width: '18px', height: '18px', cursor: 'pointer' }}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
        <Button variant="primary" type="submit">
          Save Payment Configurations
        </Button>
      </div>
    </form>
  );
};

export default PaymentSettingsTab;
