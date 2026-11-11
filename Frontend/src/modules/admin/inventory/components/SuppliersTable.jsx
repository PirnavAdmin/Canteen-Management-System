import React from 'react';
import { Mail, Phone, MapPin } from 'lucide-react';
import { DataTable } from '../../../../components/tables/DataTable';
import { StatusBadge } from '../../../../components/common/StatusBadge';

export const SuppliersTable = ({ suppliers = [], loading = false }) => {
  const columns = [
    {
      key: 'name',
      header: 'Supplier / Vendor',
      render: (val) => (
        <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
          {val}
        </strong>
      )
    },
    {
      key: 'contactPerson',
      header: 'Contact Person',
      render: (val) => (
        <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
          {val}
        </span>
      )
    },
    {
      key: 'contact',
      header: 'Communication Details',
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
      header: 'Supplied Raw Materials',
      render: (val) => (
        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
          {val}
        </span>
      )
    },
    {
      key: 'address',
      header: 'Location / Warehouse',
      render: (val) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11.5px', color: 'var(--text-muted)', maxWidth: '200px' }} className="text-truncate">
          <MapPin size={11} style={{ flexShrink: 0 }} />
          <span>{val}</span>
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (val) => <StatusBadge status={val} size="sm" />
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
