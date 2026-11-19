import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  Send,
  History,
  CheckCircle2,
  AlertCircle,
  Building,
  ArrowRight
} from 'lucide-react';
import { useStaffInventory } from '../hooks/useStaffInventory';
import { STAFF_APP_CONFIG } from '../constants/staffNavigation';
import { PageHeader } from '../../../components/common/PageHeader';

export const StaffStockRequestsPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { inventory, createRequest } = useStaffInventory();

  const [itemName, setItemName] = useState(searchParams.get('item') || '');
  const [quantity, setQuantity] = useState(searchParams.get('qty') || '');
  const [unit, setUnit] = useState(searchParams.get('unit') || 'kg');
  const [urgency, setUrgency] = useState(searchParams.get('urgency') || 'Normal');
  const [requiredByDate, setRequiredByDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleItemSelect = (e) => {
    const selectedName = e.target.value;
    setItemName(selectedName);
    const matched = inventory.find(i => i.ingredientName === selectedName);
    if (matched && matched.unit) {
      setUnit(matched.unit);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!itemName.trim()) {
      setErrorMsg('Please select or specify an ingredient/stock item name.');
      return;
    }
    if (!quantity || Number(quantity) <= 0) {
      setErrorMsg('Please enter a valid requested quantity greater than zero.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg('');

      const matched = inventory.find(i => i.ingredientName.toLowerCase() === itemName.trim().toLowerCase());

      const created = await createRequest({
        itemName: itemName.trim(),
        itemCode: matched?.itemCode || 'ING-REQ',
        category: matched?.category || 'General Kitchen Supplies',
        requestedQuantity: Number(quantity),
        unit,
        urgency,
        requiredByDate,
        notes: notes.trim(),
        outletId: STAFF_APP_CONFIG.outletId,
        outletName: STAFF_APP_CONFIG.canteenOutlet
      });

      setSuccessData(created);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to submit stock request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '850px', margin: '0 auto' }}>
      <PageHeader
        title="Request Raw Materials & Stock from Admin"
        description="Submit an official canteen stock replenishment requisition to Central Campus Admin"
        actions={
          <Link
            to="/staff/stock-requests/history"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '0 16px',
              height: '36px',
              borderRadius: 'var(--border-radius-md)',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-secondary)',
              fontSize: '12.5px',
              fontWeight: 600,
              textDecoration: 'none'
            }}
          >
            <History size={14} />
            <span>Request History</span>
          </Link>
        }
      />

      {/* Success Banner */}
      {successData && (
        <div style={{
          backgroundColor: 'var(--color-success-bg)',
          borderRadius: 'var(--border-radius-lg)',
          border: '1px solid var(--color-success-border)',
          padding: '18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--color-success)' }}>
            <CheckCircle2 size={22} style={{ color: 'var(--color-success)', flexShrink: 0 }} />
            <div>
              <strong style={{ fontSize: '14px' }}>Stock Requisition #{successData.id} Submitted to Admin!</strong>
              <p style={{ margin: '2px 0 0 0', fontSize: '12.5px', color: 'var(--text-muted)' }}>
                Your request for <strong>{successData.requestedQuantity} {successData.unit} of {successData.itemName}</strong> has been queued.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <Link
              to="/staff/stock-requests/history"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: 'var(--border-radius-sm)',
                backgroundColor: 'var(--color-success)',
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: 700,
                textDecoration: 'none'
              }}
            >
              <span>Track in Ledger</span>
              <ArrowRight size={13} />
            </Link>

            <button
              onClick={() => {
                setSuccessData(null);
                setItemName('');
                setQuantity('');
                setNotes('');
              }}
              style={{
                padding: '7px 14px',
                borderRadius: 'var(--border-radius-sm)',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-surface)',
                color: 'var(--text-secondary)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              New Request
            </button>
          </div>
        </div>
      )}

      {/* Requisition Form */}
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        borderRadius: 'var(--border-radius-lg)',
        border: '1px solid var(--border-color)',
        padding: '24px',
        boxShadow: 'var(--shadow-xs)'
      }}>
        {errorMsg && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 14px',
            borderRadius: 'var(--border-radius-sm)',
            backgroundColor: 'var(--color-danger-bg)',
            border: '1px solid var(--color-danger-border)',
            color: 'var(--color-danger)',
            fontSize: '12.5px',
            marginBottom: '16px'
          }}>
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{
            padding: '12px 16px',
            backgroundColor: 'var(--bg-app)',
            borderRadius: 'var(--border-radius-sm)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '12.5px' }}>
              <Building size={15} style={{ color: 'var(--color-accent)' }} />
              <span>Requesting For: <strong>{STAFF_APP_CONFIG.canteenOutlet}</strong></span>
            </div>
            <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
              Mrs. Sunitha (Central Stores)
            </span>
          </div>

          <div>
            <label style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
              Select Existing Inventory Item:
            </label>
            <select
              value={itemName}
              onChange={handleItemSelect}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: 'var(--border-radius-sm)',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-app)',
                fontSize: '13px',
                color: 'var(--text-primary)',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            >
              <option value="">-- Choose from Canteen Inventory List --</option>
              {inventory.map((inv) => (
                <option key={inv.id || inv.itemCode} value={inv.ingredientName}>
                  {inv.ingredientName} ({inv.itemCode}) — Current: {inv.availableQuantity} {inv.unit}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
              Or Enter Custom Ingredient / Raw Material Name:
            </label>
            <input
              type="text"
              placeholder="e.g. Fresh Tomatoes (50kg Bag) or Refined Sunflower Oil"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: 'var(--border-radius-sm)',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-app)',
                fontSize: '13px',
                color: 'var(--text-primary)',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                Requested Quantity: *
              </label>
              <input
                type="number"
                min="0.1"
                step="0.1"
                placeholder="e.g. 25"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 'var(--border-radius-sm)',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-app)',
                  fontSize: '13px',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                Unit of Measure:
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 'var(--border-radius-sm)',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-app)',
                  fontSize: '13px',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              >
                <option value="kg">Kilograms (kg)</option>
                <option value="liters">Liters</option>
                <option value="packets">Packets</option>
                <option value="boxes">Boxes</option>
                <option value="tins">Tins</option>
                <option value="units">Units / Pieces</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                Requisition Urgency:
              </label>
              <select
                value={urgency}
                onChange={(e) => setUrgency(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 'var(--border-radius-sm)',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-app)',
                  fontSize: '13px',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              >
                <option value="Normal">Normal</option>
                <option value="High">High (Within 24 hours)</option>
                <option value="Emergency">Emergency (Immediate)</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                Required By Date:
              </label>
              <input
                type="date"
                value={requiredByDate}
                onChange={(e) => setRequiredByDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 'var(--border-radius-sm)',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-app)',
                  fontSize: '13px',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
              Justification & Kitchen Notes for Admin:
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Breakfast chai rush requirement."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: 'var(--border-radius-sm)',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-app)',
                fontSize: '13px',
                color: 'var(--text-primary)',
                outline: 'none',
                boxSizing: 'border-box',
                fontFamily: 'inherit'
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
            <button
              type="button"
              onClick={() => navigate('/staff/inventory')}
              style={{
                padding: '9px 16px',
                borderRadius: 'var(--border-radius-sm)',
                border: '1px solid var(--border-color)',
                background: 'none',
                fontSize: '12.5px',
                fontWeight: 600,
                cursor: 'pointer',
                color: 'var(--text-secondary)'
              }}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                borderRadius: 'var(--border-radius-sm)',
                backgroundColor: urgency === 'Emergency' ? 'var(--color-danger)' : 'var(--color-accent)',
                color: '#ffffff',
                border: 'none',
                fontSize: '13px',
                fontWeight: 700,
                cursor: isSubmitting ? 'not-allowed' : 'pointer'
              }}
            >
              <Send size={15} />
              <span>{isSubmitting ? 'Submitting...' : 'Submit Requisition to Admin'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StaffStockRequestsPage;
