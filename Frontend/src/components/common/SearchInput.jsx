import React from 'react';
import { Search, X } from 'lucide-react';

export const SearchInput = ({
  value = '',
  onChange,
  placeholder = 'Search...',
  onClear,
  style = {},
  width = '280px'
}) => {
  return (
    <div style={{
      position: 'relative',
      display: 'inline-flex',
      alignItems: 'center',
      width: width,
      maxWidth: '100%',
      ...style
    }}>
      <Search
        size={16}
        style={{
          position: 'absolute',
          left: '12px',
          color: 'var(--text-placeholder)',
          pointerEvents: 'none'
        }}
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: '8px 34px 8px 36px',
          fontSize: '13.5px',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--border-radius-md)',
          backgroundColor: 'var(--bg-surface)',
          color: 'var(--text-primary)',
          outline: 'none',
          transition: 'border-color var(--transition-fast), box-shadow var(--transition-fast)'
        }}
        onFocus={(e) => {
          e.target.style.borderColor = 'var(--color-accent)';
          e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.12)';
        }}
        onBlur={(e) => {
          e.target.style.borderColor = 'var(--border-color)';
          e.target.style.boxShadow = 'none';
        }}
      />
      {value && (
        <button
          type="button"
          onClick={() => {
            if (onClear) onClear();
            else onChange('');
          }}
          style={{
            position: 'absolute',
            right: '10px',
            background: 'none',
            border: 'none',
            color: 'var(--text-placeholder)',
            cursor: 'pointer',
            padding: '3px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%'
          }}
          title="Clear search"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
};

