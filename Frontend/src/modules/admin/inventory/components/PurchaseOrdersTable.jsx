import React from 'react';
import { CheckCircle2, PackageCheck, XCircle } from 'lucide-react';
import { DataTable } from '../../../../components/tables/DataTable';
import { StatusBadge } from '../../../../components/common/StatusBadge';
import { formatCurrency, formatDate } from '../../../../utils/formatters';

export const PurchaseOrdersTable = ({
  orders = [],
  loading = false,
  onUpdateStatus,
  footer
}) => {
  const columns = [
    {
      key: 'poNumber',
      header: 'PO Number',
      render: (val) => (
        <code style={{
          backgroundColor: 'var(--bg-muted)',
          padding: '3px 8px',
          borderRadius: '4px',
          fontSize: '12px',
          fontWeight: 700,
          color: 'var(--color-primary)'
        }}>
          {val}
        </code>
      )
    },
    {
      key: 'supplierName',
      header: 'Supplier',
      render: (val) => (
        <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
          {val}
        </strong>
      )
    },
    {
      key: 'orderDate',
      header: 'Dates',
      render: (val, row) => (
        <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
          <div>Ordered: {formatDate(val)}</div>
          <div>Expected: <strong>{formatDate(row.expectedDelivery)}</strong></div>
        </div>
      )
    },
    {
      key: 'items',
      header: 'Line Items',
      render: (items) => (
        <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', maxWidth: '240px' }}>
          {items?.map((it, i) => (
            <div key={i}>{it.ingredientName}: {it.qty} {it.unit} @ ₹{it.unitPrice}</div>
          ))}
        </div>
      )
    },
    {
      key: 'totalAmount',
      header: 'Total Value',
      render: (val) => (
        <strong style={{ fontSize: '13.5px', color: 'var(--color-primary)' }}>
          {formatCurrency(val)}
        </strong>
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
      render: (_, row) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
          {row.status === 'Submitted' && (
            <button
              type="button"
              onClick={() => onUpdateStatus(row.id, 'Approved')}
              style={{
                background: 'none',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--border-radius-sm)',
                padding: '4px 8px',
                color: 'var(--color-accent)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                fontSize: '11.5px',
                fontWeight: 600
              }}
              title="Approve PO"
            >
              <CheckCircle2 size={12} />
              <span>Approve</span>
            </button>
          )}

          {row.status === 'Approved' && (
            <button
              type="button"
              onClick={() => onUpdateStatus(row.id, 'Received')}
              style={{
                background: 'var(--color-success-bg)',
                border: '1px solid var(--color-success-border)',
                borderRadius: 'var(--border-radius-sm)',
                padding: '4px 8px',
                color: 'var(--color-success-text)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                fontSize: '11.5px',
                fontWeight: 600
              }}
              title="Mark Delivery Received"
            >
              <PackageCheck size={12} />
              <span>Receive</span>
            </button>
          )}

          {row.status !== 'Received' && row.status !== 'Cancelled' && (
            <button
              type="button"
              onClick={() => onUpdateStatus(row.id, 'Cancelled')}
              style={{
                background: 'none',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--border-radius-sm)',
                padding: '4px 8px',
                color: 'var(--color-danger)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                fontSize: '11.5px'
              }}
              title="Cancel PO"
            >
              <XCircle size={12} />
              <span>Cancel</span>
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <DataTable
      columns={columns}
      data={orders}
      loading={loading}
      footer={footer}
    />
  );
};

export default PurchaseOrdersTable;
