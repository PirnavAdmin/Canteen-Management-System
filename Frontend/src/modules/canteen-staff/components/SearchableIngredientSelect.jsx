import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, X, ChevronDown, PlusCircle, Check, Package, AlertCircle } from 'lucide-react';

/**
 * Searchable Ingredient Dropdown
 * Displays ONLY existing Canteen Staff Kitchen Inventory items.
 * Allows searching existing kitchen stock (even when quantity is zero).
 * Allows typing and requesting a completely new ingredient not present in kitchen inventory.
 */
export const SearchableIngredientSelect = ({
  value = '',
  onSelect,
  kitchenStock = [],
  disabled = false,
  placeholder = 'Search kitchen ingredient (e.g. Rice, Sugar, Green Chillies)...'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  // Sync internal search input when external value changes
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm(value || '');
    }
  }, [value, isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm(value || '');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [value]);

  // Items strictly from the Canteen Staff Kitchen Inventory (deduplicated by name)
  const kitchenItems = useMemo(() => {
    const map = new Map();

    (kitchenStock || []).forEach((item) => {
      const name = (item.ingredientName || item.itemName || '').trim();
      if (name) {
        const key = name.toLowerCase();
        if (!map.has(key)) {
          map.set(key, {
            id: item.id || null,
            itemName: name,
            category: item.category || 'General Kitchen Supplies',
            availableQuantity: Number(item.availableQuantity ?? 0),
            reorderLevel: Number(item.reorderLevel ?? 5),
            unit: item.unit || 'kg',
            itemCode: item.itemCode || 'ING-REQ'
          });
        }
      }
    });

    return Array.from(map.values());
  }, [kitchenStock]);

  // Filter kitchen ingredients based on search query
  const filteredList = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) {
      return kitchenItems;
    }
    return kitchenItems.filter((item) => {
      const name = item.itemName.toLowerCase();
      const cat = item.category.toLowerCase();
      const code = (item.itemCode || '').toLowerCase();
      return name.includes(q) || cat.includes(q) || code.includes(q);
    });
  }, [kitchenItems, searchTerm]);

  // Check if search query exactly matches an existing kitchen ingredient
  const hasExactMatch = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return false;
    return kitchenItems.some(
      (item) => item.itemName.trim().toLowerCase() === q
    );
  }, [kitchenItems, searchTerm]);

  const handleSelectExisting = (item) => {
    onSelect({
      id: item.id,
      itemName: item.itemName,
      itemCode: item.itemCode || 'ING-REQ',
      category: item.category || 'General Kitchen Supplies',
      unit: item.unit || 'kg',
      availableQuantity: item.availableQuantity,
      reorderLevel: item.reorderLevel,
      isCustom: false
    });
    setSearchTerm(item.itemName);
    setIsOpen(false);
  };

  const handleSelectCustom = (customName) => {
    const trimmed = (customName || searchTerm).trim();
    if (!trimmed) return;

    onSelect({
      id: null,
      itemName: trimmed,
      itemCode: 'ING-NEW-REQ',
      category: 'Groceries',
      unit: 'kg',
      availableQuantity: 0,
      reorderLevel: 5,
      isCustom: true
    });
    setSearchTerm(trimmed);
    setIsOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    setSearchTerm('');
    onSelect({
      id: null,
      itemName: '',
      itemCode: '',
      category: 'General Kitchen Supplies',
      unit: 'kg',
      availableQuantity: 0,
      reorderLevel: 5,
      isCustom: false
    });
    inputRef.current?.focus();
    setIsOpen(true);
  };

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: '100%' }}>
      {/* Search Input Box */}
      <div
        onClick={() => {
          if (!disabled) {
            setIsOpen(true);
            inputRef.current?.focus();
          }
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          width: '100%',
          padding: '8px 12px',
          borderRadius: '8px',
          border: isOpen ? '1px solid var(--color-primary)' : '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-app)',
          boxShadow: isOpen ? '0 0 0 2px rgba(14, 165, 233, 0.2)' : 'none',
          cursor: disabled ? 'not-allowed' : 'text',
          transition: 'all 0.15s ease'
        }}
      >
        <Search size={15} style={{ color: isOpen ? 'var(--color-primary)' : 'var(--text-muted)', flexShrink: 0 }} />

        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          disabled={disabled}
          placeholder={placeholder}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setIsOpen(false);
            } else if (e.key === 'Enter') {
              e.preventDefault();
              if (filteredList.length === 1 && hasExactMatch) {
                handleSelectExisting(filteredList[0]);
              } else if (!hasExactMatch && searchTerm.trim()) {
                handleSelectCustom(searchTerm);
              }
            }
          }}
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            backgroundColor: 'transparent',
            color: 'var(--text-primary)',
            fontSize: '13px',
            padding: 0
          }}
        />

        {searchTerm && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            title="Clear ingredient"
            style={{
              background: 'none',
              border: 'none',
              padding: '2px',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '4px'
            }}
          >
            <X size={14} />
          </button>
        )}

        <ChevronDown
          size={15}
          style={{
            color: 'var(--text-muted)',
            flexShrink: 0,
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.15s ease'
          }}
        />
      </div>

      {/* Dropdown Options Popover */}
      {isOpen && !disabled && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -4px rgba(0, 0, 0, 0.3)',
            maxHeight: '260px',
            overflowY: 'auto',
            zIndex: 1100,
            animation: 'fadeIn 0.12s ease'
          }}
        >
          {/* Header indicator */}
          <div
            style={{
              padding: '6px 12px',
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              color: 'var(--text-muted)',
              borderBottom: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-app)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <span>Kitchen Inventory Items ({filteredList.length})</span>
            {searchTerm && <span>Search: "{searchTerm}"</span>}
          </div>

          {/* List of Matching Kitchen Inventory Ingredients */}
          {filteredList.length > 0 ? (
            <div>
              {filteredList.map((item) => {
                const isSelected = value && item.itemName.toLowerCase() === value.toLowerCase();
                const isLow = item.availableQuantity <= item.reorderLevel;

                return (
                  <div
                    key={item.id || item.itemCode || item.itemName}
                    onClick={() => handleSelectExisting(item)}
                    style={{
                      padding: '9px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      borderBottom: '1px solid var(--border-color)',
                      backgroundColor: isSelected ? 'rgba(14, 165, 233, 0.1)' : 'transparent',
                      transition: 'background-color 0.1s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = 'var(--bg-app)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                      <Package size={14} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {item.itemName}
                          </span>
                          <span
                            style={{
                              fontSize: '10.5px',
                              padding: '1px 6px',
                              borderRadius: '4px',
                              backgroundColor: 'var(--bg-muted)',
                              color: 'var(--text-muted)',
                              border: '1px solid var(--border-color)'
                            }}
                          >
                            {item.category}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 600,
                          padding: '2px 7px',
                          borderRadius: '9999px',
                          backgroundColor: item.availableQuantity === 0
                            ? 'rgba(100, 116, 139, 0.12)'
                            : isLow
                            ? '#fef2f2'
                            : '#ecfdf5',
                          color: item.availableQuantity === 0
                            ? 'var(--text-muted)'
                            : isLow
                            ? '#dc2626'
                            : '#059669',
                          border: item.availableQuantity === 0
                            ? '1px solid var(--border-color)'
                            : isLow
                            ? '1px solid #fecaca'
                            : '1px solid #a7f3d0'
                        }}
                      >
                        In Stock: {item.availableQuantity} {item.unit}
                      </span>
                      {isSelected && <Check size={14} style={{ color: 'var(--color-primary)' }} />}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}

          {/* Option: Request New Item when not found in Kitchen Inventory or typing new name */}
          {searchTerm.trim() && !hasExactMatch && (
            <div
              onClick={() => handleSelectCustom(searchTerm)}
              style={{
                padding: '11px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                cursor: 'pointer',
                backgroundColor: filteredList.length === 0 ? 'rgba(234, 88, 12, 0.08)' : 'rgba(14, 165, 233, 0.06)',
                borderTop: filteredList.length > 0 ? '1px dashed var(--border-color)' : 'none',
                transition: 'background-color 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(234, 88, 12, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = filteredList.length === 0 ? 'rgba(234, 88, 12, 0.08)' : 'rgba(14, 165, 233, 0.06)';
              }}
            >
              <PlusCircle size={18} style={{ color: '#ea580c', flexShrink: 0 }} />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#ea580c' }}>
                  {filteredList.length === 0
                    ? `"${searchTerm.trim()}" not found in your kitchen inventory.`
                    : `Request New Item: ${searchTerm.trim()}`}
                </span>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#ea580c', marginTop: '1px' }}>
                  {filteredList.length === 0 ? `Request New Item: ${searchTerm.trim()}` : 'Click to submit a new ingredient request to Admin.'}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Item does not exist in your kitchen inventory. Central Admin will review, source, and dispatch it.
                </span>
              </div>
            </div>
          )}

          {/* Empty state when kitchen inventory has 0 items and search input is blank */}
          {filteredList.length === 0 && !searchTerm.trim() && (
            <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12.5px' }}>
              <AlertCircle size={18} style={{ margin: '0 auto 6px', display: 'block', opacity: 0.7 }} />
              No items in this kitchen inventory yet. Type an ingredient name to request a new item from Admin.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchableIngredientSelect;
