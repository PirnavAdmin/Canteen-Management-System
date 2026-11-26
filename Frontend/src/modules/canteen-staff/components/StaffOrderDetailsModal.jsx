import React from 'react';
import { Clock, ShoppingBag, ChefHat, CheckCircle2 } from 'lucide-react';
import { Modal } from '../../../components/modals/Modal';
import { Button } from '../../../components/common/Button';
import { StatusBadge } from '../../../components/common/StatusBadge';
import { ORDER_STATUS } from '../../../constants/appConstants';
import { formatDate, formatTimeIST } from '../../../utils/formatters';
import {
  isStatusPlaced,
  isStatusAccepted,
  isStatusPreparing,
  isStatusReady,
  isStatusCompleted,
  isStatusCancelled
} from '../services/staffOrderService';

export const StaffOrderDetailsModal = ({
  isOpen,
  onClose,
  order,
  onAccept,
  onStartCooking,
  onMarkReady,
  onReject
}) => {
  if (!isOpen || !order) return null;

  const {
    id,
    orderId,
    token,
    orderDate,
    createdAt,
    items = [],
    status = ORDER_STATUS.PLACED,
    orderType = 'Pickup',
    outletName = '',
    timeline = [],
    notes
  } = order;

  const resolvedId = id || orderId;
  const ts = orderDate || createdAt;
  const dateFormatted = ts ? formatDate(ts) : '—';
  const timeFormatted = ts ? formatTimeIST(ts) : '—';

  const isPlaced = isStatusPlaced(status);
  const isAccepted = isStatusAccepted(status);
  const isPreparing = isStatusPreparing(status);
  const isReady = isStatusReady(status);
  const isCompleted = isStatusCompleted(status);
  const isCancelled = isStatusCancelled(status);

  const totalPortions = items.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Order #${resolvedId} (${token || 'Token'})`}
      subtitle={[outletName, orderType].filter(Boolean).join(' • ')}
      maxWidth="720px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {/* Status Strip */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Placed: <strong style={{ color: 'var(--text-primary)' }}>{dateFormatted}</strong> at <strong>{timeFormatted}</strong>
          </span>
          <StatusBadge status={status} />
        </div>

        {/* 1. ORDER SPECIFICATION CARDS */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px'
        }}>
          <div style={{
            padding: '12px 14px',
            backgroundColor: 'var(--bg-app)',
            borderRadius: 'var(--border-radius-md)',
            border: '1px solid var(--border-color)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              <ShoppingBag size={13} />
              <span>Order Identifiers</span>
            </div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-primary)', marginTop: '4px' }}>
              {token || '—'}
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Order ID: <strong>{resolvedId}</strong>
            </div>
          </div>

          <div style={{
            padding: '12px 14px',
            backgroundColor: 'var(--bg-app)',
            borderRadius: 'var(--border-radius-md)',
            border: '1px solid var(--border-color)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              <Clock size={13} />
              <span>Schedule &amp; Type</span>
            </div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
              {orderType}
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Outlet: {outletName || '—'}
            </div>
          </div>

          <div style={{
            padding: '12px 14px',
            backgroundColor: 'var(--bg-app)',
            borderRadius: 'var(--border-radius-md)',
            border: '1px solid var(--border-color)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              <ChefHat size={13} />
              <span>Preparation Summary</span>
            </div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-primary)', marginTop: '4px' }}>
              {items.length} {items.length === 1 ? 'Dish' : 'Dishes'} ({totalPortions} portions)
            </div>
            {(notes || order.cookingNotes) && (
              <div style={{
                fontSize: '11.5px',
                color: 'var(--color-warning-text)',
                backgroundColor: 'var(--color-warning-bg)',
                border: '1px solid var(--color-warning-border)',
                padding: '4px 8px',
                borderRadius: '4px',
                marginTop: '6px',
                fontWeight: 600
              }}>
                Note: {notes || order.cookingNotes}
              </div>
            )}
          </div>
        </div>

        {/* 2. FOOD ITEM DETAILS TABLE */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Food Items To Prepare ({items.length})
            </span>
            <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Total: {totalPortions} portions
            </span>
          </div>
          <div style={{
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--border-radius-md)',
            overflow: 'hidden'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12.5px' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-app)', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ width: '40px', padding: '8px 12px', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', textAlign: 'center' }}>#</th>
                  <th style={{ padding: '8px 12px', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Item</th>
                  <th style={{ padding: '8px 12px', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Details / Instructions</th>
                  <th style={{ width: '80px', padding: '8px 12px', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', textAlign: 'center' }}>Qty</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: idx < items.length - 1 ? '1px solid var(--border-color-subtle)' : 'none' }}>
                    <td style={{ padding: '8px 12px', color: 'var(--text-muted)', textAlign: 'center' }}>
                      {idx + 1}
                    </td>
                    <td style={{ padding: '8px 12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {item.name || item.itemName}
                    </td>
                    <td style={{ padding: '8px 12px', color: 'var(--text-muted)' }}>
                      {item.variant || item.notes || 'Standard Preparation'}
                    </td>
                    <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        borderRadius: 'var(--border-radius-xs)',
                        backgroundColor: 'var(--color-primary-light)',
                        color: 'var(--color-primary)',
                        fontWeight: 700,
                        fontSize: '12px'
                      }}>
                        {item.quantity}x
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 3. ORDER TRACKING TIMELINE */}
        <div>
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Order Lifecycle Tracking
          </div>
          {timeline.length === 0 ? (
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Order initialized with current status: {status}.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {timeline.map((event, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    fontSize: '12px',
                    padding: '7px 10px',
                    borderRadius: 'var(--border-radius-sm)',
                    backgroundColor: 'var(--bg-app)',
                    border: '1px solid var(--border-color)'
                  }}
                >
                  <span style={{ fontWeight: 700, color: 'var(--color-primary)', minWidth: '65px' }}>
                    {event.timestamp || '—'}
                  </span>
                  <StatusBadge status={event.status} size="sm" />
                  <span style={{ color: 'var(--text-secondary)', flex: 1 }}>
                    {event.note || 'Status milestone updated'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* MODAL FOOTER ACTIONS */}
        <div style={{
          paddingTop: '14px',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <div>
            {!isCancelled && !isCompleted && onReject && (
              <Button variant="danger" size="sm" onClick={() => onReject(order)}>
                Reject Order
              </Button>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <Button variant="secondary" size="sm" onClick={onClose}>
              Close
            </Button>

            {isPlaced && (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 12px',
                borderRadius: 'var(--border-radius-md)',
                backgroundColor: 'var(--color-warning-bg)',
                border: '1px solid var(--color-warning-border)',
                color: 'var(--color-warning-text)',
                fontSize: '12px',
                fontWeight: 600
              }}>
                <Clock size={14} />
                <span>Awaiting Cashier Acceptance</span>
              </span>
            )}

            {isAccepted && (
              <Button
                variant="primary"
                size="sm"
                icon={ChefHat}
                onClick={() => {
                  onClose();
                  if (onStartCooking) onStartCooking(resolvedId);
                  else if (onAccept) onAccept(resolvedId);
                }}
              >
                Start Preparing
              </Button>
            )}

            {isPreparing && onMarkReady && (
              <Button
                variant="primary"
                size="sm"
                icon={CheckCircle2}
                onClick={() => {
                  onClose();
                  onMarkReady(resolvedId);
                }}
                style={{ backgroundColor: 'var(--color-success)', borderColor: 'var(--color-success)' }}
              >
                Ready / Move to Pickup
              </Button>
            )}

            {isReady && (
              <span style={{
                fontSize: '12px',
                color: 'var(--color-info-text)',
                fontWeight: 600,
                padding: '6px 12px',
                borderRadius: 'var(--border-radius-md)',
                backgroundColor: 'var(--color-info-bg)',
                border: '1px solid var(--color-info-border)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <CheckCircle2 size={14} />
                <span>At Pickup Counter {order.prepDurationFormatted ? `(${order.prepDurationFormatted})` : ''}</span>
              </span>
            )}

            {isCompleted && (
              <span style={{
                fontSize: '12px',
                color: 'var(--color-success-text)',
                fontWeight: 600,
                padding: '6px 12px',
                borderRadius: 'var(--border-radius-md)',
                backgroundColor: 'var(--color-success-bg)',
                border: '1px solid var(--color-success-border)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}>
                <CheckCircle2 size={14} />
                <span>Collected{order.verifiedAt || order.completedAt ? ` • ${formatTimeIST(order.verifiedAt || order.completedAt)}` : ''}</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default StaffOrderDetailsModal;
