import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  Store,
  Shield,
  LogOut,
  CheckCircle2,
  Mail
} from 'lucide-react';
import { useAuth } from '../../../app/providers/AuthProvider';
import { useStaffOutlet } from '../hooks/useStaffOutlet';
import { PageHeader } from '../../../components/common/PageHeader';
import { Card } from '../../../components/common/Card';
import { StatusBadge } from '../../../components/common/StatusBadge';
import { Button } from '../../../components/common/Button';

export const StaffProfilePage = () => {
  const { user, logout } = useAuth();
  const { activeOutletName, activeCampusName, selectedOutletObj } = useStaffOutlet();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      if (logout) await logout();
    } finally {
      navigate('/staff/login', { replace: true });
    }
  };

  const displayName = user?.fullName || user?.name || user?.username || 'Staff Member';
  const username = user?.username || '—';
  const userEmail = user?.email || '—';
  const staffId = user?.id || user?.userId ? `STF-${user.id || user.userId}` : '—';
  const staffRole = user?.role || 'Staff';
  const staffShift = user?.shift || 'Assigned Operational Shift';
  const staffPhone = user?.phoneNumber || user?.phone || user?.contactNumber || '—';
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'ST';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '840px', margin: '0 auto' }}>
      <PageHeader
        title="Staff Profile & Station Assignment"
        description="Authenticated personnel details, outlet assignment, and operational permissions."
      />

      <Card padding="24px">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Identity Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                fontWeight: 700,
                flexShrink: 0
              }}>
                {initials}
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                    {displayName}
                  </h2>
                  <StatusBadge status={user?.isActive === false ? 'Inactive' : 'Active'} size="sm" />
                </div>
                <div style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Role: <strong>{staffRole}</strong> • Staff ID:{' '}
                  <code style={{ backgroundColor: 'var(--bg-muted)', padding: '1px 6px', borderRadius: '4px', color: 'var(--color-primary)', fontWeight: 600 }}>
                    {staffId}
                  </code>
                </div>
              </div>
            </div>
          </div>

          {/* Info Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
            <div style={{ padding: '14px', borderRadius: 'var(--border-radius-md)', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-accent)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <Store size={14} />
                <span>Assigned Outlet</span>
              </div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '6px' }}>
                {activeOutletName || 'No outlet assigned'}
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                {[activeCampusName, selectedOutletObj?.code].filter(Boolean).join(' • ') || '—'}
              </div>
            </div>

            <div style={{ padding: '14px', borderRadius: 'var(--border-radius-md)', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-primary)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <Clock size={14} />
                <span>Operational Shift</span>
              </div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '6px' }}>
                {staffShift}
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Contact: {staffPhone}
              </div>
            </div>

            <div style={{ padding: '14px', borderRadius: 'var(--border-radius-md)', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-success)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <Mail size={14} />
                <span>Account Identity</span>
              </div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '6px' }}>
                Username: <code style={{ backgroundColor: 'var(--bg-muted)', padding: '2px 6px', borderRadius: '4px' }}>{username}</code>
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px', wordBreak: 'break-all' }}>
                {userEmail}
              </div>
            </div>
          </div>

          {/* Permissions */}
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '10px' }}>
              <Shield size={14} />
              <span>Station Authorizations</span>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {[
                'Order Board & Workflow Transitions',
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
                    fontSize: '12px',
                    fontWeight: 500,
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
            <Button
              variant="danger"
              icon={LogOut}
              onClick={handleLogout}
            >
              Sign Out
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default StaffProfilePage;
