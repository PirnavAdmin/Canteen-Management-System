import React from 'react';
import { Eye, CheckCircle, ChefHat, BellRing, PackageCheck, ArrowRight, Loader2 } from 'lucide-react';
import { DataTable } from '../../../../components/tables/DataTable';
import { StatusBadge } from '../../../../components/common/StatusBadge';
import { formatCurrency } from '../../../../utils/formatters';
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
      return PackageCheck;
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
            {val}
          </span>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
            {row.id}
          </span>
        </div>
      )
    },
    {
      key: 'customer',
      header: 'Customer',
      render: (val) => (
        <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '115px', overflow: 'hidden' }}>
          <span
            title={val.name}
            style={{
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--text-primary)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {val.name}
          </span>
          <span
            title={`${val.role} • ${val.rollNo || val.department}`}
            style={{
              fontSize: '10px',
              color: 'var(--text-muted)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {val.role} • {val.rollNo || val.department}
          </span>
        </div>
      )
    },
    {
      key: 'outletName',
      header: 'Outlet',
      render: (val) => (
        <span
          title={val}
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
          {val}
        </span>
      )
    },
    {
      key: 'items',
      header: 'Items',
      render: (items) => {
        const itemStr = items.map(i => `${i.name} (x${i.quantity})`).join(', ');
        return (
          <div
            title={itemStr}
            style={{
              fontSize: '11.5px',
              color: 'var(--text-secondary)',
              maxWidth: '120px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {itemStr}
          </div>
        );
      }
    },
    {
      key: 'slot',
      header: 'Pickup Slot',
      render: (val) => (
        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
          <div style={{ fontWeight: 500 }}>{val.timeWindow}</div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{val.session}</div>
        </div>
      )
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
          <div>{val.method}</div>
          <div style={{
            color: val.status === 'Paid' ? 'var(--color-success)' : val.status === 'Refunded' ? '#d97706' : 'var(--color-danger)',
            fontWeight: 600
          }}>
            {val.status}
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
      width: '80px',
      render: (_, row) => {
        const nextSteps = ORDER_LIFECYCLE_NEXT_STEPS[row.status] || [];
        const nextOperationalStatus = nextSteps.find(s => s !== ORDER_STATUS.CANCELLED && s !== ORDER_STATUS.REFUNDED);
        const StepIcon = nextOperationalStatus ? getStepIcon(nextOperationalStatus) : null;

        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
            <button
              type="button"
              onClick={() => onView(row)}
              style={{
                background: 'none',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                padding: '5px',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="View Order Details"
              aria-label="View Order Details"
            >
              <Eye size={14} />
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
                  justifyContent: 'center'
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
