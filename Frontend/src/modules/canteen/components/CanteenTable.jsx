import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Edit, Power, Phone, Mail } from 'lucide-react';
import { DataTable } from '../../../components/tables/DataTable';
import { StatusBadge } from '../../../components/common/StatusBadge';
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
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span
            onClick={() => navigate(`/canteen/${row.id}`)}
            style={{
              fontWeight: 600,
              color: 'var(--color-primary)',
              cursor: 'pointer',
              textDecoration: 'none'
            }}
            onMouseEnter={(e) => { e.target.style.textDecoration = 'underline'; }}
            onMouseLeave={(e) => { e.target.style.textDecoration = 'none'; }}
          >
            {val}
          </span>
          <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
            ID: {row.id}
          </span>
        </div>
      )
    },
    {
      key: 'code',
      header: 'Code',
      render: (val) => (
        <code style={{
          backgroundColor: 'var(--bg-muted)',
          padding: '3px 7px',
          borderRadius: 'var(--border-radius-xs)',
          fontSize: '12px',
          fontWeight: 600,
          color: 'var(--color-primary)'
        }}>
          {val}
        </code>
      )
    },
    {
      key: 'campus',
      header: 'Campus',
      render: (val) => (
        <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>
          {val}
        </span>
      )
    },
    {
      key: 'location',
      header: 'Location',
      render: (val) => (
        <span
          style={{ fontSize: '12.5px', color: 'var(--text-secondary)', display: 'block', maxWidth: '180px' }}
          title={val}
          className="text-truncate"
        >
          {val}
        </span>
      )
    },
    {
      key: 'contact',
      header: 'Contact',
      render: (_, row) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '12px' }}>
          {row.contactPhone && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: 'var(--text-secondary)' }}>
              <Phone size={12} style={{ color: 'var(--text-muted)' }} />
              {row.contactPhone}
            </span>
          )}
          {row.contactEmail && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: 'var(--text-muted)' }}>
              <Mail size={12} style={{ color: 'var(--text-muted)' }} />
              <span className="text-truncate" style={{ maxWidth: '160px' }} title={row.contactEmail}>
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
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
          <div>{formatTime12Hour(row.openingTime)}</div>
          <div style={{ color: 'var(--text-muted)' }}>to {formatTime12Hour(row.closingTime)}</div>
        </div>
      )
    },
    {
      key: 'workingDays',
      header: 'Working Days',
      render: (val) => (
        <span
          style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', maxWidth: '140px' }}
          title={Array.isArray(val) ? val.join(', ') : val}
          className="text-truncate"
        >
          {formatWorkingDays(val)}
        </span>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (val) => <StatusBadge status={val} size="sm" />
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (_, row) => {
        const isActive = row.status === 'Active';
        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
            <button
              type="button"
              onClick={() => navigate(`/canteen/${row.id}`)}
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
              title="View Canteen Details"
            >
              <Eye size={13} />
              <span>View</span>
            </button>

            <button
              type="button"
              onClick={() => navigate(`/canteen/${row.id}/edit`)}
              style={{
                background: 'none',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--border-radius-sm)',
                padding: '6px 8px',
                color: 'var(--color-accent)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '12px'
              }}
              title="Edit Canteen"
            >
              <Edit size={13} />
              <span>Edit</span>
            </button>

            <button
              type="button"
              onClick={() => onToggleStatus(row)}
              style={{
                background: 'none',
                border: `1px solid ${isActive ? '#fecaca' : '#a7f3d0'}`,
                backgroundColor: isActive ? 'var(--color-danger-bg)' : 'var(--color-success-bg)',
                borderRadius: 'var(--border-radius-sm)',
                padding: '6px 8px',
                color: isActive ? 'var(--color-danger)' : 'var(--color-success)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '12px',
                fontWeight: 500
              }}
              title={isActive ? 'Deactivate Canteen' : 'Activate Canteen'}
            >
              <Power size={13} />
              <span>{isActive ? 'Deactivate' : 'Activate'}</span>
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
