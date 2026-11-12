import React from 'react';
import { RotateCcw } from 'lucide-react';
import { SLOT_SESSIONS, SLOT_STATUS } from '../../../../constants/appConstants';

export const SlotFilters = ({
  selectedOutlet = 'ALL',
  onOutletChange,
  selectedSession = 'ALL',
  onSessionChange,
  selectedStatus = 'ALL',
  onStatusChange,
  selectedDate = '',
  onDateChange,
  onReset
}) => {
  return (
    <div style={{
      backgroundColor: 'var(--bg-surface)',
      borderRadius: 'var(--border-radius-lg)',
      border: '1px solid var(--border-color)',
      padding: '10px 14px',
      marginBottom: '16px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      flexWrap: 'nowrap',
      overflowX: 'auto',
      boxShadow: 'var(--shadow-xs)'
    }}>
      {/* Date Picker */}
      <input
        type="date"
        value={selectedDate}
        onChange={(e) => onDateChange(e.target.value)}
        style={{
          height: '34px',
          padding: '0 8px',
          fontSize: '12.5px',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--border-radius-md)',
          backgroundColor: 'var(--bg-surface)',
          color: 'var(--text-secondary)',
          flexShrink: 0
        }}
      />

      {/* Outlet */}
      <select
        value={selectedOutlet}
        onChange={(e) => onOutletChange(e.target.value)}
        style={{
          height: '34px',
          padding: '0 8px',
          fontSize: '12.5px',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--border-radius-md)',
          backgroundColor: 'var(--bg-surface)',
          color: 'var(--text-secondary)',
          flex: '1 1 180px'
        }}
      >
        <option value="ALL">All Outlets</option>
        <option value="canteen-001">Central Dining Hall</option>
        <option value="canteen-002">North Campus Food Court</option>
        <option value="canteen-003">Engineering Block Kiosk</option>
      </select>

      {/* Meal Session */}
      <select
        value={selectedSession}
        onChange={(e) => onSessionChange(e.target.value)}
        style={{
          height: '34px',
          padding: '0 8px',
          fontSize: '12.5px',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--border-radius-md)',
          backgroundColor: 'var(--bg-surface)',
          color: 'var(--text-secondary)',
          flexShrink: 0
        }}
      >
        <option value="ALL">All Sessions</option>
        {SLOT_SESSIONS.map(s => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>

      {/* Status */}
      <select
        value={selectedStatus}
        onChange={(e) => onStatusChange(e.target.value)}
        style={{
          height: '34px',
          padding: '0 8px',
          fontSize: '12.5px',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--border-radius-md)',
          backgroundColor: 'var(--bg-surface)',
          color: 'var(--text-secondary)',
          flexShrink: 0
        }}
      >
        <option value="ALL">All Slot States</option>
        {Object.values(SLOT_STATUS).map(st => (
          <option key={st} value={st}>{st}</option>
        ))}
      </select>

      {/* Reset Icon Button */}
      <button
        type="button"
        onClick={onReset}
        title="Reset all filters"
        aria-label="Reset all filters"
        style={{
          width: '34px',
          height: '34px',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--border-radius-md)',
          backgroundColor: 'var(--bg-surface)',
          color: 'var(--text-secondary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          flexShrink: 0,
          transition: 'all var(--transition-fast)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--bg-muted)';
          e.currentTarget.style.color = 'var(--color-accent)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--bg-surface)';
          e.currentTarget.style.color = 'var(--text-secondary)';
        }}
      >
        <RotateCcw size={14} />
      </button>
    </div>
  );
};

export default SlotFilters;
