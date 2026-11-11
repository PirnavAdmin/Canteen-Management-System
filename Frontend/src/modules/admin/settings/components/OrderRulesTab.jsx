import React, { useState, useEffect } from 'react';
import { Button } from '../../../../components/common/Button';

export const OrderRulesTab = ({ initialData = {}, onSave }) => {
  const [formData, setFormData] = useState({ ...initialData });

  useEffect(() => {
    setFormData({ ...initialData });
  }, [initialData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} style={{
      backgroundColor: '#ffffff',
      borderRadius: 'var(--border-radius-lg)',
      border: '1px solid var(--border-color)',
      padding: '24px',
      boxShadow: 'var(--shadow-xs)',
      display: 'flex',
      flexDirection: 'column',
      gap: '18px'
    }}>
      <div>
        <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 4px 0', color: 'var(--text-primary)' }}>
          Order Lifecycle & Slot Timing Governance
        </h3>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
          Enforce automated cancellation timers, pickup holding thresholds, and student booking quota guardrails.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
            Unpaid Order Expiry (Minutes) *
          </label>
          <input
            type="number"
            min="2"
            max="60"
            value={formData.unpaidOrderExpiryMinutes || 10}
            onChange={(e) => setFormData({ ...formData, unpaidOrderExpiryMinutes: Number(e.target.value) })}
            style={{ width: '100%', height: '36px', padding: '0 10px', fontSize: '13px', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-md)' }}
          />
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Pending payment orders will be released after this timer</span>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
            Pickup Token Hold Duration (Minutes) *
          </label>
          <input
            type="number"
            min="5"
            max="120"
            value={formData.pickupHoldDurationMinutes || 20}
            onChange={(e) => setFormData({ ...formData, pickupHoldDurationMinutes: Number(e.target.value) })}
            style={{ width: '100%', height: '36px', padding: '0 10px', fontSize: '13px', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-md)' }}
          />
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Maximum holding period at counter after food is marked ready</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
            Student Cancellation Cut-off (Minutes before slot) *
          </label>
          <input
            type="number"
            min="5"
            max="180"
            value={formData.cancellationDeadlineMinutes || 30}
            onChange={(e) => setFormData({ ...formData, cancellationDeadlineMinutes: Number(e.target.value) })}
            style={{ width: '100%', height: '36px', padding: '0 10px', fontSize: '13px', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-md)' }}
          />
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>No student-initiated cancellations allowed once kitchen enters prep window</span>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
            Advance Slot Booking Cut-off (Minutes prior) *
          </label>
          <input
            type="number"
            min="5"
            max="120"
            value={formData.orderCutoffMinutes || 15}
            onChange={(e) => setFormData({ ...formData, orderCutoffMinutes: Number(e.target.value) })}
            style={{ width: '100%', height: '36px', padding: '0 10px', fontSize: '13px', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-md)' }}
          />
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Orders for any slot close this many minutes before slot start</span>
        </div>
      </div>

      <div style={{
        padding: '14px 16px',
        backgroundColor: 'var(--bg-app)',
        borderRadius: 'var(--border-radius-md)',
        border: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div>
          <strong style={{ fontSize: '13.5px', color: 'var(--text-primary)' }}>
            Automated Reverse Refund on Kitchen Cancellation
          </strong>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
            When canteen staff cancels an order due to ingredient depletion, instantly trigger 100% gateway reverse credit.
          </p>
        </div>

        <input
          type="checkbox"
          checked={formData.autoRefundOnCancellation || false}
          onChange={(e) => setFormData({ ...formData, autoRefundOnCancellation: e.target.checked })}
          style={{ width: '18px', height: '18px', cursor: 'pointer' }}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
        <Button variant="primary" type="submit">
          Save Order Rules
        </Button>
      </div>
    </form>
  );
};

export default OrderRulesTab;
