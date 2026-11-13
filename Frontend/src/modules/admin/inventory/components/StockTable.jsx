import React, { useState } from 'react';
import { ArrowDownRight, ArrowUpRight, AlertTriangle, Sliders, MoreVertical } from 'lucide-react';
import { DataTable } from '../../../../components/tables/DataTable';
import { StatusBadge } from '../../../../components/common/StatusBadge';
import { formatDate } from '../../../../utils/formatters';

export const StockTable = ({
  items = [],
  loading = false,
  onOpenMovement,
  footer
}) => {
  const [popoverState, setPopoverState] = useState(null);

  const handleOpenPopover = (e, row) => {
    if (popoverState?.row?.id === row.id) {
      setPopoverState(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const openUpward = rect.bottom + 100 > window.innerHeight - 12;
    setPopoverState({
      row,
      top: openUpward ? undefined : rect.bottom + 4,
      bottom: openUpward ? window.innerHeight - rect.top + 4 : undefined,
      right: Math.max(12, window.innerWidth - rect.right)
    });
  };

  const columns = [
    {
      key: 'ingredientName',
      header: 'Ingredient / Material',
      render: (val, row) => (
        <div style={{ maxWidth: '170px', overflow: 'hidden' }}>
          <strong
            title={val}
            style={{
              color: 'var(--text-primary)',
              fontSize: '12.5px',
              display: 'block',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {val}
          </strong>
          <div
            title={row.outletName || 'Main Canteen'}
            style={{
              fontSize: '10.5px',
              color: 'var(--text-muted)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {row.outletName || 'Main Canteen'}
          </div>
        </div>
      )
    },
    {
      key: 'itemCode',
      header: 'Code',
      render: (val, row) => {
        const code = val || row.code || `ING-${String(row.id || row.itemId || 1).padStart(3, '0')}`;
        return (
          <code style={{
            backgroundColor: 'var(--bg-muted)',
            padding: '2px 6px',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: 600,
            color: 'var(--color-primary)',
            whiteSpace: 'nowrap'
          }}>
            {code}
          </code>
        );
      }
    },
    {
      key: 'availableQuantity',
      header: 'Available Stock',
      render: (val, row) => {
        const isLow = val <= row.reorderLevel;
        return (
          <div style={{ fontSize: '12.5px', whiteSpace: 'nowrap' }}>
            <span style={{ fontWeight: 700, color: isLow ? 'var(--color-danger)' : 'var(--text-primary)' }}>
              {val} {row.unit}
            </span>
            <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
              Reorder: {row.reorderLevel} {row.unit}
            </div>
          </div>
        );
      }
    },
    {
      key: 'batchNumber',
      header: 'Batch & Expiry',
      render: (val, row) => (
        <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
          <div>Batch: <code>{val}</code></div>
          <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>Exp: {formatDate(row.expiryDate)}</div>
        </div>
      )
    },
    {
      key: 'supplierName',
      header: 'Vendor / Supplier',
      render: (val) => (
        <span
          title={val}
          style={{
            fontSize: '12px',
            color: 'var(--text-secondary)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: 'block',
            maxWidth: '140px'
          }}
        >
          {val}
        </span>
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
      header: 'Log Movement',
      align: 'center',
      width: '96px',
      render: (_, row) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
          <button
            type="button"
            onClick={() => onOpenMovement(row, 'Stock In')}
            style={{
              background: 'var(--color-success-bg)',
              border: '1px solid var(--color-success-border)',
              borderRadius: 'var(--border-radius-sm)',
              padding: '5px',
              color: 'var(--color-success-text)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Log Stock In"
            aria-label="Log Stock In"
          >
            <ArrowDownRight size={14} />
          </button>

          <button
            type="button"
            onClick={() => onOpenMovement(row, 'Stock Out')}
            style={{
              background: 'var(--color-primary-light)',
              border: '1px solid var(--color-primary-border)',
              borderRadius: 'var(--border-radius-sm)',
              padding: '5px',
              color: 'var(--color-primary)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Log Kitchen Issue"
            aria-label="Log Kitchen Issue"
          >
            <ArrowUpRight size={14} />
          </button>

          <button
            type="button"
            onClick={(e) => handleOpenPopover(e, row)}
            style={{
              background: popoverState?.row?.id === row.id ? 'var(--bg-muted)' : 'none',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--border-radius-sm)',
              padding: '5px',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="More movement options"
            aria-label="More movement options"
          >
            <MoreVertical size={14} />
          </button>
        </div>
      )
    }
  ];

  const targetRow = popoverState?.row;

  return (
    <>
      <DataTable
        columns={columns}
        data={items}
        loading={loading}
        footer={footer}
      />

      {popoverState && (
        <>
          <div
            onClick={() => setPopoverState(null)}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 75
            }}
          />
          <div
            style={{
              position: 'fixed',
              top: popoverState.top,
              bottom: popoverState.bottom,
              right: popoverState.right,
              backgroundColor: 'var(--modal-bg)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--border-radius-md)',
              boxShadow: 'var(--shadow-modal)',
              zIndex: 80,
              minWidth: '170px',
              padding: '4px',
              display: 'flex',
              flexDirection: 'column',
              gap: '2px'
            }}
          >
            <button
              type="button"
              onClick={() => {
                setPopoverState(null);
                onOpenMovement(targetRow, 'Wastage');
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '7px 10px',
                borderRadius: 'var(--border-radius-sm)',
                border: 'none',
                background: 'none',
                color: 'var(--color-danger)',
                fontSize: '12.5px',
                fontWeight: 500,
                cursor: 'pointer',
                width: '100%',
                textAlign: 'left'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-danger-bg)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <AlertTriangle size={14} />
              <span>Log Wastage</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setPopoverState(null);
                onOpenMovement(targetRow, 'Adjustment');
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '7px 10px',
                borderRadius: 'var(--border-radius-sm)',
                border: 'none',
                background: 'none',
                color: 'var(--text-primary)',
                fontSize: '12.5px',
                fontWeight: 500,
                cursor: 'pointer',
                width: '100%',
                textAlign: 'left'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-muted)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <Sliders size={14} />
              <span>Audit Adjustment</span>
            </button>
          </div>
        </>
      )}
    </>
  );
};

export default StockTable;
