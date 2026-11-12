import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Camera, Upload, Sparkles } from 'lucide-react';
import { Button } from '../../../../components/common/Button';
import { ALLERGENS, FOOD_TYPES } from '../../../../constants/appConstants';
import { canteenService } from '../../outlets/services/canteenService';
import { categoryService } from '../../categories/services/categoryService';

export const MenuModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  loading = false,
  title = 'Add Menu Item'
}) => {
  const [outlets, setOutlets] = useState([]);
  const [categories, setCategories] = useState([]);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    category: 'Main Course',
    categoryId: 1,
    outletId: 1,
    foodType: FOOD_TYPES.VEG,
    price: '',
    dailyCapacity: '',
    servingSize: '',
    calories: '',
    imageUrl: '',
    allergens: [],
    publicationStatus: 'Published',
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    startTime: '11:00',
    endTime: '16:00',
    variants: [],
    addOns: []
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      canteenService.getAll().catch(() => []),
      categoryService.getAll().catch(() => [])
    ]).then(([outletsData, categoriesData]) => {
      if (isMounted) {
        if (Array.isArray(outletsData) && outletsData.length > 0) {
          setOutlets(outletsData);
        }
        if (Array.isArray(categoriesData) && categoriesData.length > 0) {
          setCategories(categoriesData);
        }
      }
    });
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        code: initialData.code || '',
        description: initialData.description || '',
        category: initialData.category || 'Main Course',
        categoryId: Number(initialData.categoryId) || 1,
        outletId: Number(initialData.outletId) || 1,
        foodType: initialData.foodType || FOOD_TYPES.VEG,
        price: initialData.price || '',
        dailyCapacity: initialData.dailyCapacity || '',
        servingSize: initialData.servingSize || '',
        calories: initialData.calories || '',
        imageUrl: initialData.imageUrl || '',
        allergens: initialData.allergens || [],
        publicationStatus: initialData.publicationStatus || 'Published',
        workingDays: initialData.workingDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        startTime: initialData.startTime || '11:00',
        endTime: initialData.endTime || '16:00',
        variants: initialData.variants || [],
        addOns: initialData.addOns || []
      });
    } else {
      setFormData({
        name: '',
        code: '',
        description: '',
        category: 'Main Course',
        categoryId: 1,
        outletId: 1,
        foodType: FOOD_TYPES.VEG,
        price: '',
        dailyCapacity: '',
        servingSize: '',
        calories: '',
        imageUrl: '',
        allergens: [],
        publicationStatus: 'Published',
        workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        startTime: '11:00',
        endTime: '16:00',
        variants: [],
        addOns: []
      });
    }
    setErrors({});
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleImageUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, imageUrl: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Item name is required.';
    if (!formData.price || Number(formData.price) <= 0) errs.price = 'Price must be a positive amount.';
    if (!formData.dailyCapacity || Number(formData.dailyCapacity) <= 0) errs.dailyCapacity = 'Daily capacity must be greater than zero.';
    if (!formData.description.trim()) errs.description = 'Description is required before publishing.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const numericOutletId = Number(formData.outletId) || (outlets[0]?.outletId ?? 1);
    const matchedCategory = categories.find(c => c.name === formData.category || c.id === formData.categoryId);
    const numericCategoryId = Number(formData.categoryId) || (matchedCategory?.id || matchedCategory?.categoryId || 1);

    onSubmit({
      ...formData,
      outletId: numericOutletId,
      categoryId: numericCategoryId,
      price: Number(formData.price),
      dailyCapacity: Number(formData.dailyCapacity) || 100,
      code: formData.code?.trim() || `MI-${Date.now().toString().slice(-4)}`
    });
  };

  const handleAllergenToggle = (allergen) => {
    setFormData(prev => ({
      ...prev,
      allergens: prev.allergens.includes(allergen)
        ? prev.allergens.filter(a => a !== allergen)
        : [...prev.allergens, allergen]
    }));
  };

  const handleAddVariant = () => {
    setFormData(prev => ({
      ...prev,
      variants: [...prev.variants, { id: `v-${Date.now()}`, name: '', price: '' }]
    }));
  };

  const handleRemoveVariant = (idx) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== idx)
    }));
  };

  const handleVariantChange = (idx, field, val) => {
    setFormData(prev => {
      const updated = [...prev.variants];
      updated[idx] = { ...updated[idx], [field]: val };
      return { ...prev, variants: updated };
    });
  };

  const handleAddAddOn = () => {
    setFormData(prev => ({
      ...prev,
      addOns: [...prev.addOns, { id: `a-${Date.now()}`, name: '', price: '' }]
    }));
  };

  const handleRemoveAddOn = (idx) => {
    setFormData(prev => ({
      ...prev,
      addOns: prev.addOns.filter((_, i) => i !== idx)
    }));
  };

  const handleAddOnChange = (idx, field, val) => {
    setFormData(prev => {
      const updated = [...prev.addOns];
      updated[idx] = { ...updated[idx], [field]: val };
      return { ...prev, addOns: updated };
    });
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 60,
      padding: '16px'
    }}>
      <div style={{
        backgroundColor: 'var(--modal-bg)',
        color: 'var(--text-primary)',
        borderRadius: 'var(--border-radius-xl)',
        maxWidth: '760px',
        width: '100%',
        maxHeight: '92vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: 'var(--shadow-modal)',
        border: '1px solid var(--border-color)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 24px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'var(--modal-bg)'
        }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
              {title}
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
              Configure dish specification, dietary allergens, dish photo, pricing and daily kitchen quotas.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: 'var(--border-radius-sm)'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} style={{ overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Row 1: Item Name, Code & Food Type */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '4px', color: 'var(--text-primary)' }}>
                Item Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Paneer Butter Masala Combo"
                style={{
                  width: '100%',
                  height: '36px',
                  padding: '0 10px',
                  fontSize: '13px',
                  backgroundColor: 'var(--bg-surface)',
                  color: 'var(--text-primary)',
                  border: `1px solid ${errors.name ? 'var(--color-danger)' : 'var(--border-color)'}`,
                  borderRadius: 'var(--border-radius-md)'
                }}
              />
              {errors.name && <span style={{ fontSize: '11px', color: 'var(--color-danger)' }}>{errors.name}</span>}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '4px', color: 'var(--text-primary)' }}>
                Item Code (SKU)
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="e.g. PBM-01"
                style={{
                  width: '100%',
                  height: '36px',
                  padding: '0 10px',
                  fontSize: '13px',
                  backgroundColor: 'var(--bg-surface)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--border-radius-md)'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '4px', color: 'var(--text-primary)' }}>
                Food Type *
              </label>
              <select
                value={formData.foodType}
                onChange={(e) => setFormData({ ...formData, foodType: e.target.value })}
                style={{
                  width: '100%',
                  height: '36px',
                  padding: '0 10px',
                  fontSize: '13px',
                  backgroundColor: 'var(--bg-surface)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--border-radius-md)'
                }}
              >
                <option value={FOOD_TYPES.VEG}>Pure Veg (Green)</option>
                <option value={FOOD_TYPES.NON_VEG}>Non-veg (Red)</option>
                <option value={FOOD_TYPES.EGG}>Egg (Amber)</option>
              </select>
            </div>
          </div>

          {/* Row 2: Category, Outlet & Base Price */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '4px', color: 'var(--text-primary)' }}>
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => {
                  const selectedName = e.target.value;
                  const foundCat = categories.find(c => c.name === selectedName);
                  setFormData({
                    ...formData,
                    category: selectedName,
                    categoryId: foundCat?.id || foundCat?.categoryId || 1
                  });
                }}
                style={{
                  width: '100%',
                  height: '36px',
                  padding: '0 10px',
                  fontSize: '13px',
                  backgroundColor: 'var(--bg-surface)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--border-radius-md)'
                }}
              >
                {categories.length > 0 ? (
                  categories.map(c => (
                    <option key={c.id || c.categoryId} value={c.name}>
                      {c.name}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="Main Course">Main Course</option>
                    <option value="Meals & Thalis">Meals & Thalis</option>
                    <option value="Snacks & Quick Bites">Snacks & Quick Bites</option>
                    <option value="Beverages">Beverages</option>
                    <option value="Desserts">Desserts</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '4px', color: 'var(--text-primary)' }}>
                Campus Outlet *
              </label>
              <select
                value={formData.outletId}
                onChange={(e) => setFormData({ ...formData, outletId: Number(e.target.value) || 1 })}
                style={{
                  width: '100%',
                  height: '36px',
                  padding: '0 10px',
                  fontSize: '13px',
                  backgroundColor: 'var(--bg-surface)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--border-radius-md)'
                }}
              >
                {outlets.length > 0 ? (
                  outlets.map(out => (
                    <option key={out.outletId || out.id} value={out.outletId || out.id}>
                      {out.name} ({out.code || 'MC'})
                    </option>
                  ))
                ) : (
                  <option value={1}>Main Canteen (MC-01)</option>
                )}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '4px', color: 'var(--text-primary)' }}>
                Base Price (₹) *
              </label>
              <input
                type="number"
                step="0.5"
                min="1"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="120.00"
                style={{
                  width: '100%',
                  height: '36px',
                  padding: '0 10px',
                  fontSize: '13px',
                  backgroundColor: 'var(--bg-surface)',
                  color: 'var(--text-primary)',
                  border: `1px solid ${errors.price ? 'var(--color-danger)' : 'var(--border-color)'}`,
                  borderRadius: 'var(--border-radius-md)'
                }}
              />
              {errors.price && <span style={{ fontSize: '11px', color: 'var(--color-danger)' }}>{errors.price}</span>}
            </div>
          </div>

          {/* Dish Photo Capture & Upload Field */}
          <div style={{
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--border-radius-lg)',
            padding: '14px 16px',
            backgroundColor: 'var(--bg-app)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                  Dish Photo *
                </label>
                <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                  Take a photo using camera or upload image (displays small in menu table & medium in user item details)
                </span>
              </div>

              {formData.imageUrl && (
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, imageUrl: '' })}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '11.5px',
                    color: 'var(--color-danger)',
                    fontWeight: 600,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <Trash2 size={13} />
                  <span>Remove Photo</span>
                </button>
              )}
            </div>

            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
              {/* Photo Preview Thumbnail */}
              <div style={{
                width: '140px',
                height: '110px',
                borderRadius: 'var(--border-radius-md)',
                border: '2px dashed var(--border-color)',
                backgroundColor: 'var(--bg-surface)',
                overflow: 'hidden',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                {formData.imageUrl ? (
                  <img
                    src={formData.imageUrl}
                    alt="Dish Preview"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: 'var(--text-muted)', textAlign: 'center', padding: '6px' }}>
                    <Camera size={26} style={{ opacity: 0.6 }} />
                    <span style={{ fontSize: '11px', fontWeight: 500 }}>No photo selected</span>
                  </div>
                )}
              </div>

              {/* Photo Input Controls */}
              <div style={{ flex: 1, minWidth: '240px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <label
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '7px 14px',
                      borderRadius: 'var(--border-radius-md)',
                      backgroundColor: 'var(--color-accent)',
                      color: '#ffffff',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      boxShadow: 'var(--shadow-xs)'
                    }}
                  >
                    <Camera size={14} />
                    <span>Take / Choose Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleImageUpload}
                      style={{ display: 'none' }}
                    />
                  </label>

                  <label
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '7px 14px',
                      borderRadius: 'var(--border-radius-md)',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--bg-surface)',
                      color: 'var(--text-primary)',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    <Upload size={14} />
                    <span>Upload File</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>

                {/* Direct image URL input */}
                <input
                  type="url"
                  placeholder="Or paste dish image URL (https://...)"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  style={{
                    width: '100%',
                    height: '32px',
                    padding: '0 10px',
                    fontSize: '12px',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--border-radius-sm)',
                    backgroundColor: 'var(--bg-surface)',
                    color: 'var(--text-primary)'
                  }}
                />

                {/* Quick preset dish photo chips */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginTop: '2px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <Sparkles size={11} /> Presets:
                  </span>
                  {[
                    { label: '🍛 Thali', url: 'https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?auto=format&fit=crop&w=600&q=80' },
                    { label: '🍲 Biryani', url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80' },
                    { label: '🥪 Sandwich', url: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=600&q=80' },
                    { label: '🧀 Paneer', url: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=600&q=80' },
                    { label: '🥤 Drink', url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80' }
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setFormData({ ...formData, imageUrl: preset.url })}
                      style={{
                        padding: '2px 8px',
                        fontSize: '11px',
                        borderRadius: 'var(--border-radius-full)',
                        border: '1px solid var(--border-color)',
                        backgroundColor: formData.imageUrl === preset.url ? 'var(--color-primary-light)' : 'var(--bg-surface)',
                        color: formData.imageUrl === preset.url ? 'var(--color-primary)' : 'var(--text-secondary)',
                        cursor: 'pointer'
                      }}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '4px', color: 'var(--text-primary)' }}>
              Food Description & Recipe Details *
            </label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Provide a clear culinary description for students and faculty..."
              style={{
                width: '100%',
                padding: '8px 10px',
                fontSize: '13px',
                backgroundColor: 'var(--bg-surface)',
                color: 'var(--text-primary)',
                border: `1px solid ${errors.description ? 'var(--color-danger)' : 'var(--border-color)'}`,
                borderRadius: 'var(--border-radius-md)'
              }}
            />
            {errors.description && <span style={{ fontSize: '11px', color: 'var(--color-danger)' }}>{errors.description}</span>}
          </div>

          {/* Row 3: Daily Capacity, Serving Size, Calories */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '4px', color: 'var(--text-primary)' }}>
                Daily Kitchen Capacity (Portions) *
              </label>
              <input
                type="number"
                min="1"
                value={formData.dailyCapacity}
                onChange={(e) => setFormData({ ...formData, dailyCapacity: e.target.value })}
                placeholder="100"
                style={{
                  width: '100%',
                  height: '36px',
                  padding: '0 10px',
                  fontSize: '13px',
                  backgroundColor: 'var(--bg-surface)',
                  color: 'var(--text-primary)',
                  border: `1px solid ${errors.dailyCapacity ? 'var(--color-danger)' : 'var(--border-color)'}`,
                  borderRadius: 'var(--border-radius-md)'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '4px', color: 'var(--text-primary)' }}>
                Portion / Serving Size
              </label>
              <input
                type="text"
                value={formData.servingSize}
                onChange={(e) => setFormData({ ...formData, servingSize: e.target.value })}
                placeholder="e.g. 1 Plate (350g)"
                style={{
                  width: '100%',
                  height: '36px',
                  padding: '0 10px',
                  fontSize: '13px',
                  backgroundColor: 'var(--bg-surface)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--border-radius-md)'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '4px', color: 'var(--text-primary)' }}>
                Caloric Value
              </label>
              <input
                type="text"
                value={formData.calories}
                onChange={(e) => setFormData({ ...formData, calories: e.target.value })}
                placeholder="e.g. 480 kcal"
                style={{
                  width: '100%',
                  height: '36px',
                  padding: '0 10px',
                  fontSize: '13px',
                  backgroundColor: 'var(--bg-surface)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--border-radius-md)'
                }}
              />
            </div>
          </div>

          {/* Allergens Multiselect */}
          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '6px', color: 'var(--text-primary)' }}>
              Allergen Disclaimers
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {ALLERGENS.map((alg) => {
                const checked = formData.allergens.includes(alg);
                return (
                  <button
                    key={alg}
                    type="button"
                    onClick={() => handleAllergenToggle(alg)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 'var(--border-radius-full)',
                      fontSize: '11.5px',
                      border: checked ? '1px solid var(--color-primary)' : '1px solid var(--border-color)',
                      backgroundColor: checked ? 'var(--color-primary-light)' : 'var(--bg-surface)',
                      color: checked ? 'var(--color-primary)' : 'var(--text-secondary)',
                      cursor: 'pointer'
                    }}
                  >
                    {alg}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Variants section */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Serving Variants (e.g. Regular, Large, Thali Combo)
              </label>
              <button
                type="button"
                onClick={handleAddVariant}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-accent)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Plus size={13} />
                <span>Add Variant</span>
              </button>
            </div>

            {formData.variants.map((v, idx) => (
              <div key={v.id || idx} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <input
                  type="text"
                  placeholder="Variant name (e.g. Regular / Large)"
                  value={v.name}
                  onChange={(e) => handleVariantChange(idx, 'name', e.target.value)}
                  style={{
                    flex: 2,
                    height: '32px',
                    padding: '0 8px',
                    fontSize: '12px',
                    backgroundColor: 'var(--bg-surface)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '4px'
                  }}
                />
                <input
                  type="number"
                  placeholder="Price (₹)"
                  value={v.price}
                  onChange={(e) => handleVariantChange(idx, 'price', Number(e.target.value))}
                  style={{
                    flex: 1,
                    height: '32px',
                    padding: '0 8px',
                    fontSize: '12px',
                    backgroundColor: 'var(--bg-surface)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '4px'
                  }}
                />
                <button
                  type="button"
                  onClick={() => handleRemoveVariant(idx)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-danger)',
                    cursor: 'pointer',
                    padding: '4px'
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          {/* Add-ons section */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Add-ons & Extras (e.g. Extra Cheese, Butter Naan, Dip)
              </label>
              <button
                type="button"
                onClick={handleAddAddOn}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-accent)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Plus size={13} />
                <span>Add Extra</span>
              </button>
            </div>

            {formData.addOns.map((a, idx) => (
              <div key={a.id || idx} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <input
                  type="text"
                  placeholder="Add-on item name"
                  value={a.name}
                  onChange={(e) => handleAddOnChange(idx, 'name', e.target.value)}
                  style={{
                    flex: 2,
                    height: '32px',
                    padding: '0 8px',
                    fontSize: '12px',
                    backgroundColor: 'var(--bg-surface)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '4px'
                  }}
                />
                <input
                  type="number"
                  placeholder="Price (₹)"
                  value={a.price}
                  onChange={(e) => handleAddOnChange(idx, 'price', Number(e.target.value))}
                  style={{
                    flex: 1,
                    height: '32px',
                    padding: '0 8px',
                    fontSize: '12px',
                    backgroundColor: 'var(--bg-surface)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '4px'
                  }}
                />
                <button
                  type="button"
                  onClick={() => handleRemoveAddOn(idx)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-danger)',
                    cursor: 'pointer',
                    padding: '4px'
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          {/* Schedule & Publication */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '4px', color: 'var(--text-primary)' }}>
                Serving Window Start
              </label>
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                style={{
                  width: '100%',
                  height: '36px',
                  padding: '0 8px',
                  fontSize: '13px',
                  backgroundColor: 'var(--bg-surface)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--border-radius-md)'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '4px', color: 'var(--text-primary)' }}>
                Serving Window End
              </label>
              <input
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                style={{
                  width: '100%',
                  height: '36px',
                  padding: '0 8px',
                  fontSize: '13px',
                  backgroundColor: 'var(--bg-surface)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--border-radius-md)'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, marginBottom: '4px', color: 'var(--text-primary)' }}>
                Publication Status
              </label>
              <select
                value={formData.publicationStatus}
                onChange={(e) => setFormData({ ...formData, publicationStatus: e.target.value })}
                style={{
                  width: '100%',
                  height: '36px',
                  padding: '0 10px',
                  fontSize: '13px',
                  backgroundColor: 'var(--bg-surface)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--border-radius-md)'
                }}
              >
                <option value="Published">Published (Live for Orders)</option>
                <option value="Draft">Draft (Hidden from Students)</option>
              </select>
            </div>
          </div>

          {/* Footer actions */}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            marginTop: '12px',
            paddingTop: '16px',
            borderTop: '1px solid var(--border-color)'
          }}>
            <Button variant="secondary" onClick={onClose} type="button" disabled={loading}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={loading}>
              {initialData ? 'Save Changes' : 'Create Menu Item'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MenuModal;
