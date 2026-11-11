import React from 'react';
import { ArrowDownRight, ArrowUpRight, AlertTriangle, Sliders } from 'lucide-react';
import { DataTable } from '../../../../components/tables/DataTable';
import { StatusBadge } from '../../../../components/common/StatusBadge';
import { formatDate } from '../../../../utils/formatters';

export const StockTable = ({
  items = [],
  loading = false,
  onOpenMovement,
  footer
}) => {
  const columns = [
    {
      key: 'ingredientName',
      header: 'Ingredient / Raw Material',
      render: (val, row) => (
        <div>
          <strong style={{ color: 'var(--text-primary)', fontSize: '13px' }}>{val}</strong>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{row.outletName}</div>
        </div>
      )
    },
    {
      key: 'itemCode',
      header: 'Code',
      render: (val) => (
        <code style={{
          backgroundColor: 'var(--bg-muted)',
          padding: '2px 6px',
          borderRadius: '4px',
          fontSize: '11.5px',
          fontWeight: 600,
          color: 'var(--color-primary)'
        }}>
          {val}
        </code>
      )
    },
    {
      key: 'availableQuantity',
      header: 'Available Stock',
      render: (val, row) => {
        const isLow = val <= row.reorderLevel;
        return (
          <div style={{ fontSize: '13px' }}>
            <span style={{ fontWeight: 700, color: isLow ? 'var(--color-danger)' : 'var(--text-primary)' }}>
              {val} {row.unit}
            </span>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Reorder trigger: {row.reorderLevel} {row.unit}
            </div>
          </div>
        );
      }
    },
    {
      key: 'batchNumber',
      header: 'Batch & Expiry',
      render: (val, row) => (
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
          <div>Batch: <code>{val}</code></div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Expires: {formatDate(row.expiryDate)}</div>
        </div>
      )
    },
    {
      key: 'supplierName',
      header: 'Vendor / Supplier',
      render: (val) => (
        <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
          {val}
        </span>
      )
    },
    {
      key: 'status',
      header: 'Stock Status',
      render: (val) => <StatusBadge status={val} size="sm" />
    },
    {
      key: 'actions',
      header: 'Log Movement',
      align: 'right',
      render: (_, row) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
          <button
            type="button"
            onClick={() => onOpenMovement(row, 'Stock In')}
            style={{
              background: 'var(--color-success-bg)',
              border: '1px solid var(--color-success-border)',
              borderRadius: 'var(--border-radius-sm)',
              padding: '5px 8px',
              color: 'var(--color-success-text)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '3px',
              fontSize: '11.5px',
              fontWeight: 600
            }}
            title="Log Stock In"
          >
            <ArrowDownRight size={12} />
            <span>Stock In</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenMovement(row, 'Stock Out')}
            style={{
              background: 'var(--color-primary-light)',
              border: '1px solid var(--color-primary-border)',
              borderRadius: 'var(--border-radius-sm)',
              padding: '5px 8px',
              color: 'var(--color-primary)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '3px',
              fontSize: '11.5px',
              fontWeight: 600
            }}
            title="Log Kitchen Issue"
          >
            <ArrowUpRight size={12} />
            <span>Issue</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenMovement(row, 'Wastage')}
            style={{
              background: 'var(--color-danger-bg)',
              border: '1px solid var(--color-danger-border)',
              borderRadius: 'var(--border-radius-sm)',
              padding: '5px 8px',
              color: 'var(--color-danger)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '3px',
              fontSize: '11.5px',
              fontWeight: 600
            }}
            title="Log Wastage"
          >
            <AlertTriangle size={12} />
            <span>Waste</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenMovement(row, 'Adjustment')}
            style={{
              background: 'var(--bg-muted)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--border-radius-sm)',
              padding: '5px 8px',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '3px',
              fontSize: '11.5px',
              fontWeight: 500
            }}
            title="Audit Adjustment"
          >
            <Sliders size={12} />
            <span>Adjust</span>
          </button>
        </div>
      )
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

export default StockTable;
