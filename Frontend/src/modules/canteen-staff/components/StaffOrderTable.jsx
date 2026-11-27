import React, { useState, useEffect } from 'react';
import {
  Eye,
  ShoppingBag,
  Clock,
  CheckCircle2,
  BellRing,
  XCircle,
  Flame,
  ShieldCheck,
  Loader2
} from 'lucide-react';
import { DataTable } from '../../../components/tables/DataTable';
import { StatusBadge } from '../../../components/common/StatusBadge';
import { EmptyState } from '../../../components/common/EmptyState';
import { formatDate, formatTimeIST, isSameIstDate } from '../../../utils/formatters';
import {
  isStatusPlaced,
  isStatusAccepted,
  isStatusPreparing,
  isStatusReady,
  isStatusCompleted,
  isStatusCancelled
} from '../services/staffOrderService';
import styles from '../styles/staff.module.css';

export const StaffOrderTable = ({
  orders = [],
  loading = false,
  actionLoadingId = null,
  currentPage = 1,
  pageSize = 10,
  onViewDetails,
  onStartCooking,
  onMarkReady,
  footer
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getElapsedPrep = (prepStartedAt) => {
    if (!prepStartedAt) return null;
    const startMs = new Date(prepStartedAt).getTime();
    if (isNaN(startMs)) return null;
    const diffSecs = Math.max(0, Math.floor((currentTime.getTime() - startMs) / 1000));
    const m = Math.floor(diffSecs / 60);
    const s = diffSecs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

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
      render: (val, row) => {
        const ordDate = row.orderDate || row.createdAt;
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className={styles.tokenBadge}>{val || 'T-ORD'}</span>
              <span
                onClick={() => onViewDetails(row)}
                title="Click to view details"
                style={{
                  fontWeight: 700,
                  color: 'var(--color-primary)',
                  fontSize: '12.5px',
                  cursor: 'pointer'
                }}
              >
                {row.id}
              </span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {ordDate
                ? (isSameIstDate(ordDate)
                    ? `Today, ${formatTimeIST(ordDate)}`
                    : `${formatDate(ordDate)} • ${formatTimeIST(ordDate)}`)
                : '—'}
            </div>
          </div>
        );
      }
    },
    {
      key: 'items',
      header: 'Food Order Details',
      render: (items, row) => {
        const itemsList = Array.isArray(items) ? items : [];
        const totalPortions = itemsList.reduce((sum, it) => sum + (Number(it.quantity) || 1), 0);
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
              {itemsList.length > 0 ? (
                itemsList.slice(0, 3).map((item, i) => (
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
                <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>No items listed</span>
              )}
              {itemsList.length > 3 && (
                <span style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  padding: '2px 6px',
                  borderRadius: 'var(--border-radius-xs)',
                  backgroundColor: 'var(--bg-muted)'
                }}>
                  +{itemsList.length - 3} more
                </span>
              )}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {itemsList.length > 0 && `${totalPortions} ${totalPortions === 1 ? 'portion' : 'portions'}`}
              {row.notes && ` • Note: ${row.notes}`}
            </div>
          </div>
        );
      }
    },
    {
      key: 'orderType',
      header: 'Order Type',
      align: 'center',
      width: '115px',
      render: (val, row) => (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
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
      key: 'status',
      header: 'Order Status',
      align: 'center',
      width: '160px',
      render: (val, row) => {
        const elapsed = isStatusPreparing(val) && row.prepStartedAt ? getElapsedPrep(row.prepStartedAt) : null;
        return (
          <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
            <StatusBadge status={val} size="sm" />
            {elapsed && (
              <span style={{ fontSize: '10.5px', fontWeight: 600, color: 'var(--color-info-text)', fontFamily: 'var(--font-mono)' }}>
                {elapsed}
              </span>
            )}
            {isStatusReady(val) && row.prepDurationFormatted && (
              <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                Prep: {row.prepDurationFormatted}
              </span>
            )}
          </div>
        );
      }
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'center',
      width: '200px',
      render: (_, order) => {
        const isPlaced = isStatusPlaced(order.status);
        const isAccepted = isStatusAccepted(order.status);
        const isPreparing = isStatusPreparing(order.status);
        const isReady = isStatusReady(order.status);
        const isCompleted = isStatusCompleted(order.status);
        const isCancelled = isStatusCancelled(order.status);
        const isActionLoading = actionLoadingId === order.id;

        return (
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => onViewDetails(order)}
              title="View Order Details"
              aria-label="View Order Details"
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

            {isPlaced && (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--color-warning-text)',
                backgroundColor: 'var(--color-warning-bg)',
                border: '1px solid var(--color-warning-border)',
                padding: '4px 8px',
                borderRadius: 'var(--border-radius-sm)'
              }}>
                <Clock size={12} />
                Awaiting Cashier
              </span>
            )}

            {isAccepted && (
              <button
                type="button"
                disabled={isActionLoading}
                onClick={() => onStartCooking(order.id)}
                title="Start kitchen preparation"
                style={{
                  padding: '5px 11px',
                  borderRadius: 'var(--border-radius-sm)',
                  border: 'none',
                  backgroundColor: 'var(--color-primary)',
                  color: '#ffffff',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  cursor: isActionLoading ? 'wait' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                {isActionLoading ? <Loader2 size={12} className="spin" /> : <Flame size={12} />}
                <span>{isActionLoading ? 'Starting...' : 'Start Preparing'}</span>
              </button>
            )}

            {isPreparing && (
              <button
                type="button"
                disabled={isActionLoading}
                onClick={() => onMarkReady(order.id)}
                title="Mark Ready for Pickup"
                style={{
                  padding: '5px 11px',
                  borderRadius: 'var(--border-radius-sm)',
                  border: 'none',
                  backgroundColor: 'var(--color-success)',
                  color: '#ffffff',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  cursor: isActionLoading ? 'wait' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                {isActionLoading ? <Loader2 size={12} className="spin" /> : <BellRing size={12} />}
                <span>{isActionLoading ? 'Updating...' : 'Ready for Pickup'}</span>
              </button>
            )}

            {isReady && (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--color-info-text)',
                backgroundColor: 'var(--color-info-bg)',
                border: '1px solid var(--color-info-border)',
                padding: '4px 8px',
                borderRadius: 'var(--border-radius-sm)'
              }}>
                <CheckCircle2 size={12} />
                At Pickup Counter
              </span>
            )}

            {isCompleted && (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--color-success-text)',
                backgroundColor: 'var(--color-success-bg)',
                border: '1px solid var(--color-success-border)',
                padding: '4px 8px',
                borderRadius: 'var(--border-radius-sm)'
              }}>
                <ShieldCheck size={12} />
                Verified
              </span>
            )}

            {isCancelled && (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--color-danger-text)',
                backgroundColor: 'var(--color-danger-bg)',
                border: '1px solid var(--color-danger-border)',
                padding: '4px 8px',
                borderRadius: 'var(--border-radius-sm)'
              }}>
                <XCircle size={12} />
                Cancelled
              </span>
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
      emptyState={
        <EmptyState
          icon={ShoppingBag}
          title="No orders match your filters"
          message="Try adjusting the search query, order status, or date range."
        />
      }
    />
  );
};

export default StaffOrderTable;
