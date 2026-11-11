import React from 'react';
import { Search, RotateCcw } from 'lucide-react';
import { ORDER_STATUS, PAYMENT_STATUS } from '../../../../constants/appConstants';

export const OrderFilters = ({
  searchTerm = '',
  onSearchChange,
  selectedStatus = 'ALL',
  onStatusChange,
  selectedPayment = 'ALL',
  onPaymentChange,
  selectedOutlet = 'ALL',
  onOutletChange,
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
      {/* Search Input */}
      <div style={{ position: 'relative', flex: '1 1 220px' }}>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by token, order ID, or customer name..."
          style={{
            width: '100%',
            height: '36px',
            padding: '0 12px 0 32px',
            fontSize: '13px',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--border-radius-md)',
            backgroundColor: 'var(--bg-app)',
            outline: 'none'
          }}
        />
        <Search
          size={14}
          style={{
            position: 'absolute',
            left: '10px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-muted)'
          }}
        />
      </div>

      {/* Order Status */}
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
        <option value="ALL">All Order Statuses</option>
        {Object.values(ORDER_STATUS).map(st => (
          <option key={st} value={st}>{st}</option>
        ))}
      </select>

      {/* Payment Status */}
      <select
        value={selectedPayment}
        onChange={(e) => onPaymentChange(e.target.value)}
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
        <option value="ALL">All Payment Statuses</option>
        {Object.values(PAYMENT_STATUS).map(ps => (
          <option key={ps} value={ps}>{ps}</option>
        ))}
      </select>

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

      {/* Reset */}
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

export default OrderFilters;
