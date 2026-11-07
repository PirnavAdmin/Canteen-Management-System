import React from 'react';

export const FormInput = ({
  label,
  name,
  value,
  onChange,
  type = 'text',
  placeholder,
  required = false,
  error,
  helperText,
  disabled = false,
  readOnly = false,
  prefixIcon: PrefixIcon,
  suffix,
  autoComplete = 'off',
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
        {PrefixIcon && (
          <PrefixIcon
            size={16}
            style={{
              position: 'absolute',
              left: '12px',
              color: 'var(--text-placeholder)',
              pointerEvents: 'none'
            }}
          />
        )}
        <input
          id={name}
          name={name}
          type={type}
          value={value ?? ''}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          autoComplete={autoComplete}
          style={{
            width: '100%',
            padding: `9px 14px 9px ${PrefixIcon ? '36px' : '14px'}`,
            fontSize: '13.5px',
            borderRadius: 'var(--border-radius-md)',
            border: `1px solid ${error ? 'var(--color-danger)' : 'var(--border-color)'}`,
            backgroundColor: disabled ? 'var(--bg-muted)' : '#ffffff',
            color: disabled ? 'var(--text-muted)' : 'var(--text-primary)',
            outline: 'none',
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
        />
        {suffix && (
          <span style={{
            position: 'absolute',
            right: '12px',
            fontSize: '12px',
            color: 'var(--text-muted)',
            pointerEvents: 'none'
          }}>
            {suffix}
          </span>
        )}
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

