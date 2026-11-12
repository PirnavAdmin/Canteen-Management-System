import React, { useState } from 'react';
import { Card } from '../../../../components/common/Card';
import { Button } from '../../../../components/common/Button';
import { Modal } from '../../../../components/modals/Modal';
import { FormInput } from '../../../../components/forms/FormInput';
import { FormSelect } from '../../../../components/forms/FormSelect';
import { Users, UserCheck, UserPlus, Trash2, Mail, Phone, Shield } from 'lucide-react';

export const CanteenStaffCard = ({
  canteen,
  onAssignStaff,
  onRemoveStaff
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newStaff, setNewStaff] = useState({
    name: '',
    role: 'Billing Cashier',
    phone: ''
  });
  const [staffError, setStaffError] = useState('');

  const admin = canteen.assignedAdministrator || {
    name: 'Not Assigned',
    role: 'Outlet Administrator',
    id: 'EMP-TBD',
    email: 'admin@apexinstitute.edu',
    phone: '--'
  };

  const staffList = canteen.assignedStaff || [];

  const handleOpenModal = () => {
    setNewStaff({ name: '', role: 'Billing Cashier', phone: '' });
    setStaffError('');
    setIsModalOpen(true);
  };

  const handleSaveStaff = async (e) => {
    e.preventDefault();
    if (!newStaff.name.trim()) {
      setStaffError('Staff member name is required.');
      return;
    }
    await onAssignStaff(canteen.id, newStaff);
    setIsModalOpen(false);
  };

  return (
    <>
      <Card
        title="Outlet Administration & Staff Assignment (SRS §3.1)"
        subtitle="Manage assigned administrative lead and operations personnel for this dining outlet."
        actions={
          <Button
            variant="secondary"
            size="sm"
            icon={UserPlus}
            onClick={handleOpenModal}
          >
            Assign Staff Member
          </Button>
        }
      >
        {/* Administrator Lead Card */}
        <div style={{
          padding: '16px',
          borderRadius: 'var(--border-radius-md)',
          backgroundColor: 'var(--bg-app)',
          border: '1px solid var(--border-color)',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-primary-light)',
              color: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Shield size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {admin.name}
                </span>
                <span style={{
                  fontSize: '11px',
                  backgroundColor: 'var(--color-primary-light)',
                  color: 'var(--color-primary)',
                  padding: '2px 8px',
                  borderRadius: 'var(--border-radius-full)',
                  fontWeight: 600
                }}>
                  {admin.role}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '4px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                <span>ID: {admin.id}</span>
                {admin.email && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Mail size={12} style={{ color: 'var(--text-muted)' }} />
                    {admin.email}
                  </span>
                )}
                {admin.phone && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Phone size={12} style={{ color: 'var(--text-muted)' }} />
                    {admin.phone}
                  </span>
                )}
              </div>
            </div>
          </div>
          <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
            Configured via Institutional SMS Master
          </span>
        </div>

        {/* Assigned Staff Members List */}
        <div>
          <h4 style={{
            fontSize: '13px',
            fontWeight: 600,
            color: 'var(--text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            marginBottom: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <Users size={14} />
            Active Operating Crew ({staffList.length})
          </h4>

          {staffList.length === 0 ? (
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
              No operational crew currently assigned to this outlet. Click "Assign Staff Member" to add crew.
            </p>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '12px'
            }}>
              {staffList.map((staff) => (
                <div
                  key={staff.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: 'var(--border-radius-md)',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-surface)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--bg-muted)',
                      color: 'var(--text-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: 600
                    }}>
                      <UserCheck size={16} />
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {staff.name}
                      </div>
                      <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                        {staff.role} • {staff.id}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemoveStaff(canteen.id, staff.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-danger)',
                      padding: '4px',
                      cursor: 'pointer',
                      borderRadius: '4px',
                      opacity: 0.8
                    }}
                    title="Remove assignment"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Staff Assignment Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Assign Staff Member"
        subtitle={`Assign operational staff to ${canteen.name}`}
      >
        <form onSubmit={handleSaveStaff}>
          <FormInput
            label="Staff Member Full Name"
            name="name"
            value={newStaff.name}
            onChange={(e) => {
              setNewStaff(prev => ({ ...prev, name: e.target.value }));
              if (staffError) setStaffError('');
            }}
            placeholder="e.g. Ramesh Chandra"
            required
            error={staffError}
          />

          <FormSelect
            label="Operational Role"
            name="role"
            value={newStaff.role}
            onChange={(e) => setNewStaff(prev => ({ ...prev, role: e.target.value }))}
            options={[
              'Billing Cashier',
              'Kitchen Head / Lead Chef',
              'Counter Dispenser',
              'Kitchen Assistant',
              'Inventory Dispatcher'
            ]}
            required
          />

          <FormInput
            label="Contact Phone"
            name="phone"
            value={newStaff.phone}
            onChange={(e) => setNewStaff(prev => ({ ...prev, phone: e.target.value }))}
            placeholder="+1 (555) 000-0000"
            helperText="Internal extension or mobile number for duty scheduling."
          />

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '12px',
            paddingTop: '16px',
            borderTop: '1px solid var(--border-color)',
            marginTop: '8px'
          }}>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Assign Staff
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
};

