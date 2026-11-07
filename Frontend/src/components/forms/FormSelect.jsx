import React from 'react';
import { ChevronDown } from 'lucide-react';

export const FormSelect = ({
  label,
  name,
  value,
  onChange,
  options = [],
  placeholder = 'Select an option...',
  required = false,
  error,
  helperText,
  disabled = false,
  style = {},
  ...props
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px', ...style }}>
      {label && (
        <label
          htmlFor={name}
          style={{
            fontSize: '13px',
            fontWeight: 600,
            color: 'var(--text-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          {label}
          {required && <span style={{ color: 'var(--color-danger)' }}>*</span>}
        </label>
      )}

      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <select
          id={name}
          name={name}
          value={value ?? ''}
          onChange={onChange}
          disabled={disabled}
          style={{
            width: '100%',
            appearance: 'none',
            padding: '9px 34px 9px 14px',
            fontSize: '13.5px',
            borderRadius: 'var(--border-radius-md)',
            border: `1px solid ${error ? 'var(--color-danger)' : 'var(--border-color)'}`,
            backgroundColor: disabled ? 'var(--bg-muted)' : '#ffffff',
            color: disabled ? 'var(--text-muted)' : 'var(--text-primary)',
            outline: 'none',
            cursor: disabled ? 'not-allowed' : 'pointer',
            transition: 'border-color var(--transition-fast), box-shadow var(--transition-fast)'
          }}
          onFocus={(e) => {
            if (!error && !disabled) {
              e.target.style.borderColor = 'var(--color-accent)';
              e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.12)';
            }
          }}
          onBlur={(e) => {
            if (!error) {
              e.target.style.borderColor = 'var(--border-color)';
              e.target.style.boxShadow = 'none';
            }
          }}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt) => {
            const val = typeof opt === 'object' ? opt.value : opt;
            const lbl = typeof opt === 'object' ? opt.label : opt;
            return (
              <option key={val} value={val}>
                {lbl}
              </option>
            );
          })}
        </select>
        <ChevronDown
          size={16}
          style={{
            position: 'absolute',
            right: '12px',
            color: 'var(--text-muted)',
            pointerEvents: 'none'
          }}
        />
      </div>

      {error ? (
        <span style={{ fontSize: '12px', color: 'var(--color-danger)', fontWeight: 500 }}>
          {error}
        </span>
      ) : helperText ? (
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          {helperText}
        </span>
      ) : null}
    </div>
  );
};

