import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Send,
  Trash2,
  AlertCircle,
  RefreshCw,
  ArrowLeft
} from 'lucide-react';
import { useStaffInventory } from '../hooks/useStaffInventory';
import { useToast } from '../../../app/providers/ToastProvider';
import { staffInventoryService } from '../services/staffInventoryService';
import { PageHeader } from '../../../components/common/PageHeader';
import { Card } from '../../../components/common/Card';
import { Button } from '../../../components/common/Button';
import { StatusBadge } from '../../../components/common/StatusBadge';
import { Modal } from '../../../components/modals/Modal';
import { formatDate } from '../../../utils/formatters';
import styles from '../styles/staff.module.css';

export const StaffStockDetailsPage = () => {
  const { itemId } = useParams();
  const { success, error: toastError } = useToast();
  const { outletId, activeOutletName, recordWaste } = useStaffInventory();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [wasteQty, setWasteQty] = useState('');
  const [wasteReason, setWasteReason] = useState('Expired batch');
  const [showWasteModal, setShowWasteModal] = useState(false);
  const [wasteLoading, setWasteLoading] = useState(false);

  const fetchItem = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const found = await staffInventoryService.getInventoryItemById(itemId, outletId);
      setItem(found);
    } catch (err) {
      setError(err.message || 'Unable to load inventory item details.');
      setItem(null);
    } finally {
      setLoading(false);
    }
  }, [itemId, outletId]);

  useEffect(() => {
    fetchItem();
  }, [fetchItem]);

  const handleRecordWaste = async (e) => {
    e.preventDefault();
    if (!wasteQty || Number(wasteQty) <= 0) {
      toastError('Invalid Quantity', 'Please enter a valid positive quantity.');
      return;
    }
    try {
      setWasteLoading(true);
      await recordWaste(item.id || item.itemCode, Number(wasteQty), wasteReason);
      await fetchItem();
      setShowWasteModal(false);
      setWasteQty('');
      success('Disposal Recorded', 'Waste / disposal recorded and inventory updated.');
    } catch (err) {
      toastError('Disposal Failed', err.message || 'Error recording waste.');
    } finally {
      setWasteLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div className="skeleton-box" style={{ height: '48px', width: '60%' }} />
        <div className="skeleton-box" style={{ height: '260px', borderRadius: 'var(--border-radius-lg)' }} />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div className={styles.errorBanner} role="alert">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
          <Button variant="secondary" size="sm" icon={RefreshCw} onClick={fetchItem}>
            Retry
          </Button>
        </div>
        <Link to="/staff/inventory" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
          <ArrowLeft size={14} />
          <span>Back to Inventory</span>
        </Link>
      </div>
    );
  }

  if (!item) {
    return (
      <Card padding="48px" style={{ maxWidth: '700px', margin: '0 auto', textAlign: 'center' }}>
        <h3 style={{ color: 'var(--text-primary)', margin: '0 0 8px 0' }}>Inventory Item Not Found</h3>
        <p style={{ color: 'var(--text-muted)', margin: '0 0 16px 0' }}>
          The requested ingredient ID does not exist in this outlet.
        </p>
        <Link to="/staff/inventory" style={{ fontWeight: 600 }}>
          ← Back to Inventory
        </Link>
      </Card>
    );
  }

  const isLow = Number(item.availableQuantity) <= Number(item.reorderLevel);
  const percentage = Math.min(100, Math.round(((Number(item.availableQuantity) || 0) / Math.max(1, (Number(item.reorderLevel) || 1) * 2)) * 100));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '900px', margin: '0 auto' }}>
      <PageHeader
        title={item.ingredientName}
        description={`${item.category || 'Raw Ingredient'} • Code: ${item.itemCode}`}
        actions={
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Button variant="danger" size="sm" icon={Trash2} onClick={() => setShowWasteModal(true)}>
              Record Disposal
            </Button>

            <Link
              to={`/staff/stock-requests?item=${encodeURIComponent(item.ingredientName)}&unit=${item.unit}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: 'var(--border-radius-md)',
                backgroundColor: 'var(--color-primary)',
                color: '#ffffff',
                fontSize: '12.5px',
                fontWeight: 500,
                textDecoration: 'none'
              }}
            >
              <Send size={14} />
              <span>Requisition</span>
            </Link>
          </div>
        }
      />

      <Card padding="24px">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Stock Level Gauge */}
          <div style={{
            backgroundColor: 'var(--bg-app)',
            borderRadius: 'var(--border-radius-md)',
            border: '1px solid var(--border-color)',
            padding: '18px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Available Quantity
              </span>
              <span style={{ fontSize: '22px', fontWeight: 700, color: isLow ? 'var(--color-danger)' : 'var(--text-primary)' }}>
                {item.availableQuantity} {item.unit}
              </span>
            </div>

            <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--border-color)', borderRadius: 'var(--border-radius-full)', overflow: 'hidden' }}>
              <div style={{
                width: `${percentage}%`,
                height: '100%',
                backgroundColor: isLow ? 'var(--color-danger)' : 'var(--color-success)',
                borderRadius: 'var(--border-radius-full)',
                transition: 'width 0.3s ease'
              }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: 'var(--text-muted)' }}>
              <span>Reorder Point: <strong>{item.reorderLevel} {item.unit}</strong></span>
              <StatusBadge status={item.status || (isLow ? 'Low Stock' : 'In Stock')} size="sm" />
            </div>
          </div>

          {/* Details Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '14px' }}>
            <div style={{ padding: '14px', borderRadius: 'var(--border-radius-md)', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Batch Number</div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px' }}>
                {item.batchNumber || '—'}
              </div>
            </div>

            <div style={{ padding: '14px', borderRadius: 'var(--border-radius-md)', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Expiry Date</div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px' }}>
                {item.expiryDate ? formatDate(item.expiryDate) : '—'}
              </div>
            </div>

            <div style={{ padding: '14px', borderRadius: 'var(--border-radius-md)', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Supplier</div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px' }}>
                {item.supplierName || '—'}
              </div>
            </div>

            <div style={{ padding: '14px', borderRadius: 'var(--border-radius-md)', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Location</div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px' }}>
                {item.outletName || activeOutletName || '—'}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Waste Recording Modal */}
      <Modal
        isOpen={showWasteModal}
        onClose={() => !wasteLoading && setShowWasteModal(false)}
        title={`Record Disposal: ${item.ingredientName}`}
        maxWidth="420px"
      >
        <form onSubmit={handleRecordWaste} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
              Quantity ({item.unit})
            </label>
            <input
              type="number"
              min="0.1"
              step="any"
              required
              autoFocus
              placeholder={`Available: ${item.availableQuantity}`}
              value={wasteQty}
              onChange={(e) => setWasteQty(e.target.value)}
              className={styles.formInput}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
              Reason
            </label>
            <input
              type="text"
              value={wasteReason}
              onChange={(e) => setWasteReason(e.target.value)}
              className={styles.formInput}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '8px', borderTop: '1px solid var(--border-color)' }}>
            <Button variant="secondary" onClick={() => setShowWasteModal(false)} disabled={wasteLoading}>
              Cancel
            </Button>
            <Button type="submit" variant="danger" loading={wasteLoading}>
              Confirm Disposal
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default StaffStockDetailsPage;
