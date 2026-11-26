import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, X, ChevronDown, PlusCircle, Check, Package, AlertCircle } from 'lucide-react';

/**
 * Searchable Ingredient Dropdown
 * Displays existing Canteen Staff Kitchen Inventory items and allows requesting new items.
 */
export const SearchableIngredientSelect = ({
  value = '',
  onSelect,
  kitchenStock = [],
  disabled = false,
  placeholder = 'Search kitchen ingredient...'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      setSearchTerm(value || '');
    }
  }, [value, isOpen]);

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

  const filteredList = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return kitchenItems;
    return kitchenItems.filter((item) => {
      const name = item.itemName.toLowerCase();
      const cat = item.category.toLowerCase();
      const code = (item.itemCode || '').toLowerCase();
      return name.includes(q) || cat.includes(q) || code.includes(q);
    });
  }, [kitchenItems, searchTerm]);

  const hasExactMatch = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return false;
    return kitchenItems.some((item) => item.itemName.trim().toLowerCase() === q);
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
          height: '38px',
          padding: '0 12px',
          borderRadius: 'var(--border-radius-md)',
          border: isOpen ? '1px solid var(--color-accent)' : '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-app)',
          cursor: disabled ? 'not-allowed' : 'text',
          transition: 'border-color var(--transition-fast)'
        }}
      >
        <Search size={15} style={{ color: isOpen ? 'var(--color-accent)' : 'var(--text-muted)', flexShrink: 0 }} />

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
              justifyContent: 'center'
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

      {isOpen && !disabled && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            backgroundColor: 'var(--modal-bg)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--border-radius-md)',
            boxShadow: 'var(--shadow-modal)',
            maxHeight: '260px',
            overflowY: 'auto',
            zIndex: 1100
          }}
        >
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

          {filteredList.length > 0 && (
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
                      borderBottom: '1px solid var(--border-color-subtle)',
                      backgroundColor: isSelected ? 'var(--color-primary-light)' : 'transparent'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                      <Package size={14} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {item.itemName}
                        </span>
                        <span style={{
                          fontSize: '10.5px',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          backgroundColor: 'var(--bg-muted)',
                          color: 'var(--text-muted)',
                          border: '1px solid var(--border-color)'
                        }}>
                          {item.category}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 600,
                          padding: '2px 7px',
                          borderRadius: 'var(--border-radius-full)',
                          backgroundColor: item.availableQuantity === 0
                            ? 'var(--bg-muted)'
                            : isLow
                              ? 'var(--color-danger-bg)'
                              : 'var(--color-success-bg)',
                          color: item.availableQuantity === 0
                            ? 'var(--text-muted)'
                            : isLow
                              ? 'var(--color-danger-text)'
                              : 'var(--color-success-text)',
                          border: `1px solid ${
                            item.availableQuantity === 0
                              ? 'var(--border-color)'
                              : isLow
                                ? 'var(--color-danger-border)'
                                : 'var(--color-success-border)'
                          }`
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
          )}

          {searchTerm.trim() && !hasExactMatch && (
            <div
              onClick={() => handleSelectCustom(searchTerm)}
              style={{
                padding: '11px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                cursor: 'pointer',
                backgroundColor: 'var(--color-primary-light)',
                borderTop: filteredList.length > 0 ? '1px dashed var(--border-color)' : 'none'
              }}
            >
              <PlusCircle size={18} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-primary)' }}>
                  Request New Item: {searchTerm.trim()}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Not in your kitchen inventory yet. Central Admin will review, source, and dispatch it.
                </span>
              </div>
            </div>
          )}

          {filteredList.length === 0 && !searchTerm.trim() && (
            <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12.5px' }}>
              <AlertCircle size={18} style={{ margin: '0 auto 6px', display: 'block', opacity: 0.7 }} />
              No items in kitchen inventory. Type an ingredient name to request a new item from Admin.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchableIngredientSelect;
