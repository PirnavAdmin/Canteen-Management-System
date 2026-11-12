import React from 'react';
import { X, AlertCircle, RotateCcw, Ban, CreditCard } from 'lucide-react';
import { Button } from '../../../../components/common/Button';
import { StatusBadge } from '../../../../components/common/StatusBadge';
import { formatCurrency } from '../../../../utils/formatters';
import { ORDER_STATUS, ORDER_LIFECYCLE_NEXT_STEPS } from '../../../../constants/appConstants';

export const OrderDetailsModal = ({
  isOpen,
  onClose,
  order,
  loading = false,
  onUpdateStatus,
  onOpenCancel,
  onProcessRefund
}) => {
  if (!isOpen || !order) return null;

  const nextSteps = ORDER_LIFECYCLE_NEXT_STEPS[order.status] || [];
  const canCancel = nextSteps.includes(ORDER_STATUS.CANCELLED);
  const canRefund = nextSteps.includes(ORDER_STATUS.REFUNDED) && order.status === ORDER_STATUS.CANCELLED;

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
        maxWidth: '740px',
        width: '100%',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: 'var(--shadow-modal)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 24px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                backgroundColor: '#1e3a8a',
                color: '#ffffff',
                padding: '3px 8px',
                borderRadius: '4px',
                fontWeight: 700,
                fontSize: '13px'
              }}>
                {order.token}
              </span>
              <h2 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Order #{order.id}
              </h2>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
              Outlet: {order.outletName} • Pickup Slot: {order.slot?.timeWindow} ({order.slot?.session})
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <StatusBadge status={order.status} />
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '6px'
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Customer Metadata Card */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '12px',
            backgroundColor: 'var(--bg-app)',
            padding: '12px 16px',
            borderRadius: 'var(--border-radius-md)',
            border: '1px solid var(--border-color)',
            fontSize: '12.5px'
          }}>
            <div>
              <span style={{ color: 'var(--text-muted)', fontSize: '11px', display: 'block' }}>Customer</span>
              <strong style={{ color: 'var(--text-primary)' }}>{order.customer?.name}</strong>
              <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>{order.customer?.role} ({order.customer?.rollNo})</div>
            </div>

            <div>
              <span style={{ color: 'var(--text-muted)', fontSize: '11px', display: 'block' }}>Department</span>
              <strong style={{ color: 'var(--text-primary)' }}>{order.customer?.department}</strong>
            </div>

            <div>
              <span style={{ color: 'var(--text-muted)', fontSize: '11px', display: 'block' }}>Contact Details</span>
              <div style={{ color: 'var(--text-secondary)' }}>{order.customer?.phone}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>{order.customer?.email}</div>
            </div>
          </div>

          {/* Items Breakdown Table */}
          <div>
            <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
              Ordered Items
            </h4>
            <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-md)', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12.5px' }}>
                <thead style={{ backgroundColor: 'var(--bg-muted)', borderBottom: '1px solid var(--border-color)' }}>
                  <tr>
                    <th style={{ padding: '8px 12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Item & Variant</th>
                    <th style={{ padding: '8px 12px', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'right' }}>Price</th>
                    <th style={{ padding: '8px 12px', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'center' }}>Qty</th>
                    <th style={{ padding: '8px 12px', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'right' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items?.map((item, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border-color-subtle)' }}>
                      <td style={{ padding: '8px 12px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.name}</div>
                        {item.variant && <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{item.variant}</div>}
                      </td>
                      <td style={{ padding: '8px 12px', textAlign: 'right' }}>{formatCurrency(item.price)}</td>
                      <td style={{ padding: '8px 12px', textAlign: 'center' }}>{item.quantity}</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600 }}>{formatCurrency(item.total || item.price * item.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Price summary */}
              <div style={{ padding: '10px 16px', backgroundColor: 'var(--bg-app)', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end', fontSize: '12.5px' }}>
                <div style={{ display: 'flex', gap: '24px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Subtotal:</span>
                  <span>{formatCurrency(order.subtotal || order.totalAmount)}</span>
                </div>
                {order.taxAmount && (
                  <div style={{ display: 'flex', gap: '24px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Institutional GST (5%):</span>
                    <span>{formatCurrency(order.taxAmount)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', gap: '24px', fontSize: '14px', fontWeight: 700, color: 'var(--color-primary)', marginTop: '4px' }}>
                  <span>Grand Total:</span>
                  <span>{formatCurrency(order.totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment & Refund Details */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '12px'
          }}>
            <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-md)', padding: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', color: 'var(--text-primary)', fontWeight: 600, fontSize: '12.5px' }}>
                <CreditCard size={14} style={{ color: 'var(--color-accent)' }} />
                <span>Payment Settlement</span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <div>Method: <strong>{order.payment?.method}</strong></div>
                <div>Transaction Ref: <code>{order.payment?.transactionId}</code></div>
                <div>Status: <strong style={{ color: order.payment?.status === 'Paid' ? 'var(--color-success)' : '#d97706' }}>{order.payment?.status}</strong></div>
              </div>
            </div>

            {order.cancellationReason && (
              <div style={{ border: '1px solid var(--color-danger-border)', backgroundColor: 'var(--color-danger-bg)', borderRadius: 'var(--border-radius-md)', padding: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', color: 'var(--color-danger-text)', fontWeight: 600, fontSize: '12.5px' }}>
                  <AlertCircle size={14} />
                  <span>Cancellation & Refund</span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-danger-text)' }}>
                  Reason: {order.cancellationReason}
                </div>
                {order.refundDetails && (
                  <div style={{ fontSize: '11.5px', color: 'var(--color-danger-text)', marginTop: '4px' }}>
                    Refund Ref: {order.refundDetails.refundId} ({formatCurrency(order.refundDetails.amount)}) - {order.refundDetails.status}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Order Lifecycle Timeline */}
          <div>
            <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 10px 0' }}>
              Order Status Lifecycle Timeline
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {order.timeline?.map((event, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    backgroundColor: event.status === ORDER_STATUS.CANCELLED ? 'var(--color-danger-bg)' : 'var(--color-primary-light)',
                    border: `1.5px solid ${event.status === ORDER_STATUS.CANCELLED ? 'var(--color-danger)' : 'var(--color-primary)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: event.status === ORDER_STATUS.CANCELLED ? 'var(--color-danger)' : 'var(--color-primary)',
                    fontSize: '11px',
                    fontWeight: 700,
                    flexShrink: 0,
                    marginTop: '2px'
                  }}>
                    ✓
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {event.status}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {event.timestamp}
                      </span>
                    </div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {event.note}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer with permitted actions */}
        <div style={{
          padding: '14px 24px',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            {canCancel && (
              <Button
                variant="danger"
                icon={Ban}
                disabled={loading}
                onClick={() => onOpenCancel(order)}
              >
                Cancel Order
              </Button>
            )}

            {canRefund && (
              <Button
                variant="warning"
                icon={RotateCcw}
                loading={loading}
                onClick={() => onProcessRefund(order.id)}
              >
                Process Refund
              </Button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="secondary" onClick={onClose} disabled={loading}>
              Close
            </Button>

            {nextSteps.map(nextSt => {
              if (nextSt === ORDER_STATUS.CANCELLED || nextSt === ORDER_STATUS.REFUNDED) return null;
              return (
                <Button
                  key={nextSt}
                  variant="primary"
                  loading={loading}
                  onClick={() => onUpdateStatus(order.id, nextSt)}
                >
                  Mark as {nextSt}
                </Button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsModal;
