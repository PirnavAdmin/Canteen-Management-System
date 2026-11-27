import React from 'react';
import { CheckCircle2, PackageCheck, Send, Clock, ChefHat, Edit2, Trash2, XCircle } from 'lucide-react';
import { DataTable } from '../../../../components/tables/DataTable';
import { StatusBadge } from '../../../../components/common/StatusBadge';
import { formatDate } from '../../../../utils/formatters';
import { Button } from '../../../../components/common/Button';
import { EmptyState } from '../../../../components/common/EmptyState';

export const KitchenRequestsTable = ({
  requests = [],
  loading = false,
  isWarehouseScope = false,
  onOpenApprove,
  onOpenReject,
  onMarkReceived,
  onEditRequest,
  onDeleteRequest,
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
      header: 'Kitchen / Source',
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
            🍳 {val || (row.outletId === 1 ? 'Main Canteen Kitchen' : `Outlet #${row.outletId || 1} Kitchen`)}
          </strong>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginTop: '2px' }}>
            To: <strong>Central Warehouse</strong> • By: {row.requestedBy || 'Chef'}
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
      render: (val, row) => {
        const s = (val || row?.status || 'Pending Review').toLowerCase();
        const isRejected = s.includes('reject');
        const isReceived = s.includes('received') || s.includes('fulfilled') || s.includes('completed');
        const isIssued = s.includes('issued') || s.includes('dispatch') || s.includes('approved');

        if (isRejected) {
          const reasonText = row?.rejectionReason || row?.adminNotes || row?.notes || '';
          return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <StatusBadge status="Voided" label="Rejected" size="sm" />
              {reasonText && (
                <div
                  title={reasonText}
                  style={{
                    fontSize: '10.5px',
                    color: 'var(--color-danger, #ef4444)',
                    marginTop: '3px',
                    maxWidth: '160px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    fontWeight: 600
                  }}
                >
                  {reasonText}
                </div>
              )}
            </div>
          );
        }

        if (isReceived) {
          const label = isWarehouseScope ? 'Received' : 'Completed';
          return <StatusBadge status="Completed" label={label} size="sm" />;
        } else if (isIssued) {
          const label = isWarehouseScope ? 'Dispatched' : 'Approved';
          return <StatusBadge status="Ready for Pickup" label={label} size="sm" />;
        }

        const label = 'Pending';
        return <StatusBadge status="Pending" label={label} size="sm" />;
      }
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'center',
      width: '180px',
      render: (_, row) => {
        const s = (row.status || 'Pending Review').toLowerCase();
        const isRejected = s.includes('reject');
        const isPending = s.includes('pending') || s === 'requested';
        const isIssued = s.includes('issued') || s.includes('dispatch') || s.includes('approved');
        const isReceived = s.includes('received') || s.includes('fulfilled') || s.includes('completed');

        if (isWarehouseScope) {
          // ADMIN / CENTRAL WAREHOUSE VIEW:
          if (isPending) {
            return (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => onOpenApprove(row)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '5px 9px',
                    fontSize: '11.5px',
                    fontWeight: 600,
                    color: '#ffffff',
                    backgroundColor: 'var(--color-primary)',
                    border: 'none',
                    borderRadius: 'var(--border-radius-sm)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                  title="Approve & Dispatch Stock"
                >
                  <Send size={11} />
                  <span>Approve & Issue</span>
                </button>

                <button
                  type="button"
                  onClick={() => onOpenReject && onOpenReject(row)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '5px 8px',
                    fontSize: '11.5px',
                    fontWeight: 600,
                    color: 'var(--color-danger, #ef4444)',
                    backgroundColor: 'var(--color-danger-light, #fee2e2)',
                    border: '1px solid var(--color-danger-border, #fecaca)',
                    borderRadius: 'var(--border-radius-sm)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                  title="Reject Requisition with Reason"
                >
                  <XCircle size={11} />
                  <span>Reject</span>
                </button>
              </div>
            );
          }

          if (isRejected) {
            return (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--color-danger)', fontWeight: 600 }}>
                <XCircle size={13} />
                <span>Rejected</span>
              </span>
            );
          }

          if (isIssued) {
            return (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--color-primary)', fontWeight: 600 }}>
                <Clock size={13} />
                <span>In Transit</span>
              </span>
            );
          }

          return (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11.5px', color: 'var(--color-success)', fontWeight: 600 }}>
              <CheckCircle2 size={13} />
              <span>Received by Kitchen</span>
            </span>
          );
        } else {
          // OUTLET KITCHEN VIEW:
          if (isRejected) {
            return (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--color-danger)', fontWeight: 600 }}>
                <XCircle size={13} />
                <span>Rejected</span>
              </span>
            );
          }
          if (isPending) {
            return (
              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => onEditRequest && onEditRequest(row)}
                  style={{
                    background: 'var(--color-primary-light, #eff6ff)',
                    border: '1px solid var(--color-primary-border, #bfdbfe)',
                    borderRadius: 'var(--border-radius-sm, 4px)',
                    padding: '6px',
                    color: 'var(--color-primary, #2563eb)',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s ease'
                  }}
                  title="Edit Requested Quantity"
                  aria-label="Edit Requested Quantity"
                >
                  <Edit2 size={13} />
                </button>

                <button
                  type="button"
                  onClick={() => onDeleteRequest && onDeleteRequest(row)}
                  style={{
                    background: 'var(--color-danger-light, #fee2e2)',
                    border: '1px solid var(--color-danger-border, #fecaca)',
                    borderRadius: 'var(--border-radius-sm, 4px)',
                    padding: '6px',
                    color: 'var(--color-danger, #ef4444)',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s ease'
                  }}
                  title="Delete Requisition"
                  aria-label="Delete Requisition"
                >
                  <Trash2 size={13} />
                </button>
              </div>
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
                title="Confirm receipt of goods from warehouse"
              >
                <PackageCheck size={13} />
                <span>Receive Items</span>
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
