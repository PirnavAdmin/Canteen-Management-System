import React from 'react';
import { Eye, CheckCircle, ChefHat, BellRing, CheckCheck, ArrowRight, Loader2, XCircle, Printer } from 'lucide-react';
import { DataTable } from '../../../../components/tables/DataTable';
import { StatusBadge } from '../../../../components/common/StatusBadge';
import { formatCurrency, formatTimeIST, formatDate, isSameIstDate } from '../../../../utils/formatters';
import { ORDER_STATUS, ORDER_LIFECYCLE_NEXT_STEPS } from '../../../../constants/appConstants';

const getStepIcon = (nextStatus) => {
  switch (nextStatus) {
    case ORDER_STATUS.ACCEPTED:
      return CheckCircle;
    case ORDER_STATUS.PREPARING:
      return ChefHat;
    case ORDER_STATUS.READY_FOR_PICKUP:
      return BellRing;
    case ORDER_STATUS.COMPLETED:
      return CheckCheck;
    default:
      return ArrowRight;
  }
};

export const OrderTable = ({
  orders = [],
  loading = false,
  actionLoadingId = null,
  onView,
  onAdvanceStatus,
  onCancel,
  onPrintReceipt,
  footer
}) => {
  const columns = [
    {
      key: 'token',
      header: 'Token / ID',
      width: '75px',
      render: (val, row) => (
        <div style={{ display: 'flex', flexDirection: 'column', whiteSpace: 'nowrap' }}>
          <span
            onClick={() => onView(row)}
            title={`Order ${row.id}`}
            style={{
              fontWeight: 700,
              color: 'var(--color-primary)',
              cursor: 'pointer',
              fontSize: '12.5px'
            }}
            onMouseEnter={(e) => { e.target.style.textDecoration = 'underline'; }}
            onMouseLeave={(e) => { e.target.style.textDecoration = 'none'; }}
          >
            {val || row?.token || row?.id || '—'}
          </span>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
            {row.id}
          </span>
          {(row.orderDate || row.createdAt) && (
            <span style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '1px' }}>
              {isSameIstDate(row.orderDate || row.createdAt)
                ? formatTimeIST(row.orderDate || row.createdAt)
                : `${formatDate(row.orderDate || row.createdAt)}, ${formatTimeIST(row.orderDate || row.createdAt)}`}
            </span>
          )}
        </div>
      )
    },
    {
      key: 'customer',
      header: 'Customer',
      render: (val) => {
        const custName = typeof val === 'object' ? (val?.name || val?.fullName || val?.id || '—') : (val || '—');
        const custRole = typeof val === 'object' ? (val?.role || '') : '';
        const custDept = typeof val === 'object' ? (val?.rollNo || val?.department || '') : '';
        return (
          <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '115px', overflow: 'hidden' }}>
            <span
              title={custName}
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {custName}
            </span>
            {custRole && (
              <span
                title={`${custRole}${custDept ? ` • ${custDept}` : ''}`}
                style={{
                  fontSize: '10px',
                  color: 'var(--text-muted)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {custRole}{custDept ? ` • ${custDept}` : ''}
              </span>
            )}
          </div>
        );
      }
    },
    {
      key: 'outletName',
      header: 'Outlet',
      render: (val, row) => {
        const outStr = typeof val === 'object'
          ? (val?.name || val?.outletName || val?.id || '')
          : (val || (typeof row?.outlet === 'object' ? (row.outlet?.name || row.outlet?.id) : (row?.outlet || '—')));
        return (
          <span
            title={outStr}
            style={{
              fontSize: '11.5px',
              color: 'var(--text-secondary)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: 'block',
              maxWidth: '100px'
            }}
          >
            {outStr}
          </span>
        );
      }
    },
    {
      key: 'items',
      header: 'Items',
      render: (items, row) => {
        const itemStr = (Array.isArray(items) ? items : []).map(i => `${i.name} (x${i.quantity})`).join(', ');
        const hasNotes = Boolean(row?.notes || row?.cookingNotes);
        return (
          <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '125px' }}>
            <span
              title={itemStr}
              style={{
                fontSize: '11.5px',
                color: 'var(--text-secondary)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {itemStr}
            </span>
            {hasNotes && (
              <span
                title={`Note: ${row.notes || row.cookingNotes}`}
                style={{
                  fontSize: '9.5px',
                  color: '#b45309',
                  backgroundColor: '#fef3c7',
                  padding: '1px 4px',
                  borderRadius: '3px',
                  marginTop: '2px',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: 'inline-block'
                }}
              >
                📝 {row.notes || row.cookingNotes}
              </span>
            )}
          </div>
        );
      }
    },
    {
      key: 'totalAmount',
      header: 'Total',
      render: (val) => (
        <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
          {formatCurrency(val)}
        </span>
      )
    },
    {
      key: 'payment',
      header: 'Payment',
      render: (val) => (
        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
          <div>{val?.method || 'Campus Wallet'}</div>
          <div style={{
            color: val?.status === 'Paid' ? 'var(--color-success)' : val?.status === 'Refunded' ? '#d97706' : 'var(--color-danger)',
            fontWeight: 600
          }}>
            {val?.status || 'Paid'}
          </div>
        </div>
      )
    },
    {
      key: 'status',
      header: 'Order Status',
      align: 'center',
      render: (val) => <StatusBadge status={val} size="sm" />
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'center',
      width: '105px',
      render: (_, row) => {
        const orderStatus = row?.status || ORDER_STATUS.PLACED;
        const nextSteps = ORDER_LIFECYCLE_NEXT_STEPS[orderStatus] || [];
        const nextOperationalStatus = nextSteps.find(s => s !== ORDER_STATUS.CANCELLED && s !== ORDER_STATUS.REFUNDED);
        const StepIcon = nextOperationalStatus ? getStepIcon(nextOperationalStatus) : null;
        const isCancellable = orderStatus !== ORDER_STATUS.COMPLETED && orderStatus !== ORDER_STATUS.CANCELLED && orderStatus !== ORDER_STATUS.REFUNDED;

        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
            <button
              type="button"
              onClick={() => onPrintReceipt && onPrintReceipt(row)}
              style={{
                background: 'none',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                padding: '5px',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease'
              }}
              title="Print Receipt (Thermal / A4)"
              aria-label="Print Receipt"
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--bg-muted)';
                e.currentTarget.style.color = 'var(--color-primary)';
                e.currentTarget.style.borderColor = 'var(--color-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--text-secondary)';
                e.currentTarget.style.borderColor = 'var(--border-color)';
              }}
            >
              <Printer size={14} />
            </button>

            {nextOperationalStatus && StepIcon && (
              <button
                type="button"
                disabled={actionLoadingId === row.id}
                onClick={() => onAdvanceStatus(row, nextOperationalStatus)}
                style={{
                  background: 'var(--color-primary-light)',
                  border: '1px solid var(--color-primary-border)',
                  borderRadius: '4px',
                  padding: '5px',
                  color: 'var(--color-primary)',
                  cursor: actionLoadingId === row.id ? 'not-allowed' : 'pointer',
                  opacity: actionLoadingId === row.id ? 0.7 : 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s ease'
                }}
                title={`Mark as ${nextOperationalStatus}`}
                aria-label={`Mark as ${nextOperationalStatus}`}
              >
                {actionLoadingId === row.id ? (
                  <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} />
                ) : (
                  <StepIcon size={14} />
                )}
              </button>
            )}

            {isCancellable && onCancel && (
              <button
                type="button"
                disabled={actionLoadingId === row.id}
                onClick={() => onCancel(row)}
                style={{
                  background: 'none',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  padding: '5px',
                  color: 'var(--color-danger, #ef4444)',
                  cursor: actionLoadingId === row.id ? 'not-allowed' : 'pointer',
                  opacity: actionLoadingId === row.id ? 0.7 : 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s ease'
                }}
                title="Cancel Order"
                aria-label="Cancel Order"
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.08)';
                  e.currentTarget.style.borderColor = 'var(--color-danger, #ef4444)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                }}
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

export default OrderTable;
