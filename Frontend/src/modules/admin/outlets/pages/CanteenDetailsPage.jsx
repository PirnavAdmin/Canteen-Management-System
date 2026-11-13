import React, { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCanteens } from '../hooks/useCanteens';
import { PageHeader } from '../../../../components/common/PageHeader';
import { Button } from '../../../../components/common/Button';
import { StatusBadge } from '../../../../components/common/StatusBadge';
import { Card } from '../../../../components/common/Card';
import { ConfirmationModal } from '../../../../components/common/ConfirmationModal';
import { CanteenStaffCard } from '../components/CanteenStaffCard';
import { formatTime12Hour, formatDate, calculateTotalHours } from '../utils/canteenFormatters';
import {
  Edit,
  ArrowLeft,
  Power,
  Store,
  MapPin,
  Clock,
  Calendar,
  Phone,
  Mail,
  Building,
  CheckCircle2,
  XCircle,
  Hash
} from 'lucide-react';

export const CanteenDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getCanteen, toggleCanteenStatus, assignStaff, removeStaff, loading } = useCanteens();

  const [isToggleModalOpen, setIsToggleModalOpen] = useState(false);

  const canteen = useMemo(() => getCanteen(id), [getCanteen, id]);

  if (loading) {
    return (
      <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-secondary)' }}>
        Loading canteen details...
      </div>
    );
  }

  if (!canteen) {
    return (
      <div>
        <PageHeader
          title="Canteen Details"
          breadcrumbItems={[
            { label: 'Canteen Outlets', path: '/canteen' },
            { label: 'Details' }
          ]}
        />
        <Card>
          <div style={{ textAlign: 'center', padding: '32px' }}>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
              The requested canteen outlet does not exist or may have been deleted.
            </p>
            <Button variant="primary" onClick={() => navigate('/canteen')}>
              Return to Canteens List
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const isActive = canteen.status === 'Active';
  const totalDailyHours = calculateTotalHours(canteen.openingTime, canteen.closingTime);

  const handleConfirmToggle = async () => {
    await toggleCanteenStatus(canteen.id);
    setIsToggleModalOpen(false);
  };

  return (
    <div>
      <PageHeader
        title={canteen.name}
        description={`Canteen Code: ${canteen.code} • Campus: ${canteen.campus}`}
        badge={<StatusBadge status={canteen.status} />}
        breadcrumbItems={[
          { label: 'Canteen Outlets', path: '/canteen' },
          { label: canteen.name }
        ]}
        actions={
          <>
            <Button
              variant="secondary"
              icon={ArrowLeft}
              onClick={() => navigate('/canteen')}
            >
              Back to List
            </Button>
            <Button
              variant="outline"
              icon={Power}
              onClick={() => setIsToggleModalOpen(true)}
              style={{
                color: isActive ? 'var(--color-danger)' : 'var(--color-success)',
                borderColor: isActive ? 'var(--color-danger)' : 'var(--color-success)'
              }}
            >
              {isActive ? 'Deactivate Outlet' : 'Activate Outlet'}
            </Button>
            <Button
              variant="primary"
              icon={Edit}
              onClick={() => navigate(`/canteen/${id}/edit`)}
            >
              Edit Outlet
            </Button>
          </>
        }
      />

      {/* Main Details Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        {/* Card 1: Outlet Identity & Location */}
        <Card title="Outlet & Campus Specifications">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <Building size={18} style={{ color: 'var(--color-accent)', marginTop: '2px', flexShrink: 0 }} />
              <div>
                <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
                  Assigned Campus
                </span>
                <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', margin: '2px 0 0 0' }}>
                  {canteen.campus}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <Hash size={18} style={{ color: 'var(--color-accent)', marginTop: '2px', flexShrink: 0 }} />
              <div>
                <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
                  Institutional Code
                </span>
                <p style={{ margin: '2px 0 0 0' }}>
                  <code style={{
                    backgroundColor: 'var(--bg-muted)',
                    padding: '3px 8px',
                    borderRadius: 'var(--border-radius-xs)',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: 'var(--color-primary)'
                  }}>
                    {canteen.code}
                  </code>
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <MapPin size={18} style={{ color: 'var(--color-accent)', marginTop: '2px', flexShrink: 0 }} />
              <div>
                <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
                  Physical Location / Building
                </span>
                <p style={{ fontSize: '13.5px', color: 'var(--text-primary)', margin: '2px 0 0 0', lineHeight: 1.4 }}>
                  {canteen.location}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <Store size={18} style={{ color: 'var(--color-accent)', marginTop: '2px', flexShrink: 0 }} />
              <div>
                <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
                  Order Acceptance Status (SRS §3.1)
                </span>
                <div style={{ marginTop: '4px' }}>
                  {canteen.isOrderAcceptanceEnabled ? (
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '12px',
                      color: 'var(--color-success-text)',
                      backgroundColor: 'var(--color-success-bg)',
                      padding: '2px 8px',
                      borderRadius: 'var(--border-radius-full)',
                      fontWeight: 600
                    }}>
                      <CheckCircle2 size={13} />
                      Accepting Online & Counter Orders
                    </span>
                  ) : (
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '12px',
                      color: 'var(--color-danger-text)',
                      backgroundColor: 'var(--color-danger-bg)',
                      padding: '2px 8px',
                      borderRadius: 'var(--border-radius-full)',
                      fontWeight: 600
                    }}>
                      <XCircle size={13} />
                      Order Acceptance Suspended
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Card 2: Operating Schedule & Contact */}
        <Card title="Operating Hours & Communications">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <Clock size={18} style={{ color: 'var(--color-accent)', marginTop: '2px', flexShrink: 0 }} />
              <div>
                <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
                  Daily Operating Hours
                </span>
                <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', margin: '2px 0 0 0' }}>
                  {formatTime12Hour(canteen.openingTime)} – {formatTime12Hour(canteen.closingTime)}
                </p>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Total daily operating window: {totalDailyHours} hours
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <Calendar size={18} style={{ color: 'var(--color-accent)', marginTop: '2px', flexShrink: 0 }} />
              <div>
                <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
                  Working Days of Operation
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                  {Array.isArray(canteen.workingDays) && canteen.workingDays.map(day => (
                    <span
                      key={day}
                      style={{
                        fontSize: '11.5px',
                        backgroundColor: 'var(--color-primary-light)',
                        color: 'var(--color-primary)',
                        padding: '2px 8px',
                        borderRadius: 'var(--border-radius-full)',
                        fontWeight: 500
                      }}
                    >
                      {day}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <Phone size={18} style={{ color: 'var(--color-accent)', marginTop: '2px', flexShrink: 0 }} />
              <div>
                <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
                  Contact Phone
                </span>
                <p style={{ fontSize: '13.5px', color: 'var(--text-primary)', margin: '2px 0 0 0' }}>
                  {canteen.contactPhone || 'Not provided'}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <Mail size={18} style={{ color: 'var(--color-accent)', marginTop: '2px', flexShrink: 0 }} />
              <div>
                <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
                  Official Email Address
                </span>
                <p style={{ fontSize: '13.5px', color: 'var(--text-primary)', margin: '2px 0 0 0' }}>
                  {canteen.contactEmail || 'Not provided'}
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Staff and Administration Assignment Section (SRS Section 3.1 & 74) */}
      <CanteenStaffCard
        canteen={canteen}
        onAssignStaff={assignStaff}
        onRemoveStaff={removeStaff}
      />

      {/* Institutional System Audit Info */}
      <div style={{
        marginTop: '24px',
        padding: '16px 20px',
        backgroundColor: 'var(--bg-surface)',
        borderRadius: 'var(--border-radius-md)',
        border: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        fontSize: '12px',
        color: 'var(--text-muted)'
      }}>
        <span>Institution Master: <strong>{canteen.institutionId || 'INST-APEX-01'}</strong></span>
        <span>Record Created: <strong>{formatDate(canteen.createdAt)}</strong></span>
        <span>Last Modified: <strong>{formatDate(canteen.updatedAt)}</strong></span>
      </div>

      {/* Status Toggle Modal */}
      <ConfirmationModal
        isOpen={isToggleModalOpen}
        onClose={() => setIsToggleModalOpen(false)}
        onConfirm={handleConfirmToggle}
        title={isActive ? 'Deactivate Canteen Outlet' : 'Activate Canteen Outlet'}
        variant={isActive ? 'warning' : 'primary'}
        message={
          isActive
            ? `Are you sure you want to deactivate "${canteen.name}" (${canteen.code})? It will temporarily suspend active order acceptance and menu browsing for students and faculty.`
            : `Are you sure you want to activate "${canteen.name}" (${canteen.code})? It will re-open the outlet for active campus operations.`
        }
        confirmText={isActive ? 'Deactivate Outlet' : 'Activate Outlet'}
      />
    </div>
  );
};

export default CanteenDetailsPage;
