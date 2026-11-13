import React from 'react';
import { SlidersHorizontal, PauseCircle, PlayCircle, Clock, Loader2 } from 'lucide-react';
import { DataTable } from '../../../../components/tables/DataTable';
import { StatusBadge } from '../../../../components/common/StatusBadge';
import { formatTime12Hour, formatDate, calculateDuration } from '../../../../utils/formatters';
import { SLOT_STATUS } from '../../../../constants/appConstants';

export const SlotTable = ({
  slots = [],
  loading = false,
  actionLoadingId = null,
  onAdjustCapacity,
  onTogglePause,
  footer
}) => {
  const columns = [
    {
      key: 'outletName',
      header: 'Outlet',
      render: (val, row) => (
        <div style={{ maxWidth: '150px', overflow: 'hidden' }}>
          <strong
            title={val}
            style={{
              color: 'var(--text-primary)',
              fontSize: '12.5px',
              display: 'block',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {val}
          </strong>
          <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{formatDate(row.date)}</div>
        </div>
      )
    },
    {
      key: 'mealSession',
      header: 'Session',
      render: (val, row) => (
        <span style={{
          backgroundColor: 'var(--bg-muted)',
          padding: '2px 7px',
          borderRadius: 'var(--border-radius-xs)',
          fontSize: '11px',
          fontWeight: 600,
          color: 'var(--text-secondary)',
          whiteSpace: 'nowrap'
        }}>
          {row.session || val || '--'}
        </span>
      )
    },
    {
      key: 'timeWindow',
      header: 'Time Window',
      render: (_, row) => (
        <div style={{ color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
          <div style={{ fontSize: '11px', fontWeight: 600 }}>{formatTime12Hour(row.startTime)} - {formatTime12Hour(row.endTime)}</div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
            Duration: {row.slotDuration || calculateDuration(row.startTime, row.endTime)}
          </div>
        </div>
      )
    },
    {
      key: 'capacity',
      header: 'Order Capacity',
      render: (_, row) => {
        const percent = Math.min(100, Math.round((row.bookedOrders / row.maxCapacity) * 100));
        const isHigh = percent >= 80;
        const barColor = percent >= 100 ? 'var(--color-danger)' : percent >= 80 ? 'var(--color-warning)' : 'var(--color-accent)';
        return (
          <div style={{ minWidth: '130px', maxWidth: '150px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11px',
              marginBottom: '4px',
              whiteSpace: 'nowrap'
            }}>
              <span><strong>{row.bookedOrders}</strong>/{row.maxCapacity} booked</span>
              <span style={{ color: isHigh ? 'var(--color-danger)' : 'var(--text-muted)', fontWeight: 600 }}>{percent}%</span>
            </div>
            {/* Thin Progress Bar */}
            <div
              title={`${row.bookedOrders} booked out of ${row.maxCapacity} (${row.remainingCapacity} remaining)`}
              style={{
                width: '100%',
                height: '5px',
                backgroundColor: 'var(--bg-muted)',
                borderRadius: '999px',
                overflow: 'hidden'
              }}
            >
              <div style={{
                width: `${percent}%`,
                height: '100%',
                backgroundColor: barColor,
                borderRadius: '999px',
                transition: 'width var(--transition-fast)'
              }} />
            </div>
          </div>
        );
      }
    },
    {
      key: 'cutoffTime',
      header: 'Cut-off',
      render: (val, row) => (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
          <Clock size={11} style={{ color: 'var(--text-muted)' }} />
          <span>{val ? formatTime12Hour(val) : `${row.cutoffMinutes || 15}m prior`}</span>
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (val) => <StatusBadge status={val} size="sm" />
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'center',
      width: '76px',
      render: (_, row) => {
        const isPaused = row.status === SLOT_STATUS.PAUSED;
        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
            <button
              type="button"
              onClick={() => onAdjustCapacity(row)}
              style={{
                background: 'none',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--border-radius-sm)',
                padding: '5px',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Adjust Slot Capacity"
              aria-label="Adjust Slot Capacity"
            >
              <SlidersHorizontal size={14} />
            </button>

            <button
              type="button"
              disabled={actionLoadingId === row.id}
              onClick={() => onTogglePause(row)}
              style={{
                background: isPaused ? 'var(--color-success-bg)' : 'var(--color-warning-bg)',
                border: `1px solid ${isPaused ? 'var(--color-success-border)' : 'var(--color-warning-border)'}`,
                borderRadius: 'var(--border-radius-sm)',
                padding: '5px',
                color: isPaused ? 'var(--color-success-text)' : 'var(--color-warning-text)',
                cursor: actionLoadingId === row.id ? 'not-allowed' : 'pointer',
                opacity: actionLoadingId === row.id ? 0.7 : 1,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title={isPaused ? 'Resume Slot Orders' : 'Pause Slot Orders'}
              aria-label={isPaused ? 'Resume Slot Orders' : 'Pause Slot Orders'}
            >
              {actionLoadingId === row.id ? (
                <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} />
              ) : isPaused ? (
                <PlayCircle size={14} />
              ) : (
                <PauseCircle size={14} />
              )}
            </button>
          </div>
        );
      }
    }
  ];

  return (
    <DataTable
      columns={columns}
      data={slots}
      loading={loading}
      footer={footer}
    />
  );
};

export default SlotTable;
