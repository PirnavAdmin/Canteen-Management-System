import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '../../../../components/common/Button';
import { SLOT_SESSIONS } from '../../../../constants/appConstants';
import { canteenService } from '../../outlets/services/canteenService';

export const SlotModal = ({ isOpen, onClose, onSubmit }) => {
  const [outlets, setOutlets] = useState([]);
  const [formData, setFormData] = useState({
    outletId: 1,
    outletName: 'Main Canteen',
    date: new Date().toISOString().split('T')[0],
    mealSession: 'Lunch',
    startTime: '12:00',
    endTime: '12:30',
    slotDuration: '30 mins',
    maxCapacity: 60,
    cutoffMinutes: 15
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    let isMounted = true;
    canteenService.getAll().then((data) => {
      if (isMounted && Array.isArray(data) && data.length > 0) {
        setOutlets(data);
        setFormData(prev => ({
          ...prev,
          outletId: data[0].outletId || data[0].id || 1,
          outletName: data[0].name || 'Campus Dining'
        }));
      }
    }).catch(() => {});
    return () => { isMounted = false; };
  }, []);

  if (!isOpen) return null;

  const validate = () => {
    const errs = {};
    if (!formData.startTime) errs.startTime = 'Start time is required.';
    if (!formData.endTime) errs.endTime = 'End time is required.';
    if (formData.startTime >= formData.endTime) errs.endTime = 'End time must be after start time.';
    if (!formData.maxCapacity || Number(formData.maxCapacity) <= 0) {
      errs.maxCapacity = 'Capacity must be greater than zero.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({
      ...formData,
      outletId: Number(formData.outletId) || 1,
      maxCapacity: Number(formData.maxCapacity)
    });
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
      zIndex: 60,
      padding: '16px'
    }}>
      <div style={{
        backgroundColor: 'var(--modal-bg)',
        color: 'var(--text-primary)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--border-radius-xl)',
        maxWidth: '520px',
        width: '100%',
        boxShadow: 'var(--shadow-modal)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              Configure Dining Slot
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
              Define operational order windows, meal sessions, and throughput capacity.
            </p>
          </div>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
              Campus Outlet *
            </label>
            <select
              value={formData.outletId}
              onChange={(e) => {
                const selId = Number(e.target.value) || 1;
                const found = outlets.find(o => (o.outletId || o.id) === selId);
                setFormData({
                  ...formData,
                  outletId: selId,
                  outletName: found?.name || 'Campus Dining'
                });
              }}
              style={{
                width: '100%',
                height: '36px',
                padding: '0 10px',
                fontSize: '13px',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--border-radius-md)'
              }}
            >
              {outlets.length > 0 ? (
                outlets.map(out => (
                  <option key={out.outletId || out.id} value={out.outletId || out.id}>
                    {out.name} ({out.code || 'MC'})
                  </option>
                ))
              ) : (
                <option value={1}>Main Canteen (MC-01)</option>
              )}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                Slot Date *
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                style={{
                  width: '100%',
                  height: '36px',
                  padding: '0 8px',
                  fontSize: '13px',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--border-radius-md)'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                Meal Session *
              </label>
              <select
                value={formData.mealSession}
                onChange={(e) => setFormData({ ...formData, mealSession: e.target.value })}
                style={{
                  width: '100%',
                  height: '36px',
                  padding: '0 10px',
                  fontSize: '13px',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--border-radius-md)'
                }}
              >
                {SLOT_SESSIONS.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                Start Time *
              </label>
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                style={{
                  width: '100%',
                  height: '36px',
                  padding: '0 8px',
                  fontSize: '13px',
                  border: `1px solid ${errors.startTime ? 'var(--color-danger)' : 'var(--border-color)'}`,
                  borderRadius: 'var(--border-radius-md)'
                }}
              />
              {errors.startTime && <span style={{ fontSize: '11px', color: 'var(--color-danger)' }}>{errors.startTime}</span>}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                End Time *
              </label>
              <input
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                style={{
                  width: '100%',
                  height: '36px',
                  padding: '0 8px',
                  fontSize: '13px',
                  border: `1px solid ${errors.endTime ? 'var(--color-danger)' : 'var(--border-color)'}`,
                  borderRadius: 'var(--border-radius-md)'
                }}
              />
              {errors.endTime && <span style={{ fontSize: '11px', color: 'var(--color-danger)' }}>{errors.endTime}</span>}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                Max Order Capacity *
              </label>
              <input
                type="number"
                min="5"
                value={formData.maxCapacity}
                onChange={(e) => setFormData({ ...formData, maxCapacity: e.target.value })}
                style={{
                  width: '100%',
                  height: '36px',
                  padding: '0 8px',
                  fontSize: '13px',
                  border: `1px solid ${errors.maxCapacity ? 'var(--color-danger)' : 'var(--border-color)'}`,
                  borderRadius: 'var(--border-radius-md)'
                }}
              />
              {errors.maxCapacity && <span style={{ fontSize: '11px', color: 'var(--color-danger)' }}>{errors.maxCapacity}</span>}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                Cut-off Window (Minutes prior)
              </label>
              <input
                type="number"
                min="0"
                value={formData.cutoffMinutes}
                onChange={(e) => setFormData({ ...formData, cutoffMinutes: e.target.value })}
                style={{
                  width: '100%',
                  height: '36px',
                  padding: '0 8px',
                  fontSize: '13px',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--border-radius-md)'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '14px' }}>
            <Button variant="secondary" onClick={onClose} type="button">
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Save Slot
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SlotModal;
