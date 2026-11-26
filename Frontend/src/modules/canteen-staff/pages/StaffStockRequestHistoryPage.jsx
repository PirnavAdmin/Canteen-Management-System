import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Send,
  RefreshCw,
  AlertCircle,
  History,
  PackageCheck
} from 'lucide-react';
import { useStaffInventory } from '../hooks/useStaffInventory';
import { useToast } from '../../../app/providers/ToastProvider';
import { PageHeader } from '../../../components/common/PageHeader';
import { Button } from '../../../components/common/Button';
import { DataTable } from '../../../components/tables/DataTable';
import { StatusBadge } from '../../../components/common/StatusBadge';
import { EmptyState } from '../../../components/common/EmptyState';
import { formatDate } from '../../../utils/formatters';
import styles from '../styles/staff.module.css';

export const StaffStockRequestHistoryPage = () => {
  const { success, error: toastError } = useToast();
  const { stockRequests, loading, error, refreshInventory, markStockReceived } = useStaffInventory();
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const filtered = stockRequests.filter((req) => {
    const s = String(req.status || '').toLowerCase();
    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'PENDING') return s.includes('pending') || s === 'requested';
    if (statusFilter === 'APPROVED') return s === 'approved' || s.includes('dispatch') || s.includes('transit');
    if (statusFilter === 'FULFILLED') return s.includes('fulfilled') || s.includes('received') || s.includes('completed');
    if (statusFilter === 'REJECTED') return s.includes('reject');
    return true;
  });

  const handleMarkReceived = async (reqId) => {
    try {
      setActionLoadingId(reqId);
      await markStockReceived(reqId);
      success('Stock Received', `Requisition #${reqId} marked received and added to inventory.`);
    } catch (err) {
      toastError('Update Failed', err.message || 'Error marking stock received.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const columns = [
    {
      key: 'id',
      header: 'Req ID',
      render: (val, req) => (
        <div>
          <code style={{
            backgroundColor: 'var(--bg-muted)',
            padding: '2px 6px',
            borderRadius: '4px',
            fontSize: '11.5px',
            fontWeight: 700,
            color: 'var(--color-primary)'
          }}>
            REQ-{val}
          </code>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
            {req.createdAt ? formatDate(req.createdAt) : '—'}
          </div>
        </div>
      )
    },
    {
      key: 'itemName',
      header: 'Requested Item',
      render: (val, req) => (
        <div>
          <strong style={{ color: 'var(--text-primary)', display: 'block' }}>{val}</strong>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            {req.itemCode} • {req.category}
          </span>
        </div>
      )
    },
    {
      key: 'requestedQuantity',
      header: 'Qty & Unit',
      align: 'right',
      render: (val, req) => (
        <strong>{val} {req.unit}</strong>
      )
    },
    {
      key: 'urgency',
      header: 'Urgency',
      align: 'center',
      render: (val) => {
        const isEmergency = String(val).toLowerCase() === 'emergency';
        const isHigh = String(val).toLowerCase() === 'high' || String(val).toLowerCase() === 'urgent';
        return (
          <span style={{
            fontSize: '11px',
            fontWeight: 600,
            padding: '2px 8px',
            borderRadius: 'var(--border-radius-full)',
            backgroundColor: isEmergency ? 'var(--color-danger-bg)' : isHigh ? 'var(--color-warning-bg)' : 'var(--bg-muted)',
            color: isEmergency ? 'var(--color-danger-text)' : isHigh ? 'var(--color-warning-text)' : 'var(--text-secondary)',
            border: `1px solid ${isEmergency ? 'var(--color-danger-border)' : isHigh ? 'var(--color-warning-border)' : 'var(--border-color)'}`
          }}>
            {val || 'Normal'}
          </span>
        );
      }
    },
    {
      key: 'status',
      header: 'Admin Status',
      align: 'center',
      render: (val) => <StatusBadge status={val} size="sm" />
    },
    {
      key: 'adminNotes',
      header: 'Notes',
      render: (val, req) => (
        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
          {val || req.notes || '—'}
        </span>
      )
    },
    {
      key: 'actions',
      header: 'Action',
      align: 'right',
      render: (_, req) => {
        const s = String(req.status || '').toLowerCase();
        const canReceive = s === 'approved' || s.includes('dispatch') || s.includes('transit');
        const isDone = s.includes('fulfilled') || s.includes('received') || s.includes('completed');

        if (canReceive) {
          return (
            <Button
              variant="primary"
              size="sm"
              icon={PackageCheck}
              loading={actionLoadingId === req.id}
              onClick={() => handleMarkReceived(req.id)}
              style={{ backgroundColor: 'var(--color-success)', borderColor: 'var(--color-success)' }}
            >
              Mark Received
            </Button>
          );
        }
        return (
          <span style={{ fontSize: '12px', color: isDone ? 'var(--color-success-text)' : 'var(--text-muted)', fontWeight: 500 }}>
            {isDone ? 'Received ✓' : 'Awaiting Admin'}
          </span>
        );
      }
    }
  ];

  const filterTabs = [
    { id: 'ALL', label: `All Requests (${stockRequests.length})` },
    { id: 'PENDING', label: `Pending (${stockRequests.filter((r) => String(r.status).toLowerCase().includes('pending')).length})` },
    { id: 'APPROVED', label: `Approved / Transit (${stockRequests.filter((r) => ['approved', 'dispatched', 'in transit'].some((k) => String(r.status).toLowerCase().includes(k))).length})` },
    { id: 'FULFILLED', label: `Fulfilled (${stockRequests.filter((r) => ['fulfilled', 'received', 'completed'].some((k) => String(r.status).toLowerCase().includes(k))).length})` }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <PageHeader
        title="Admin Stock Requisitions Ledger"
        description="Historical record of all raw material requests submitted to Central Canteen Admin."
        actions={
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Button
              variant="secondary"
              icon={RefreshCw}
              loading={loading}
              onClick={() => refreshInventory()}
            >
              Refresh
            </Button>
            <Link
              to="/staff/stock-requests"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: 'var(--border-radius-md)',
                backgroundColor: 'var(--color-primary)',
                color: '#ffffff',
                fontSize: '13.5px',
                fontWeight: 500,
                textDecoration: 'none'
              }}
            >
              <Send size={14} />
              <span>New Request</span>
            </Link>
          </div>
        }
      />

      {error && (
        <div className={styles.errorBanner} role="alert">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
          <Button variant="secondary" size="sm" icon={RefreshCw} onClick={refreshInventory}>
            Retry
          </Button>
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {filterTabs.map((tab) => {
          const isActive = statusFilter === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--border-radius-md)',
                border: '1px solid',
                borderColor: isActive ? 'var(--color-primary)' : 'var(--border-color)',
                backgroundColor: isActive ? 'var(--color-primary)' : 'var(--bg-surface)',
                color: isActive ? '#ffffff' : 'var(--text-secondary)',
                fontSize: '12.5px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        emptyState={
          <EmptyState
            icon={History}
            title="No Stock Requisitions Found"
            message="No stock requisitions match this status filter."
          />
        }
      />
    </div>
  );
};

export default StaffStockRequestHistoryPage;
