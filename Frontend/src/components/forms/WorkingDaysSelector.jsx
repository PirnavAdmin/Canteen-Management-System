import React from 'react';
import { DAYS_OF_WEEK } from '../../modules/admin/outlets/constants/canteenConstants';

export const WorkingDaysSelector = ({
  value = [],
  onChange,
  label = 'Working Days',
  required = false,
  error,
  helperText,
  disabled = false,
  style = {}
}) => {
  const selectedDays = Array.isArray(value) ? value : [];

  const handleToggle = (day) => {
    if (disabled) return;
    if (selectedDays.includes(day)) {
      onChange(selectedDays.filter(d => d !== day));
    } else {
      onChange([...selectedDays, day]);
    }
  };

  const handleSelectAll = () => {
    if (disabled) return;
    onChange([...DAYS_OF_WEEK]);
  };

  const handleSelectWeekdays = () => {
    if (disabled) return;
    onChange(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']);
  };

  const handleClear = () => {
    if (disabled) return;
    onChange([]);
  };

  const shortNames = {
    'Monday': 'Mon',
    'Tuesday': 'Tue',
    'Wednesday': 'Wed',
    'Thursday': 'Thu',
    'Friday': 'Fri',
    'Saturday': 'Sat',
    'Sunday': 'Sun'
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px', ...style }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {label && (
          <label style={{
            fontSize: '13px',
            fontWeight: 600,
            color: 'var(--text-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            {label}
            {required && <span style={{ color: 'var(--color-danger)' }}>*</span>}
          </label>
        )}
        {!disabled && (
          <div style={{ display: 'flex', gap: '8px', fontSize: '11.5px' }}>
            <button
              type="button"
              onClick={handleSelectWeekdays}
              style={{ color: 'var(--color-accent)', fontWeight: 500, padding: 0 }}
            >
              Mon–Fri
            </button>
            <span style={{ color: 'var(--border-color)' }}>|</span>
            <button
              type="button"
              onClick={handleSelectAll}
              style={{ color: 'var(--color-accent)', fontWeight: 500, padding: 0 }}
            >
              All 7 Days
            </button>
            <span style={{ color: 'var(--border-color)' }}>|</span>
            <button
              type="button"
              onClick={handleClear}
              style={{ color: 'var(--text-muted)', fontWeight: 500, padding: 0 }}
            >
              Clear
            </button>
          </div>
        )}
      </div>

      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px',
        padding: '10px 12px',
        borderRadius: 'var(--border-radius-md)',
        border: `1px solid ${error ? 'var(--color-danger)' : 'var(--border-color)'}`,
        backgroundColor: disabled ? 'var(--bg-muted)' : 'var(--bg-surface)'
      }}>
        {DAYS_OF_WEEK.map((day) => {
          const isSelected = selectedDays.includes(day);
          return (
            <button
              key={day}
              type="button"
              disabled={disabled}
              onClick={() => handleToggle(day)}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--border-radius-full)',
                fontSize: '12.5px',
                fontWeight: isSelected ? 600 : 400,
                border: isSelected ? '1px solid var(--color-accent)' : '1px solid var(--border-color)',
                backgroundColor: isSelected ? 'var(--color-accent)' : 'var(--bg-surface)',
                color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                cursor: disabled ? 'not-allowed' : 'pointer',
                transition: 'all var(--transition-fast)'
              }}
              title={day}
            >
              {shortNames[day]}
            </button>
          );
        })}
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

