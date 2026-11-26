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
  CreditCard,
  RefreshCw
} from 'lucide-react';
import { useStaffOrders } from '../hooks/useStaffOrders';
import { useStaffOutlet } from '../hooks/useStaffOutlet';
import { useToast } from '../../../app/providers/ToastProvider';
import { staffOrderService, isStatusCompleted, isStatusReady } from '../services/staffOrderService';
import { PageHeader } from '../../../components/common/PageHeader';
import { Card } from '../../../components/common/Card';
import { Button } from '../../../components/common/Button';
import { StatusBadge } from '../../../components/common/StatusBadge';
import { formatCurrency, formatTimeIST } from '../../../utils/formatters';
import styles from '../styles/staff.module.css';

export const VerifyPickupPage = () => {
  const [searchParams] = useSearchParams();
  const initialToken = searchParams.get('token') || '';
  const { success, error: toastError } = useToast();

  const { orders, loading, error, refreshOrders, confirmPickupHandover } = useStaffOrders();
  const { activeOutletName } = useStaffOutlet();

  const [tokenInput, setTokenInput] = useState(initialToken);
  const [verifiedOrder, setVerifiedOrder] = useState(null);
  const [searchError, setSearchError] = useState('');
  const [handoverSuccess, setHandoverSuccess] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const readyOrders = orders.filter((o) => isStatusReady(o.status));

  const handleVerify = useCallback(async (queryToSearch) => {
    const q = queryToSearch !== undefined ? queryToSearch : tokenInput;
    if (!q || !q.trim()) {
      setSearchError('Please enter a valid counter token (e.g. T-101) or Order ID.');
      setVerifiedOrder(null);
      return;
    }

    try {
      setIsSearching(true);
      setSearchError('');
      setHandoverSuccess(false);
      const matched = await staffOrderService.verifyPickupHandover(q);
      setVerifiedOrder(matched);
    } catch (err) {
      setSearchError(err.message || 'No matching order found for this token.');
      setVerifiedOrder(null);
    } finally {
      setIsSearching(false);
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
      success('Pickup Completed', `Order #${completed.token || completed.id} handed over and marked Collected.`);
      await refreshOrders();
    } catch (err) {
      const msg = err.message || 'Failed to complete handover.';
      setSearchError(msg);
      toastError('Handover Failed', msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const isAlreadyCompleted = isStatusCompleted(verifiedOrder?.status);
  const isReady = isStatusReady(verifiedOrder?.status);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      <PageHeader
        title="Verify Counter Pickup & Meal Handover"
        description="Authenticate customer token, verify payment, prevent duplicate pickup & complete meal collection."
        actions={
          <Button variant="secondary" icon={RefreshCw} onClick={refreshOrders} loading={loading}>
            Refresh
          </Button>
        }
      />

      {error && (
        <div className={styles.errorBanner} role="alert">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
          <Button variant="secondary" size="sm" icon={RefreshCw} onClick={refreshOrders}>
            Retry
          </Button>
        </div>
      )}

      {/* Token Search Card */}
      <Card padding="24px">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
            Enter Customer Counter Token or Scan QR / Order Code
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
              padding: '8px 14px',
              flex: 1,
              minWidth: '260px'
            }}>
              <QrCode size={18} style={{ color: 'var(--color-accent)', flexShrink: 0 }} />
              <input
                type="text"
                placeholder="e.g. T-101 or Order ID"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  outline: 'none',
                  fontSize: '14px',
                  fontWeight: 600,
                  width: '100%',
                  color: 'var(--text-primary)'
                }}
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              icon={Search}
              loading={isSearching}
            >
              Verify Order
            </Button>
          </form>

          {searchError && (
            <div className={styles.errorBanner} role="alert">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={16} />
                <span>{searchError}</span>
              </div>
            </div>
          )}

          {/* Quick Click Tokens Waiting at Counter */}
          {readyOrders.length > 0 && (
            <div style={{ marginTop: '4px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Ready for Collection Now (Click to Verify):
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {readyOrders.map((order) => {
                  const isSel = verifiedOrder?.id === order.id;
                  return (
                    <button
                      key={order.id}
                      type="button"
                      onClick={() => handleQuickSelect(order)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 'var(--border-radius-sm)',
                        border: '1px solid',
                        borderColor: isSel ? 'var(--color-success)' : 'var(--border-color)',
                        backgroundColor: isSel ? 'var(--color-success-bg)' : 'var(--bg-app)',
                        color: isSel ? 'var(--color-success-text)' : 'var(--text-primary)',
                        fontSize: '12.5px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <span>{order.token || `#${order.id}`}</span>
                      {order.customer?.name && (
                        <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)' }}>
                          ({order.customer.name.split(' ')[0]})
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Verified Order Details */}
      {verifiedOrder && (
        <Card padding="0">
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
              <span className={styles.tokenBadge} style={{ fontSize: '16px', padding: '4px 12px' }}>
                {verifiedOrder.token || `#${verifiedOrder.id}`}
              </span>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Order #{verifiedOrder.id}
                </div>
                {(verifiedOrder.outletName || activeOutletName) && (
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {verifiedOrder.outletName || activeOutletName}
                  </div>
                )}
              </div>
            </div>

            <StatusBadge status={verifiedOrder.status} />
          </div>

          {isAlreadyCompleted && (
            <div style={{
              padding: '14px 20px',
              backgroundColor: 'var(--color-danger-bg)',
              borderBottom: '1px solid var(--color-danger-border)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              color: 'var(--color-danger-text)'
            }}>
              <XCircle size={20} style={{ flexShrink: 0 }} />
              <div>
                <strong style={{ fontSize: '13.5px' }}>DUPLICATE PICKUP ATTEMPT BLOCKED</strong>
                <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  This order was already handed over{verifiedOrder.verifiedAt || verifiedOrder.completedAt ? ` at ${formatTimeIST(verifiedOrder.verifiedAt || verifiedOrder.completedAt)}` : ''}
                  {verifiedOrder.verifiedBy ? ` by ${verifiedOrder.verifiedBy}` : ''}.
                </p>
              </div>
            </div>
          )}

          {handoverSuccess && (
            <div style={{
              padding: '14px 20px',
              backgroundColor: 'var(--color-success-bg)',
              borderBottom: '1px solid var(--color-success-border)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              color: 'var(--color-success-text)'
            }}>
              <CheckCircle2 size={20} style={{ flexShrink: 0 }} />
              <div>
                <strong style={{ fontSize: '13.5px' }}>Meal Handover Confirmed Successfully</strong>
                <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Order #{verifiedOrder.token || verifiedOrder.id} marked Collected.
                </p>
              </div>
            </div>
          )}

          {/* Customer & Payment Info */}
          <div style={{
            padding: '20px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '16px'
          }}>
            <div style={{
              backgroundColor: 'var(--bg-app)',
              borderRadius: 'var(--border-radius-md)',
              border: '1px solid var(--border-color)',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-accent)', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase' }}>
                <User size={14} />
                <span>Customer Identity</span>
              </div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {verifiedOrder.customer?.name || 'Customer'}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Role: <strong>{verifiedOrder.customer?.role || '—'}</strong>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Roll/ID: {verifiedOrder.customer?.rollNo || '—'}
              </div>
            </div>

            <div style={{
              backgroundColor: 'var(--bg-app)',
              borderRadius: 'var(--border-radius-md)',
              border: '1px solid var(--border-color)',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-success)', fontWeight: 700, fontSize: '12px', textTransform: 'uppercase' }}>
                <CreditCard size={14} />
                <span>Payment Verification</span>
              </div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {formatCurrency(Number(verifiedOrder.totalAmount) || 0)}
              </div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginTop: '2px' }}>
                {verifiedOrder.payment?.method || verifiedOrder.paymentMethod || '—'} ({verifiedOrder.payment?.status || verifiedOrder.paymentStatus || '—'})
              </div>
            </div>
          </div>

          {/* Items Checklist */}
          <div style={{ padding: '0 20px 20px 20px' }}>
            <div style={{
              fontSize: '12.5px',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              marginBottom: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <ShoppingBag size={15} />
              <span>Items to Handover ({verifiedOrder.items?.length || 0})</span>
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
                    <CheckCircle2 size={16} style={{ color: 'var(--color-success)', flexShrink: 0 }} />
                    <div>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
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
                    {formatCurrency((Number(item.price) || 0) * (Number(item.quantity) || 1))}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Actions */}
          <div style={{
            padding: '16px 20px',
            backgroundColor: 'var(--bg-app)',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '10px'
          }}>
            <Button
              variant="secondary"
              onClick={() => {
                setVerifiedOrder(null);
                setTokenInput('');
                setSearchError('');
              }}
            >
              Clear / Next Token
            </Button>

            <Button
              variant="primary"
              icon={CheckCircle2}
              loading={isProcessing}
              disabled={isAlreadyCompleted}
              onClick={handleConfirmHandover}
              style={{
                backgroundColor: isAlreadyCompleted ? undefined : 'var(--color-success)',
                borderColor: isAlreadyCompleted ? undefined : 'var(--color-success)'
              }}
            >
              {isAlreadyCompleted ? 'Meal Already Collected' : 'Confirm Handover & Complete Order'}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default VerifyPickupPage;
