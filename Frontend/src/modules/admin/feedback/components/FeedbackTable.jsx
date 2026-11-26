import React from 'react';
import { Eye, Star } from 'lucide-react';
import { DataTable } from '../../../../components/tables/DataTable';
import { StatusBadge } from '../../../../components/common/StatusBadge';
import { formatDate } from '../../../../utils/formatters';

export const FeedbackTable = ({
  feedbackList = [],
  loading = false,
  onViewDetails,
  footer
}) => {
  const columns = [
    {
      key: 'id',
      header: 'Ticket ID',
      render: (val, row) => (
        <span
          onClick={() => onViewDetails(row)}
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
      )
    },
    {
      key: 'customerName',
      header: 'Customer',
      render: (val, row) => (
        <div>
          <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{val}</strong>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{row.customerRole}</div>
        </div>
      )
    },
    {
      key: 'rating',
      header: 'Rating',
      render: (val) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
          {[1, 2, 3, 4, 5].map(star => (
            <Star
              key={star}
              size={13}
              fill={star <= val ? '#f59e0b' : 'none'}
              color={star <= val ? '#f59e0b' : 'var(--border-color)'}
            />
          ))}
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginLeft: '4px' }}>
            {val}.0
          </span>
        </div>
      )
    },
    {
      key: 'complaintCategory',
      header: 'Category / Dish',
      render: (val, row) => {
        const catStr = typeof val === 'object' ? (val?.name || val?.id || '—') : (val || '—');
        return (
          <div style={{ maxWidth: '280px' }}>
            <span style={{
              backgroundColor: 'var(--bg-muted)',
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '11.5px',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              display: 'inline-block'
            }}>
              {catStr}
            </span>
            {row.comments && (
              <div
                style={{
                  fontSize: '11.5px',
                  color: 'var(--text-muted)',
                  marginTop: '3px',
                  lineHeight: 1.35,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
                title={row.comments}
              >
                {row.comments}
              </div>
            )}
          </div>
        );
      }
    },
    {
      key: 'orderToken',
      header: 'Linked Order',
      render: (val, row) => (
        <div style={{ fontSize: '12px' }}>
          <strong>{val}</strong>
          <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>{row.orderId}</div>
        </div>
      )
    },
    {
      key: 'outletName',
      header: 'Outlet',
      render: (val, row) => {
        const outStr = typeof val === 'object' ? (val?.name || val?.id || '—') : (val || row?.outlet || '—');
        return (
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            {outStr}
          </span>
        );
      }
    },
    {
      key: 'createdAt',
      header: 'Logged Date',
      render: (val) => (
        <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
          {formatDate(val)}
        </span>
      )
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (val) => (
        <StatusBadge status={val || 'New'} size="sm" />
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'center',
      width: '72px',
      render: (_, row) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <button
            type="button"
            onClick={() => onViewDetails(row)}
            title="Review & Resolve Ticket"
            aria-label="Review & Resolve Ticket"
            style={{
              background: 'none',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--border-radius-sm)',
              padding: '5px',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Eye size={14} />
          </button>
        </div>
      )
    }
  ];

  return (
    <DataTable
      columns={columns}
      data={feedbackList}
      loading={loading}
      footer={footer}
    />
  );
};

export default FeedbackTable;
