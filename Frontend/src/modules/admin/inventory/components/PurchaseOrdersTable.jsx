import React from 'react';
import { CheckCircle2, PackageCheck, XCircle, Loader2 } from 'lucide-react';
import { DataTable } from '../../../../components/tables/DataTable';
import { StatusBadge } from '../../../../components/common/StatusBadge';
import { formatCurrency, formatDate } from '../../../../utils/formatters';

export const PurchaseOrdersTable = ({
  orders = [],
  loading = false,
  actionLoadingId = null,
  onUpdateStatus,
  footer
}) => {
  const columns = [
    {
      key: 'poNumber',
      header: 'PO Number',
      align: 'center',
      render: (val) => (
        <code style={{
          backgroundColor: 'var(--bg-muted)',
          padding: '3px 7px',
          borderRadius: '4px',
          fontSize: '11.5px',
          fontWeight: 700,
          color: 'var(--color-primary)',
          whiteSpace: 'nowrap'
        }}>
          {val}
        </code>
      )
    },
    {
      key: 'supplierName',
      header: 'Supplier',
      render: (val) => (
        <strong
          title={val}
          style={{
            fontSize: '12.5px',
            color: 'var(--text-primary)',
            display: 'block',
            maxWidth: '150px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          {val}
        </strong>
      )
    },
    {
      key: 'orderDate',
      header: 'Dates',
      render: (val, row) => (
        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
          <div>Ordered: {formatDate(val)}</div>
          <div>Expected: <strong>{formatDate(row.expectedDelivery)}</strong></div>
        </div>
      )
    },
    {
      key: 'items',
      header: 'Line Items',
      render: (items) => (
        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', maxWidth: '220px' }}>
          {items?.map((it, i) => (
            <div
              key={i}
              title={`${it.ingredientName}: ${it.qty} ${it.unit} @ ₹${it.unitPrice}`}
              style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
            >
              {it.ingredientName}: {it.qty} {it.unit} @ ₹{it.unitPrice}
            </div>
          ))}
        </div>
      )
    },
    {
      key: 'totalAmount',
      header: 'Total Value',
      align: 'center',
      render: (val) => (
        <strong style={{ fontSize: '13px', color: 'var(--color-primary)', whiteSpace: 'nowrap' }}>
          {formatCurrency(val)}
        </strong>
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
      width: '88px',
      render: (_, row) => {
        const canApprove = row.status === 'Submitted';
        const canReceive = row.status === 'Approved';
        const canCancel = row.status !== 'Received' && row.status !== 'Cancelled';

        if (!canApprove && !canReceive && !canCancel) {
          return (
            <div style={{ display: 'flex', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
              —
            </div>
          );
        }

        const isRowLoading = actionLoadingId === row.id;

        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
            {canApprove && (
              <button
                type="button"
                disabled={isRowLoading}
                onClick={() => onUpdateStatus(row.id, 'Approved')}
                style={{
                  background: 'none',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--border-radius-sm)',
                  padding: '5px',
                  color: 'var(--color-accent)',
                  cursor: isRowLoading ? 'not-allowed' : 'pointer',
                  opacity: isRowLoading ? 0.7 : 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="Approve Purchase Order"
                aria-label="Approve Purchase Order"
              >
                {isRowLoading ? <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> : <CheckCircle2 size={14} />}
              </button>
            )}

            {canReceive && (
              <button
                type="button"
                disabled={isRowLoading}
                onClick={() => onUpdateStatus(row.id, 'Received')}
                style={{
                  background: 'var(--color-success-bg)',
                  border: '1px solid var(--color-success-border)',
                  borderRadius: 'var(--border-radius-sm)',
                  padding: '5px',
                  color: 'var(--color-success-text)',
                  cursor: isRowLoading ? 'not-allowed' : 'pointer',
                  opacity: isRowLoading ? 0.7 : 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="Mark Delivery Received"
                aria-label="Mark Delivery Received"
              >
                {isRowLoading ? <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> : <PackageCheck size={14} />}
              </button>
            )}

            {canCancel && (
              <button
                type="button"
                disabled={isRowLoading}
                onClick={() => onUpdateStatus(row.id, 'Cancelled')}
                style={{
                  background: 'none',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--border-radius-sm)',
                  padding: '5px',
                  color: 'var(--color-danger)',
                  cursor: isRowLoading ? 'not-allowed' : 'pointer',
                  opacity: isRowLoading ? 0.7 : 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="Cancel Purchase Order"
                aria-label="Cancel Purchase Order"
              >
                <XCircle size={14} />
              </button>
            )}
          </div>
        );
      }
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
