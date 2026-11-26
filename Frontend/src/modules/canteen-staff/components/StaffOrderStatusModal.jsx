import React, { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import { Modal } from '../../../components/modals/Modal';
import { Button } from '../../../components/common/Button';
import { ORDER_LIFECYCLE_NEXT_STEPS } from '../../../constants/appConstants';
import styles from '../styles/staff.module.css';

export const StaffOrderStatusModal = ({
  isOpen,
  onClose,
  order,
  onConfirm
}) => {
  const [selectedStatus, setSelectedStatus] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (order) {
      const allowedNext = ORDER_LIFECYCLE_NEXT_STEPS[order.status] || [];
      setSelectedStatus(allowedNext[0] || order.status);
      setNote('');
      setError(null);
    }
  }, [order]);

  if (!isOpen || !order) return null;

  const currentStatus = order.status;
  const allowedNextSteps = ORDER_LIFECYCLE_NEXT_STEPS[currentStatus] || [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStatus) {
      setError('Please select a valid target status.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onConfirm(order.id, selectedStatus, note);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update order status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Update Order Status"
      subtitle={`Order ${order.token || order.id}${order.customer?.name ? ` • ${order.customer.name}` : ''}`}
      maxWidth="460px"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {error && (
          <div className={styles.errorBanner} role="alert">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <AlertCircle size={14} />
              <span>{error}</span>
            </div>
          </div>
        )}

        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
            Current Status
          </label>
          <div style={{
            padding: '8px 12px',
            borderRadius: 'var(--border-radius-md)',
            backgroundColor: 'var(--bg-app)',
            border: '1px solid var(--border-color)',
            fontSize: '13px',
            fontWeight: 600,
            color: 'var(--text-primary)'
          }}>
            {currentStatus}
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
            Target Next Status
          </label>
          {allowedNextSteps.length === 0 ? (
            <div style={{ fontSize: '12.5px', color: 'var(--text-muted)', padding: '6px 0' }}>
              This order has reached terminal status ({currentStatus}) and cannot be transitioned further.
            </div>
          ) : (
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className={styles.formInput}
            >
              {allowedNextSteps.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
            Staff Note / Audit Remark (Optional)
          </label>
          <textarea
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Prepared and placed at pickup counter"
            className={styles.formTextarea}
          />
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: '10px',
          paddingTop: '12px',
          borderTop: '1px solid var(--border-color)'
        }}>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={loading}
            disabled={allowedNextSteps.length === 0}
          >
            Save Status Update
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default StaffOrderStatusModal;
