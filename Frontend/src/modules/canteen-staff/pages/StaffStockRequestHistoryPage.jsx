import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Send,
  RefreshCw
} from 'lucide-react';
import { useStaffInventory } from '../hooks/useStaffInventory';
import { PageHeader } from '../../../components/common/PageHeader';
import { Button } from '../../../components/common/Button';

export const StaffStockRequestHistoryPage = () => {
  const { stockRequests, refreshInventory, markStockReceived } = useStaffInventory();
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [successToast, setSuccessToast] = useState('');

  const filtered = stockRequests.filter((req) => {
    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'PENDING') return req.status === 'Pending Review';
    if (statusFilter === 'APPROVED') return req.status === 'Approved' || req.status === 'Dispatched';
    if (statusFilter === 'FULFILLED') return req.status === 'Fulfilled' || req.status === 'Received';
    if (statusFilter === 'REJECTED') return req.status === 'Rejected';
    return true;
  });

  const handleMarkReceived = async (reqId) => {
    try {
      await markStockReceived(reqId);
      setSuccessToast(`Stock for requisition #${reqId} marked received and added to inventory!`);
      setTimeout(() => setSuccessToast(''), 4000);
    } catch (err) {
      alert(err.message || 'Error marking stock received');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Fulfilled':
      case 'Received':
        return { bg: 'var(--color-success-bg)', color: 'var(--color-success)', border: 'var(--color-success-border)', label: '✓ Delivered & Received' };
      case 'Dispatched':
      case 'Stock Issued':
        return { bg: 'var(--color-primary-light)', color: 'var(--color-primary)', border: 'var(--color-primary-border)', label: '🚚 In Transit / Dispatched' };
      case 'Approved':
        return { bg: 'var(--color-info-bg)', color: 'var(--color-info)', border: 'var(--color-info-border)', label: '✓ Approved by Admin' };
      case 'Rejected':
        return { bg: 'var(--color-danger-bg)', color: 'var(--color-danger)', border: 'var(--color-danger-border)', label: '✕ Rejected' };
      default:
        return { bg: 'var(--color-warning-bg)', color: 'var(--color-warning)', border: 'var(--color-warning-border)', label: '⏳ Pending Admin Review' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <PageHeader
        title="Admin Stock Requisitions Ledger"
        description="Historical record of all raw material requests submitted to Central Canteen Admin"
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button
              variant="secondary"
              icon={RefreshCw}
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
                padding: '0 16px',
                height: '36px',
                borderRadius: 'var(--border-radius-md)',
                backgroundColor: 'var(--color-accent)',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 600,
                textDecoration: 'none'
              }}
            >
              <Send size={14} />
              <span>New Request</span>
            </Link>
          </div>
        }
      />

      {successToast && (
        <div style={{ padding: '12px 16px', borderRadius: 'var(--border-radius-md)', backgroundColor: 'var(--color-success-bg)', color: 'var(--color-success)', fontSize: '13px', fontWeight: 700, border: '1px solid var(--color-success-border)' }}>
          {successToast}
        </div>
      )}

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {[
          { id: 'ALL', label: `All Requests (${stockRequests.length})` },
          { id: 'PENDING', label: `Pending (${stockRequests.filter(r => r.status === 'Pending Review').length})` },
          { id: 'APPROVED', label: `Approved / Transit (${stockRequests.filter(r => r.status === 'Approved' || r.status === 'Dispatched').length})` },
          { id: 'FULFILLED', label: `Fulfilled (${stockRequests.filter(r => r.status === 'Fulfilled').length})` }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--border-radius-sm)',
              border: '1px solid',
              borderColor: statusFilter === tab.id ? 'var(--color-accent)' : 'var(--border-color)',
              backgroundColor: statusFilter === tab.id ? 'var(--color-primary-light)' : 'var(--bg-surface)',
              color: statusFilter === tab.id ? 'var(--color-primary)' : 'var(--text-secondary)',
              fontSize: '12.5px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Requisitions Table */}
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        borderRadius: 'var(--border-radius-lg)',
        border: '1px solid var(--border-color)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-xs)'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-app)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontWeight: 700 }}>
                <th style={{ padding: '12px 16px' }}>Req ID</th>
                <th style={{ padding: '12px 16px' }}>Requested Item</th>
                <th style={{ padding: '12px 16px' }}>Qty & Unit</th>
                <th style={{ padding: '12px 16px' }}>Urgency</th>
                <th style={{ padding: '12px 16px' }}>Admin Status</th>
                <th style={{ padding: '12px 16px' }}>Admin Notes</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No stock requisitions found matching this status filter.
                  </td>
                </tr>
              ) : (
                filtered.map((req) => {
                  const badge = getStatusBadge(req.status);
                  const isEmergency = req.urgency === 'Emergency';
                  const isHigh = req.urgency === 'High';

                  return (
                    <tr key={req.id} style={{ borderBottom: '1px solid var(--border-color-subtle)' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 800, color: 'var(--text-primary)' }}>
                        {req.id}
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 400 }}>
                          {new Date(req.createdAt).toLocaleDateString()}
                        </div>
                      </td>

                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                          {req.itemName}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {req.itemCode} • {req.category}
                        </div>
                      </td>

                      <td style={{ padding: '12px 16px', fontWeight: 800, color: 'var(--text-primary)' }}>
                        {req.requestedQuantity} {req.unit}
                      </td>

                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '9999px',
                          backgroundColor: isEmergency ? 'var(--color-danger-bg)' : isHigh ? 'var(--color-warning-bg)' : 'var(--bg-app)',
                          color: isEmergency ? 'var(--color-danger)' : isHigh ? 'var(--color-warning)' : 'var(--text-secondary)',
                          border: '1px solid var(--border-color)'
                        }}>
                          {req.urgency}
                        </span>
                      </td>

                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          fontSize: '11.5px',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '6px',
                          backgroundColor: badge.bg,
                          color: badge.color,
                          border: `1px solid ${badge.border}`
                        }}>
                          {badge.label}
                        </span>
                      </td>

                      <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', maxWidth: '240px' }}>
                        {req.adminNotes || req.notes || '—'}
                      </td>

                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        {req.status === 'Approved' || req.status === 'Dispatched' ? (
                          <button
                            onClick={() => handleMarkReceived(req.id)}
                            style={{
                              padding: '5px 10px',
                              borderRadius: 'var(--border-radius-sm)',
                              backgroundColor: 'var(--color-success)',
                              color: '#ffffff',
                              border: 'none',
                              fontSize: '11.5px',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            Mark Received
                          </button>
                        ) : (
                          <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                            {req.status === 'Fulfilled' ? 'Received ✓' : 'Awaiting Admin'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StaffStockRequestHistoryPage;
