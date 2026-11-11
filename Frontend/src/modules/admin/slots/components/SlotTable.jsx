import React from 'react';
import { SlidersHorizontal, PauseCircle, PlayCircle, Clock } from 'lucide-react';
import { DataTable } from '../../../../components/tables/DataTable';
import { StatusBadge } from '../../../../components/common/StatusBadge';
import { formatTime12Hour, formatDate } from '../../../../utils/formatters';
import { SLOT_STATUS } from '../../../../constants/appConstants';

export const SlotTable = ({
  slots = [],
  loading = false,
  onAdjustCapacity,
  onTogglePause,
  footer
}) => {
  const columns = [
    {
      key: 'outletName',
      header: 'Outlet',
      render: (val, row) => (
        <div>
          <strong style={{ color: 'var(--text-primary)', fontSize: '13px' }}>{val}</strong>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{formatDate(row.date)}</div>
        </div>
      )
    },
    {
      key: 'mealSession',
      header: 'Session',
      render: (val) => (
        <span style={{
          backgroundColor: 'var(--bg-muted)',
          padding: '3px 8px',
          borderRadius: 'var(--border-radius-xs)',
          fontSize: '12px',
          fontWeight: 600,
          color: 'var(--text-secondary)'
        }}>
          {val}
        </span>
      )
    },
    {
      key: 'timeWindow',
      header: 'Time Window',
      render: (_, row) => (
        <div style={{ fontSize: '12.5px', color: 'var(--text-primary)' }}>
          <div>{formatTime12Hour(row.startTime)} - {formatTime12Hour(row.endTime)}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Duration: {row.slotDuration}</div>
        </div>
      )
    },
    {
      key: 'capacity',
      header: 'Order Capacity',
      render: (_, row) => {
        const percent = Math.min(100, Math.round((row.bookedOrders / row.maxCapacity) * 100));
        const isHigh = percent >= 80;
        return (
          <div style={{ minWidth: '120px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '3px' }}>
              <span><strong>{row.bookedOrders}</strong> / {row.maxCapacity} booked</span>
              <span style={{ color: isHigh ? 'var(--color-danger)' : 'var(--text-muted)' }}>{percent}%</span>
            </div>
            <div style={{ width: '100%', height: '5px', backgroundColor: 'var(--bg-muted)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{
                width: `${percent}%`,
                height: '100%',
                backgroundColor: percent >= 100 ? 'var(--color-danger)' : percent >= 80 ? 'var(--color-warning)' : 'var(--color-accent)',
                borderRadius: '3px'
              }} />
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
              {row.remainingCapacity} slots remaining
            </div>
          </div>
        );
      }
    },
    {
      key: 'cutoffTime',
      header: 'Cut-off Time',
      render: (val, row) => (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--text-secondary)' }}>
          <Clock size={12} style={{ color: 'var(--text-muted)' }} />
          <span>{val ? formatTime12Hour(val) : `${row.cutoffMinutes || 15}m prior`}</span>
        </div>
      )
    },
    {
      key: 'status',
      header: 'Slot Status',
      render: (val) => <StatusBadge status={val} size="sm" />
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (_, row) => {
        const isPaused = row.status === SLOT_STATUS.PAUSED;
        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
            <button
              type="button"
              onClick={() => onAdjustCapacity(row)}
              style={{
                background: 'none',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--border-radius-sm)',
                padding: '6px 8px',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '12px'
              }}
              title="Adjust Slot Capacity"
            >
              <SlidersHorizontal size={13} />
              <span>Quota</span>
            </button>

            <button
              type="button"
              onClick={() => onTogglePause(row)}
              style={{
                background: isPaused ? 'var(--color-success-bg)' : 'var(--color-warning-bg)',
                border: `1px solid ${isPaused ? 'var(--color-success-border)' : 'var(--color-warning-border)'}`,
                borderRadius: 'var(--border-radius-sm)',
                padding: '6px 8px',
                color: isPaused ? 'var(--color-success-text)' : 'var(--color-warning-text)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '12px',
                fontWeight: 600
              }}
              title={isPaused ? 'Resume Slot' : 'Pause Slot'}
            >
              {isPaused ? <PlayCircle size={13} /> : <PauseCircle size={13} />}
              <span>{isPaused ? 'Resume' : 'Pause'}</span>
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
