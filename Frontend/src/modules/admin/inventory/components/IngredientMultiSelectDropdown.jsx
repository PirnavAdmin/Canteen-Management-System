import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, Check, X, Plus } from 'lucide-react';

export const DEFAULT_BASIC_INGREDIENTS = [
  'Dairy Products',
  'Full Cream Milk',
  'Fresh Paneer',
  'Butter & Cheese',
  'Cooking Oils & Ghee',
  'Basmati Rice',
  'Wheat Flour & Atta',
  'Pulses & Dals',
  'Fresh Vegetables',
  'Onions & Potatoes',
  'Tomatoes',
  'Spices & Masalas',
  'Tea Powder & Coffee Beans',
  'Sugar & Sweeteners',
  'Bakery Buns & Bread',
  'Fresh Farm Eggs',
  'Poultry Meat',
  'Sauces & Condiments',
  'Beverages & Syrups',
  'Dry Fruits & Nuts'
];

/**
 * Multi-Select Searchable Dropdown matching the reference design.
 * Shows max 5 items visible with a slim scrollbar, includes search filtering,
 * theme-based styling, and an "Others" custom item addition flow.
 */
export const IngredientMultiSelectDropdown = ({
  options = DEFAULT_BASIC_INGREDIENTS,
  selected = [],
  onChange,
  placeholder = 'Select ingredients...',
  allowCustom = true,
  disabled = false,
  badgeColor = 'var(--color-primary, #2563eb)'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [customList, setCustomList] = useState([]);
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [customInputVal, setCustomInputVal] = useState('');

  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setIsAddingCustom(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Merge default options with any custom ingredients added or existing in selected
  const allAvailableOptions = useMemo(() => {
    const set = new Set([...options, ...customList, ...selected]);
    return Array.from(set).filter(item => item && item !== 'Others');
  }, [options, customList, selected]);

  // Filtered by search term
  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) return allAvailableOptions;
    const term = searchTerm.toLowerCase();
    return allAvailableOptions.filter(item => item.toLowerCase().includes(term));
  }, [allAvailableOptions, searchTerm]);

  const handleToggle = (item) => {
    if (disabled) return;
    const isSelected = selected.includes(item);
    const updated = isSelected
      ? selected.filter(s => s !== item)
      : [...selected, item];
    onChange?.(updated);
  };

  const handleRemove = (e, item) => {
    e.stopPropagation();
    if (disabled) return;
    onChange?.(selected.filter(s => s !== item));
  };

  const handleAddCustom = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const trimmed = customInputVal.trim();
    if (!trimmed) return;

    if (!customList.includes(trimmed)) {
      setCustomList(prev => [...prev, trimmed]);
    }
    if (!selected.includes(trimmed)) {
      onChange?.([...selected, trimmed]);
    }
    setCustomInputVal('');
    setIsAddingCustom(false);
    setSearchTerm('');
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', userSelect: 'none' }}>
      <style>{`
        .custom-dropdown-scroll::-webkit-scrollbar {
          width: 4px;
        }
        .custom-dropdown-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-dropdown-scroll::-webkit-scrollbar-thumb {
          background: var(--border-color, #cbd5e1);
          border-radius: 4px;
        }
        .custom-dropdown-scroll::-webkit-scrollbar-thumb:hover {
          background: var(--text-muted, #94a3b8);
        }
      `}</style>

      {/* Main Select Input Box (styled matching the reference image) */}
      <div
        onClick={() => {
          if (!disabled) {
            setIsOpen(prev => !prev);
            setTimeout(() => searchInputRef.current?.focus(), 50);
          }
        }}
        style={{
          minHeight: '34px',
          width: '100%',
          padding: '3px 8px',
          backgroundColor: disabled ? 'var(--bg-muted, #f8fafc)' : 'var(--bg-surface, #ffffff)',
          color: 'var(--text-primary, #1e293b)',
          border: isOpen
            ? '1.5px solid var(--color-primary, #2563eb)'
            : '1.5px solid var(--border-color, #cbd5e1)',
          borderRadius: '6px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          cursor: disabled ? 'not-allowed' : 'pointer',
          boxShadow: isOpen ? '0 0 0 3px rgba(37, 99, 235, 0.12)' : 'none',
          transition: 'all 0.18s ease',
          boxSizing: 'border-box'
        }}
      >
        {/* Search Icon on the left */}
        <Search size={14} style={{ color: 'var(--text-muted, #94a3b8)', flexShrink: 0 }} />

        {/* Selected chips and inline search */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '4px', flex: 1, minWidth: 0 }}>
          {selected.map((item) => (
            <span
              key={item}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                fontSize: '11px',
                fontWeight: 600,
                backgroundColor: 'var(--bg-muted, #eff6ff)',
                color: 'var(--color-primary, #1d4ed8)',
                border: '1px solid var(--border-color, #bfdbfe)',
                borderRadius: '4px',
                padding: '1.5px 6px',
                lineHeight: 1.3
              }}
            >
              <span>{item}</span>
              <button
                type="button"
                onClick={(e) => handleRemove(e, item)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  color: 'inherit',
                  opacity: 0.75
                }}
                title={`Remove ${item}`}
              >
                <X size={11} />
              </button>
            </span>
          ))}

          {/* Inline search input */}
          <input
            ref={searchInputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              if (!isOpen) setIsOpen(true);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
                const trimmed = searchTerm.trim();
                if (!trimmed) return;
                if (trimmed.toLowerCase() === 'others') {
                  setIsAddingCustom(true);
                  setSearchTerm('');
                  return;
                }
                if (allowCustom) {
                  if (!customList.includes(trimmed)) {
                    setCustomList(prev => [...prev, trimmed]);
                  }
                  if (!selected.includes(trimmed)) {
                    onChange?.([...selected, trimmed]);
                  }
                  setSearchTerm('');
                }
              }
            }}
            placeholder={selected.length === 0 ? placeholder : ''}
            disabled={disabled}
            style={{
              border: 'none',
              outline: 'none',
              backgroundColor: 'transparent',
              fontSize: '12px',
              color: 'var(--text-primary, #1e293b)',
              minWidth: selected.length === 0 ? '160px' : '50px',
              flex: 1,
              padding: 0
            }}
          />
        </div>

        {/* Chevron Dropdown Icon on the right */}
        <ChevronDown
          size={14}
          style={{
            color: 'var(--text-muted, #64748b)',
            transform: isOpen ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.18s ease',
            flexShrink: 0
          }}
        />
      </div>

      {/* Floating Dropdown Card (Theme-based, rounded with soft shadow matching reference 3) */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            zIndex: 9999,
            backgroundColor: 'var(--modal-bg, #ffffff)',
            color: 'var(--text-primary, #1e293b)',
            border: '1px solid var(--border-color, #e2e8f0)',
            borderRadius: '10px',
            boxShadow: '0 10px 25px -4px rgba(0, 0, 0, 0.14), 0 4px 10px -2px rgba(0, 0, 0, 0.06)',
            overflow: 'hidden'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Scrollable list showing max 5 items with slim scrollbar */}
          <div
            className="custom-dropdown-scroll"
            style={{
              maxHeight: '165px', // Exactly ~5 items compact visible height
              overflowY: 'auto',
              scrollbarWidth: 'thin'
            }}
          >
            {filteredOptions.length === 0 && !isAddingCustom && (
              <div style={{ padding: '12px 14px', textAlign: 'center' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-muted, #94a3b8)', marginBottom: allowCustom && searchTerm.trim() ? '6px' : 0 }}>
                  No matching ingredients found.
                </div>
                {allowCustom && searchTerm.trim() && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const trimmed = searchTerm.trim();
                      if (trimmed.toLowerCase() === 'others') {
                        setIsAddingCustom(true);
                        setSearchTerm('');
                        return;
                      }
                      if (!customList.includes(trimmed)) {
                        setCustomList(prev => [...prev, trimmed]);
                      }
                      if (!selected.includes(trimmed)) {
                        onChange?.([...selected, trimmed]);
                      }
                      setSearchTerm('');
                    }}
                    style={{
                      padding: '4px 10px',
                      fontSize: '11.5px',
                      fontWeight: 600,
                      color: 'var(--color-primary, #2563eb)',
                      backgroundColor: 'var(--bg-muted, #eff6ff)',
                      border: '1px solid var(--border-color, #bfdbfe)',
                      borderRadius: '5px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Plus size={12} />
                    <span>
                      {searchTerm.trim().toLowerCase() === 'others'
                        ? 'Add Custom Ingredient'
                        : `Add "${searchTerm}" as custom ingredient`}
                    </span>
                  </button>
                )}
              </div>
            )}

            {filteredOptions.map((item) => {
              const isSelected = selected.includes(item);
              return (
                <div
                  key={item}
                  onClick={() => handleToggle(item)}
                  style={{
                    padding: '7px 12px',
                    fontSize: '12px',
                    fontWeight: isSelected ? 600 : 500,
                    color: isSelected ? 'var(--color-primary, #2563eb)' : 'var(--text-primary, #1e293b)',
                    backgroundColor: isSelected ? 'var(--bg-muted, #f1f5f9)' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'background-color 0.12s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = 'var(--bg-muted, #f8fafc)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <span>{item}</span>
                  {isSelected && (
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '16px',
                        height: '16px',
                        borderRadius: '4px',
                        backgroundColor: 'var(--color-primary, #2563eb)',
                        color: '#ffffff'
                      }}
                    >
                      <Check size={12} strokeWidth={3} />
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* "Others" option to add custom ingredients */}
          {allowCustom && (
            <div style={{ borderTop: '1px solid var(--border-color, #e2e8f0)', padding: '6px 8px', backgroundColor: 'var(--bg-app, #f8fafc)' }}>
              {!isAddingCustom ? (
                <button
                  type="button"
                  onClick={() => setIsAddingCustom(true)}
                  style={{
                    width: '100%',
                    padding: '6px 10px',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: 'var(--color-primary, #2563eb)',
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    gap: '6px',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-muted, #e2e8f0)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <Plus size={14} />
                  <span>Others (Add Custom Ingredient)</span>
                </button>
              ) : (
                <div style={{ display: 'flex', gap: '6px', padding: '4px' }}>
                  <input
                    type="text"
                    value={customInputVal}
                    onChange={(e) => setCustomInputVal(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        e.stopPropagation();
                        handleAddCustom(e);
                      }
                    }}
                    placeholder="Enter custom ingredient name..."
                    autoFocus
                    style={{
                      flex: 1,
                      height: '32px',
                      padding: '0 8px',
                      fontSize: '12px',
                      border: '1px solid var(--border-color, #cbd5e1)',
                      borderRadius: '6px',
                      backgroundColor: 'var(--bg-surface, #ffffff)',
                      color: 'var(--text-primary, #1e293b)',
                      outline: 'none'
                    }}
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleAddCustom(e);
                    }}
                    disabled={!customInputVal.trim()}
                    style={{
                      padding: '0 10px',
                      fontSize: '12px',
                      fontWeight: 600,
                      backgroundColor: 'var(--color-primary, #2563eb)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: customInputVal.trim() ? 'pointer' : 'not-allowed',
                      opacity: customInputVal.trim() ? 1 : 0.6
                    }}
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsAddingCustom(false);
                      setCustomInputVal('');
                    }}
                    style={{
                      padding: '0 8px',
                      fontSize: '12px',
                      backgroundColor: 'transparent',
                      color: 'var(--text-secondary, #64748b)',
                      border: '1px solid var(--border-color, #cbd5e1)',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default IngredientMultiSelectDropdown;
