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
            onClick={() => onView && onView(row)}
            style={{
              fontWeight: 700,
              color: 'var(--color-primary)',
              cursor: 'pointer',
              fontSize: '13.5px'
            }}
            onMouseEnter={(e) => { e.target.style.textDecoration = 'underline'; }}
            onMouseLeave={(e) => { e.target.style.textDecoration = 'none'; }}
          >
            {val || row?.token || row?.id || '—'}
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            {row?.id || '—'}
          </span>
        </div>
      )
    },
    {
      key: 'customer',
      header: 'Customer',
      render: (val, row) => {
        const custName = val?.name || row?.customerName || (typeof val === 'string' ? val : 'Walk-in Customer');
        const custRole = val?.role || row?.customerRole || 'Student';
        const custId = val?.rollNo || val?.department || row?.customerRollNo || row?.rollNo || '';

        return (
          <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '160px', overflow: 'hidden' }}>
            <span
              title={custName}
              style={{
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {custName}
            </span>
            <span
              title={`${custRole}${custId ? ` • ${custId}` : ''}`}
              style={{
                fontSize: '11px',
                color: 'var(--text-muted)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {custRole}{custId ? ` • ${custId}` : ''}
            </span>
          </div>
        );
      }
    },
    {
      key: 'outletName',
      header: 'Outlet',
      render: (val, row) => {
        const rawOutlet = val || row?.outletName || row?.canteenName || 'Central Dining Hall';
        const outlet = typeof rawOutlet === 'object' ? (rawOutlet?.name || rawOutlet?.id || 'Central Dining Hall') : String(rawOutlet || 'Central Dining Hall');
        return (
          <span
            title={outlet}
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
            {outlet}
          </span>
        );
      }
    },
    {
      key: 'items',
      header: 'Items',
      render: (items, row) => {
        const list = Array.isArray(items) ? items : Array.isArray(row?.items) ? row.items : [];
        const itemStr = list.length > 0
          ? list.map(i => `${i?.name || 'Dish'} (x${i?.quantity || 1})`).join(', ')
          : 'Campus Meal';

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
      render: (val, row) => {
        // Safe check whether parent configuration object exists before accessing .timeWindow
        const slotConfig = val ?? row?.slot ?? null;
        const timeWindow = slotConfig?.timeWindow ?? (typeof val === 'string' ? val : '12:30 PM - 01:00 PM');
        const session = slotConfig?.session ?? (row?.pickupSlot ? 'Scheduled' : 'Lunch');

        return (
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            <div style={{ fontWeight: 500 }}>{timeWindow}</div>
            <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>{session}</div>
          </div>
        );
      }
    },
    {
      key: 'totalAmount',
      header: 'Total',
      render: (val, row) => {
        const amount = Number(val ?? row?.totalAmount ?? row?.pricing?.totalAmount ?? 0);
        return (
          <span style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-primary)' }}>
            {formatCurrency(amount)}
          </span>
        );
      }
    },
    {
      key: 'payment',
      header: 'Payment',
      render: (val, row) => {
        const payConfig = val ?? row?.payment ?? null;
        const method = payConfig?.method || row?.paymentMethod || 'Campus Wallet';
        const status = payConfig?.status || row?.paymentStatus || 'Paid';

        return (
          <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
            <div>{method}</div>
            <div style={{
              color: status === 'Paid' ? 'var(--color-success)' : status === 'Refunded' ? '#d97706' : 'var(--color-danger)',
              fontWeight: 600
            }}>
              {status}
            </div>
          </div>
        );
      }
    },
    {
      key: 'status',
      header: 'Order Status',
      render: (val, row) => {
        const status = val || row?.status || ORDER_STATUS.PLACED;
        return <StatusBadge status={status} size="sm" />;
      }
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (_, row) => {
        const orderStatus = row?.status || ORDER_STATUS.PLACED;
        const nextSteps = ORDER_LIFECYCLE_NEXT_STEPS[orderStatus] || [];
        const nextOperationalStatus = nextSteps.find(s => s !== ORDER_STATUS.CANCELLED && s !== ORDER_STATUS.REFUNDED);

        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
            <button
              type="button"
              onClick={() => onView && onView(row)}
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
                onClick={() => onAdvanceStatus && onAdvanceStatus(row, nextOperationalStatus)}
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
