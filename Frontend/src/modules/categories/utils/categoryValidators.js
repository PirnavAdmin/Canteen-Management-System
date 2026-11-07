/**
 * Category form validation rules
 */

export const validateCategoryForm = (formData, existingCategories = [], currentId = null) => {
  const errors = {};

  // Category Name
  if (!formData.name || !formData.name.trim()) {
    errors.name = 'Category Name is required.';
  } else if (formData.name.trim().length < 2) {
    errors.name = 'Category Name must be at least 2 characters.';
  } else if (formData.name.trim().length > 60) {
    errors.name = 'Category Name cannot exceed 60 characters.';
  } else {
    const trimmed = formData.name.trim().toLowerCase();
    const isDuplicate = existingCategories.some(
      c => c.name.trim().toLowerCase() === trimmed && c.id !== currentId
    );
    if (isDuplicate) {
      errors.name = `A category named '${formData.name.trim()}' already exists.`;
    }
  }

  // Display Order
  if (formData.displayOrder === '' || formData.displayOrder === null || formData.displayOrder === undefined) {
    errors.displayOrder = 'Display Order is required.';
  } else {
    const orderNum = Number(formData.displayOrder);
    if (!Number.isInteger(orderNum) || orderNum < 1) {
      errors.displayOrder = 'Display Order must be a positive integer (1, 2, 3...).';
    } else if (orderNum > 999) {
      errors.displayOrder = 'Display Order cannot exceed 999.';
    }
  }

  // Status
  if (!formData.status) {
    errors.status = 'Status is required.';
  }

  // Description
  if (formData.description && formData.description.length > 250) {
    errors.description = 'Description cannot exceed 250 characters.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

