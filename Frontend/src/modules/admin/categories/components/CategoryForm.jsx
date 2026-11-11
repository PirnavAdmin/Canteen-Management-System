import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FormInput } from '../../../../components/forms/FormInput';
import { FormSelect } from '../../../../components/forms/FormSelect';
import { FormTextarea } from '../../../../components/forms/FormTextarea';
import { Button } from '../../../../components/common/Button';
import { validateCategoryForm } from '../utils/categoryValidators';
import { Save, X, LayoutGrid, ListOrdered, ShieldAlert } from 'lucide-react';

export const CategoryForm = ({
  initialValues = {},
  onSubmit,
  isEdit = false,
  allCategories = []
}) => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    displayOrder: 1,
    status: 'Active',
    description: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialValues && Object.keys(initialValues).length > 0) {
      setFormData({
        name: initialValues.name || '',
        displayOrder: initialValues.displayOrder ?? 1,
        status: initialValues.status || 'Active',
        description: initialValues.description || ''
      });
    } else if (!isEdit && allCategories.length > 0) {
      // Auto-suggest next display order
      const nextOrder = Math.max(...allCategories.map(c => c.displayOrder || 0), 0) + 1;
      setFormData(prev => ({ ...prev, displayOrder: nextOrder }));
    }
  }, [initialValues, isEdit, allCategories]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validation = validateCategoryForm(formData, allCategories, initialValues?.id);

    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit(formData);
    } catch (err) {
      console.error('Submission error:', err);
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
        {/* Institutional Safeguard Banner */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
          padding: '14px 16px',
          backgroundColor: 'var(--color-primary-light)',
          border: '1px solid var(--color-primary-border)',
          borderRadius: 'var(--border-radius-md)',
          marginBottom: '24px'
        }}>
          <ShieldAlert size={18} style={{ color: 'var(--color-primary)', marginTop: '2px', flexShrink: 0 }} />
          <div style={{ fontSize: '12.5px', color: 'var(--color-primary)', lineHeight: 1.4 }}>
            <strong>Institutional Integrity Policy (SRS §3.2 & §6.2):</strong> Food categories establish master classifications across SMS/CMS dining schedules. Categories with active or historical item/order dependencies must not be permanently deleted. Use deactivation to retire categories without breaking financial audit trails.
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '20px'
        }}>
          <FormInput
            label="Category Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g. Breakfast & Morning Tiffin"
            required
            prefixIcon={LayoutGrid}
            error={errors.name}
            helperText="Clear label visible on digital and printed dining menus."
          />

          <FormInput
            label="Display Order (Rank)"
            name="displayOrder"
            type="number"
            min="1"
            max="999"
            value={formData.displayOrder}
            onChange={handleChange}
            placeholder="1"
            required
            prefixIcon={ListOrdered}
            error={errors.displayOrder}
            helperText="Sort position on menu browsing screens (1 appears first)."
          />

          <FormSelect
            label="Category Status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            options={[
              { value: 'Active', label: 'Active (Available for item assignment & display)' },
              { value: 'Inactive', label: 'Inactive (Hidden from daily menu scheduling)' }
            ]}
            required
            error={errors.status}
            helperText="Inactive categories cannot receive new food item mappings."
          />
        </div>

        <div style={{ marginTop: '16px' }}>
          <FormTextarea
            label="Category Description & Operating Notes"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            placeholder="e.g. Fresh morning South/North Indian specials, served 07:30 to 11:30 AM..."
            error={errors.description}
            helperText="Optional descriptive notes for kitchen and customer reference (max 250 characters)."
          />
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: '12px',
          paddingTop: '20px',
          borderTop: '1px solid var(--border-color)',
          marginTop: '12px'
        }}>
          <Button
            variant="secondary"
            onClick={() => navigate(initialValues?.id ? `/categories/${initialValues.id}` : '/categories')}
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
            {isEdit ? 'Update Category' : 'Save Category'}
          </Button>
        </div>
      </div>
    </form>
  );
};
