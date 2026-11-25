import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FormInput } from '../../../../components/forms/FormInput';
import { FormSelect } from '../../../../components/forms/FormSelect';
import { TimeInput } from '../../../../components/forms/TimeInput';
import { WorkingDaysSelector } from '../../../../components/forms/WorkingDaysSelector';
import { Button } from '../../../../components/common/Button';
import { CAMPUSES } from '../constants/canteenConstants';
import { useCanteens } from '../hooks/useCanteens';
import { validateCanteenForm } from '../utils/canteenValidators';
import { Save, Building, MapPin, Phone, Mail, Hash, ShieldCheck, Clock, FileCheck, Users } from 'lucide-react';

const EMPTY_INITIAL_VALUES = {};

const BASE_CHEF_OPTIONS = [
  { value: 'Ravi (Kitchen & Counter Staff)', label: 'Ravi (Kitchen & Counter Staff)' },
  { value: 'Chef Ramesh (Head Chef)', label: 'Chef Ramesh (Head Chef)' },
  { value: 'Chef Ananya (Sous Chef)', label: 'Chef Ananya (Sous Chef)' },
  { value: 'Manoj Kumar (Kitchen Head)', label: 'Manoj Kumar (Kitchen Head)' },
  { value: 'Ganesh Pillai (Lead Cook)', label: 'Ganesh Pillai (Lead Cook)' },
  { value: 'Farhan Ali (Dietary Chef)', label: 'Farhan Ali (Dietary Chef)' },
  { value: 'Pooja Iyer (Kitchen Assistant)', label: 'Pooja Iyer (Kitchen Assistant)' },
  { value: 'Vikram (Kitchen Attendant)', label: 'Vikram (Kitchen Attendant)' }
];

const BASE_CASHIER_OPTIONS = [
  { value: 'Rahul Verma (Cashier)', label: 'Rahul Verma (Cashier)' },
  { value: 'Sunita Sharma (Billing Cashier)', label: 'Sunita Sharma (Billing Cashier)' },
  { value: 'Arjun Nair (Barista & Cashier)', label: 'Arjun Nair (Barista & Cashier)' },
  { value: 'Suman Roy (Cashier & Counter Staff)', label: 'Suman Roy (Cashier & Counter Staff)' },
  { value: 'Deepak Varma (Counter Dispenser)', label: 'Deepak Varma (Counter Dispenser)' },
  { value: 'Pooja Sharma (Counter Cashier)', label: 'Pooja Sharma (Counter Cashier)' },
  { value: 'Sunil Kumar (Billing Cashier)', label: 'Sunil Kumar (Billing Cashier)' }
];

