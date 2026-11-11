import React from 'react';
import { Eye, ArrowRight } from 'lucide-react';
import { DataTable } from '../../../../components/tables/DataTable';
import { StatusBadge } from '../../../../components/common/StatusBadge';
import { formatCurrency } from '../../../../utils/formatters';
import { ORDER_STATUS, ORDER_LIFECYCLE_NEXT_STEPS } from '../../../../constants/appConstants';

export const OrderTable = ({
  orders = [],
  loading = false,
  onView,
  onAdvanceStatus,
  footer
}) => {
  const columns = [
    {
      key: 'token',
      header: 'Token / ID',
      render: (val, row) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span
            onClick={() => onView(row)}
            style={{
              fontWeight: 700,
              color: 'var(--color-primary)',
              cursor: 'pointer',
              fontSize: '13.5px'
            }}
            onMouseEnter={(e) => { e.target.style.textDecoration = 'underline'; }}
            onMouseLeave={(e) => { e.target.style.textDecoration = 'none'; }}
          >
            {val}
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            {row.id}
          </span>
        </div>
      )
    },
    {
      key: 'customer',
      header: 'Customer',
      render: (val) => (
        <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '160px', overflow: 'hidden' }}>
          <span
            title={val.name}
            style={{
              fontSize: '13px',
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
              fontSize: '11px',
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
      key: 'items',
      header: 'Items',
      render: (items) => {
        const itemStr = items.map(i => `${i.name} (x${i.quantity})`).join(', ');
        return (
          <div
            title={itemStr}
            style={{
              fontSize: '12px',
              color: 'var(--text-secondary)',
              maxWidth: '190px',
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
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
          <div style={{ fontWeight: 500 }}>{val.timeWindow}</div>
          <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>{val.session}</div>
        </div>
      )
    },
    {
      key: 'totalAmount',
      header: 'Total',
      render: (val) => (
        <span style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-primary)' }}>
          {formatCurrency(val)}
        </span>
      )
    },
    {
      key: 'payment',
      header: 'Payment',
      render: (val) => (
        <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
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
      render: (val) => <StatusBadge status={val} size="sm" />
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (_, row) => {
        const nextSteps = ORDER_LIFECYCLE_NEXT_STEPS[row.status] || [];
        const nextOperationalStatus = nextSteps.find(s => s !== ORDER_STATUS.CANCELLED && s !== ORDER_STATUS.REFUNDED);

        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
            <button
              type="button"
              onClick={() => onView(row)}
              style={{
                background: 'none',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--border-radius-sm)',
                padding: '6px 8px',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '12px'
              }}
              title="View Order Details"
            >
              <Eye size={13} />
              <span>Details</span>
            </button>

            {nextOperationalStatus && (
              <button
                type="button"
                onClick={() => onAdvanceStatus(row, nextOperationalStatus)}
                style={{
                  background: 'var(--color-primary-light)',
                  border: '1px solid var(--color-primary-border)',
                  borderRadius: 'var(--border-radius-sm)',
                  padding: '6px 10px',
                  color: 'var(--color-primary)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '12px',
                  fontWeight: 600
                }}
                title={`Advance to ${nextOperationalStatus}`}
              >
                <span>{nextOperationalStatus}</span>
                <ArrowRight size={13} />
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
