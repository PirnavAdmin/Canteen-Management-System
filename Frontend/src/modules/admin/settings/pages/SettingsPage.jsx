import React, { useState } from 'react';
import { Store, CreditCard, Clock, ShieldCheck } from 'lucide-react';
import { PageHeader } from '../../../../components/common/PageHeader';
import { useSettings } from '../hooks/useSettings';
import { OutletSettingsTab } from '../components/OutletSettingsTab';
import { PaymentSettingsTab } from '../components/PaymentSettingsTab';
import { OrderRulesTab } from '../components/OrderRulesTab';
import { PrivacyDsarTab } from '../components/PrivacyDsarTab';

export const SettingsPage = () => {
  const {
    settings,
    loading,
    updateOutlet,
    updatePayments,
    updateRules,
    updatePrivacy,
    updateDsar
  } = useSettings();

  const [activeTab, setActiveTab] = useState('outlet');

  if (loading || !settings) {
    return (
      <div>
        <PageHeader
          title="Settings & Privacy Governance"
          description="Loading system configuration..."
          breadcrumbItems={[
            { label: 'Admin' },
            { label: 'Settings & Privacy' }
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
        title="Settings & Privacy Governance"
        description="Configure institutional dining hall operating rules, UPI and payment gateways, automated cancellation thresholds, and DPDP Act compliance."
        breadcrumbItems={[
          { label: 'Admin' },
          { label: 'Settings & Privacy' }
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
          onClick={() => setActiveTab('outlet')}
          style={{
            padding: '10px 16px',
            fontSize: '13px',
            fontWeight: activeTab === 'outlet' ? 600 : 500,
            color: activeTab === 'outlet' ? 'var(--color-primary)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'outlet' ? '2.5px solid var(--color-primary)' : '2.5px solid transparent',
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
          <Store size={15} />
          <span>Outlet Profile & FSSAI</span>
        </button>

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

        <button
          type="button"
          onClick={() => setActiveTab('privacy')}
          style={{
            padding: '10px 16px',
            fontSize: '13px',
            fontWeight: activeTab === 'privacy' ? 600 : 500,
            color: activeTab === 'privacy' ? 'var(--color-primary)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'privacy' ? '2.5px solid var(--color-primary)' : '2.5px solid transparent',
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
          <ShieldCheck size={15} />
          <span>Privacy & Data Protection (DSAR)</span>
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === 'outlet' && (
        <OutletSettingsTab
          initialData={settings.outlet}
          onSave={updateOutlet}
        />
      )}

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

      {activeTab === 'privacy' && (
        <PrivacyDsarTab
          initialData={settings.privacy}
          onSavePrivacy={updatePrivacy}
          onUpdateDsar={updateDsar}
        />
      )}
    </div>
  );
};

export default SettingsPage;
