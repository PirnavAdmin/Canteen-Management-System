import React from 'react';
import { Eye, CheckCheck } from 'lucide-react';
import { DataTable } from '../../../components/tables/DataTable';
import { StatusBadge } from '../../../components/common/StatusBadge';
import { EmptyState } from '../../../components/common/EmptyState';
import { formatCurrency, formatDate, formatTimeIST } from '../../../utils/formatters';
import styles from '../styles/staff.module.css';

export const StaffOrderHistoryTable = ({
  orders = [],
  loading = false,
  currentPage = 1,
  pageSize = 10,
  onViewDetails,
  footer
}) => {
  const columns = [
    {
      key: 'serial',
      header: '#',
      align: 'center',
      width: '48px',
      render: (_, __, index) => (
        <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>
          {(currentPage - 1) * pageSize + index + 1}
        </span>
      )
    },
    {
      key: 'token',
      header: 'Order Info',
      width: '185px',
      render: (val, order) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className={styles.tokenBadge}>{val || 'T-ORD'}</span>
            <span
              onClick={() => onViewDetails && onViewDetails(order)}
              title="Click to view details"
              style={{
                fontWeight: 700,
                color: 'var(--color-primary)',
                fontSize: '12.5px',
                cursor: 'pointer'
              }}
            >
              {order.id}
            </span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            {order.customer?.name || 'Customer'}
            {order.customer?.rollNo && order.customer.rollNo !== '—' ? ` (${order.customer.rollNo})` : ''}
          </div>
        </div>
      )
    },
    {
      key: 'items',
      header: 'Food Order Details',
      render: (items) => {
        const itemsList = Array.isArray(items) ? items : [];
        return (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
            {itemsList.length > 0 ? (
              itemsList.map((item, i) => (
                <span
                  key={i}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '2px 7px',
                    borderRadius: 'var(--border-radius-xs)',
                    backgroundColor: 'var(--bg-app)',
                    border: '1px solid var(--border-color)',
                    fontSize: '11.5px',
                    fontWeight: 500,
                    color: 'var(--text-primary)'
                  }}
                >
                  <span style={{ color: 'var(--color-primary)', fontWeight: 700 }}>
                    {item.quantity}x
                  </span>
                  <span>{item.name || item.itemName}</span>
                </span>
              ))
            ) : (
              <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>—</span>
            )}
          </div>
        );
      }
    },
    {
      key: 'orderType',
      header: 'Order Type',
      align: 'center',
      width: '110px',
      render: (val, row) => (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          padding: '2px 8px',
          borderRadius: 'var(--border-radius-sm)',
          fontSize: '11.5px',
          fontWeight: 600,
          backgroundColor: 'var(--color-primary-light)',
          color: 'var(--color-primary)',
          border: '1px solid var(--color-primary-border)',
          whiteSpace: 'nowrap'
        }}>
          {val || row.type || 'Pickup'}
        </span>
      )
    },
    {
      key: 'completedAt',
      header: 'Completed Date / Time',
      width: '160px',
      render: (val, order) => {
        const ts = val || order.updatedAt || order.orderDate || order.createdAt;
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '12px' }}>
              {ts ? formatDate(ts) : '—'}
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {ts ? formatTimeIST(ts) : '—'}
            </span>
          </div>
        );
      }
    },
    {
      key: 'totalAmount',
      header: 'Total',
      align: 'right',
      width: '100px',
      render: (val, order) => (
        <strong style={{ color: 'var(--text-primary)' }}>
          {formatCurrency(Number(val ?? order.total ?? 0))}
        </strong>
      )
    },
    {
      key: 'status',
      header: 'Final Status',
      align: 'center',
      width: '130px',
      render: (val) => <StatusBadge status={val || 'Collected'} size="sm" />
    },
    {
      key: 'actions',
      header: 'Details',
      align: 'center',
      width: '75px',
      render: (_, order) => (
        <button
          type="button"
          onClick={() => onViewDetails && onViewDetails(order)}
          title="View order details"
          aria-label="View order details"
          style={{
            width: '30px',
            height: '30px',
            borderRadius: 'var(--border-radius-sm)',
            border: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-surface)',
            color: 'var(--color-primary)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          <Eye size={14} />
        </button>
      )
    }
  ];

  return (
    <DataTable
      columns={columns}
      data={orders}
      loading={loading}
      footer={footer}
      emptyState={
        <EmptyState
          icon={CheckCheck}
          title="No Completed Orders Found"
          message="Completed orders will appear in this history view once fulfilled at the counter."
        />
      }
    />
  );
};

export default StaffOrderHistoryTable;
