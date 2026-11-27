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
import { useToast } from '../../../app/providers/ToastProvider';
import { PageHeader } from '../../../components/common/PageHeader';
import { Card } from '../../../components/common/Card';
import { Button } from '../../../components/common/Button';
import styles from '../styles/staff.module.css';

export const StaffStockRequestsPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();
  const { inventory, outletId, activeOutletName, loading, error, createRequest } = useStaffInventory();

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
    const matched = inventory.find((i) => i.ingredientName === selectedName);
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

      const matched = inventory.find((i) => i.ingredientName.toLowerCase() === itemName.trim().toLowerCase());

      const created = await createRequest({
        ingredientId: matched?.id || null,
        itemName: itemName.trim(),
        itemCode: matched?.itemCode || 'ING-REQ',
        category: matched?.category || 'General Kitchen Supplies',
        requestedQuantity: Number(quantity),
        unit,
        urgency,
        requiredByDate,
        notes: notes.trim(),
        outletId,
        outletName: activeOutletName
      });

      setSuccessData(created);
      success('Requisition Submitted', `Stock requisition #${created.id} submitted to Central Admin.`);
    } catch (err) {
      const msg = err.message || 'Failed to submit stock request.';
      setErrorMsg(msg);
      toastError('Submission Failed', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '850px', margin: '0 auto' }}>
      <PageHeader
        title="Request Raw Materials & Stock from Admin"
        description="Submit a canteen stock replenishment requisition to Central Campus Admin."
        actions={
          <Link
            to="/staff/stock-requests/history"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: 'var(--border-radius-md)',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              fontSize: '13px',
              fontWeight: 500,
              textDecoration: 'none'
            }}
          >
            <History size={15} />
            <span>Request History</span>
          </Link>
        }
      />

      {error && (
        <div className={styles.errorBanner} role="alert">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        </div>
      )}

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
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--color-success-text)' }}>
            <CheckCircle2 size={22} style={{ flexShrink: 0 }} />
            <div>
              <strong style={{ fontSize: '14px' }}>Stock Requisition #{successData.id} Submitted to Admin</strong>
              <p style={{ margin: '2px 0 0 0', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
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
                borderRadius: 'var(--border-radius-md)',
                backgroundColor: 'var(--color-success)',
                color: '#ffffff',
                fontSize: '12.5px',
                fontWeight: 600,
                textDecoration: 'none'
              }}
            >
              <span>Track in Ledger</span>
              <ArrowRight size={13} />
            </Link>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setSuccessData(null);
                setItemName('');
                setQuantity('');
                setNotes('');
              }}
            >
              New Request
            </Button>
          </div>
        </div>
      )}

      <Card padding="24px">
        {errorMsg && (
          <div className={styles.errorBanner} role="alert" style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className={styles.infoBanner} style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
              <Building size={15} style={{ color: 'var(--color-primary)' }} />
              <span>Destination Kitchen: <strong>{activeOutletName || (loading ? 'Loading...' : 'No outlet selected')}</strong></span>
            </div>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-primary)' }}>
              Target: Central Warehouse (Campus Admin)
            </span>
          </div>

          <div>
            <label style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
              Select Existing Inventory Item
            </label>
            <select
              value={itemName}
              onChange={handleItemSelect}
              className={styles.formInput}
              disabled={loading}
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
            <label style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
              Or Enter Custom Ingredient / Raw Material Name
            </label>
            <input
              type="text"
              placeholder="e.g. Fresh Tomatoes or Refined Sunflower Oil"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              className={styles.formInput}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                Requested Quantity <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <input
                type="number"
                min="0.1"
                step="any"
                required
                placeholder="e.g. 25"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className={styles.formInput}
              />
            </div>

            <div>
              <label style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                Unit of Measure
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className={styles.formInput}
              >
                <option value="kg">Kilograms (kg)</option>
                <option value="g">Grams (g)</option>
                <option value="litre">Litres</option>
                <option value="ml">Millilitres (ml)</option>
                <option value="packets">Packets</option>
                <option value="boxes">Boxes</option>
                <option value="pieces">Pieces</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                Requisition Urgency
              </label>
              <select
                value={urgency}
                onChange={(e) => setUrgency(e.target.value)}
                className={styles.formInput}
              >
                <option value="Normal">Normal</option>
                <option value="High">High (Within 24 hours)</option>
                <option value="Emergency">Emergency (Immediate)</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                Required By Date
              </label>
              <input
                type="date"
                value={requiredByDate}
                onChange={(e) => setRequiredByDate(e.target.value)}
                className={styles.formInput}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
              Justification &amp; Kitchen Notes for Admin
            </label>
            <textarea
              rows={3}
              placeholder="Provide operational context for this requisition..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={styles.formTextarea}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '8px', borderTop: '1px solid var(--border-color)' }}>
            <Button variant="secondary" onClick={() => navigate('/staff/inventory')}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant={urgency === 'Emergency' ? 'danger' : 'primary'}
              icon={Send}
              loading={isSubmitting}
              disabled={!outletId}
            >
              Submit Requisition to Admin
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default StaffStockRequestsPage;
