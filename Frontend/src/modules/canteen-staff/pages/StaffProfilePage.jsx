import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  Store,
  Key,
  LogOut,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../../../app/providers/AuthProvider';
import { STAFF_APP_CONFIG } from '../constants/staffNavigation';
import { PageHeader } from '../../../components/common/PageHeader';

export const StaffProfilePage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      if (logout) await logout();
      navigate('/login', { replace: true });
    } catch {
      navigate('/login', { replace: true });
    }
  };

  const displayName = user?.fullName || user?.name || 'Staff Member';
  const username = user?.username || '—';
  const staffId = user?.id ? `STF-${user.id}` : 'STF-ACTIVE';
  const staffRole = user?.role || 'Canteen Staff (Kitchen & Pickup Counter)';
  const staffShift = user?.shift || 'Standard Operational Shift';
  const staffPhone = user?.phone || user?.contactNumber || '—';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <PageHeader
        title="Staff Profile & Station Assignment"
        description="Active personnel credentials, shift timings and kitchen station authorizations"
      />

      {/* Main Profile Card */}
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        borderRadius: 'var(--border-radius-lg)',
        border: '1px solid var(--border-color)',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        boxShadow: 'var(--shadow-xs)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            backgroundColor: 'var(--color-primary)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            fontWeight: 800
          }}>
            {displayName.charAt(0)}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                {displayName}
              </h2>
              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '9999px',
                backgroundColor: 'var(--color-success-bg)',
                color: 'var(--color-success)',
                border: '1px solid var(--color-success-border)'
              }}>
                Active Duty
              </span>
            </div>
            <div style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Role: <strong>{staffRole}</strong> • ID: <code style={{ backgroundColor: 'var(--bg-muted)', padding: '1px 5px', borderRadius: '4px' }}>{staffId}</code>
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
          <div style={{ padding: '14px', borderRadius: 'var(--border-radius-md)', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-accent)', fontSize: '11.5px', fontWeight: 700 }}>
              <Store size={14} />
              <span>ASSIGNED OUTLET</span>
            </div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
              {STAFF_APP_CONFIG.canteenOutlet}
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
              {STAFF_APP_CONFIG.counterName}
            </div>
          </div>

          <div style={{ padding: '14px', borderRadius: 'var(--border-radius-md)', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-primary)', fontSize: '11.5px', fontWeight: 700 }}>
              <Clock size={14} />
              <span>CURRENT SHIFT</span>
            </div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
              {staffShift}
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Contact: {staffPhone}
            </div>
          </div>

          <div style={{ padding: '14px', borderRadius: 'var(--border-radius-md)', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-success)', fontSize: '11.5px', fontWeight: 700 }}>
              <Key size={14} />
              <span>CREDENTIALS</span>
            </div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
              Username: <code style={{ backgroundColor: 'var(--bg-muted)', padding: '2px 6px', borderRadius: '4px' }}>{username}</code>
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Password: <code style={{ backgroundColor: 'var(--bg-muted)', padding: '2px 6px', borderRadius: '4px' }}>Staff@123</code>
            </div>
          </div>
        </div>

        {/* Permissions */}
        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
          <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px' }}>
            Station Authorizations:
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {[
              'Order Board & Workflow Acceptance',
              'Kitchen Display (KDS) Live Tickets',
              'Counter Pickup & Token Verification',
              'Raw Inventory & Waste Reporting',
              'Admin Stock Requisition Dispatch'
            ].map((perm) => (
              <span
                key={perm}
                style={{
                  padding: '5px 10px',
                  borderRadius: 'var(--border-radius-sm)',
                  backgroundColor: 'var(--bg-app)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-secondary)',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <CheckCircle2 size={13} style={{ color: 'var(--color-success)' }} />
                <span>{perm}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Logout Action */}
        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={handleLogout}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '9px 16px',
              borderRadius: 'var(--border-radius-sm)',
              backgroundColor: 'var(--color-danger-bg)',
              color: 'var(--color-danger)',
              border: '1px solid var(--color-danger-border)',
              fontSize: '12.5px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            <LogOut size={15} />
            <span>Sign Out of Staff Portal</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default StaffProfilePage;
