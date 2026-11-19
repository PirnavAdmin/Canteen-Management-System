import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Send,
  Trash2
} from 'lucide-react';
import { useStaffInventory } from '../hooks/useStaffInventory';
import { staffInventoryService } from '../services/staffInventoryService';
import { PageHeader } from '../../../components/common/PageHeader';

export const StaffStockDetailsPage = () => {
  const { itemId } = useParams();
  const { recordWaste } = useStaffInventory();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [wasteQty, setWasteQty] = useState('');
  const [wasteReason, setWasteReason] = useState('Expired batch');
  const [showWasteModal, setShowWasteModal] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    const fetchItem = async () => {
      setLoading(true);
      const found = await staffInventoryService.getInventoryItemById(itemId);
      setItem(found);
      setLoading(false);
    };
    fetchItem();
  }, [itemId]);

  const handleRecordWaste = async () => {
    if (!wasteQty || Number(wasteQty) <= 0) {
      alert('Please enter a valid positive quantity.');
      return;
    }
    try {
      const updated = await recordWaste(item.id || item.itemCode, Number(wasteQty), wasteReason);
      setItem(updated);
      setShowWasteModal(false);
      setWasteQty('');
      setStatusMsg('Waste / disposal recorded successfully.');
    } catch (err) {
      alert(err.message || 'Error recording waste');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading stock details...
      </div>
    );
  }

  if (!item) {
    return (
      <div style={{ padding: '60px', textAlign: 'center' }}>
        <h3 style={{ color: 'var(--text-primary)' }}>Inventory Item Not Found</h3>
        <p style={{ color: 'var(--text-muted)' }}>The requested ingredient ID does not exist.</p>
        <Link to="/staff/inventory" style={{ color: 'var(--color-accent)', fontWeight: 600 }}>
          ← Back to Inventory
        </Link>
      </div>
    );
  }

  const isLow = Number(item.availableQuantity) <= Number(item.reorderLevel);
  const percentage = Math.min(100, Math.round(((Number(item.availableQuantity) || 0) / ((Number(item.reorderLevel) || 1) * 2)) * 100));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '900px', margin: '0 auto' }}>
      <PageHeader
        title={item.ingredientName}
        description={`${item.category || 'Raw Ingredient'} • Code: ${item.itemCode}`}
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setShowWasteModal(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '0 14px',
                height: '36px',
                borderRadius: 'var(--border-radius-md)',
                border: '1px solid var(--color-danger-border)',
                backgroundColor: 'var(--color-danger-bg)',
                color: 'var(--color-danger)',
                fontSize: '12.5px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <Trash2 size={14} />
              <span>Record Disposal</span>
            </button>

            <Link
              to={`/staff/stock-requests?item=${encodeURIComponent(item.ingredientName)}&unit=${item.unit}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '0 16px',
                height: '36px',
                borderRadius: 'var(--border-radius-md)',
                backgroundColor: 'var(--color-accent)',
                color: '#ffffff',
                fontSize: '12.5px',
                fontWeight: 700,
                textDecoration: 'none'
              }}
            >
              <Send size={14} />
              <span>Requisition</span>
            </Link>
          </div>
        }
      />

      {statusMsg && (
        <div style={{ padding: '12px 16px', borderRadius: 'var(--border-radius-md)', backgroundColor: 'var(--color-success-bg)', color: 'var(--color-success)', fontSize: '13px', fontWeight: 600, border: '1px solid var(--color-success-border)' }}>
          {statusMsg}
        </div>
      )}

      {/* Main Stock Card */}
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        borderRadius: 'var(--border-radius-lg)',
        border: '1px solid var(--border-color)',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        boxShadow: 'var(--shadow-xs)'
      }}>
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
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Available Quantity:</span>
            <span style={{ fontSize: '24px', fontWeight: 900, color: isLow ? 'var(--color-danger)' : 'var(--text-primary)' }}>
              {item.availableQuantity} {item.unit}
            </span>
          </div>

          <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--border-color)', borderRadius: '9999px', overflow: 'hidden' }}>
            <div style={{
              width: `${percentage}%`,
              height: '100%',
              backgroundColor: isLow ? 'var(--color-danger)' : 'var(--color-success)',
              borderRadius: '9999px',
              transition: 'width 0.3s ease'
            }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: 'var(--text-muted)' }}>
            <span>Reorder Point: <strong>{item.reorderLevel} {item.unit}</strong></span>
            <span>Status: <strong style={{ color: isLow ? 'var(--color-danger)' : 'var(--color-success)' }}>{item.status || (isLow ? 'Low Stock' : 'In Stock')}</strong></span>
          </div>
        </div>

        {/* Details Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
          <div style={{ padding: '14px', borderRadius: 'var(--border-radius-md)', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)' }}>BATCH NUMBER</div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
              {item.batchNumber || 'B-MAIN-882'}
            </div>
          </div>

          <div style={{ padding: '14px', borderRadius: 'var(--border-radius-md)', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)' }}>EXPIRY DATE</div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
              {item.expiryDate || 'N/A'}
            </div>
          </div>

          <div style={{ padding: '14px', borderRadius: 'var(--border-radius-md)', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)' }}>SUPPLIER</div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
              {item.supplierName || 'Campus Central Store'}
            </div>
          </div>

          <div style={{ padding: '14px', borderRadius: 'var(--border-radius-md)', backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)' }}>LOCATION</div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
              {item.outletName || 'Central Dining Hall'}
            </div>
          </div>
        </div>
      </div>

      {/* Waste Recording Modal */}
      {showWasteModal && (
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
              Record Disposal: {item.ingredientName}
            </h3>

            <div>
              <label style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Quantity ({item.unit}):
              </label>
              <input
                type="number"
                min="0.1"
                step="0.1"
                placeholder={`Available: ${item.availableQuantity}`}
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
                onClick={() => setShowWasteModal(false)}
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
                onClick={handleRecordWaste}
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

export default StaffStockDetailsPage;
