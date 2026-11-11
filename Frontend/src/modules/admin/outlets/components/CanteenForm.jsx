import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FormInput } from '../../../../components/forms/FormInput';
import { FormSelect } from '../../../../components/forms/FormSelect';
import { TimeInput } from '../../../../components/forms/TimeInput';
import { WorkingDaysSelector } from '../../../../components/forms/WorkingDaysSelector';
import { Button } from '../../../../components/common/Button';
import { CAMPUSES } from '../constants/canteenConstants';
import { validateCanteenForm } from '../utils/canteenValidators';
import { Save, X, Building, MapPin, Phone, Mail, Hash, ShieldCheck } from 'lucide-react';

export const CanteenForm = ({
  initialValues = {},
  onSubmit,
  isEdit = false,
  allCanteens = []
}) => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    campus: '',
    location: '',
    contactPhone: '',
    contactEmail: '',
    openingTime: '08:00',
    closingTime: '20:00',
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    status: 'Active',
    isOrderAcceptanceEnabled: true
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialValues && Object.keys(initialValues).length > 0) {
      setFormData({
        name: initialValues.name || '',
        code: initialValues.code || '',
        campus: initialValues.campus || '',
        location: initialValues.location || '',
        contactPhone: initialValues.contactPhone || '',
        contactEmail: initialValues.contactEmail || '',
        openingTime: initialValues.openingTime || '08:00',
        closingTime: initialValues.closingTime || '20:00',
        workingDays: initialValues.workingDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        status: initialValues.status || 'Active',
        isOrderAcceptanceEnabled: initialValues.isOrderAcceptanceEnabled ?? true
      });
    }
  }, [initialValues]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleWorkingDaysChange = (days) => {
    setFormData(prev => ({ ...prev, workingDays: days }));
    if (errors.workingDays) {
      setErrors(prev => ({ ...prev, workingDays: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validation = validateCanteenForm(formData, allCanteens, initialValues?.id);

    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit(formData);
    } catch (err) {
      console.error('Submission failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: 'var(--border-radius-lg)',
        border: '1px solid var(--border-color)',
        padding: '28px',
        boxShadow: 'var(--shadow-xs)'
      }}>
        {/* Section 1: Basic Information */}
        <div style={{ marginBottom: '28px' }}>
          <h3 style={{
            fontSize: '15px',
            fontWeight: 600,
            color: 'var(--text-primary)',
            paddingBottom: '12px',
            borderBottom: '1px solid var(--border-color)',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Building size={16} style={{ color: 'var(--color-accent)' }} />
            Outlet Identity & Location
          </h3>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '20px'
          }}>
            <FormInput
              label="Canteen / Outlet Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Central University Food Court"
              required
              error={errors.name}
              helperText="Full institutional name for this dining facility."
            />

            <FormInput
              label="Canteen Code"
              name="code"
              value={formData.code}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }));
                if (errors.code) setErrors(prev => ({ ...prev, code: null }));
              }}
              placeholder="e.g. CNT-MAIN-01"
              required
              prefixIcon={Hash}
              error={errors.code}
              helperText="Unique uppercase identifier for audit and POS mapping."
            />

            <FormSelect
              label="Campus"
              name="campus"
              value={formData.campus}
              onChange={handleChange}
              options={CAMPUSES}
              placeholder="Select Campus..."
              required
              error={errors.campus}
              helperText="Institutional campus where this outlet is situated."
            />

            <FormInput
              label="Physical Location / Building"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="e.g. Student Center, Ground Floor (Block A)"
              required
              prefixIcon={MapPin}
              error={errors.location}
              helperText="Floor, block, or building details for students and staff."
            />
          </div>
        </div>

        {/* Section 2: Contact Information */}
        <div style={{ marginBottom: '28px' }}>
          <h3 style={{
            fontSize: '15px',
            fontWeight: 600,
            color: 'var(--text-primary)',
            paddingBottom: '12px',
            borderBottom: '1px solid var(--border-color)',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Phone size={16} style={{ color: 'var(--color-accent)' }} />
            Contact & Communications
          </h3>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '20px'
          }}>
            <FormInput
              label="Contact Phone"
              name="contactPhone"
              value={formData.contactPhone}
              onChange={handleChange}
              placeholder="+1 (555) 000-0000"
              required
              prefixIcon={Phone}
              error={errors.contactPhone}
              helperText="Manager desk or counter dispatch number."
            />

            <FormInput
              label="Contact Email"
              name="contactEmail"
              type="email"
              value={formData.contactEmail}
              onChange={handleChange}
              placeholder="outlet.canteen@apexinstitute.edu"
              required
              prefixIcon={Mail}
              error={errors.contactEmail}
              helperText="Official university correspondence email."
            />
          </div>
        </div>

        {/* Section 3: Operating Schedule */}
        <div style={{ marginBottom: '28px' }}>
          <h3 style={{
            fontSize: '15px',
            fontWeight: 600,
            color: 'var(--text-primary)',
            paddingBottom: '12px',
            borderBottom: '1px solid var(--border-color)',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <ShieldCheck size={16} style={{ color: 'var(--color-accent)' }} />
            Operating Schedule & Order Settings
          </h3>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '20px',
            marginBottom: '16px'
          }}>
            <TimeInput
              label="Opening Time"
              name="openingTime"
              value={formData.openingTime}
              onChange={handleChange}
              required
              error={errors.openingTime}
              helperText="Time when outlet opens for kitchen prep/service."
            />

            <TimeInput
              label="Closing Time"
              name="closingTime"
              value={formData.closingTime}
              onChange={handleChange}
              required
              error={errors.closingTime}
              helperText="Time when daily counter operations cease."
            />

            <FormSelect
              label="Operational Status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              options={[
                { value: 'Active', label: 'Active (Open for institutional operations)' },
                { value: 'Inactive', label: 'Inactive (Temporarily suspended / closed)' }
              ]}
              required
              error={errors.status}
            />
          </div>

          <WorkingDaysSelector
            label="Working Days of Operation"
            value={formData.workingDays}
            onChange={handleWorkingDaysChange}
            required
            error={errors.workingDays}
            helperText="Select which days this outlet is open for student and faculty service."
          />

          {/* Order Acceptance Availability Toggle (SRS 3.1 & 75) */}
          <div style={{
            marginTop: '20px',
            padding: '16px',
            backgroundColor: 'var(--bg-app)',
            borderRadius: 'var(--border-radius-md)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            flexWrap: 'wrap'
          }}>
            <div>
              <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Order Acceptance Availability (SRS §3.1)
              </div>
              <div style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Allow students, faculty, and staff to place new online orders during active operating hours.
              </div>
            </div>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                name="isOrderAcceptanceEnabled"
                checked={formData.isOrderAcceptanceEnabled}
                onChange={handleChange}
                style={{ width: '18px', height: '18px', accentColor: 'var(--color-accent)', cursor: 'pointer' }}
              />
              <span style={{ fontSize: '13px', fontWeight: 600, color: formData.isOrderAcceptanceEnabled ? 'var(--color-success-text)' : 'var(--text-muted)' }}>
                {formData.isOrderAcceptanceEnabled ? 'Accepting Orders' : 'Orders Suspended'}
              </span>
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: '12px',
          paddingTop: '20px',
          borderTop: '1px solid var(--border-color)'
        }}>
          <Button
            variant="secondary"
            onClick={() => navigate(initialValues?.id ? `/canteen/${initialValues.id}` : '/canteen')}
            icon={X}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            icon={Save}
            loading={isSubmitting}
          >
            {isEdit ? 'Update Canteen' : 'Save Canteen'}
          </Button>
        </div>
      </div>
    </form>
  );
};
