import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../app/providers/AuthProvider';
import { useCart } from '../../cart/hooks/useCart';
import { customerOrderService } from '../../orders/services/customerOrderService';
import { paymentService } from '../../../../services/paymentService';
import { PageHeader } from '../../../../components/common/PageHeader';
import { Card } from '../../../../components/common/Card';
import { Button } from '../../../../components/common/Button';
import { DynamicQrCode } from '../../../../components/common/DynamicQrCode';
import { apiClient } from '../../../../services/api/apiClient';
import {
  QrCode,
  Banknote,
  ShieldCheck,
  Lock,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  CreditCard,
  Wallet,
  Upload,
  CheckCircle,
  FileImage,
  X
} from 'lucide-react';

export const PaymentPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { clearCart } = useCart();

  const [draftOrder, setDraftOrder] = useState(null);
  const [selectedMethod, setSelectedMethod] = useState('UPI'); // UPI, CASH, CARD, WALLET
  const [processing, setProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [copiedVpa, setCopiedVpa] = useState(false);

  // Method specific states
  const [upiTab, setUpiTab] = useState('vpa'); // 'vpa' or 'qr'
  const [upiId, setUpiId] = useState('student@okcampus');
  const [upiUtr, setUpiUtr] = useState('');
  const [screenshotUrl, setScreenshotUrl] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState(null);
  const [screenshotUploading, setScreenshotUploading] = useState(false);

  // Live Public Configuration from Admin Settings
  const [paymentConfig, setPaymentConfig] = useState({
    upiEnabled: true,
    upiVpa: 'canteen.apex@icici',
    upiMerchantName: 'Apex Institute Canteen',
    cardNetBankingEnabled: false,
    gatewayProvider: 'Razorpay',
    campusWalletEnabled: true,
    campusWalletMaxBalance: 2000,
    cashOnCounterEnabled: true
  });

  const pollingRef = useRef(null);

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

  // Fetch admin payment settings
  useEffect(() => {
    let isMounted = true;
    paymentService.getPublicConfig().then(cfg => {
      if (isMounted && cfg) {
        setPaymentConfig(cfg);
        if (selectedMethod === 'UPI' && cfg.upiEnabled === false) {
          if (cfg.cashOnCounterEnabled) setSelectedMethod('CASH');
          else if (cfg.campusWalletEnabled) setSelectedMethod('WALLET');
        }
      }
    });
    return () => { isMounted = false; };
  }, []);

  const orderTotal = Number(draftOrder?.pricing?.totalAmount || 0);
  const activeVpa = paymentConfig.upiVpa || 'canteen.apex@icici';
  const activeMerchantName = paymentConfig.upiMerchantName || 'Apex Institute Canteen';
  const orderRefId = draftOrder?.orderId || draftOrder?.id || `ORD-${Date.now()}`;
  const upiIntentUri = `upi://pay?pa=${encodeURIComponent(activeVpa)}&pn=${encodeURIComponent(activeMerchantName)}&am=${orderTotal.toFixed(2)}&cu=INR&tn=${encodeURIComponent(orderRefId)}`;

  // Polling for Dynamic QR completion
  const checkStatusCallback = useCallback(async () => {
    if (!draftOrder?.id) return;
    try {
      const res = await paymentService.checkStatus(draftOrder.id);
      if (res && res.status === 'Paid') {
        clearCart();
        window.__cms_customer_draft_order = null;
        navigate('/customer/orders', {
          state: {
            newOrderId: draftOrder.id,
            token: res.token || draftOrder.token,
            paymentMethod: 'UPI Dynamic QR',
            paymentStatus: 'Paid'
          }
        });
      }
    } catch {
      // Ignore polling errors
    }
  }, [draftOrder, clearCart, navigate]);

  useEffect(() => {
    if (selectedMethod === 'UPI' && upiTab === 'qr' && draftOrder?.id) {
      pollingRef.current = setInterval(checkStatusCallback, 3000);
    }
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [selectedMethod, upiTab, draftOrder, checkStatusCallback]);

  if (!draftOrder) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
        <p>Loading payment checkout...</p>
      </div>
    );
  }

  const handleScreenshotUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please upload a valid image file (PNG, JPG, JPEG, WEBP).');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setErrorMessage('Image size exceeds 8MB. Please upload a smaller screenshot.');
      return;
    }

    const preview = URL.createObjectURL(file);
    setScreenshotPreview(preview);

    try {
      setScreenshotUploading(true);
      setErrorMessage(null);
      const formData = new FormData();
      formData.append('file', file);
      const res = await apiClient.post('/media/upload?folder=payments', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const uploadedUrl = res?.data?.data?.fileUrl || res?.data?.fileUrl || res?.fileUrl;
      setScreenshotUrl(uploadedUrl || preview);
    } catch (err) {
      console.warn('Backend screenshot upload failed; fallback to local reader', err);
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshotUrl(reader.result);
      };
      reader.readAsDataURL(file);
    } finally {
      setScreenshotUploading(false);
    }
  };

  // Handle Payment Submission
  const handleAuthorizePayment = async () => {
    if (processing) return;
    setErrorMessage(null);

    // Frontend validations before dispatching
    if (selectedMethod === 'UPI') {
      if (upiTab === 'vpa' && (!upiId || !upiId.includes('@'))) {
        setErrorMessage('Please enter a valid UPI VPA handle containing "@" (e.g., student@okcampus).');
        return;
      }
      if (upiTab === 'qr' && (!upiUtr || upiUtr.trim().length !== 12)) {
        setErrorMessage('Please enter the 12-digit UPI Reference Number (UTR) from your payment app (Google Pay / PhonePe / Paytm).');
        return;
      }
    }

    try {
      setProcessing(true);

      const paymentDetails = {
        upiId: selectedMethod === 'UPI' ? (upiTab === 'vpa' ? upiId : activeVpa) : undefined,
        upiRefId: selectedMethod === 'UPI' ? upiUtr.trim() : undefined,
        screenshot: screenshotUrl
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
    navigator.clipboard.writeText(activeVpa);
    setCopiedVpa(true);
    setTimeout(() => setCopiedVpa(false), 2000);
  };

  return (
    <div>
      {/* PageHeader */}
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
              {paymentConfig.upiEnabled !== false && (
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    padding: '14px 16px',
                    borderRadius: 'var(--border-radius-md)',
                    border: '2px solid',
                    borderColor: selectedMethod === 'UPI' ? 'var(--color-accent)' : 'var(--border-color)',
                    backgroundColor: selectedMethod === 'UPI' ? 'var(--color-primary-light)' : 'var(--bg-app)',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
                    <input
                      type="radio"
                      name="payMethod"
                      value="UPI"
                      checked={selectedMethod === 'UPI'}
                      onChange={(e) => {
                        setSelectedMethod(e.target.value);
                        setErrorMessage(null);
                      }}
                      style={{ cursor: 'pointer', width: '18px', height: '18px', flexShrink: 0 }}
                    />
                    <QrCode size={22} style={{ color: '#0284c7', flexShrink: 0 }} />
                    <div style={{ minWidth: 0 }}>
                      <span style={{ fontSize: '14.5px', fontWeight: 600, color: 'var(--text-primary)', display: 'block' }}>
                        UPI Instant Payment (QR & VPA)
                      </span>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginTop: '2px', lineHeight: 1.3 }}>
                        Google Pay, PhonePe, Paytm, BHIM or enter any UPI VPA ID
                      </span>
                    </div>
                  </div>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: '#0284c7',
                    backgroundColor: '#e0f2fe',
                    padding: '3px 8px',
                    borderRadius: 'var(--border-radius-full)',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    lineHeight: '1.2'
                  }}>
                    Instant 0% Fee
                  </span>
                </label>
              )}

              {/* Option 2: Pay Cash at Counter Pickup */}
              {paymentConfig.cashOnCounterEnabled !== false && (
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    padding: '14px 16px',
                    borderRadius: 'var(--border-radius-md)',
                    border: '2px solid',
                    borderColor: selectedMethod === 'CASH' ? 'var(--color-accent)' : 'var(--border-color)',
                    backgroundColor: selectedMethod === 'CASH' ? 'var(--color-primary-light)' : 'var(--bg-app)',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
                    <input
                      type="radio"
                      name="payMethod"
                      value="CASH"
                      checked={selectedMethod === 'CASH'}
                      onChange={(e) => {
                        setSelectedMethod(e.target.value);
                        setErrorMessage(null);
                      }}
                      style={{ cursor: 'pointer', width: '18px', height: '18px', flexShrink: 0 }}
                    />
                    <Banknote size={22} style={{ color: '#059669', flexShrink: 0 }} />
                    <div style={{ minWidth: 0 }}>
                      <span style={{ fontSize: '14.5px', fontWeight: 600, color: 'var(--text-primary)', display: 'block' }}>
                        Pay Cash at Counter Pickup
                      </span>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginTop: '2px', lineHeight: 1.3 }}>
                        Collect order token now; hand over physical cash at counter pickup
                      </span>
                    </div>
                  </div>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: '#059669',
                    backgroundColor: '#d1fae5',
                    padding: '3px 8px',
                    borderRadius: 'var(--border-radius-full)',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    lineHeight: '1.2'
                  }}>
                    Pay on Pickup
                  </span>
                </label>
              )}

              {/* Option 3: Campus Smart ID / Student Wallet */}
              {paymentConfig.campusWalletEnabled === true && (
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    padding: '14px 16px',
                    borderRadius: 'var(--border-radius-md)',
                    border: '2px solid',
                    borderColor: selectedMethod === 'WALLET' ? 'var(--color-accent)' : 'var(--border-color)',
                    backgroundColor: selectedMethod === 'WALLET' ? 'var(--color-primary-light)' : 'var(--bg-app)',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
                    <input
                      type="radio"
                      name="payMethod"
                      value="WALLET"
                      checked={selectedMethod === 'WALLET'}
                      onChange={(e) => {
                        setSelectedMethod(e.target.value);
                        setErrorMessage(null);
                      }}
                      style={{ cursor: 'pointer', width: '18px', height: '18px', flexShrink: 0 }}
                    />
                    <Wallet size={22} style={{ color: '#7c3aed', flexShrink: 0 }} />
                    <div style={{ minWidth: 0 }}>
                      <span style={{ fontSize: '14.5px', fontWeight: 600, color: 'var(--text-primary)', display: 'block' }}>
                        Campus Smart ID Card / Student Wallet
                      </span>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginTop: '2px', lineHeight: 1.3 }}>
                        Direct debit from student portal account balance
                      </span>
                    </div>
                  </div>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: '#7c3aed',
                    backgroundColor: '#ede9fe',
                    padding: '3px 8px',
                    borderRadius: 'var(--border-radius-full)',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    lineHeight: '1.2'
                  }}>
                    Instant Debit
                  </span>
                </label>
              )}

              {/* Option 4: Cards & Institutional Net Banking */}
              {paymentConfig.cardNetBankingEnabled === true && (
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    padding: '14px 16px',
                    borderRadius: 'var(--border-radius-md)',
                    border: '2px solid',
                    borderColor: selectedMethod === 'CARD' ? 'var(--color-accent)' : 'var(--border-color)',
                    backgroundColor: selectedMethod === 'CARD' ? 'var(--color-primary-light)' : 'var(--bg-app)',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
                    <input
                      type="radio"
                      name="payMethod"
                      value="CARD"
                      checked={selectedMethod === 'CARD'}
                      onChange={(e) => {
                        setSelectedMethod(e.target.value);
                        setErrorMessage(null);
                      }}
                      style={{ cursor: 'pointer', width: '18px', height: '18px', flexShrink: 0 }}
                    />
                    <CreditCard size={22} style={{ color: '#ea580c', flexShrink: 0 }} />
                    <div style={{ minWidth: 0 }}>
                      <span style={{ fontSize: '14.5px', fontWeight: 600, color: 'var(--text-primary)', display: 'block' }}>
                        Cards & Institutional Net Banking
                      </span>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginTop: '2px', lineHeight: 1.3 }}>
                        Debit, Credit Card & Net Banking via {paymentConfig.gatewayProvider || 'Payment Gateway'}
                      </span>
                    </div>
                  </div>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: '#ea580c',
                    backgroundColor: '#ffedd5',
                    padding: '3px 8px',
                    borderRadius: 'var(--border-radius-full)',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    lineHeight: '1.2'
                  }}>
                    Gateway Secure
                  </span>
                </label>
              )}
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
                      <DynamicQrCode
                        value={upiIntentUri}
                        size={130}
                        alt={`Scan to pay ₹${orderTotal.toFixed(2)}`}
                      />
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#0369a1', marginTop: '6px' }}>
                        ₹{orderTotal.toFixed(2)} • BHIM UPI
                      </span>
                    </div>

                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      <span>Merchant VPA: <strong>{activeVpa}</strong></span>
                      <button
                        type="button"
                        onClick={handleCopyVpa}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-accent)' }}
                        title="Copy VPA"
                      >
                        {copiedVpa ? <Check size={14} /> : <Copy size={14} />}
                      </button>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                      Scan the QR above using any UPI app (Google Pay, PhonePe, Paytm, BHIM)
                    </span>

                    {/* Step 2: Payment Verification Submission */}
                    <div style={{
                      marginTop: '16px',
                      padding: '14px 16px',
                      backgroundColor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '10px',
                      textAlign: 'left'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', color: '#0f172a', fontWeight: 700, fontSize: '13px' }}>
                        <CheckCircle size={16} color="#0284c7" />
                        <span>Submit UPI Payment Proof for Cashier Verification</span>
                      </div>

                      {/* 12-digit UTR Input */}
                      <div style={{ marginBottom: '12px' }}>
                        <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>
                          12-Digit UPI Reference Number (UTR) <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <input
                          type="text"
                          maxLength={12}
                          placeholder="e.g. 432109876543 (from GPay / PhonePe / Paytm)"
                          value={upiUtr}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '').slice(0, 12);
                            setUpiUtr(val);
                            setErrorMessage(null);
                          }}
                          style={{
                            width: '100%',
                            padding: '9px 12px',
                            borderRadius: '6px',
                            border: upiUtr.length === 12 ? '2px solid #10b981' : '1px solid #cbd5e1',
                            fontSize: '14px',
                            fontWeight: 600,
                            letterSpacing: '1px',
                            outline: 'none',
                            backgroundColor: '#ffffff',
                            color: '#0f172a'
                          }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginTop: '4px', color: upiUtr.length === 12 ? '#10b981' : '#64748b' }}>
                          <span>{upiUtr.length === 12 ? '✓ Valid 12-digit UTR entered' : 'Find 12-digit UTR / UPI Ref ID in your transaction receipt'}</span>
                          <span style={{ fontWeight: 600 }}>{upiUtr.length}/12 digits</span>
                        </div>
                      </div>

                      {/* Screenshot Upload */}
                      <div>
                        <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>
                          Upload Payment Screenshot / Receipt (Optional / Recommended)
                        </label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                          <input
                            type="file"
                            id="customer-upi-screenshot"
                            accept="image/*"
                            onChange={handleScreenshotUpload}
                            style={{ display: 'none' }}
                          />
                          <label
                            htmlFor="customer-upi-screenshot"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '7px 12px',
                              borderRadius: '6px',
                              border: '1px solid #cbd5e1',
                              backgroundColor: '#ffffff',
                              color: '#334155',
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                            }}
                          >
                            <Upload size={14} />
                            <span>{screenshotUrl ? 'Change Screenshot' : 'Choose Receipt Image'}</span>
                          </label>

                          {screenshotUploading && (
                            <span style={{ fontSize: '11px', color: '#64748b' }}>Uploading screenshot...</span>
                          )}

                          {screenshotUrl && !screenshotUploading && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontSize: '11.5px', color: '#10b981', fontWeight: 600 }}>✓ Screenshot Attached</span>
                              <button
                                type="button"
                                onClick={() => { setScreenshotUrl(null); setScreenshotPreview(null); }}
                                style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '11px', cursor: 'pointer', textDecoration: 'underline' }}
                              >
                                Remove
                              </button>
                            </div>
                          )}
                        </div>

                        {screenshotPreview && (
                          <div style={{ marginTop: '8px' }}>
                            <img
                              src={screenshotPreview}
                              alt="Payment Proof Preview"
                              style={{ width: '90px', height: '90px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                            />
                          </div>
                        )}
                      </div>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', fontSize: '13px', gap: '12px' }}>
                <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>Item Names:</span>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {draftOrder.items && draftOrder.items.length > 0 ? (
                    draftOrder.items.map((item, idx) => (
                      <span key={idx}>
                        {item.name || item.itemName || 'Item'}{item.quantity > 1 ? ` x ${item.quantity}` : ''}
                      </span>
                    ))
                  ) : (
                    <span>-</span>
                  )}
                </div>
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
                <span style={{ color: 'var(--text-secondary)' }}>GST ({draftOrder.pricing?.gstPercent || 5}%):</span>
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
                disabled={processing || (selectedMethod === 'UPI' && upiTab === 'qr' && upiUtr.trim().length !== 12)}
                onClick={handleAuthorizePayment}
                style={{
                  height: '46px',
                  fontSize: '14.5px',
                  fontWeight: 600,
                  marginTop: '14px',
                  justifyContent: 'center',
                  opacity: (selectedMethod === 'UPI' && upiTab === 'qr' && upiUtr.trim().length !== 12) ? 0.65 : 1
                }}
              >
                {processing
                  ? 'Authorizing Order...'
                  : selectedMethod === 'CASH'
                  ? `Confirm Order • Pay ₹${orderTotal.toFixed(2)} at Counter`
                  : selectedMethod === 'UPI' && upiTab === 'qr' && upiUtr.trim().length !== 12
                  ? `Enter 12-Digit UTR to Place Order`
                  : `Submit UPI Payment & Place Order • ₹${orderTotal.toFixed(2)}`}
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
