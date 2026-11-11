import React from 'react';
import { Eye, Edit, Power, Globe, GlobeLock, Trash2 } from 'lucide-react';
import { DataTable } from '../../../../components/tables/DataTable';
import { StatusBadge } from '../../../../components/common/StatusBadge';
import { formatCurrency, formatNumber } from '../../../../utils/formatters';

export const MenuTable = ({
  items = [],
  loading = false,
  onView,
  onEdit,
  onToggleStatus,
  onTogglePublish,
  onDelete,
  footer
}) => {
  const columns = [
    {
      key: 'name',
      header: 'Menu Item',
      render: (val, row) => {
        const typeColor = row.foodType === 'Veg' ? '#059669' : row.foodType === 'Non-veg' ? '#dc2626' : '#d97706';
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '12px',
              height: '12px',
              border: `1.5px solid ${typeColor}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1px',
              flexShrink: 0
            }}>
              <div style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: typeColor }} />
            </div>

            <div>
              <span
                onClick={() => onView(row)}
                style={{
                  fontWeight: 600,
                  color: 'var(--color-primary)',
                  cursor: 'pointer',
                  fontSize: '13.5px'
                }}
                onMouseEnter={(e) => { e.target.style.textDecoration = 'underline'; }}
                onMouseLeave={(e) => { e.target.style.textDecoration = 'none'; }}
              >
                {val}
              </span>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {row.outletName || 'Main Campus Dining'}
              </div>
            </div>
          </div>
        );
      }
    },
    {
      key: 'code',
      header: 'Code',
      render: (val) => (
        <code style={{
          backgroundColor: 'var(--bg-muted)',
          padding: '2px 6px',
          borderRadius: '4px',
          fontSize: '11.5px',
          fontWeight: 600,
          color: 'var(--text-primary)'
        }}>
          {val}
        </code>
      )
    },
    {
      key: 'category',
      header: 'Category',
      render: (val) => (
        <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
          {val}
        </span>
      )
    },
    {
      key: 'price',
      header: 'Price',
      render: (val) => (
        <span style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-primary)' }}>
          {formatCurrency(val)}
        </span>
      )
    },
    {
      key: 'dailyCapacity',
      header: 'Capacity',
      render: (val, row) => (
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
          <div><strong>{formatNumber(row.remainingCapacity ?? val)}</strong> / {formatNumber(val)} left</div>
          <div style={{
            width: '60px',
            height: '4px',
            backgroundColor: 'var(--bg-muted)',
            borderRadius: '2px',
            marginTop: '3px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${Math.round(((row.remainingCapacity ?? val) / val) * 100)}%`,
              height: '100%',
              backgroundColor: '#10b981'
            }} />
          </div>
        </div>
      )
    },
    {
      key: 'publicationStatus',
      header: 'Publish Status',
      render: (val) => {
        const isPub = val === 'Published';
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '2px 8px',
            borderRadius: 'var(--border-radius-full)',
            fontSize: '11px',
            fontWeight: 600,
            backgroundColor: isPub ? 'var(--color-primary-light)' : 'var(--bg-muted)',
            color: isPub ? 'var(--color-primary)' : 'var(--text-muted)',
            border: `1px solid ${isPub ? 'var(--color-primary-border)' : 'var(--border-color)'}`
          }}>
            {isPub ? <Globe size={11} /> : <GlobeLock size={11} />}
            <span>{val}</span>
          </span>
        );
      }
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
        const isPublished = row.publicationStatus === 'Published';
        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
            <button
              type="button"
              onClick={() => onView(row)}
              style={{
                background: 'none',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                padding: '4px 6px',
                color: 'var(--text-secondary)',
                cursor: 'pointer'
              }}
              title="View Details"
            >
              <Eye size={13} />
            </button>

            <button
              type="button"
              onClick={() => onEdit(row)}
              style={{
                background: 'none',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                padding: '4px 6px',
                color: 'var(--color-accent)',
                cursor: 'pointer'
              }}
              title="Edit Item"
            >
              <Edit size={13} />
            </button>

            <button
              type="button"
              onClick={() => onTogglePublish(row)}
              style={{
                background: 'none',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                padding: '4px 6px',
                color: isPublished ? '#0284c7' : 'var(--text-muted)',
                cursor: 'pointer'
              }}
              title={isPublished ? 'Unpublish (Mark as Draft)' : 'Publish to Students/Faculty'}
            >
              {isPublished ? <Globe size={13} /> : <GlobeLock size={13} />}
            </button>

            <button
              type="button"
              onClick={() => onToggleStatus(row)}
              style={{
                background: 'none',
                border: `1px solid ${isActive ? '#fecaca' : '#a7f3d0'}`,
                backgroundColor: isActive ? 'var(--color-danger-bg)' : 'var(--color-success-bg)',
                borderRadius: '4px',
                padding: '4px 6px',
                color: isActive ? 'var(--color-danger)' : 'var(--color-success)',
                cursor: 'pointer'
              }}
              title={isActive ? 'Deactivate' : 'Activate'}
            >
              <Power size={13} />
            </button>

            <button
              type="button"
              onClick={() => onDelete(row)}
              style={{
                background: 'none',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                padding: '4px 6px',
                color: 'var(--color-danger)',
                cursor: 'pointer'
              }}
              title="Delete Item"
            >
              <Trash2 size={13} />
            </button>
          </div>
        );
      }
    }
  ];

  return (
    <DataTable
      columns={columns}
      data={items}
      loading={loading}
      footer={footer}
    />
  );
};

export default MenuTable;
