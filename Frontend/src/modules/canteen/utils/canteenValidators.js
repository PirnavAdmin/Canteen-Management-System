/**
 * Canteen form validation rules
 */

export const validateCanteenForm = (formData, existingCanteens = [], currentId = null) => {
  const errors = {};

  // Name
  if (!formData.name || !formData.name.trim()) {
    errors.name = 'Canteen Name is required.';
  } else if (formData.name.trim().length < 3) {
    errors.name = 'Canteen Name must be at least 3 characters.';
  } else if (formData.name.trim().length > 100) {
    errors.name = 'Canteen Name cannot exceed 100 characters.';
  }

  // Code
  if (!formData.code || !formData.code.trim()) {
    errors.code = 'Canteen Code is required.';
  } else {
    const codePattern = /^[A-Z0-9_-]{3,20}$/;
    const upperCode = formData.code.trim().toUpperCase();
    if (!codePattern.test(upperCode)) {
      errors.code = 'Canteen Code must be 3-20 uppercase alphanumeric characters (hyphens/underscores allowed).';
    } else {
      const isDuplicate = existingCanteens.some(
        c => c.code.toUpperCase() === upperCode && c.id !== currentId
      );
      if (isDuplicate) {
        errors.code = `Canteen Code '${upperCode}' is already in use by another outlet.`;
      }
    }
  }

  // Campus
  if (!formData.campus || !formData.campus.trim()) {
    errors.campus = 'Please select a campus for this outlet.';
  }

  // Location
  if (!formData.location || !formData.location.trim()) {
    errors.location = 'Physical location / building is required.';
  } else if (formData.location.trim().length < 3) {
    errors.location = 'Location description must be at least 3 characters.';
  }

  // Contact Phone
  if (!formData.contactPhone || !formData.contactPhone.trim()) {
    errors.contactPhone = 'Contact phone number is required.';
  } else {
    const phonePattern = /^[0-9+() -]{7,20}$/;
    if (!phonePattern.test(formData.contactPhone.trim())) {
      errors.contactPhone = 'Please provide a valid contact phone number.';
    }
  }

  // Contact Email
  if (!formData.contactEmail || !formData.contactEmail.trim()) {
    errors.contactEmail = 'Contact email address is required.';
  } else {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(formData.contactEmail.trim())) {
      errors.contactEmail = 'Please provide a valid email address.';
    }
  }

  // Opening & Closing Time
  if (!formData.openingTime) {
    errors.openingTime = 'Opening time is required.';
  }
  if (!formData.closingTime) {
    errors.closingTime = 'Closing time is required.';
  }
  if (formData.openingTime && formData.closingTime) {
    if (formData.openingTime >= formData.closingTime) {
      errors.closingTime = 'Closing time must be later than opening time.';
    }
  }

  // Working Days
  if (!formData.workingDays || !Array.isArray(formData.workingDays) || formData.workingDays.length === 0) {
    errors.workingDays = 'Please select at least one operating day.';
  }

  // Status
  if (!formData.status) {
    errors.status = 'Status is required.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

