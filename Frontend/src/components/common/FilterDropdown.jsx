import React from 'react';
import { Filter } from 'lucide-react';

export const FilterDropdown = ({
  label,
  value,
  options = [],
  onChange,
  icon: Icon = Filter,
  style = {}
}) => {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', ...style }}>
      {label && (
        <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>
          {label}:
        </span>
      )}
      <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
        {Icon && (
          <Icon
            size={14}
            style={{
              position: 'absolute',
              left: '10px',
              color: 'var(--text-muted)',
              pointerEvents: 'none'
            }}
          />
        )}
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            appearance: 'none',
            paddingLeft: Icon ? '30px' : '12px',
            paddingRight: '28px',
            paddingTop: '8px',
            paddingBottom: '8px',
            fontSize: '13px',
            fontWeight: 500,
            color: 'var(--text-primary)',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--border-radius-md)',
            cursor: 'pointer',
            outline: 'none',
            transition: 'border-color var(--transition-fast)'
          }}
          onFocus={(e) => {
            e.target.style.borderColor = 'var(--color-accent)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = 'var(--border-color)';
          }}
        >
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
        <span
          style={{
            position: 'absolute',
            right: '10px',
            pointerEvents: 'none',
            color: 'var(--text-muted)',
            fontSize: '10px'
          }}
        >
          ▼
        </span>
      </div>
    </div>
  );
};

