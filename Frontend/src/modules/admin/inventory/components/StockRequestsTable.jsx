import React from 'react';
import { CheckCircle2, PackageCheck, XCircle, ShoppingCart, Loader2, AlertCircle, Clock, Building } from 'lucide-react';
import { DataTable } from '../../../../components/tables/DataTable';
import { StatusBadge } from '../../../../components/common/StatusBadge';
import { formatDate } from '../../../../utils/formatters';

export const StockRequestsTable = ({
  requests = [],
  loading = false,
  actionLoadingId = null,
  onApprove,
  onReject,
  onCreatePO,
  footer
}) => {
  const columns = [
    {
      key: 'id',
      header: 'Requisition ID',
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
      key: 'itemName',
      header: 'Ingredient / Item',
      render: (val, row) => (
        <div>
          <strong
            title={val}
            style={{
              fontSize: '12.5px',
              color: 'var(--text-primary)',
              display: 'block',
              maxWidth: '160px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {val}
          </strong>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginTop: '2px' }}>
            {row.itemCode ? `${row.itemCode} • ` : ''}{row.category || 'General Supplies'}
          </span>
        </div>
      )
    },
    {
      key: 'requestedQuantity',
      header: 'Requested Qty',
      align: 'center',
      render: (val, row) => (
        <strong style={{ fontSize: '13px', color: 'var(--color-primary)', whiteSpace: 'nowrap' }}>
          {val} {row.unit || 'kg'}
        </strong>
      )
    },
    {
      key: 'outlet',
      header: 'Outlet & Staff',
      render: (_, row) => (
        <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600, color: 'var(--text-primary)' }}>
            <Building size={12} style={{ color: 'var(--color-accent)' }} />
            <span>{row.outletName || (row.outletId === 1 ? 'Central Dining Hall' : `Outlet #${row.outletId || 1}`)}</span>
          </div>
          <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Requested by: <strong>{row.requestedBy || 'Staff'}</strong>
          </div>
        </div>
      )
    },
    {
      key: 'urgency',
      header: 'Urgency',
      align: 'center',
      render: (val) => {
        const u = String(val || 'Normal').toLowerCase();
        const isEmergency = u.includes('emergency') || u.includes('crit');
        const isHigh = u.includes('high');
        const bg = isEmergency ? 'var(--color-danger-bg)' : isHigh ? 'var(--color-warning-bg)' : 'var(--bg-muted)';
        const color = isEmergency ? 'var(--color-danger)' : isHigh ? 'var(--color-warning)' : 'var(--text-secondary)';
        const border = isEmergency ? 'var(--color-danger-border)' : isHigh ? 'var(--color-warning-border)' : 'var(--border-color)';

        return (
          <span style={{
            padding: '2px 8px',
            borderRadius: '9999px',
            fontSize: '11px',
            fontWeight: 700,
            backgroundColor: bg,
            color: color,
            border: `1px solid ${border}`,
            whiteSpace: 'nowrap'
          }}>
            {val || 'Normal'}
          </span>
        );
      }
    },
    {
      key: 'dates',
      header: 'Dates',
      render: (_, row) => (
        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
          <div>Needed by: <strong style={{ color: 'var(--text-primary)' }}>{formatDate(row.requiredByDate)}</strong></div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Created: {formatDate(row.createdAt)}</div>
        </div>
      )
    },
    {
      key: 'notes',
      header: 'Kitchen Reason',
      render: (val) => (
        <span
          title={val || 'No reason provided'}
          style={{
            fontSize: '11.5px',
            color: val ? 'var(--text-secondary)' : 'var(--text-muted)',
            display: 'block',
            maxWidth: '180px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          {val || '—'}
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
      header: 'Actions',
      align: 'center',
      width: '120px',
      render: (_, row) => {
        const isPending = row.status === 'Pending Review' || row.status === 'Pending';
        const isFulfilled = row.status === 'Fulfilled';
        const isRowLoading = actionLoadingId === row.id;

        if (isFulfilled) {
          return (
            <span style={{ fontSize: '11px', color: 'var(--color-success)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
              ✓ Fulfilled
            </span>
          );
        }

        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
            {/* Quick Inward / Approve Button */}
            <button
              type="button"
              disabled={isRowLoading}
              onClick={() => onApprove && onApprove(row.id)}
              style={{
                background: 'var(--color-success-bg)',
                border: '1px solid var(--color-success-border)',
                borderRadius: 'var(--border-radius-sm)',
                padding: '5px 7px',
                color: 'var(--color-success-text)',
                cursor: isRowLoading ? 'not-allowed' : 'pointer',
                opacity: isRowLoading ? 0.7 : 1,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '11px',
                fontWeight: 600
              }}
              title="Approve & Receive Stock into Inventory"
              aria-label="Approve and receive stock"
            >
              {isRowLoading ? <Loader2 size={13} style={{ animation: 'spin 0.8s linear infinite' }} /> : <PackageCheck size={13} />}
              <span>Approve</span>
            </button>

            {/* Convert to Purchase Order */}
            {onCreatePO && (
              <button
                type="button"
                disabled={isRowLoading}
                onClick={() => onCreatePO(row)}
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
                title="Create Vendor Purchase Order from this Requisition"
                aria-label="Create purchase order"
              >
                <ShoppingCart size={13} />
              </button>
            )}

            {/* Reject Button */}
            {isPending && onReject && (
              <button
                type="button"
                disabled={isRowLoading}
                onClick={() => onReject(row.id)}
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
                title="Reject Requisition"
                aria-label="Reject requisition"
              >
                <XCircle size={13} />
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
      data={requests}
      loading={loading}
      footer={footer}
    />
  );
};

export default StockRequestsTable;
