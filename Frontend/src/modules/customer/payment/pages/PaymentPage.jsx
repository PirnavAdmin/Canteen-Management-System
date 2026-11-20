import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../app/providers/AuthProvider';
import { useCart } from '../../cart/hooks/useCart';
import { customerOrderService } from '../../orders/services/customerOrderService';
import { PageHeader } from '../../../../components/common/PageHeader';
import { Card } from '../../../../components/common/Card';
import { Button } from '../../../../components/common/Button';
import {
  QrCode,
  Banknote,
  ShieldCheck,
  Lock,
  AlertCircle,
  Copy,
  Check,
  RefreshCw
} from 'lucide-react';

export const PaymentPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { clearCart } = useCart();

  const [draftOrder, setDraftOrder] = useState(null);
  const [selectedMethod, setSelectedMethod] = useState('UPI'); // UPI, CASH
  const [processing, setProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [copiedVpa, setCopiedVpa] = useState(false);

  // Method specific states
  const [upiTab, setUpiTab] = useState('vpa'); // 'vpa' or 'qr'
  const [upiId, setUpiId] = useState('student@okcampus');

  // Customer identity resolution
  const rawRole = user?.role || user?.roleCode || user?.userType || 'Student';
  const isFaculty = String(rawRole).toUpperCase().includes('FACULTY');
  const userRole = isFaculty ? 'Faculty' : 'Student';

  useEffect(() => {
    const raw = location.state?.draftOrder || window.__cms_customer_draft_order;
    if (!raw) {
      navigate('/customer/dashboard');
      return;
    }
    setDraftOrder(raw);
  }, [location.state, navigate]);

  if (!draftOrder) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
        <p>Loading payment checkout...</p>
      </div>
    );
  }

  const orderTotal = Number(draftOrder.pricing?.totalAmount || 0);

  // Handle Payment Submission
  const handleAuthorizePayment = async () => {
    if (processing) return;
    setErrorMessage(null);

    // Frontend validations before dispatching
    if (selectedMethod === 'UPI' && upiTab === 'vpa' && (!upiId || !upiId.includes('@'))) {
      setErrorMessage('Please enter a valid UPI VPA handle containing "@" (e.g., student@okcampus).');
      return;
    }

    try {
      setProcessing(true);

      // Simulate network gateway authorization round-trip (500ms)
      await new Promise(resolve => setTimeout(resolve, 500));

      const paymentDetails = {
        upiId
      };

      // Create order and persist through customer order service
      const completedOrder = await customerOrderService.createOrder(
        draftOrder,
        user,
        selectedMethod,
        paymentDetails
      );

      // Clear active cart & draft session
      clearCart();
      window.__cms_customer_draft_order = null;

      // Navigate to My Orders page with token and ID confirmation
      navigate('/customer/orders', {
        state: {
          newOrderId: completedOrder.id,
          token: completedOrder.token,
          paymentMethod: completedOrder.paymentMethod,
          paymentStatus: completedOrder.paymentStatus
        }
      });
    } catch (err) {
      console.error('Payment authorization error:', err);
      setErrorMessage(err.message || 'Payment transaction failed. Please check details and retry.');
    } finally {
      setProcessing(false);
    }
  };

  const handleCopyVpa = () => {
    navigator.clipboard.writeText('canteen.central@campusbank');
    setCopiedVpa(true);
    setTimeout(() => setCopiedVpa(false), 2000);
  };

  return (
    <div>
      {/* Admin PageHeader */}
      <PageHeader
        title="Payment & Order Confirmation"
        description="Select UPI instant payment or cash payment on counter pickup to authorize your meal order."
      />

      {/* Error Alert Banner */}
      {errorMessage && (
        <div style={{
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: 'var(--border-radius-md)',
          padding: '14px 18px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          color: '#b91c1c'
        }}>
          <AlertCircle size={20} style={{ flexShrink: 0 }} />
          <div style={{ flex: 1, fontSize: '13px', lineHeight: 1.4 }}>
            <strong>Payment Authorization Failed: </strong>
            <span>{errorMessage}</span>
          </div>
        </div>
      )}

      {/* Main 2-Column Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.4fr) minmax(320px, 1fr)',
        gap: '24px',
        alignItems: 'start'
      }}>
        {/* Left Column: Payment Method Selection */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Card title="Select Payment Method" padding="20px">
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '-4px', marginBottom: '16px' }}>
              Choose your preferred payment mode for this meal order:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Option 1: UPI Dynamic QR & VPA */}
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px',
                  borderRadius: 'var(--border-radius-md)',
                  border: '2px solid',
                  borderColor: selectedMethod === 'UPI' ? 'var(--color-accent)' : 'var(--border-color)',
                  backgroundColor: selectedMethod === 'UPI' ? 'var(--color-primary-light)' : 'var(--bg-app)',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <input
                    type="radio"
                    name="payMethod"
                    value="UPI"
                    checked={selectedMethod === 'UPI'}
                    onChange={(e) => {
                      setSelectedMethod(e.target.value);
                      setErrorMessage(null);
                    }}
                    style={{ cursor: 'pointer', width: '18px', height: '18px' }}
                  />
                  <QrCode size={24} style={{ color: '#0284c7' }} />
                  <div>
                    <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      UPI Instant Payment (QR & VPA)
                    </span>
                    <span style={{ fontSize: '12.5px', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>
                      Google Pay, PhonePe, Paytm, BHIM or enter any UPI VPA ID
                    </span>
                  </div>
                </div>
                <span style={{
                  fontSize: '11.5px',
                  fontWeight: 700,
                  color: '#0284c7',
                  backgroundColor: '#e0f2fe',
                  padding: '4px 10px',
                  borderRadius: 'var(--border-radius-full)'
                }}>
                  Instant 0% Fee
                </span>
              </label>

              {/* Option 2: Pay Cash at Counter Pickup */}
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px',
                  borderRadius: 'var(--border-radius-md)',
                  border: '2px solid',
                  borderColor: selectedMethod === 'CASH' ? 'var(--color-accent)' : 'var(--border-color)',
                  backgroundColor: selectedMethod === 'CASH' ? 'var(--color-primary-light)' : 'var(--bg-app)',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <input
                    type="radio"
                    name="payMethod"
                    value="CASH"
                    checked={selectedMethod === 'CASH'}
                    onChange={(e) => {
                      setSelectedMethod(e.target.value);
                      setErrorMessage(null);
                    }}
                    style={{ cursor: 'pointer', width: '18px', height: '18px' }}
                  />
                  <Banknote size={24} style={{ color: '#059669' }} />
                  <div>
                    <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      Pay Cash at Counter Pickup
                    </span>
                    <span style={{ fontSize: '12.5px', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>
                      Collect order token now; hand over physical cash at counter pickup
                    </span>
                  </div>
                </div>
                <span style={{
                  fontSize: '11.5px',
                  fontWeight: 700,
                  color: '#059669',
                  backgroundColor: '#d1fae5',
                  padding: '4px 10px',
                  borderRadius: 'var(--border-radius-full)'
                }}>
                  Pay on Pickup
                </span>
              </label>
            </div>

            {/* Custom Interactive UI for UPI */}
            {selectedMethod === 'UPI' && (
              <div style={{
                marginTop: '20px',
                padding: '18px',
                backgroundColor: 'var(--bg-app)',
                borderRadius: 'var(--border-radius-md)',
                border: '1px solid var(--border-color)'
              }}>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                  <button
                    type="button"
                    onClick={() => setUpiTab('vpa')}
                    style={{
                      padding: '7px 14px',
                      borderRadius: 'var(--border-radius-sm)',
                      fontSize: '12.5px',
                      fontWeight: upiTab === 'vpa' ? 600 : 500,
                      backgroundColor: upiTab === 'vpa' ? 'var(--bg-surface)' : 'transparent',
                      border: upiTab === 'vpa' ? '1px solid var(--border-color)' : '1px solid transparent',
                      color: upiTab === 'vpa' ? 'var(--color-accent)' : 'var(--text-secondary)',
                      cursor: 'pointer'
                    }}
                  >
                    UPI ID / VPA
                  </button>
                  <button
                    type="button"
                    onClick={() => setUpiTab('qr')}
                    style={{
                      padding: '7px 14px',
                      borderRadius: 'var(--border-radius-sm)',
                      fontSize: '12.5px',
                      fontWeight: upiTab === 'qr' ? 600 : 500,
                      backgroundColor: upiTab === 'qr' ? 'var(--bg-surface)' : 'transparent',
                      border: upiTab === 'qr' ? '1px solid var(--border-color)' : '1px solid transparent',
                      color: upiTab === 'qr' ? 'var(--color-accent)' : 'var(--text-secondary)',
                      cursor: 'pointer'
                    }}
                  >
                    Scan Dynamic QR Code
                  </button>
                </div>

                {upiTab === 'vpa' ? (
                  <div>
                    <label style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                      Enter your UPI VPA Address:
                    </label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="text"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        placeholder="e.g. yourname@okhdfcbank"
                        style={{
                          flex: 1,
                          padding: '10px 14px',
                          borderRadius: 'var(--border-radius-sm)',
                          border: '1px solid var(--border-color)',
                          fontSize: '13.5px',
                          backgroundColor: 'var(--bg-surface)',
                          color: 'var(--text-primary)',
                          outline: 'none'
                        }}
                      />
                    </div>
                    <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'block', marginTop: '6px' }}>
                      A secure payment notification request will be sent to your UPI app (GPay / PhonePe / Paytm / BHIM).
                    </span>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '10px 0' }}>
                    <div style={{
                      width: '180px',
                      height: '180px',
                      margin: '0 auto 14px auto',
                      backgroundColor: '#ffffff',
                      border: '2px solid #e2e8f0',
                      borderRadius: '10px',
                      padding: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                    }}>
                      <QrCode size={130} style={{ color: '#0f172a' }} />
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#0369a1', marginTop: '6px' }}>
                        ₹{orderTotal.toFixed(2)} • BHIM UPI
                      </span>
                    </div>

                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      <span>Merchant VPA: <strong>canteen.central@campusbank</strong></span>
                      <button
                        type="button"
                        onClick={handleCopyVpa}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-accent)' }}
                        title="Copy VPA"
                      >
                        {copiedVpa ? <Check size={14} /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Custom Interactive UI for Cash */}
            {selectedMethod === 'CASH' && (
              <div style={{
                marginTop: '16px',
                padding: '16px',
                backgroundColor: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: 'var(--border-radius-md)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px'
              }}>
                <Banknote size={24} style={{ color: '#16a34a', flexShrink: 0, marginTop: '2px' }} />
                <div style={{ fontSize: '13px', color: '#166534', lineHeight: 1.5 }}>
                  <strong>Pay Cash at Canteen Counter:</strong>
                  <div style={{ marginTop: '4px' }}>
                    Your order will be transmitted directly to the kitchen preparation display with an assigned token.
                    Please bring the exact change of <strong>₹{orderTotal.toFixed(2)}</strong> when picking up your tray at the designated counter.
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Order Invoice & Authorization Button */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Card title="Payment Authorization Summary" padding="20px">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Order ID:</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{draftOrder.orderId}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Canteen Outlet:</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  {typeof draftOrder.outletName === 'object' ? (draftOrder.outletName?.name || draftOrder.outletName?.id) : draftOrder.outletName}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Customer:</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  {user?.fullName || draftOrder.customer?.name} ({userRole})
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Meal Items:</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{draftOrder.items?.length || 0} Dishes</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Pickup Slot:</span>
                <span style={{ fontWeight: 600, color: 'var(--color-accent)' }}>
                  {draftOrder.pickupSlot === 'tea_slot' ? '04:30 PM - 05:00 PM (Tea)' :
                   draftOrder.pickupSlot === 'lunch_slot_2' ? '01:00 PM - 01:30 PM (Lunch)' :
                   draftOrder.pickupSlot === 'express' ? 'Immediate Express Pickup' :
                   '12:30 PM - 01:00 PM (Lunch)'}
                </span>
              </div>
            </div>

            <div style={{
              borderTop: '1px solid var(--border-color)',
              paddingTop: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Subtotal:</span>
                <span style={{ fontWeight: 600 }}>₹{Number(draftOrder.pricing?.subtotal || 0).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>GST (5%):</span>
                <span style={{ fontWeight: 600 }}>₹{Number(draftOrder.pricing?.taxAmount || 0).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Packaging Fee:</span>
                <span style={{ fontWeight: 600 }}>₹{Number(draftOrder.pricing?.packagingFee || 0).toFixed(2)}</span>
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderTop: '1px solid var(--border-color)',
                paddingTop: '12px',
                marginTop: '4px'
              }}>
                <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>Total Due:</span>
                <span style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-accent)' }}>
                  ₹{orderTotal.toFixed(2)}
                </span>
              </div>

              {/* Action Button */}
              <Button
                variant="primary"
                icon={processing ? RefreshCw : Lock}
                loading={processing}
                disabled={processing}
                onClick={handleAuthorizePayment}
                style={{
                  height: '46px',
                  fontSize: '14.5px',
                  fontWeight: 600,
                  marginTop: '14px',
                  justifyContent: 'center'
                }}
              >
                {processing
                  ? 'Authorizing Order...'
                  : selectedMethod === 'CASH'
                  ? `Confirm Order • Pay ₹${orderTotal.toFixed(2)} at Counter`
                  : `Authorize UPI Payment • ₹${orderTotal.toFixed(2)}`}
              </Button>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginTop: '16px',
              fontSize: '11.5px',
              color: 'var(--text-muted)'
            }}>
              <ShieldCheck size={14} style={{ color: 'var(--color-success)' }} />
              <span>Institutional 256-bit Encrypted Token Generation</span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
