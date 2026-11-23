import React from 'react';
import { DataTable } from '../../../../components/tables/DataTable';
import { formatDateTime } from '../../../../utils/formatters';

export const StockLedgerTable = ({ ledger = [], loading = false, footer }) => {
  const columns = [
    {
      key: 'dateTime',
      header: 'Date & Time',
      render: (val, row) => (
        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
          {formatDateTime(val || row.createdAt || row.timestamp || row.date || new Date())}
        </span>
      )
    },
    {
      key: 'ingredientName',
      header: 'Ingredient',
      render: (val, row) => (
        <div>
          <strong style={{ fontSize: '13px', color: 'var(--text-primary)', display: 'block' }}>
            {val || row.name || row.itemName || 'Raw Material'}
          </strong>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginTop: '1px' }}>
            {row.outletName || (row.outletId === 1 ? 'Main Canteen' : (row.outletId ? `Outlet #${row.outletId}` : 'Main Canteen'))}
          </span>
        </div>
      )
    },
    {
      key: 'movementType',
      header: 'Movement Type',
      render: (val) => {
        const isPositive = val === 'Stock In';
        const isNegative = val === 'Stock Out' || val === 'Wastage';
        return (
          <span style={{
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: 600,
            backgroundColor: isPositive ? 'var(--color-success-bg)' : isNegative ? 'var(--color-danger-bg)' : 'var(--bg-muted)',
            color: isPositive ? 'var(--color-success)' : isNegative ? 'var(--color-danger)' : 'var(--text-secondary)',
            border: `1px solid ${isPositive ? 'var(--color-success-border)' : isNegative ? 'var(--color-danger-border)' : 'var(--border-color)'}`
          }}>
            {val}
          </span>
        );
      }
    },
    {
      key: 'quantity',
      header: 'Quantity',
      render: (val, row) => {
        const q = Number(val || row.qty || 0);
        const isPositive = q > 0 || row.movementType === 'Stock In';
        return (
          <span style={{
            fontSize: '13px',
            fontWeight: 700,
            color: isPositive ? 'var(--color-success)' : 'var(--color-danger)'
          }}>
            {isPositive ? `+${Math.abs(q)}` : `-${Math.abs(q)}`} {row.unit || 'kg'}
          </span>
        );
      }
    },
    {
      key: 'batchNumber',
      header: 'Batch & Ref',
      render: (val, row) => (
        <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
          <div>Batch: <code>{val || 'N/A'}</code></div>
          <div>Ref: <code>{row.reference || 'N/A'}</code></div>
        </div>
      )
    },
    {
      key: 'reason',
      header: 'Reason / Justification',
      render: (val) => (
        <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', maxWidth: '240px' }}>
          {val}
        </span>
      )
    },
    {
      key: 'performedBy',
      header: 'Authorized By',
      render: (val) => (
        <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
          {val}
        </span>
      )
    }
  ];

  return (
    <DataTable
      columns={columns}
      data={ledger}
      loading={loading}
      footer={footer}
    />
  );
};

export default StockLedgerTable;