export const CanteenForm = ({
  initialValues = EMPTY_INITIAL_VALUES,
  onSubmit,
  isEdit = false,
  allCanteens = []
}) => {
  const navigate = useNavigate();
  const { selectedCampus, setSelectedCampus } = useCanteens();

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    campus: selectedCampus || 'Main Campus',
    location: '',
    contactPhone: '',
    contactEmail: '',
    fssaiLicenseNumber: '',
    fssaiValidTill: '',
    assignedChef: '',
    assignedCashier: '',
    openingTime: '08:00',
    closingTime: '20:00',
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    status: 'Active',
    isOrderAcceptanceEnabled: true
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const chefOptions = React.useMemo(() => {
    const list = [...BASE_CHEF_OPTIONS];
    const cur = formData.assignedChef;
    if (cur && !list.some(o => o.value === cur)) {
      list.push({ value: cur, label: cur });
    }
    return list;
  }, [formData.assignedChef]);

  const cashierOptions = React.useMemo(() => {
    const list = [...BASE_CASHIER_OPTIONS];
    const cur = formData.assignedCashier;
    if (cur && !list.some(o => o.value === cur)) {
      list.push({ value: cur, label: cur });
    }
    return list;
  }, [formData.assignedCashier]);

  useEffect(() => {
    if (initialValues && Object.keys(initialValues).length > 0) {
      const chefFromStaff = initialValues.assignedStaff?.find(s => /chef|cook|kitchen/i.test(s.role))?.name;
      const cashierFromStaff = initialValues.assignedStaff?.find(s => /cashier|billing/i.test(s.role))?.name;

      setFormData({
        name: initialValues.name || '',
        code: initialValues.code || '',
        campus: initialValues.campus || selectedCampus || 'Main Campus',
        location: initialValues.location || '',
        contactPhone: initialValues.contactPhone || '',
        contactEmail: initialValues.contactEmail || '',
        fssaiLicenseNumber: initialValues.fssaiLicenseNumber || initialValues.fssaiLicenseNo || '',
        fssaiValidTill: initialValues.fssaiValidTill ? String(initialValues.fssaiValidTill).split('T')[0] : '',
        assignedChef: initialValues.assignedChef || initialValues.chef || chefFromStaff || '',
        assignedCashier: initialValues.assignedCashier || initialValues.cashier || cashierFromStaff || '',
        openingTime: initialValues.openingTime || '08:00',
        closingTime: initialValues.closingTime || '20:00',
        workingDays: initialValues.workingDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        status: initialValues.status || 'Active',
        isOrderAcceptanceEnabled: initialValues.isOrderAcceptanceEnabled ?? true
      });
      if (initialValues.campus && initialValues.campus !== selectedCampus) {
        setSelectedCampus(initialValues.campus);
      }
    } else if (!isEdit && selectedCampus) {
      setFormData(prev => {
        if (prev.campus === selectedCampus) return prev;
        return { ...prev, campus: selectedCampus };
      });
    }
  }, [initialValues, isEdit, selectedCampus, setSelectedCampus]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    if (name === 'campus' && value) {
      setSelectedCampus(value);
    }

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

  const handleCancel = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/admin/outlets');
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        borderRadius: 'var(--border-radius-lg)',
        border: '1px solid var(--border-color)',
        padding: '16px 20px',
        boxShadow: 'var(--shadow-xs)'
      }}>
        {/* Section 1: Basic Information */}
        <div style={{ marginBottom: '14px' }}>
          <h3 style={{
            fontSize: '13.5px',
            fontWeight: 600,
            color: 'var(--text-primary)',
            paddingBottom: '6px',
            borderBottom: '1px solid var(--border-color)',
            marginBottom: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Building size={16} style={{ color: 'var(--color-accent)' }} />
            Outlet Identity & Location
          </h3>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '10px 14px'
          }}>
            <FormInput
              label="Canteen / Outlet Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Central University Food Court"
              required
              error={errors.name}
              style={{ marginBottom: 0 }}
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
              style={{ marginBottom: 0 }}
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
              style={{ marginBottom: 0 }}
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
              style={{ marginBottom: 0 }}
            />
          </div>
        </div>

        {/* Section 2: Contact Information */}
        <div style={{ marginBottom: '14px' }}>
          <h3 style={{
            fontSize: '13.5px',
            fontWeight: 600,
            color: 'var(--text-primary)',
            paddingBottom: '6px',
            borderBottom: '1px solid var(--border-color)',
            marginBottom: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Phone size={16} style={{ color: 'var(--color-accent)' }} />
            Contact & Communications
          </h3>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '10px 14px'
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
              style={{ marginBottom: 0 }}
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
              style={{ marginBottom: 0 }}
            />
          </div>
        </div>

        {/* Section 3: FSSAI & Regulatory Standards */}
        <div style={{ marginBottom: '14px' }}>
          <h3 style={{
            fontSize: '13.5px',
            fontWeight: 600,
            color: 'var(--text-primary)',
            paddingBottom: '6px',
            borderBottom: '1px solid var(--border-color)',
            marginBottom: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <ShieldCheck size={16} style={{ color: 'var(--color-accent)' }} />
            FSSAI & Regulatory Standards
          </h3>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '10px 14px'
          }}>
            <FormInput
              label="FSSAI License Number"
              name="fssaiLicenseNumber"
              value={formData.fssaiLicenseNumber}
              onChange={handleChange}
              placeholder="e.g. 10022044000123"
              prefixIcon={FileCheck}
              error={errors.fssaiLicenseNumber}
              style={{ marginBottom: 0 }}
            />

            <FormInput
              label="FSSAI License Valid Till"
              name="fssaiValidTill"
              type="date"
              value={formData.fssaiValidTill}
              onChange={handleChange}
              error={errors.fssaiValidTill}
              style={{ marginBottom: 0 }}
            />
          </div>
        </div>

        {/* Section 4: Staff & Personnel Assignment */}
        <div style={{ marginBottom: '14px' }}>
          <h3 style={{
            fontSize: '13.5px',
            fontWeight: 600,
            color: 'var(--text-primary)',
            paddingBottom: '6px',
            borderBottom: '1px solid var(--border-color)',
            marginBottom: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Users size={16} style={{ color: 'var(--color-accent)' }} />
            Staff & Personnel Assignment
          </h3>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '10px 14px'
          }}>
            <FormSelect
              label="Assign Chef"
              name="assignedChef"
              value={formData.assignedChef}
              onChange={handleChange}
              options={chefOptions}
              placeholder="Select or Assign Chef (Optional)..."
              style={{ marginBottom: 0 }}
            />

            <FormSelect
              label="Assign Cashier"
              name="assignedCashier"
              value={formData.assignedCashier}
              onChange={handleChange}
              options={cashierOptions}
              placeholder="Select or Assign Cashier (Optional)..."
              style={{ marginBottom: 0 }}
            />
          </div>
        </div>

        {/* Section 5: Operating Schedule & Order Settings */}
        <div style={{ marginBottom: '14px' }}>
          <h3 style={{
            fontSize: '13.5px',
            fontWeight: 600,
            color: 'var(--text-primary)',
            paddingBottom: '6px',
            borderBottom: '1px solid var(--border-color)',
            marginBottom: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Clock size={16} style={{ color: 'var(--color-accent)' }} />
            Operating Schedule & Order Settings
          </h3>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '10px 14px',
            marginBottom: '10px'
          }}>
            <TimeInput
              label="Opening Time"
              name="openingTime"
              value={formData.openingTime}
              onChange={handleChange}
              required
              error={errors.openingTime}
              style={{ marginBottom: 0 }}
            />

            <TimeInput
              label="Closing Time"
              name="closingTime"
              value={formData.closingTime}
              onChange={handleChange}
              required
              error={errors.closingTime}
              style={{ marginBottom: 0 }}
            />

            <FormSelect
              label="Operational Status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              options={[
                { value: 'Active', label: 'Active' },
                { value: 'Inactive', label: 'Inactive' }
              ]}
              required
              error={errors.status}
              style={{ marginBottom: 0 }}
            />
          </div>

          <WorkingDaysSelector
            label="Working Days of Operation"
            value={formData.workingDays}
            onChange={handleWorkingDaysChange}
            required
            error={errors.workingDays}
            style={{ marginBottom: 0 }}
          />

          {/* Order Acceptance Availability Toggle */}
          <div style={{
            marginTop: '10px',
            padding: '10px 14px',
            backgroundColor: 'var(--bg-app)',
            borderRadius: 'var(--border-radius-md)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            flexWrap: 'wrap'
          }}>
            <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
              Order Acceptance Availability
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
          paddingTop: '12px',
          borderTop: '1px solid var(--border-color)'
        }}>
          <Button
            type="submit"
            variant="primary"
            icon={Save}
            loading={isSubmitting}
          >
            {isEdit ? 'Update Canteen Outlet' : 'Save Canteen Outlet'}
          </Button>
        </div>
      </div>
    </form>
  );
};
