import React, { useState } from 'react';
import { CreditCard, Clock } from 'lucide-react';
import { PageHeader } from '../../../../components/common/PageHeader';
import { useSettings } from '../hooks/useSettings';
import { PaymentSettingsTab } from '../components/PaymentSettingsTab';
import { OrderRulesTab } from '../components/OrderRulesTab';

export const SettingsPage = () => {
  const {
    settings,
    loading,
    updatePayments,
    updateRules
  } = useSettings();

  const [activeTab, setActiveTab] = useState('payments');

  if (loading || !settings) {
    return (
      <div>
        <PageHeader
          title="Settings & System Governance"
          description="Loading system configuration..."
          breadcrumbItems={[
            { label: 'Admin' },
            { label: 'Settings' }
          ]}
        />
        <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-secondary)' }}>
          Loading administrative settings...
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Settings & System Governance"
        description="Configure institutional dining hall operating rules, UPI and payment gateways, and automated cancellation thresholds."
        breadcrumbItems={[
          { label: 'Admin' },
          { label: 'Settings' }
        ]}
      />

      {/* Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--border-color)',
        marginBottom: '20px',
        gap: '6px',
        overflowX: 'auto'
      }}>
        <button
          type="button"
          onClick={() => setActiveTab('payments')}
          style={{
            padding: '10px 16px',
            fontSize: '13px',
            fontWeight: activeTab === 'payments' ? 600 : 500,
            color: activeTab === 'payments' ? 'var(--color-primary)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'payments' ? '2.5px solid var(--color-primary)' : '2.5px solid transparent',
            background: 'none',
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            whiteSpace: 'nowrap'
          }}
        >
          <CreditCard size={15} />
          <span>Payment Gateways & Wallet</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('rules')}
          style={{
            padding: '10px 16px',
            fontSize: '13px',
            fontWeight: activeTab === 'rules' ? 600 : 500,
            color: activeTab === 'rules' ? 'var(--color-primary)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'rules' ? '2.5px solid var(--color-primary)' : '2.5px solid transparent',
            background: 'none',
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            whiteSpace: 'nowrap'
          }}
        >
          <Clock size={15} />
          <span>Order Rules & Holding</span>
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === 'payments' && (
        <PaymentSettingsTab
          initialData={settings.payments}
          onSave={updatePayments}
        />
      )}

      {activeTab === 'rules' && (
        <OrderRulesTab
          initialData={settings.orderRules}
          onSave={updateRules}
        />
      )}
    </div>
  );
};

export default SettingsPage;
