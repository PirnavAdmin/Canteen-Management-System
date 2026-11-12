import React, { useState, useEffect } from 'react';
import { X, Star, Clock } from 'lucide-react';
import { Button } from '../../../../components/common/Button';
import { StatusBadge } from '../../../../components/common/StatusBadge';
import { FEEDBACK_STATUS } from '../../../../constants/appConstants';

export const FeedbackDetailsModal = ({ isOpen, onClose, ticket, onResolve }) => {
  const [status, setStatus] = useState(FEEDBACK_STATUS.RESOLVED);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (ticket) {
      setStatus(ticket.status === FEEDBACK_STATUS.NEW ? FEEDBACK_STATUS.UNDER_REVIEW : ticket.status);
      setNotes(ticket.resolutionNotes || '');
      setError('');
    }
  }, [ticket, isOpen]);

  if (!isOpen || !ticket) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!notes.trim()) {
      setError('Resolution notes / supervisory comments are required before updating grievance status.');
      return;
    }
    try {
      setSubmitting(true);
      await onResolve(ticket.id, {
        status,
        notes,
        resolvedBy: 'Dr. Rajesh Sharma (Administrator)'
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
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
        maxWidth: '600px',
        width: '100%',
        maxHeight: '90vh',
        boxShadow: 'var(--shadow-modal)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                Grievance Ticket #{ticket.id}
              </h3>
              <StatusBadge status={ticket.status} size="sm" />
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
              Category: {ticket.complaintCategory} • Outlet: {ticket.outletName}
            </p>
          </div>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Customer & Rating overview */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 16px',
            backgroundColor: 'var(--bg-app)',
            borderRadius: 'var(--border-radius-md)',
            border: '1px solid var(--border-color)'
          }}>
            <div>
              <strong style={{ fontSize: '13.5px', color: 'var(--text-primary)' }}>{ticket.customerName}</strong>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{ticket.customerRole} ({ticket.customerEmail})</div>
              <div style={{ fontSize: '11.5px', color: 'var(--color-primary)', marginTop: '2px' }}>
                Linked Order: <strong>{ticket.orderToken}</strong> ({ticket.orderId})
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ display: 'flex', gap: '2px' }}>
                {[1, 2, 3, 4, 5].map(s => (
                  <Star
                    key={s}
                    size={15}
                    fill={s <= ticket.rating ? '#f59e0b' : 'none'}
                    color={s <= ticket.rating ? '#f59e0b' : 'var(--border-color)'}
                  />
                ))}
              </div>
              <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Given Rating: {ticket.rating}/5</span>
            </div>
          </div>

          {/* Feedback Comments */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
              Customer Experience Comments
            </label>
            <div style={{
              padding: '12px 14px',
              backgroundColor: 'var(--color-warning-bg)',
              border: '1px solid var(--color-warning-border)',
              borderRadius: 'var(--border-radius-md)',
              fontSize: '13px',
              color: 'var(--color-warning-text)',
              lineHeight: 1.5
            }}>
              "{ticket.comments}"
            </div>
          </div>

          {/* Resolution History */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
              Resolution Audit Trail
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {ticket.history?.map((h, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '12px' }}>
                  <Clock size={13} style={{ color: 'var(--text-muted)', marginTop: '2px', flexShrink: 0 }} />
                  <div>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{h.status}</span>
                    <span style={{ color: 'var(--text-muted)', marginLeft: '6px' }}>({h.timestamp})</span>
                    <div style={{ color: 'var(--text-secondary)' }}>{h.note}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Resolution Form */}
          <form onSubmit={handleSubmit} style={{ borderTop: '1px solid var(--border-color)', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  Update Grievance Status *
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  style={{
                    width: '100%',
                    height: '36px',
                    padding: '0 8px',
                    fontSize: '13px',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--border-radius-md)'
                  }}
                >
                  <option value={FEEDBACK_STATUS.UNDER_REVIEW}>Under Review (Investigation Active)</option>
                  <option value={FEEDBACK_STATUS.RESOLVED}>Resolved (Corrective Action Taken)</option>
                  <option value={FEEDBACK_STATUS.DISMISSED}>Dismissed (Unsubstantiated)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  Authorizing Administrator
                </label>
                <input
                  type="text"
                  disabled
                  value="Dr. Rajesh Sharma"
                  style={{
                    width: '100%',
                    height: '36px',
                    padding: '0 8px',
                    fontSize: '13px',
                    backgroundColor: 'var(--bg-muted)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--border-radius-md)'
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                Resolution Notes / Remedial Action Taken *
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => { setNotes(e.target.value); setError(''); }}
                placeholder="Detail remedial actions taken with kitchen staff or compensation issued..."
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  fontSize: '13px',
                  border: `1px solid ${error ? 'var(--color-danger)' : 'var(--border-color)'}`,
                  borderRadius: 'var(--border-radius-md)'
                }}
              />
              {error && <span style={{ fontSize: '11px', color: 'var(--color-danger)' }}>{error}</span>}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
              <Button variant="secondary" onClick={onClose} type="button" disabled={submitting}>
                Close
              </Button>
              <Button variant="primary" type="submit" loading={submitting}>
                Save Resolution
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FeedbackDetailsModal;
