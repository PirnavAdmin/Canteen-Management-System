import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Edit, Power } from 'lucide-react';
import { DataTable } from '../../../../components/tables/DataTable';
import { StatusBadge } from '../../../../components/common/StatusBadge';

export const CategoryTable = ({
  categories = [],
  loading = false,
  sortField,
  sortDirection,
  onSort,
  onToggleStatus,
  footer
}) => {
  const navigate = useNavigate();

  const columns = [
    {
      key: 'name',
      header: 'Category Name',
      sortable: true,
      render: (val, row) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span
            onClick={() => navigate(`/categories/${row.id}`)}
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
          {row.description && (
            <span
              style={{
                fontSize: '12px',
                color: 'var(--text-muted)',
                marginTop: '2px',
                maxWidth: '360px'
              }}
              className="text-truncate"
              title={row.description}
            >
              {row.description}
            </span>
          )}
        </div>
      )
    },
    {
      key: 'displayOrder',
      header: 'Display Order',
      sortable: true,
      align: 'center',
      width: '140px',
      render: (val) => (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          minWidth: '32px',
          height: '26px',
          padding: '0 8px',
          borderRadius: 'var(--border-radius-full)',
          backgroundColor: 'var(--color-primary-light)',
          color: 'var(--color-primary)',
          fontSize: '12.5px',
          fontWeight: 700
        }}>
          #{val}
        </span>
      )
    },
    {
      key: 'linkedItemCount',
      header: 'Historical Records',
      align: 'center',
      width: '180px',
      render: (_, row) => (
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
          <div><strong>{row.linkedItemCount || 0}</strong> Menu Items</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
            {row.historicalOrderCount || 0} Orders dependent
          </div>
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      width: '130px',
      render: (val) => <StatusBadge status={val} size="sm" />
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'center',
      width: '96px',
      render: (_, row) => {
        const isActive = row.status === 'Active';
        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
            <button
              type="button"
              onClick={() => navigate(`/categories/${row.id}`)}
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
              title="View Details"
              aria-label="View Details"
            >
              <Eye size={14} />
            </button>

            <button
              type="button"
              onClick={() => navigate(`/categories/${row.id}/edit`)}
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
              title="Edit Category"
              aria-label="Edit Category"
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
              title={isActive ? 'Deactivate Category' : 'Activate Category'}
              aria-label={isActive ? 'Deactivate Category' : 'Activate Category'}
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
      data={categories}
      loading={loading}
      sortField={sortField}
      sortDirection={sortDirection}
      onSort={onSort}
      footer={footer}
      style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0 }}
    />
  );
};
