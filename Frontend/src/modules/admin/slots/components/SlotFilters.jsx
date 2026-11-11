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
      backgroundColor: '#ffffff',
      borderRadius: 'var(--border-radius-lg)',
      border: '1px solid var(--border-color)',
      padding: '12px 16px',
      marginBottom: '16px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      flexWrap: 'wrap',
      boxShadow: 'var(--shadow-xs)'
    }}>
      {/* Date Picker */}
      <input
        type="date"
        value={selectedDate}
        onChange={(e) => onDateChange(e.target.value)}
        style={{
          height: '36px',
          padding: '0 10px',
          fontSize: '13px',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--border-radius-md)',
          backgroundColor: '#ffffff',
          color: 'var(--text-secondary)'
        }}
      />

      {/* Outlet */}
      <select
        value={selectedOutlet}
        onChange={(e) => onOutletChange(e.target.value)}
        style={{
          height: '36px',
          padding: '0 10px',
          fontSize: '13px',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--border-radius-md)',
          backgroundColor: '#ffffff',
          color: 'var(--text-secondary)'
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
          height: '36px',
          padding: '0 10px',
          fontSize: '13px',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--border-radius-md)',
          backgroundColor: '#ffffff',
          color: 'var(--text-secondary)'
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
          height: '36px',
          padding: '0 10px',
          fontSize: '13px',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--border-radius-md)',
          backgroundColor: '#ffffff',
          color: 'var(--text-secondary)'
        }}
      >
        <option value="ALL">All Slot States</option>
        {Object.values(SLOT_STATUS).map(st => (
          <option key={st} value={st}>{st}</option>
        ))}
      </select>

      {/* Reset button */}
      <button
        type="button"
        onClick={onReset}
        style={{
          height: '36px',
          padding: '0 12px',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--border-radius-md)',
          backgroundColor: 'transparent',
          color: 'var(--text-secondary)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '12.5px',
          cursor: 'pointer'
        }}
      >
        <RotateCcw size={13} />
        <span>Reset</span>
      </button>
    </div>
  );
};

export default SlotFilters;
