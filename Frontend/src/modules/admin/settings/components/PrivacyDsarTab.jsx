import React, { useState } from 'react';
import { ShieldCheck, Lock } from 'lucide-react';
import { Button } from '../../../../components/common/Button';
import { StatusBadge } from '../../../../components/common/StatusBadge';
import { formatDate } from '../../../../utils/formatters';

export const PrivacyDsarTab = ({ initialData = {}, onSavePrivacy, onUpdateDsar }) => {
  const [formData, setFormData] = useState({ ...initialData });
  const [resolutionNote, setResolutionNote] = useState('');

  const handleTogglePref = (key) => {
    setFormData(prev => ({
      ...prev,
      notificationPreferences: {
        ...prev.notificationPreferences,
        [key]: !prev.notificationPreferences?.[key]
      }
    }));
  };

  const handleSavePolicy = (e) => {
    e.preventDefault();
    onSavePrivacy(formData);
  };

  const handleActionDsar = (req, newStatus) => {
    onUpdateDsar(req.id, newStatus, resolutionNote || `Request status set to ${newStatus}`);
    setResolutionNote('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Privacy Governance Card */}
      <form onSubmit={handleSavePolicy} style={{
        backgroundColor: 'var(--bg-surface)',
        borderRadius: 'var(--border-radius-lg)',
        border: '1px solid var(--border-color)',
        padding: '24px',
        boxShadow: 'var(--shadow-xs)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ShieldCheck size={20} style={{ color: 'var(--color-primary)' }} />
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              Data Protection & Privacy Governance (DPDP Act 2023)
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Active Notice: {formData.noticeVersion} • Last Revised: {formatDate(formData.lastUpdated)}
            </span>
          </div>
        </div>

        {/* Retention Policy Alert */}
        <div style={{
          padding: '12px 16px',
          backgroundColor: 'var(--color-info-bg)',
          border: '1px solid var(--color-info-border)',
          borderRadius: 'var(--border-radius-md)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '10px',
          fontSize: '12.5px',
          color: 'var(--color-info-text)',
          lineHeight: 1.5
        }}>
          <Lock size={16} style={{ marginTop: '2px', flexShrink: 0 }} />
          <div>
            <strong>Institutional Data Retention Policy (§3.2 / Statutory Compliance):</strong>
            <div>
              Student and faculty identity profile data can be erased upon formal request. However, all order invoices, GST receipts, and transaction ledgers must be retained for <strong>{formData.retentionPolicyYears || 7} years</strong> under university financial audit mandates. Deletion of historical records is prohibited.
            </div>
          </div>
        </div>

        {/* DPO details */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '3px' }}>
              Designated Data Protection Officer (DPO)
            </label>
            <input
              type="text"
              value={formData.dataProtectionOfficer || ''}
              onChange={(e) => setFormData({ ...formData, dataProtectionOfficer: e.target.value })}
              style={{ width: '100%', height: '34px', padding: '0 8px', fontSize: '12.5px', border: '1px solid var(--border-color)', borderRadius: '4px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '3px' }}>
              DPO Grievance Redressal Email
            </label>
            <input
              type="email"
              value={formData.dpoContact || ''}
              onChange={(e) => setFormData({ ...formData, dpoContact: e.target.value })}
              style={{ width: '100%', height: '34px', padding: '0 8px', fontSize: '12.5px', border: '1px solid var(--border-color)', borderRadius: '4px' }}
            />
          </div>
        </div>

        {/* Notification preferences */}
        <div>
          <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
            System Notification & Consent Channels
          </label>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={formData.notificationPreferences?.smsAlerts || false}
                onChange={() => handleTogglePref('smsAlerts')}
              />
              <span>SMS Pickup Token Alerts</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={formData.notificationPreferences?.emailReceipts || false}
                onChange={() => handleTogglePref('emailReceipts')}
              />
              <span>Email GST Invoices</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={formData.notificationPreferences?.portalPush || false}
                onChange={() => handleTogglePref('portalPush')}
              />
              <span>Campus Portal Notifications</span>
            </label>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '14px' }}>
          <Button variant="primary" type="submit">
            Save Privacy Policy Parameters
          </Button>
        </div>
      </form>

      {/* DSAR Requests Table */}
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        borderRadius: 'var(--border-radius-lg)',
        border: '1px solid var(--border-color)',
        padding: '20px',
        boxShadow: 'var(--shadow-xs)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div>
            <h4 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              Data Subject Requests (Access & Erasure Log)
            </h4>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Process student and staff requests for canteen data export and personal identifier erasure.
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {formData.dsarRequests?.map((req) => (
            <div
              key={req.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                borderRadius: 'var(--border-radius-md)',
                backgroundColor: 'var(--bg-app)',
                border: '1px solid var(--border-color)',
                flexWrap: 'wrap',
                gap: '12px'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <code style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-primary)' }}>{req.id}</code>
                  <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{req.requestType}</strong>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Applicant: <strong>{req.subjectName}</strong> ({req.subjectId}) • Requested: {formatDate(req.requestedDate)}
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '3px' }}>
                  Notes: {req.notes}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: 'auto' }}>
                <StatusBadge status={req.status === 'Fulfilled' ? 'Active' : req.status === 'Under Verification' ? 'Warning' : 'Inactive'} label={req.status} />

                {req.status !== 'Fulfilled' && (
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleActionDsar(req, 'Under Verification')}
                    >
                      Verify
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleActionDsar(req, 'Fulfilled')}
                    >
                      Fulfill Request
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PrivacyDsarTab;
