import React, { useState, useEffect } from 'react';
import { X, SlidersHorizontal, AlertCircle } from 'lucide-react';
import { Button } from '../../../../components/common/Button';

export const AdjustCapacityModal = ({ isOpen, onClose, slot, onSaveCapacity }) => {
  const [newCapacity, setNewCapacity] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (slot) {
      setNewCapacity(slot.maxCapacity);
      setError('');
    }
  }, [slot, isOpen]);

  if (!isOpen || !slot) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const val = Number(newCapacity);
    if (isNaN(val) || val <= 0) {
      setError('Please enter a valid positive capacity.');
      return;
    }

    // Institutional business rule validation
    if (val < slot.bookedOrders) {
      setError(`Cannot reduce capacity to ${val}. There are already ${slot.bookedOrders} confirmed student/faculty bookings for this slot. Policy prevents dropping capacity below active bookings.`);
      return;
    }

    onSaveCapacity(slot.id, val);
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.6)',
      backdropFilter: 'blur(3px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 65,
      padding: '16px'
    }}>
      <div style={{
        backgroundColor: 'var(--modal-bg)',
        color: 'var(--text-primary)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--border-radius-xl)',
        maxWidth: '460px',
        width: '100%',
        boxShadow: 'var(--shadow-modal)',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <SlidersHorizontal size={18} style={{ color: 'var(--color-primary)' }} />
            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              Adjust Slot Capacity
            </h3>
          </div>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '20px' }}>
          <div style={{ marginBottom: '14px', fontSize: '13px', color: 'var(--text-secondary)' }}>
            <div><strong>{slot.outletName}</strong></div>
            <div>{slot.mealSession} • {slot.startTime} to {slot.endTime}</div>
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '10px 14px',
            backgroundColor: 'var(--bg-app)',
            borderRadius: 'var(--border-radius-md)',
            border: '1px solid var(--border-color)',
            fontSize: '12.5px',
            marginBottom: '16px'
          }}>
            <div>
              <span style={{ color: 'var(--text-muted)', fontSize: '11px', display: 'block' }}>Current Bookings</span>
              <strong style={{ color: 'var(--color-primary)', fontSize: '15px' }}>{slot.bookedOrders} confirmed</strong>
            </div>

            <div>
              <span style={{ color: 'var(--text-muted)', fontSize: '11px', display: 'block' }}>Current Capacity</span>
              <strong style={{ color: 'var(--text-primary)', fontSize: '15px' }}>{slot.maxCapacity} orders</strong>
            </div>
          </div>

          <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
            New Maximum Capacity (Orders) *
          </label>
          <input
            type="number"
            min={slot.bookedOrders}
            value={newCapacity}
            onChange={(e) => { setNewCapacity(e.target.value); setError(''); }}
            style={{
              width: '100%',
              height: '38px',
              padding: '0 10px',
              fontSize: '14px',
              fontWeight: 600,
              border: `1.5px solid ${error ? 'var(--color-danger)' : 'var(--border-color)'}`,
              borderRadius: 'var(--border-radius-md)',
              marginBottom: '6px'
            }}
          />

          {error && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '11.5px', color: 'var(--color-danger)', marginTop: '6px' }}>
              <AlertCircle size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>{error}</span>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '18px' }}>
            <Button variant="secondary" onClick={onClose} type="button">
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Update Capacity
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdjustCapacityModal;
