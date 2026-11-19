import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  QrCode,
  Search,
  CheckCircle2,
  AlertCircle,
  XCircle,
  User,
  ShoppingBag,
  CreditCard
} from 'lucide-react';
import { useStaffOrders } from '../hooks/useStaffOrders';
import { staffOrderService } from '../services/staffOrderService';
import { STAFF_APP_CONFIG } from '../constants/staffNavigation';
import { ORDER_STATUS } from '../../../constants/appConstants';
import { PageHeader } from '../../../components/common/PageHeader';

export const VerifyPickupPage = () => {
  const [searchParams] = useSearchParams();
  const initialToken = searchParams.get('token') || '';

  const { orders, refreshOrders, confirmPickupHandover } = useStaffOrders();
  const [tokenInput, setTokenInput] = useState(initialToken);
  const [verifiedOrder, setVerifiedOrder] = useState(null);
  const [searchError, setSearchError] = useState('');
  const [handoverSuccess, setHandoverSuccess] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Ready for pickup quick tokens
  const readyOrders = orders.filter(
    o => o.status === ORDER_STATUS.READY_FOR_PICKUP || o.status === 'Ready for Pickup'
  );

  const handleVerify = useCallback(async (queryToSearch) => {
    const q = queryToSearch !== undefined ? queryToSearch : tokenInput;
    if (!q || !q.trim()) {
      setSearchError('Please enter a valid counter token (e.g. T-101) or Order ID.');
      setVerifiedOrder(null);
      return;
    }

    try {
      setSearchError('');
      setHandoverSuccess(false);
      const matched = await staffOrderService.verifyPickupHandover(q);
      setVerifiedOrder(matched);
    } catch (err) {
      setSearchError(err.message || 'No matching order found for this token.');
      setVerifiedOrder(null);
    }
  }, [tokenInput]);

  useEffect(() => {
    if (initialToken) {
      handleVerify(initialToken);
    }
  }, [initialToken, handleVerify]);

  const handleQuickSelect = (order) => {
    setTokenInput(order.token || order.id);
    setVerifiedOrder(order);
    setSearchError('');
    setHandoverSuccess(false);
  };

  const handleConfirmHandover = async () => {
    if (!verifiedOrder) return;
    try {
      setIsProcessing(true);
      const completed = await confirmPickupHandover(verifiedOrder.id);
      setVerifiedOrder(completed);
      setHandoverSuccess(true);
      await refreshOrders();
    } catch (err) {
      setSearchError(err.message || 'Failed to complete handover.');
    } finally {
      setIsProcessing(false);
    }
  };

  const isAlreadyCompleted = verifiedOrder?.status === ORDER_STATUS.COMPLETED;
  const isReady = verifiedOrder?.status === ORDER_STATUS.READY_FOR_PICKUP || verifiedOrder?.status === 'Ready for Pickup';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1000px', margin: '0 auto' }}>
      {/* Page Header */}
      <PageHeader
        title="Verify Counter Pickup & Meal Handover"
        description="Authenticate customer token, verify payment, prevent duplicate pickup & complete meal collection."
      />

      {/* Token Search Bar */}
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        borderRadius: 'var(--border-radius-lg)',
        border: '1px solid var(--border-color)',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        boxShadow: 'var(--shadow-xs)'
      }}>
        <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
          Enter Customer Counter Token or Scan QR / Order Code:
        </label>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleVerify();
          }}
          style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            backgroundColor: 'var(--bg-app)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--border-radius-md)',
            padding: '10px 16px',
            flex: 1,
            minWidth: '260px'
          }}>
            <QrCode size={20} style={{ color: 'var(--color-accent)' }} />
            <input
              type="text"
              placeholder="e.g. T-101, 101, or ORD-2026-8910"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              style={{
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontSize: '15px',
                fontWeight: 700,
                width: '100%',
                color: 'var(--text-primary)'
              }}
            />
          </div>

          <button
            type="submit"
            style={{
              padding: '12px 24px',
              borderRadius: 'var(--border-radius-md)',
              backgroundColor: 'var(--color-success)',
              color: '#ffffff',
              border: 'none',
              fontSize: '13.5px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Search size={16} />
            <span>Verify Order</span>
          </button>
        </form>

        {searchError && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 16px',
            borderRadius: 'var(--border-radius-md)',
            backgroundColor: 'var(--color-danger-bg)',
            border: '1px solid var(--color-danger-border)',
            color: 'var(--color-danger)',
            fontSize: '13px'
          }}>
            <AlertCircle size={16} />
            <span>{searchError}</span>
          </div>
        )}

        {/* Quick Click Tokens Waiting at Counter */}
        {readyOrders.length > 0 && (
          <div style={{ marginTop: '4px' }}>
            <div style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              READY FOR COLLECTION NOW (CLICK TO VERIFY):
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {readyOrders.map((order) => (
                <button
                  key={order.id}
                  onClick={() => handleQuickSelect(order)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 'var(--border-radius-sm)',
                    border: '1px solid',
                    borderColor: verifiedOrder?.id === order.id ? 'var(--color-success)' : 'var(--border-color)',
                    backgroundColor: verifiedOrder?.id === order.id ? 'var(--color-success-bg)' : 'var(--bg-app)',
                    color: verifiedOrder?.id === order.id ? 'var(--color-success)' : 'var(--text-primary)',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <span>{order.token || 'T-ORD'}</span>
                  <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)' }}>
                    ({order.customer?.name?.split(' ')[0]})
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Verified Order Card Details */}
      {verifiedOrder && (
        <div style={{
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--border-radius-lg)',
          border: '1px solid var(--border-color)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-xs)'
        }}>
          {/* Card Status Banner */}
          <div style={{
            padding: '16px 20px',
            backgroundColor: isAlreadyCompleted ? 'var(--bg-muted)' : isReady ? 'var(--color-success-bg)' : 'var(--color-warning-bg)',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{
                fontSize: '20px',
                fontWeight: 900,
                backgroundColor: 'var(--color-primary)',
                color: '#ffffff',
                padding: '4px 12px',
                borderRadius: '8px'
              }}>
                {verifiedOrder.token || 'T-ORD'}
              </span>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Order #{verifiedOrder.id}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {STAFF_APP_CONFIG.canteenOutlet} • {STAFF_APP_CONFIG.counterName}
                </div>
              </div>
            </div>

            <span style={{
              fontSize: '12.5px',
              fontWeight: 800,
              padding: '5px 12px',
              borderRadius: '9999px',
              backgroundColor: isAlreadyCompleted ? 'var(--bg-app)' : isReady ? 'var(--color-success)' : 'var(--color-warning)',
              color: isAlreadyCompleted ? 'var(--text-secondary)' : '#ffffff',
              border: '1px solid var(--border-color)'
            }}>
              {verifiedOrder.status}
            </span>
          </div>

          {/* DUPLICATE PICKUP WARNING IF ALREADY COMPLETED */}
          {isAlreadyCompleted && (
            <div style={{
              padding: '14px 20px',
              backgroundColor: 'var(--color-danger-bg)',
              borderBottom: '1px solid var(--color-danger-border)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              color: 'var(--color-danger)'
            }}>
              <XCircle size={22} style={{ color: 'var(--color-danger)', flexShrink: 0 }} />
              <div>
                <strong style={{ fontSize: '13.5px' }}>DUPLICATE PICKUP ATTEMPT BLOCKED</strong>
                <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                  This order was already handed over on {verifiedOrder.verifiedAt ? new Date(verifiedOrder.verifiedAt).toLocaleTimeString() : 'earlier today'} by {verifiedOrder.verifiedBy || 'Staff'}.
                </p>
              </div>
            </div>
          )}

          {/* HANDOVER SUCCESS NOTIFICATION */}
          {handoverSuccess && (
            <div style={{
              padding: '14px 20px',
              backgroundColor: 'var(--color-success-bg)',
              borderBottom: '1px solid var(--color-success-border)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              color: 'var(--color-success)'
            }}>
              <CheckCircle2 size={22} style={{ color: 'var(--color-success)', flexShrink: 0 }} />
              <div>
                <strong style={{ fontSize: '13.5px' }}>Meal Handover Confirmed Successfully!</strong>
                <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                  Order #{verifiedOrder.token} marked Completed.
                </p>
              </div>
            </div>
          )}

          {/* Customer & Verification Grid */}
          <div style={{
            padding: '20px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '16px'
          }}>
            {/* Customer Identity */}
            <div style={{
              backgroundColor: 'var(--bg-app)',
              borderRadius: 'var(--border-radius-md)',
              border: '1px solid var(--border-color)',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-accent)', fontWeight: 700, fontSize: '12.5px' }}>
                <User size={15} />
                <span>Customer Identity</span>
              </div>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {verifiedOrder.customer?.name || 'Customer'}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Role: <strong>{verifiedOrder.customer?.role || 'Student'}</strong>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Roll/ID: {verifiedOrder.customer?.rollNo || '2023-CSE-042'}
                </div>
              </div>
            </div>

            {/* Payment & Security Status */}
            <div style={{
              backgroundColor: 'var(--bg-app)',
              borderRadius: 'var(--border-radius-md)',
              border: '1px solid var(--border-color)',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-success)', fontWeight: 700, fontSize: '12.5px' }}>
                <CreditCard size={15} />
                <span>Payment Verification</span>
              </div>
              <div>
                <div style={{ fontSize: '18px', fontWeight: 900, color: 'var(--text-primary)' }}>
                  ₹{(Number(verifiedOrder.totalAmount) || 0).toFixed(2)}
                </div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-success)', marginTop: '4px' }}>
                  ✓ {verifiedOrder.payment?.method || 'UPI'} ({verifiedOrder.payment?.status || 'Paid'})
                </div>
              </div>
            </div>
          </div>

          {/* Ordered Food Checklist */}
          <div style={{ padding: '0 20px 20px 20px' }}>
            <div style={{
              fontSize: '12.5px',
              fontWeight: 700,
              color: 'var(--text-secondary)',
              marginBottom: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <ShoppingBag size={15} />
              <span>Items to Handover ({verifiedOrder.items?.length || 0}):</span>
            </div>

            <div style={{
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--border-radius-md)',
              overflow: 'hidden'
            }}>
              {Array.isArray(verifiedOrder.items) && verifiedOrder.items.map((item, idx) => (
                <div
                  key={item.id || idx}
                  style={{
                    padding: '10px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: idx < verifiedOrder.items.length - 1 ? '1px solid var(--border-color-subtle)' : 'none',
                    backgroundColor: 'var(--bg-surface)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '22px',
                      height: '22px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--color-success-bg)',
                      color: 'var(--color-success)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '11px',
                      fontWeight: 700
                    }}>
                      ✓
                    </div>
                    <div>
                      <span style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {item.quantity}x {item.name}
                      </span>
                      {item.variant && (
                        <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginLeft: '8px' }}>
                          ({item.variant})
                        </span>
                      )}
                    </div>
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    ₹{((Number(item.price) || 0) * (Number(item.quantity) || 1)).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Footer */}
          <div style={{
            padding: '16px 20px',
            backgroundColor: 'var(--bg-app)',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '10px'
          }}>
            <button
              onClick={() => {
                setVerifiedOrder(null);
                setTokenInput('');
              }}
              style={{
                padding: '9px 16px',
                borderRadius: 'var(--border-radius-sm)',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-surface)',
                fontSize: '12.5px',
                fontWeight: 600,
                cursor: 'pointer',
                color: 'var(--text-secondary)'
              }}
            >
              Clear / Next Token
            </button>

            <button
              onClick={handleConfirmHandover}
              disabled={isAlreadyCompleted || isProcessing}
              style={{
                padding: '10px 20px',
                borderRadius: 'var(--border-radius-sm)',
                backgroundColor: isAlreadyCompleted ? 'var(--bg-muted)' : 'var(--color-success)',
                color: isAlreadyCompleted ? 'var(--text-muted)' : '#ffffff',
                border: 'none',
                fontSize: '13.5px',
                fontWeight: 700,
                cursor: isAlreadyCompleted ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <CheckCircle2 size={16} />
              <span>
                {isAlreadyCompleted
                  ? 'Meal Already Collected'
                  : isProcessing
                  ? 'Verifying...'
                  : 'Confirm Handover & Complete Order'}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VerifyPickupPage;
