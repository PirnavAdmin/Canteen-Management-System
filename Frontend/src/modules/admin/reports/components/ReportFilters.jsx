import React from 'react';
import { REPORT_OPTIONS } from '../constants/reportConstants';
import { PAYMENT_METHODS } from '../../../../constants/appConstants';

export const ReportFilters = ({
  selectedReport = 'sales_summary',
  onReportChange,
  selectedOutlet = 'ALL',
  onOutletChange,
  selectedDateRange = 'today',
  onDateRangeChange,
  selectedPayment = 'ALL',
  onPaymentChange
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
      {/* Report Type Selector */}
      <div style={{ minWidth: '220px' }}>
        <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '3px', textTransform: 'uppercase' }}>
          Select Report
        </label>
        <select
          value={selectedReport}
          onChange={(e) => onReportChange(e.target.value)}
          style={{
            width: '100%',
            height: '36px',
            padding: '0 10px',
            fontSize: '13px',
            fontWeight: 600,
            color: 'var(--color-primary)',
            border: '1.5px solid var(--color-primary-border)',
            borderRadius: 'var(--border-radius-md)',
            backgroundColor: 'var(--color-primary-light)'
          }}
        >
          {REPORT_OPTIONS.map(r => (
            <option key={r.id} value={r.id}>{r.label}</option>
          ))}
        </select>
      </div>

      {/* Outlet */}
      <div>
        <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '3px', textTransform: 'uppercase' }}>
          Dining Outlet
        </label>
        <select
          value={selectedOutlet}
          onChange={(e) => onOutletChange(e.target.value)}
          style={{
            height: '36px',
            padding: '0 10px',
            fontSize: '13px',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--border-radius-md)',
            backgroundColor: '#ffffff'
          }}
        >
          <option value="ALL">All Campus Outlets</option>
          <option value="canteen-001">Central Dining Hall</option>
          <option value="canteen-002">North Campus Food Court</option>
          <option value="canteen-003">Engineering Block Kiosk</option>
        </select>
      </div>

      {/* Date Range */}
      <div>
        <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '3px', textTransform: 'uppercase' }}>
          Date Horizon
        </label>
        <select
          value={selectedDateRange}
          onChange={(e) => onDateRangeChange(e.target.value)}
          style={{
            height: '36px',
            padding: '0 10px',
            fontSize: '13px',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--border-radius-md)',
            backgroundColor: '#ffffff'
          }}
        >
          <option value="today">Today</option>
          <option value="yesterday">Yesterday</option>
          <option value="last_7_days">Last 7 Days</option>
          <option value="month_to_date">Month to Date (MTD)</option>
          <option value="quarter_to_date">Current Academic Term</option>
        </select>
      </div>

      {/* Payment Method */}
      <div>
        <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '3px', textTransform: 'uppercase' }}>
          Payment Method
        </label>
        <select
          value={selectedPayment}
          onChange={(e) => onPaymentChange(e.target.value)}
          style={{
            height: '36px',
            padding: '0 10px',
            fontSize: '13px',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--border-radius-md)',
            backgroundColor: '#ffffff'
          }}
        >
          <option value="ALL">All Payment Channels</option>
          {Object.values(PAYMENT_METHODS).map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default ReportFilters;
