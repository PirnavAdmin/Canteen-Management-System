import React from 'react';
import { CheckCircle2, PackageCheck, Send, Clock, ChefHat } from 'lucide-react';
import { DataTable } from '../../../../components/tables/DataTable';
import { StatusBadge } from '../../../../components/common/StatusBadge';
import { formatDate } from '../../../../utils/formatters';
import { Button } from '../../../../components/common/Button';
import { EmptyState } from '../../../../components/common/EmptyState';

export const KitchenRequestsTable = ({
  requests = [],
  loading = false,
  onOpenApprove,
  onMarkReceived,
  footer
}) => {
  const columns = [
    {
      key: 'requestId',
      header: 'REQ # / ID',
      align: 'center',
      render: (val, row) => {
        const idStr = val || row.id || 'REQ-001';
        const displayId = String(idStr).startsWith('REQ-') ? idStr : `REQ-${idStr}`;
        return (
          <code style={{
            backgroundColor: 'var(--bg-muted)',
            padding: '3px 7px',
            borderRadius: '4px',
            fontSize: '11.5px',
            fontWeight: 700,
            color: 'var(--color-primary)',
            whiteSpace: 'nowrap'
          }}>
            {displayId}
          </code>
        );
      }
    },
    {
      key: 'outletName',
      header: 'Kitchen / Outlet',
      render: (val, row) => (
        <div>
          <strong
            style={{
              fontSize: '12.5px',
              color: 'var(--text-primary)',
              display: 'block',
              whiteSpace: 'nowrap'
            }}
          >
            {val || (row.outletId === 1 ? 'Main Canteen Kitchen' : `Outlet #${row.outletId || 1} Kitchen`)}
          </strong>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginTop: '2px' }}>
            Requested by: {row.requestedBy || 'Kitchen Staff'}
          </span>
        </div>
      )
    },
    {
      key: 'itemName',
      header: 'Requested Item & Qty',
      render: (val, row) => {
        const name = val || row.ingredientName || 'Kitchen Item';
        const qty = row.requestedQuantity || row.quantity || 0;
        const unit = row.unit || 'kg';
        const urgency = row.urgency || 'Normal';
        const isUrgent = urgency.toLowerCase() === 'high' || urgency.toLowerCase() === 'emergency';

        return (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <strong style={{ fontSize: '12.5px', color: 'var(--text-primary)' }}>
                {name}
              </strong>
              {isUrgent && (
                <span style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  padding: '1px 5px',
                  borderRadius: '3px',
                  backgroundColor: 'var(--color-danger-light, #fee2e2)',
                  color: 'var(--color-danger, #ef4444)'
                }}>
                  {urgency}
                </span>
              )}
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Quantity Required: <strong style={{ color: 'var(--color-primary)' }}>{qty} {unit}</strong>
              {row.issuedQuantity && row.issuedQuantity !== qty && (
                <span style={{ marginLeft: '6px', color: 'var(--text-muted)' }}>
                  (Issued: {row.issuedQuantity} {unit})
                </span>
              )}
            </div>
          </div>
        );
      }
    },
    {
      key: 'createdAt',
      header: 'Date & Needed By',
      render: (val, row) => (
        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
          <div>Requested: {formatDate(val || new Date())}</div>
          {row.requiredByDate && (
            <div style={{ color: 'var(--text-muted)', marginTop: '2px' }}>
              Needed by: <strong>{formatDate(row.requiredByDate)}</strong>
            </div>
          )}
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (val) => {
        const s = val || 'Pending Review';
        let badgeType = 'Pending';
        if (s.toLowerCase().includes('received') || s.toLowerCase().includes('fulfilled')) {
          badgeType = 'Completed';
        } else if (s.toLowerCase().includes('issued') || s.toLowerCase().includes('dispatch') || s.toLowerCase().includes('approved')) {
          badgeType = 'Ready for Pickup';
        }

        return <StatusBadge status={badgeType} label={s} size="sm" />;
      }
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'center',
      width: '160px',
      render: (_, row) => {
        const s = (row.status || 'Pending Review').toLowerCase();
        const isPending = s.includes('pending') || s === 'requested';
        const isIssued = s.includes('issued') || s.includes('dispatch') || s.includes('approved');
        const isReceived = s.includes('received') || s.includes('fulfilled');

        if (isPending) {
          return (
            <button
              type="button"
              onClick={() => onOpenApprove(row)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 10px',
                fontSize: '11.5px',
                fontWeight: 600,
                color: '#ffffff',
                backgroundColor: 'var(--color-primary)',
                border: 'none',
                borderRadius: 'var(--border-radius-sm)',
                cursor: 'pointer'
              }}
            >
              <Send size={12} />
              <span>Approve & Issue</span>
            </button>
          );
        }

        if (isIssued) {
          return (
            <button
              type="button"
              onClick={() => onMarkReceived(row)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 10px',
                fontSize: '11.5px',
                fontWeight: 600,
                color: 'var(--color-success)',
                backgroundColor: 'var(--color-success-bg, #ecfdf5)',
                border: '1px solid var(--color-success-border, #a7f3d0)',
                borderRadius: 'var(--border-radius-sm)',
                cursor: 'pointer'
              }}
            >
              <PackageCheck size={13} />
              <span>Mark as Received</span>
            </button>
          );
        }

        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11.5px', color: 'var(--color-success)', fontWeight: 600 }}>
            <CheckCircle2 size={13} />
            <span>Stock Received</span>
          </span>
        );
      }
    }
  ];

  return (
    <DataTable
      columns={columns}
      data={requests}
      keyField="id"
      loading={loading}
      footer={footer}
      emptyState={
        <EmptyState
          icon={ChefHat}
          title="No Kitchen Stock Requests"
          message="No active stock requisitions from campus kitchens at this time."
        />
      }
    />
  );
};

export default KitchenRequestsTable;
