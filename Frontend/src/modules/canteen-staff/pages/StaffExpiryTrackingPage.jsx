import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  ShieldAlert,
  RefreshCw
} from 'lucide-react';
import { useStaffInventory } from '../hooks/useStaffInventory';
import { PageHeader } from '../../../components/common/PageHeader';
import { Button } from '../../../components/common/Button';

export const StaffExpiryTrackingPage = () => {
  const { expiringItems, recordWaste, refreshInventory } = useStaffInventory();
  const [selectedBatchForWaste, setSelectedBatchForWaste] = useState(null);
  const [wasteQty, setWasteQty] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState('');

  const expiredList = expiringItems.filter(i => i.urgencyTag === 'expired');
  const todayList = expiringItems.filter(i => i.urgencyTag === 'today');
  const criticalList = expiringItems.filter(i => i.urgencyTag === 'critical');
  const soonList = expiringItems.filter(i => i.urgencyTag === 'soon');

  const handleConfirmDisposal = async () => {
    if (!selectedBatchForWaste || !wasteQty || Number(wasteQty) <= 0) {
      alert('Please enter a valid quantity.');
      return;
    }
    try {
      await recordWaste(selectedBatchForWaste.id || selectedBatchForWaste.itemCode, Number(wasteQty), 'Expired batch discarded');
      setSelectedBatchForWaste(null);
      setWasteQty('');
      setFeedbackMsg('Expired batch disposal recorded and inventory updated.');
    } catch (err) {
      alert(err.message || 'Error recording disposal');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <PageHeader
        title="Ingredient Expiry Tracking & Waste Prevention"
        description="Monitor batch expiration dates, prevent using compromised raw ingredients & log disposals"
        actions={
          <Button
            variant="secondary"
            icon={RefreshCw}
            onClick={() => refreshInventory()}
          >
            Refresh
          </Button>
        }
      />

      {feedbackMsg && (
        <div style={{ padding: '12px 16px', borderRadius: 'var(--border-radius-md)', backgroundColor: 'var(--color-success-bg)', color: 'var(--color-success)', fontSize: '13px', fontWeight: 600, border: '1px solid var(--color-success-border)' }}>
          {feedbackMsg}
        </div>
      )}

      {/* Summary Alert Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '12px'
      }}>
        <div style={{
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--border-radius-md)',
          border: '1px solid var(--color-danger-border)',
          padding: '16px',
          boxShadow: 'var(--shadow-xs)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-danger)' }}>EXPIRED BATCHES</span>
            <ShieldAlert size={18} style={{ color: 'var(--color-danger)' }} />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 900, color: 'var(--color-danger)', marginTop: '4px' }}>
            {expiredList.length}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Must be discarded
          </div>
        </div>

        <div style={{
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--border-radius-md)',
          border: '1px solid var(--color-warning-border)',
          padding: '16px',
          boxShadow: 'var(--shadow-xs)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-warning)' }}>EXPIRING TODAY</span>
            <Clock size={18} style={{ color: 'var(--color-warning)' }} />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 900, color: 'var(--color-warning)', marginTop: '4px' }}>
            {todayList.length}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Cook today or discard
          </div>
        </div>

        <div style={{
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--border-radius-md)',
          border: '1px solid var(--border-color)',
          padding: '16px',
          boxShadow: 'var(--shadow-xs)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-primary)' }}>CRITICAL (1-3 DAYS)</span>
            <AlertTriangle size={18} style={{ color: 'var(--color-warning)' }} />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 900, color: 'var(--text-primary)', marginTop: '4px' }}>
            {criticalList.length}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Prioritize in cooking
          </div>
        </div>

        <div style={{
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--border-radius-md)',
          border: '1px solid var(--border-color)',
          padding: '16px',
          boxShadow: 'var(--shadow-xs)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)' }}>UPCOMING (4-7 DAYS)</span>
            <CheckCircle2 size={18} style={{ color: 'var(--color-success)' }} />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 900, color: 'var(--text-primary)', marginTop: '4px' }}>
            {soonList.length}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Track in next cycle
          </div>
        </div>
      </div>

      {/* Batch List Table */}
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        borderRadius: 'var(--border-radius-lg)',
        border: '1px solid var(--border-color)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-xs)'
      }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: '14.5px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            Expiring Batches Registry ({expiringItems.length})
          </h2>
          <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
            Sorted by earliest expiry date
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-app)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontWeight: 700 }}>
                <th style={{ padding: '12px 16px' }}>Ingredient</th>
                <th style={{ padding: '12px 16px' }}>Batch Number</th>
                <th style={{ padding: '12px 16px' }}>Expiry Date</th>
                <th style={{ padding: '12px 16px' }}>Time Status</th>
                <th style={{ padding: '12px 16px' }}>Remaining Qty</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {expiringItems.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: 'var(--color-success)', fontWeight: 600 }}>
                    ✓ No expiring raw material batches within the next 7 days!
                  </td>
                </tr>
              ) : (
                expiringItems.map((item, idx) => {
                  const isExp = item.urgencyTag === 'expired';
                  const isTod = item.urgencyTag === 'today';

                  return (
                    <tr
                      key={item.id || idx}
                      style={{
                        borderBottom: '1px solid var(--border-color-subtle)',
                        backgroundColor: isExp ? 'var(--color-danger-bg)' : isTod ? 'var(--color-warning-bg)' : 'var(--bg-surface)'
                      }}
                    >
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                          {item.ingredientName}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {item.itemCode}
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                        {item.batchNumber || 'B-MAIN-01'}
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: isExp ? 'var(--color-danger)' : 'var(--text-primary)' }}>
                        {item.expiryDate}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '6px',
                          backgroundColor: isExp ? 'var(--color-danger-bg)' : isTod ? 'var(--color-warning-bg)' : 'var(--bg-muted)',
                          color: isExp ? 'var(--color-danger)' : isTod ? 'var(--color-warning)' : 'var(--text-secondary)',
                          border: '1px solid var(--border-color)'
                        }}>
                          {isExp
                            ? `EXPIRED (${Math.abs(item.daysToExpiry)}d ago)`
                            : isTod
                            ? 'EXPIRES TODAY'
                            : `Expires in ${item.daysToExpiry} days`}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 800, color: 'var(--text-primary)' }}>
                        {item.availableQuantity} {item.unit}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          <button
                            onClick={() => {
                              setSelectedBatchForWaste(item);
                              setWasteQty(String(item.availableQuantity));
                            }}
                            style={{
                              padding: '5px 10px',
                              borderRadius: 'var(--border-radius-sm)',
                              backgroundColor: 'var(--color-danger-bg)',
                              color: 'var(--color-danger)',
                              border: '1px solid var(--color-danger-border)',
                              fontSize: '11.5px',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            Discard
                          </button>
                          <Link
                            to={`/staff/stock-requests?item=${encodeURIComponent(item.ingredientName)}&unit=${item.unit}`}
                            style={{
                              padding: '5px 10px',
                              borderRadius: 'var(--border-radius-sm)',
                              backgroundColor: 'var(--color-accent)',
                              color: '#ffffff',
                              textDecoration: 'none',
                              fontSize: '11.5px',
                              fontWeight: 700
                            }}
                          >
                            Reorder
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Disposal Confirmation Modal */}
      {selectedBatchForWaste && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '16px'
        }}>
          <div style={{
            backgroundColor: 'var(--modal-bg)',
            borderRadius: 'var(--border-radius-lg)',
            border: '1px solid var(--border-color)',
            padding: '24px',
            width: '100%',
            maxWidth: '420px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            boxShadow: 'var(--shadow-modal)'
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--color-danger)', margin: 0 }}>
              Discard Batch: {selectedBatchForWaste.ingredientName}
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
              Batch #{selectedBatchForWaste.batchNumber} has expired. Confirm quantity to deduct from inventory.
            </p>

            <div>
              <label style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Discard Quantity ({selectedBatchForWaste.unit}):
              </label>
              <input
                type="number"
                min="0.1"
                step="0.1"
                value={wasteQty}
                onChange={(e) => setWasteQty(e.target.value)}
                style={{
                  width: '100%',
                  marginTop: '4px',
                  padding: '9px 12px',
                  borderRadius: 'var(--border-radius-sm)',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-app)',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setSelectedBatchForWaste(null)}
                style={{
                  padding: '7px 14px',
                  borderRadius: 'var(--border-radius-sm)',
                  border: '1px solid var(--border-color)',
                  background: 'none',
                  color: 'var(--text-secondary)',
                  fontSize: '12.5px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDisposal}
                style={{
                  padding: '7px 16px',
                  borderRadius: 'var(--border-radius-sm)',
                  backgroundColor: 'var(--color-danger)',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Confirm Disposal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffExpiryTrackingPage;
