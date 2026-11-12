import React, { useState, useEffect } from 'react';
import { Button } from '../../../../components/common/Button';

export const OutletSettingsTab = ({ initialData = {}, onSave }) => {
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
      gap: '18px'
    }}>
      <div>
        <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 4px 0', color: 'var(--text-primary)' }}>
          Campus Outlet Profile & Regulatory Standards
        </h3>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
          Manage dining outlet identity, operating hours, and mandatory Food Safety and Standards Authority of India (FSSAI) compliance.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
            Outlet Name *
          </label>
          <input
            type="text"
            value={formData.outletName || ''}
            onChange={(e) => setFormData({ ...formData, outletName: e.target.value })}
            style={{ width: '100%', height: '36px', padding: '0 10px', fontSize: '13px', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-md)' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
            Outlet Code *
          </label>
          <input
            type="text"
            value={formData.outletCode || ''}
            onChange={(e) => setFormData({ ...formData, outletCode: e.target.value.toUpperCase() })}
            style={{ width: '100%', height: '36px', padding: '0 10px', fontSize: '13px', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-md)' }}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
            FSSAI License Number *
          </label>
          <input
            type="text"
            value={formData.fssaiLicenseNumber || ''}
            onChange={(e) => setFormData({ ...formData, fssaiLicenseNumber: e.target.value })}
            style={{ width: '100%', height: '36px', padding: '0 10px', fontSize: '13px', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-md)' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
            FSSAI License Valid Till *
          </label>
          <input
            type="date"
            value={formData.fssaiValidTill || ''}
            onChange={(e) => setFormData({ ...formData, fssaiValidTill: e.target.value })}
            style={{ width: '100%', height: '36px', padding: '0 10px', fontSize: '13px', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-md)' }}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
            Operating Contact Email *
          </label>
          <input
            type="email"
            value={formData.contactEmail || ''}
            onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
            style={{ width: '100%', height: '36px', padding: '0 10px', fontSize: '13px', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-md)' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
            Operating Phone Number *
          </label>
          <input
            type="text"
            value={formData.contactPhone || ''}
            onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
            style={{ width: '100%', height: '36px', padding: '0 10px', fontSize: '13px', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-md)' }}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
            Kitchen Opening Time
          </label>
          <input
            type="time"
            value={formData.openingTime || '07:30'}
            onChange={(e) => setFormData({ ...formData, openingTime: e.target.value })}
            style={{ width: '100%', height: '36px', padding: '0 10px', fontSize: '13px', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-md)' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
            Kitchen Closing Time
          </label>
          <input
            type="time"
            value={formData.closingTime || '21:30'}
            onChange={(e) => setFormData({ ...formData, closingTime: e.target.value })}
            style={{ width: '100%', height: '36px', padding: '0 10px', fontSize: '13px', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-md)' }}
          />
        </div>
      </div>

      {/* Master Order Acceptance Toggle */}
      <div style={{
        padding: '14px 16px',
        backgroundColor: 'var(--bg-app)',
        borderRadius: 'var(--border-radius-md)',
        border: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div>
          <strong style={{ fontSize: '13.5px', color: 'var(--text-primary)' }}>
            Master Order Influx Acceptance
          </strong>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
            When toggled OFF, student and faculty portals will display "Kitchen Temporarily Paused".
          </p>
        </div>

        <input
          type="checkbox"
          checked={formData.orderAcceptanceEnabled || false}
          onChange={(e) => setFormData({ ...formData, orderAcceptanceEnabled: e.target.checked })}
          style={{ width: '18px', height: '18px', cursor: 'pointer' }}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
        <Button variant="primary" type="submit">
          Save Outlet Profile
        </Button>
      </div>
    </form>
  );
};

export default OutletSettingsTab;
