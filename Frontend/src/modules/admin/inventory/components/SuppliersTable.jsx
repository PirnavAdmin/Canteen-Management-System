import React from 'react';
import { Mail, Phone, MapPin, Edit, Trash2 } from 'lucide-react';
import { DataTable } from '../../../../components/tables/DataTable';
import { StatusBadge } from '../../../../components/common/StatusBadge';

export const SuppliersTable = ({
  suppliers = [],
  loading = false,
  onEdit,
  onDeactivate
}) => {
  const columns = [
    {
      key: 'name',
      header: 'Suppliers Name',
      render: (val, row) => (
        <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
          {val || row.contactPerson}
        </strong>
      )
    },
    {
      key: 'contact',
      header: 'Details',
      render: (_, row) => (
        <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Phone size={11} style={{ color: 'var(--text-muted)' }} />
            <span>{row.phone}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Mail size={11} style={{ color: 'var(--text-muted)' }} />
            <span>{row.email}</span>
          </div>
        </div>
      )
    },
    {
      key: 'suppliedCategories',
      header: 'Raw Materials',
      render: (val) => (
        <span style={{ fontSize: '12px', color: val ? 'var(--text-secondary)' : 'var(--text-muted)' }}>
          {val || '--'}
        </span>
      )
    },
    {
      key: 'address',
      header: 'Location / Warehouse',
      render: (val) => val ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11.5px', color: 'var(--text-muted)', maxWidth: '200px' }} className="text-truncate">
          <MapPin size={11} style={{ flexShrink: 0 }} />
          <span>{val}</span>
        </div>
      ) : (
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>--</span>
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
      align: 'center',
      width: '90px',
      render: (_, row) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          <button
            type="button"
            onClick={() => onEdit && onEdit(row)}
            title="Edit Supplier"
            aria-label="Edit Supplier"
            style={{
              background: 'none',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--border-radius-sm)',
              padding: '5px',
              color: 'var(--color-accent)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all var(--transition-fast)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-muted)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <Edit size={13} />
          </button>

          <button
            type="button"
            onClick={() => onDeactivate && onDeactivate(row)}
            title={row.status === 'Inactive' ? 'Activate Supplier' : 'Deactivate Supplier'}
            aria-label="Deactivate Supplier"
            style={{
              background: 'none',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--border-radius-sm)',
              padding: '5px',
              color: 'var(--color-danger)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all var(--transition-fast)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-danger-bg)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <Trash2 size={13} />
          </button>
        </div>
      )
    }
  ];

  return (
    <DataTable
      columns={columns}
      data={suppliers}
      loading={loading}
    />
  );
};

export default SuppliersTable;
