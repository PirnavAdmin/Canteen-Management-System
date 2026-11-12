import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Edit, Power, Phone, Mail } from 'lucide-react';
import { DataTable } from '../../../../components/tables/DataTable';
import { StatusBadge } from '../../../../components/common/StatusBadge';
import { formatTime12Hour, formatWorkingDays } from '../utils/canteenFormatters';

export const CanteenTable = ({
  canteens = [],
  loading = false,
  onToggleStatus,
  footer
}) => {
  const navigate = useNavigate();

  const columns = [
    {
      key: 'name',
      header: 'Canteen Name',
      render: (val, row) => (
        <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '150px', overflow: 'hidden' }}>
          <span
            onClick={() => navigate(`/canteen/${row.id}`)}
            title={val}
            style={{
              fontSize: '12.5px',
              fontWeight: 600,
              color: 'var(--color-primary)',
              cursor: 'pointer',
              textDecoration: 'none',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: 'block'
            }}
            onMouseEnter={(e) => { e.target.style.textDecoration = 'underline'; }}
            onMouseLeave={(e) => { e.target.style.textDecoration = 'none'; }}
          >
            {val}
          </span>
          <span
            title={`Outlet Code: ${row.code}`}
            style={{
              fontSize: '10.5px',
              fontFamily: 'var(--font-mono)',
              fontWeight: 600,
              color: 'var(--text-muted)',
              marginTop: '2px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {row.code}
          </span>
        </div>
      )
    },
    {
      key: 'campus',
      header: 'Campus',
      render: (val) => (
        <span
          title={val}
          style={{
            fontSize: '12px',
            fontWeight: 500,
            color: 'var(--text-secondary)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: 'block',
            maxWidth: '95px'
          }}
        >
          {val}
        </span>
      )
    },
    {
      key: 'location',
      header: 'Location',
      render: (val) => (
        <span
          style={{
            fontSize: '11.5px',
            color: 'var(--text-secondary)',
            display: 'block',
            maxWidth: '120px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
          title={val}
        >
          {val}
        </span>
      )
    },
    {
      key: 'contact',
      header: 'Contact',
      render: (_, row) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '11px', maxWidth: '135px', overflow: 'hidden' }}>
          {row.contactPhone && (
            <span
              title={row.contactPhone}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                color: 'var(--text-secondary)',
                whiteSpace: 'nowrap'
              }}
            >
              <Phone size={11} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.contactPhone}</span>
            </span>
          )}
          {row.contactEmail && (
            <span
              title={row.contactEmail}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                color: 'var(--text-muted)',
                whiteSpace: 'nowrap'
              }}
            >
              <Mail size={11} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {row.contactEmail}
              </span>
            </span>
          )}
        </div>
      )
    },
    {
      key: 'hours',
      header: 'Hours',
      render: (_, row) => (
        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
          <div>{formatTime12Hour(row.openingTime)}</div>
          <div style={{ color: 'var(--text-muted)' }}>to {formatTime12Hour(row.closingTime)}</div>
        </div>
      )
    },
    {
      key: 'workingDays',
      header: 'Days',
      render: (val) => {
        const formatted = formatWorkingDays(val);
        return (
          <span
            style={{
              fontSize: '11.5px',
              color: 'var(--text-secondary)',
              display: 'block',
              maxWidth: '95px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
            title={Array.isArray(val) ? val.join(', ') : formatted}
          >
            {formatted}
          </span>
        );
      }
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
      width: '86px',
      render: (_, row) => {
        const isActive = row.status === 'Active';
        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
            <button
              type="button"
              onClick={() => navigate(`/canteen/${row.id}`)}
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
              title="View Canteen Details"
              aria-label="View Canteen Details"
            >
              <Eye size={14} />
            </button>

            <button
              type="button"
              onClick={() => navigate(`/canteen/${row.id}/edit`)}
              style={{
                background: 'none',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--border-radius-sm)',
                padding: '5px',
                color: 'var(--color-accent)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Edit Canteen"
              aria-label="Edit Canteen"
            >
              <Edit size={14} />
            </button>

            <button
              type="button"
              onClick={() => onToggleStatus(row)}
              style={{
                border: `1px solid ${isActive ? 'var(--color-danger-border)' : 'var(--color-success-border)'}`,
                backgroundColor: isActive ? 'var(--color-danger-bg)' : 'var(--color-success-bg)',
                borderRadius: 'var(--border-radius-sm)',
                padding: '5px',
                color: isActive ? 'var(--color-danger)' : 'var(--color-success)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title={isActive ? 'Deactivate Canteen' : 'Activate Canteen'}
              aria-label={isActive ? 'Deactivate Canteen' : 'Activate Canteen'}
            >
              <Power size={14} />
            </button>
          </div>
        );
      }
    }
  ];

  return (
    <DataTable
      columns={columns}
      data={canteens}
      loading={loading}
      footer={footer}
      style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0 }}
    />
  );
};
