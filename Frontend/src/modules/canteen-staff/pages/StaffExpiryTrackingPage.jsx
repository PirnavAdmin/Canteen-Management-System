import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  ShieldAlert,
  RefreshCw,
  AlertCircle,
  Trash2,
  Send
} from 'lucide-react';
import { useStaffInventory } from '../hooks/useStaffInventory';
import { useToast } from '../../../app/providers/ToastProvider';
import { PageHeader } from '../../../components/common/PageHeader';
import { Button } from '../../../components/common/Button';
import { StatCard } from '../../../components/common/StatCard';
import { DataTable } from '../../../components/tables/DataTable';
import { EmptyState } from '../../../components/common/EmptyState';
import { Modal } from '../../../components/modals/Modal';
import { formatDate } from '../../../utils/formatters';
import styles from '../styles/staff.module.css';

export const StaffExpiryTrackingPage = () => {
  const { success, error: toastError } = useToast();
  const { expiringItems, loading, error, recordWaste, refreshInventory } = useStaffInventory();
  const [selectedBatchForWaste, setSelectedBatchForWaste] = useState(null);
  const [wasteQty, setWasteQty] = useState('');
  const [disposalLoading, setDisposalLoading] = useState(false);

  const expiredList = expiringItems.filter((i) => i.urgencyTag === 'expired');
  const todayList = expiringItems.filter((i) => i.urgencyTag === 'today');
  const criticalList = expiringItems.filter((i) => i.urgencyTag === 'critical');
  const soonList = expiringItems.filter((i) => i.urgencyTag === 'soon');

  const handleConfirmDisposal = async (e) => {
    e.preventDefault();
    if (!selectedBatchForWaste || !wasteQty || Number(wasteQty) <= 0) {
      toastError('Invalid Quantity', 'Please enter a valid positive quantity.');
      return;
    }
    try {
      setDisposalLoading(true);
      const targetId = selectedBatchForWaste.ingredientId || selectedBatchForWaste.id || selectedBatchForWaste.itemCode;
      await recordWaste(
        targetId,
        Number(wasteQty),
        'Expired batch discarded',
        null,
        selectedBatchForWaste.batchNumber
      );
      success('Disposal Recorded', `Discarded ${wasteQty} ${selectedBatchForWaste.unit} of ${selectedBatchForWaste.ingredientName}.`);
      setSelectedBatchForWaste(null);
      setWasteQty('');
    } catch (err) {
      toastError('Disposal Failed', err.message || 'Error recording disposal.');
    } finally {
      setDisposalLoading(false);
    }
  };

  const columns = [
    {
      key: 'ingredientName',
      header: 'Ingredient',
      render: (val, item) => (
        <div>
          <strong style={{ color: 'var(--text-primary)', display: 'block' }}>{val}</strong>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{item.itemCode}</span>
        </div>
      )
    },
    {
      key: 'batchNumber',
      header: 'Batch Number',
      render: (val) => (
        <code style={{
          backgroundColor: 'var(--bg-muted)',
          padding: '2px 6px',
          borderRadius: '4px',
          fontSize: '11.5px',
          fontWeight: 600,
          color: 'var(--color-primary)'
        }}>
          {val || '—'}
        </code>
      )
    },
    {
      key: 'expiryDate',
      header: 'Expiry Date',
      render: (val, item) => (
        <span style={{ fontWeight: 600, color: item.urgencyTag === 'expired' ? 'var(--color-danger)' : 'var(--text-primary)' }}>
          {val ? formatDate(val) : '—'}
        </span>
      )
    },
    {
      key: 'urgencyTag',
      header: 'Time Status',
      render: (tag, item) => {
        const isExp = tag === 'expired';
        const isTod = tag === 'today';
        return (
          <span style={{
            fontSize: '11px',
            fontWeight: 700,
            padding: '2px 8px',
            borderRadius: 'var(--border-radius-full)',
            backgroundColor: isExp ? 'var(--color-danger-bg)' : isTod ? 'var(--color-warning-bg)' : 'var(--bg-muted)',
            color: isExp ? 'var(--color-danger-text)' : isTod ? 'var(--color-warning-text)' : 'var(--text-secondary)',
            border: `1px solid ${isExp ? 'var(--color-danger-border)' : isTod ? 'var(--color-warning-border)' : 'var(--border-color)'}`
          }}>
            {isExp
              ? `Expired (${Math.abs(item.daysToExpiry)}d ago)`
              : isTod
                ? 'Expires Today'
                : `Expires in ${item.daysToExpiry}d`}
          </span>
        );
      }
    },
    {
      key: 'availableQuantity',
      header: 'Remaining Qty',
      align: 'right',
      render: (val, item) => (
        <strong>{val} {item.unit}</strong>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (_, item) => (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
          <Button
            variant="danger"
            size="sm"
            icon={Trash2}
            onClick={() => {
              setSelectedBatchForWaste(item);
              setWasteQty(String(item.availableQuantity));
            }}
          >
            Discard
          </Button>
          <Link
            to={`/staff/stock-requests?item=${encodeURIComponent(item.ingredientName)}&unit=${item.unit}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '6px 12px',
              borderRadius: 'var(--border-radius-md)',
              backgroundColor: 'var(--color-primary)',
              color: '#ffffff',
              textDecoration: 'none',
              fontSize: '12.5px',
              fontWeight: 500
            }}
          >
            <Send size={13} />
            <span>Reorder</span>
          </Link>
        </div>
      )
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <PageHeader
        title="Ingredient Expiry Tracking & Waste Prevention"
        description="Monitor batch expiration dates, prevent using compromised raw ingredients & log disposals."
        actions={
          <Button
            variant="secondary"
            icon={RefreshCw}
            loading={loading}
            onClick={() => refreshInventory()}
          >
            Refresh
          </Button>
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

      {/* Summary Alert Cards matching Admin StatCard */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '12px'
      }}>
        <StatCard
          title="Expired Batches"
          value={expiredList.length}
          description="Must be discarded"
          icon={ShieldAlert}
          color="var(--color-danger)"
          bgColor="var(--color-danger-bg)"
          compact
        />
        <StatCard
          title="Expiring Today"
          value={todayList.length}
          description="Cook today or discard"
          icon={Clock}
          color="var(--color-warning)"
          bgColor="var(--color-warning-bg)"
          compact
        />
        <StatCard
          title="Critical (1-3 Days)"
          value={criticalList.length}
          description="Prioritize in cooking"
          icon={AlertTriangle}
          color="var(--color-warning)"
          bgColor="var(--color-warning-bg)"
          compact
        />
        <StatCard
          title="Upcoming (4-7 Days)"
          value={soonList.length}
          description="Track in next cycle"
          icon={CheckCircle2}
          color="var(--color-success)"
          bgColor="var(--color-success-bg)"
          compact
        />
      </div>

      {/* Expiring Batches Table */}
      <DataTable
        columns={columns}
        data={expiringItems}
        loading={loading}
        emptyState={
          <EmptyState
            icon={CheckCircle2}
            title="No Expiring Batches"
            message="No expiring raw material batches within the next 7 days."
          />
        }
      />

      {/* Disposal Confirmation Modal */}
      <Modal
        isOpen={Boolean(selectedBatchForWaste)}
        onClose={() => !disposalLoading && setSelectedBatchForWaste(null)}
        title={`Discard Batch: ${selectedBatchForWaste?.ingredientName || ''}`}
        subtitle={selectedBatchForWaste?.batchNumber ? `Batch #${selectedBatchForWaste.batchNumber}` : undefined}
        maxWidth="420px"
      >
        <form onSubmit={handleConfirmDisposal} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: 0 }}>
            Confirm quantity to discard and deduct from kitchen inventory.
          </p>

          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
              Discard Quantity ({selectedBatchForWaste?.unit || 'kg'})
            </label>
            <input
              type="number"
              min="0.1"
              step="any"
              required
              autoFocus
              value={wasteQty}
              onChange={(e) => setWasteQty(e.target.value)}
              className={styles.formInput}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '8px', borderTop: '1px solid var(--border-color)' }}>
            <Button variant="secondary" onClick={() => setSelectedBatchForWaste(null)} disabled={disposalLoading}>
              Cancel
            </Button>
            <Button type="submit" variant="danger" loading={disposalLoading}>
              Confirm Disposal
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default StaffExpiryTrackingPage;
