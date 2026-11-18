import React, { useState, useEffect, useMemo } from 'react';
import { REPORT_OPTIONS } from '../constants/reportConstants';
import { PAYMENT_METHODS } from '../../../../constants/appConstants';
import { canteenService } from '../../outlets/services/canteenService';
import { useCanteens } from '../../outlets/hooks/useCanteens';
import { Lock } from 'lucide-react';

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
  const { selectedCampus, canteens } = useCanteens();
  const [fetchedOutlets, setFetchedOutlets] = useState([]);

  useEffect(() => {
    let isMounted = true;
    canteenService.getAll().then((data) => {
      if (isMounted && Array.isArray(data)) setFetchedOutlets(data);
    }).catch(() => {});
    return () => { isMounted = false; };
  }, []);

  const effectiveOutlets = (canteens && canteens.length > 0) ? canteens : fetchedOutlets;

  // Filter outlets specifically for the campus selected on top navbar
  const campusOutlets = useMemo(() => {
    if (!effectiveOutlets || !effectiveOutlets.length) return [];
    if (!selectedCampus || selectedCampus === 'ALL') return effectiveOutlets;
    const q = selectedCampus.trim().toLowerCase();
    const matched = effectiveOutlets.filter(o => o.campus && o.campus.trim().toLowerCase() === q);
    return matched.length > 0 ? matched : effectiveOutlets;
  }, [effectiveOutlets, selectedCampus]);

  // If active campus changes, auto-reset outlet if previous outlet doesn't belong to current campus
  useEffect(() => {
    if (selectedOutlet !== 'ALL') {
      const exists = campusOutlets.some(o => String(o.outletId || o.id) === String(selectedOutlet));
      if (!exists) {
        onOutletChange('ALL');
      }
    }
  }, [selectedCampus, campusOutlets, selectedOutlet, onOutletChange]);

  const activeCampusName = selectedCampus || 'Main Campus';

  return (
    <div style={{
      backgroundColor: 'var(--bg-surface)',
      borderRadius: 'var(--border-radius-lg)',
      border: '1px solid var(--border-color)',
      padding: '10px 14px',
      marginBottom: '16px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      flexWrap: 'wrap',
      boxShadow: 'var(--shadow-xs)'
    }}>
      {/* 1. Report Selector */}
      <div style={{ flex: '1.2 1 180px', minWidth: '170px' }}>
        <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
          Select Report
        </label>
        <select
          value={selectedReport}
          onChange={(e) => onReportChange(e.target.value)}
          style={{
            width: '100%',
            height: '34px',
            padding: '0 8px',
            fontSize: '12.5px',
            fontWeight: 600,
            color: 'var(--color-primary)',
            border: '1px solid var(--color-primary-border, #bfdbfe)',
            borderRadius: 'var(--border-radius-md)',
            backgroundColor: 'var(--color-primary-light, #eff6ff)',
            cursor: 'pointer'
          }}
        >
          {REPORT_OPTIONS.map(r => (
            <option key={r.id} value={r.id}>{r.label}</option>
          ))}
        </select>
      </div>

      {/* 2. Campus (Prefilled from navbar, locked/non-editable) */}
      <div style={{ flex: '1 1 140px', minWidth: '130px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
          <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
            Campus
          </label>
          <span style={{ fontSize: '9.5px', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '2px' }} title="Prefilled from top navbar">
            <Lock size={9} /> Locked
          </span>
        </div>
        <select
          disabled
          value={activeCampusName}
          style={{
            width: '100%',
            height: '34px',
            padding: '0 8px',
            fontSize: '12.5px',
            fontWeight: 500,
            color: 'var(--text-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--border-radius-md)',
            backgroundColor: 'var(--bg-muted)',
            cursor: 'not-allowed',
            opacity: 0.95
          }}
          title="Campus is prefilled from navbar and not editable here"
        >
          <option value={activeCampusName}>{activeCampusName}</option>
        </select>
      </div>

      {/* 3. Dining Outlet (Filtered by selectedCampus) */}
      <div style={{ flex: '1.1 1 170px', minWidth: '150px' }}>
        <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
          Dining Outlet
        </label>
        <select
          value={selectedOutlet}
          onChange={(e) => onOutletChange(e.target.value)}
          style={{
            width: '100%',
            height: '34px',
            padding: '0 8px',
            fontSize: '12.5px',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--border-radius-md)',
            backgroundColor: 'var(--bg-surface)',
            color: 'var(--text-primary)',
            cursor: 'pointer'
          }}
        >
          <option value="ALL">All Outlets</option>
          {campusOutlets.map(out => (
            <option key={out.outletId || out.id} value={out.outletId || out.id}>
              {out.name}
            </option>
          ))}
        </select>
      </div>

      {/* 4. Date (Renamed from Date Horizon) */}
      <div style={{ flex: '1 1 130px', minWidth: '120px' }}>
        <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
          Date
        </label>
        <select
          value={selectedDateRange}
          onChange={(e) => onDateRangeChange(e.target.value)}
          style={{
            width: '100%',
            height: '34px',
            padding: '0 8px',
            fontSize: '12.5px',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--border-radius-md)',
            backgroundColor: 'var(--bg-surface)',
            color: 'var(--text-primary)',
            cursor: 'pointer'
          }}
        >
          <option value="today">Today</option>
          <option value="yesterday">Yesterday</option>
          <option value="last_7_days">Last 7 Days</option>
          <option value="month_to_date">Month to Date (MTD)</option>
          <option value="quarter_to_date">Current Academic Term</option>
        </select>
      </div>

      {/* 5. Payment Method */}
      <div style={{ flex: '1 1 150px', minWidth: '135px' }}>
        <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
          Payment Method
        </label>
        <select
          value={selectedPayment}
          onChange={(e) => onPaymentChange(e.target.value)}
          style={{
            width: '100%',
            height: '34px',
            padding: '0 8px',
            fontSize: '12.5px',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--border-radius-md)',
            backgroundColor: 'var(--bg-surface)',
            color: 'var(--text-primary)',
            cursor: 'pointer'
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
