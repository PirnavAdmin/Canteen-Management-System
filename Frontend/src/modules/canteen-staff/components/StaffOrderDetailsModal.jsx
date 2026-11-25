import React from 'react';
import { X, Clock, ShoppingBag, ChefHat, CheckCircle2 } from 'lucide-react';
import { ORDER_STATUS } from '../../../constants/appConstants';
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
  onCompleteOrder,
  onVerifyPickup,
  onReject
}) => {
  if (!isOpen || !order) return null;

  const {
    id,
    token,
    orderDate,
    createdAt,
    items = [],
    status = ORDER_STATUS.PLACED,
    orderType = 'Pickup',
    outletName = 'Central Dining Hall',
    timeline = [],
    notes
  } = order;

  // Format date and time
  const d = new Date(orderDate || createdAt || '');
  const dateFormatted = orderDate || createdAt
    ? d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';
  const timeFormatted = orderDate || createdAt
    ? d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
    : '—';

  const isPlaced = isStatusPlaced(status);
  const isAccepted = isStatusAccepted(status);
  const isPreparing = isStatusPreparing(status);
  const isReady = isStatusReady(status);
  const isCompleted = isStatusCompleted(status);
  const isCancelled = isStatusCancelled(status);

  const totalPortions = items.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 999,
      padding: '16px'
    }}>
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        color: 'var(--text-primary)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--border-radius-xl)',
        maxWidth: '720px',
        width: '100%',
        maxHeight: '92vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: 'var(--shadow-modal)',
        overflow: 'hidden'
      }}>
        {/* MODAL HEADER */}
        <div style={{
          padding: '16px 22px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'var(--bg-app)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{
              backgroundColor: '#1e3a8a',
              color: '#ffffff',
              padding: '3px 8px',
              borderRadius: '6px',
              fontWeight: 800,
              fontSize: '13px'
            }}>
              {token || 'T-ORD'}
            </span>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Order #{id}
              </h2>
              <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', margin: '1px 0 0 0' }}>
                {outletName} • {orderType}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              fontSize: '11px',
              fontWeight: 700,
              padding: '3px 9px',
              borderRadius: '9999px',
              backgroundColor: isReady
                ? 'var(--color-success-bg)'
                : isPreparing
                ? '#f5f3ff'
                : isAccepted
                ? '#f0f9ff'
                : isCompleted
                ? 'var(--color-success-bg)'
                : isCancelled
                ? 'var(--color-danger-bg)'
                : 'var(--color-warning-bg)',
              color: isReady
                ? 'var(--color-success)'
                : isPreparing
                ? '#8b5cf6'
                : isAccepted
                ? '#0284c7'
                : isCompleted
                ? 'var(--color-success)'
                : isCancelled
                ? 'var(--color-danger)'
                : 'var(--color-warning)',
              border: '1px solid var(--border-color)'
            }}>
              {status}
            </span>

            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* MODAL BODY (Scrollable) */}
        <div style={{ padding: '20px 22px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* 1. ORDER SPECIFICATION CARDS */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px'
          }}>
            {/* Order Identifiers */}
            <div style={{
              padding: '12px 14px',
              backgroundColor: 'var(--bg-app)',
              borderRadius: 'var(--border-radius-md)',
              border: '1px solid var(--border-color)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                <ShoppingBag size={13} />
                Order Identifiers
              </div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--color-primary)', marginTop: '4px' }}>
                {token || 'T-ORD'}
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Order ID: <strong>{id}</strong>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Status: {status}
              </div>
            </div>

            {/* Timing & Channel Box */}
            <div style={{
              padding: '12px 14px',
              backgroundColor: 'var(--bg-app)',
              borderRadius: 'var(--border-radius-md)',
              border: '1px solid var(--border-color)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                <Clock size={13} />
                Order Schedule & Type
              </div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
                {dateFormatted} at {timeFormatted}
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Order Type: <strong>{orderType}</strong>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Serving Counter: {outletName}
              </div>
            </div>

            {/* Kitchen Preparation Box */}
            <div style={{
              padding: '12px 14px',
              backgroundColor: 'var(--bg-app)',
              borderRadius: 'var(--border-radius-md)',
              border: '1px solid var(--border-color)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                <ChefHat size={13} />
                Kitchen Preparation
              </div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#ea580c', marginTop: '4px' }}>
                {items.length} {items.length === 1 ? 'Dish' : 'Dishes'} ({totalPortions} portions)
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Kitchen Station: <strong>Hot Food Line</strong>
              </div>
              {(notes || order.cookingNotes) && (
                <div style={{ fontSize: '11.5px', color: '#b45309', backgroundColor: '#fef3c7', padding: '4px 8px', borderRadius: '4px', marginTop: '4px', fontWeight: 600 }}>
                  Note: {notes || order.cookingNotes}
                </div>
              )}
            </div>
          </div>

          {/* 2. FOOD ITEM DETAILS TABLE */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Food Items To Prepare ({items.length})
              </div>
              <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                Total: {totalPortions} portions
              </span>
            </div>
            <div style={{
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--border-radius-md)',
              overflow: 'hidden'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-app)', borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ width: '40px', padding: '8px 12px', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'center' }}>#</th>
                    <th style={{ padding: '8px 12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Item</th>
                    <th style={{ padding: '8px 12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Details / Instructions</th>
                    <th style={{ width: '80px', padding: '8px 12px', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'center' }}>Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '8px 12px', color: 'var(--text-muted)', textAlign: 'center' }}>
                        {idx + 1}
                      </td>
                      <td style={{ padding: '8px 12px', fontWeight: 700, color: 'var(--text-primary)', fontSize: '13px' }}>
                        {item.name || item.itemName}
                      </td>
                      <td style={{ padding: '8px 12px', color: 'var(--text-muted)' }}>
                        {item.variant || item.notes || 'Standard Preparation'}
                      </td>
                      <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          backgroundColor: '#fff7ed',
                          color: '#ea580c',
                          fontWeight: 800,
                          fontSize: '13px'
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
                      fontSize: '11.5px',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      backgroundColor: 'var(--bg-app)',
                      border: '1px solid var(--border-color)'
                    }}
                  >
                    <span style={{ fontWeight: 700, color: 'var(--color-primary)', minWidth: '65px' }}>
                      {event.timestamp || '—'}
                    </span>
                    <span style={{
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      padding: '1px 6px',
                      borderRadius: '4px',
                      backgroundColor: 'var(--bg-muted)',
                      fontSize: '10.5px'
                    }}>
                      {event.status}
                    </span>
                    <span style={{ color: 'var(--text-muted)', flex: 1 }}>
                      {event.note || 'Status milestone updated'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* MODAL FOOTER WITH OPERATIONAL ACTIONS */}
        <div style={{
          padding: '14px 22px',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'var(--bg-app)',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <div>
            {!isCancelled && !isCompleted && (
              <button
                type="button"
                onClick={() => onReject(order)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--color-danger-border)',
                  backgroundColor: 'var(--color-danger-bg)',
                  color: 'var(--color-danger)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Reject Order
              </button>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-surface)',
                color: 'var(--text-secondary)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Close
            </button>

            {/* Status Information / Kitchen Actions */}
            {isPlaced && (
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 14px',
                borderRadius: '6px',
                backgroundColor: '#fef3c7',
                border: '1px solid #fde68a',
                color: '#b45309',
                fontSize: '12px',
                fontWeight: 700
              }}>
                <Clock size={14} />
                <span>Awaiting Cashier Acceptance</span>
              </div>
            )}

            {isAccepted && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onStartCooking) {
                    onStartCooking(order.id);
                  } else if (onAccept) {
                    onAccept(order.id);
                  }
                }}
                style={{
                  padding: '6px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: '#ea580c',
                  color: '#ffffff',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <ChefHat size={14} />
                <span>Start Preparing</span>
              </button>
            )}

            {isPreparing && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onMarkReady(order.id);
                }}
                style={{
                  padding: '6px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: '#059669',
                  color: '#ffffff',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <CheckCircle2 size={14} />
                <span>Ready / Move to Pickup</span>
              </button>
            )}

            {isReady && (
              <div style={{
                fontSize: '12px',
                color: '#2563eb',
                fontWeight: 700,
                padding: '6px 14px',
                borderRadius: '6px',
                backgroundColor: '#eff6ff',
                border: '1px solid #bfdbfe',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <CheckCircle2 size={15} />
                <span>At Cashier Pickup Counter {order.prepDurationFormatted ? `(${order.prepDurationFormatted})` : ''}</span>
              </div>
            )}

            {isCompleted && (
              <div style={{
                fontSize: '12px',
                color: 'var(--color-success)',
                fontWeight: 600,
                padding: '5px 12px',
                borderRadius: '6px',
                backgroundColor: 'var(--color-success-bg)',
                border: '1px solid var(--color-success-border)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}>
                <CheckCircle2 size={14} />
                <span>Collected by Customer {order.verifiedAt || order.completedAt ? `• ${new Date(order.verifiedAt || order.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffOrderDetailsModal;
