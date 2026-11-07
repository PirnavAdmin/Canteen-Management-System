import React from 'react';
import { Clock } from 'lucide-react';
import { formatTime12Hour } from '../../utils/formatters';

export const TimeInput = ({
  label,
  name,
  value,
  onChange,
  required = false,
  error,
  helperText,
  disabled = false,
  style = {}
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
        <Clock
          size={16}
          style={{
            position: 'absolute',
            left: '12px',
            color: 'var(--text-placeholder)',
            pointerEvents: 'none'
          }}
        />
        <input
          type="time"
          id={name}
          name={name}
          value={value ?? ''}
          onChange={onChange}
          disabled={disabled}
          style={{
            width: '100%',
            padding: '9px 14px 9px 36px',
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
        />
        {value && (
          <span style={{
            position: 'absolute',
            right: '12px',
            fontSize: '12px',
            color: 'var(--text-muted)',
            fontWeight: 500,
            pointerEvents: 'none'
          }}>
            {formatTime12Hour(value)}
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

