import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ShieldCheck,
  CreditCard,
  Banknote,
  Smartphone,
  CheckCircle,
  Store,
  Utensils,
  Copy,
  Check,
  QrCode as QrIcon,
  Maximize2
} from 'lucide-react';
import { DynamicQrCode } from '../../../../components/common/DynamicQrCode';
import { SafeImage } from '../../../../components/common/SafeImage';
import { formatCurrency } from '../../../../utils/formatters';
import { orderService } from '../services/orderService';
import { useToast } from '../../../../app/providers/ToastProvider';
import { useAuth } from '../../../../app/providers/AuthProvider';

export const CartDrawer = ({
  isOpen,
  onClose,
  cart = {},
  onUpdateQuantity,
  onClearCart,
  outlets = [],
  selectedOutletId,
  onOutletChange,
  onOrderSuccess
}) => {
  const { user } = useAuth();
  const { success, error } = useToast();

  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [customerName, setCustomerName] = useState(() => user?.fullName || user?.name || 'Mrs. Sunitha (Canteen Admin)');
  const [customerPhone, setCustomerPhone] = useState(() => user?.phone || '9876543210');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gstPercent, setGstPercent] = useState(5.0);
  const [packagingFeeSetting, setPackagingFeeSetting] = useState(5.0);
  const [enablePackagingFee, setEnablePackagingFee] = useState(true);
  const [isDineIn, setIsDineIn] = useState(true);
  const [upiConfig, setUpiConfig] = useState({ upiVpa: 'canteen.apex@icici', upiMerchantName: 'Apex Institute Canteen' });
  const [upiRefId, setUpiRefId] = useState('');
  const [isCounterSoundboxVerified, setIsCounterSoundboxVerified] = useState(true);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [copiedVpa, setCopiedVpa] = useState(false);

  useEffect(() => {
    import('../../settings/services/settingsService')
      .then(m => m.settingsService.getSettings())
      .then(settings => {
        if (settings) {
          const rules = settings.orderRules || settings.OrderRules || settings;
          const payments = settings.payments || settings.Payments || {};
          const gst = rules.gstPercent ?? payments.gstPercent ?? rules.GstPercent ?? payments.GstPercent ?? 5.0;
          const fee = rules.packagingFee ?? rules.PackagingFee ?? 5.0;
          const enable = rules.enablePackagingFee ?? rules.EnablePackagingFee ?? true;
          setGstPercent(Number(gst) >= 0 ? Number(gst) : 5.0);
          setPackagingFeeSetting(Number(fee) >= 0 ? Number(fee) : 5.0);
          setEnablePackagingFee(enable !== false);
        }
      })
      .catch(() => { });
  }, []);

  // Convert cart object to array of entries
  const cartItems = useMemo(() => {
    return Object.values(cart).filter(entry => entry && entry.quantity > 0);
  }, [cart]);

  const totalQuantity = useMemo(() => {
    return cartItems.reduce((acc, entry) => acc + entry.quantity, 0);
  }, [cartItems]);

  const subtotal = useMemo(() => {
    return cartItems.reduce((acc, entry) => {
      let itemPrice = Number(entry.item?.price || 0);
      const discount = Number(entry.item?.discountPercent || 0);
      if (discount > 0) {
        itemPrice = Math.round(itemPrice * (1 - discount / 100) * 100) / 100;
      }
      return acc + (itemPrice * entry.quantity);
    }, 0);
  }, [cartItems]);

  // Packaging fee: 0 if Dine In; otherwise setting fee if enabled
  const packagingFee = useMemo(() => {
    if (isDineIn) return 0;
    if (!enablePackagingFee || subtotal === 0) return 0;
    return packagingFeeSetting;
  }, [isDineIn, enablePackagingFee, packagingFeeSetting, subtotal]);

  // Dynamic GST from settings
  const taxAmount = useMemo(() => {
    return Math.round(subtotal * (gstPercent / 100) * 100) / 100;
  }, [subtotal, gstPercent]);

  const totalAmount = useMemo(() => {
    return Math.round((subtotal + taxAmount + packagingFee) * 100) / 100;
  }, [subtotal, taxAmount, packagingFee]);

  // Effective selected outlet
  const effectiveOutletId = useMemo(() => {
    if (selectedOutletId) return selectedOutletId;
    if (cartItems.length > 0 && cartItems[0].item?.outletId) return cartItems[0].item.outletId;
    if (outlets.length > 0) return outlets[0].outletId || outlets[0].id;
    return 1;
  }, [selectedOutletId, cartItems, outlets]);

  const upiUri = useMemo(() => {
    if (!totalAmount || totalAmount <= 0) return '';
    return `upi://pay?pa=${encodeURIComponent(upiConfig.upiVpa)}&pn=${encodeURIComponent(upiConfig.upiMerchantName)}&am=${totalAmount.toFixed(2)}&cu=INR&tn=${encodeURIComponent('Counter Meal Order')}`;
  }, [totalAmount, upiConfig]);

  const handleCopyVpa = () => {
    navigator.clipboard.writeText(upiConfig.upiVpa);
    setCopiedVpa(true);
    setTimeout(() => setCopiedVpa(false), 2000);
  };

  const selectedOutletObj = useMemo(() => {
    return outlets.find(o => String(o.outletId || o.id) === String(effectiveOutletId)) || outlets[0];
  }, [outlets, effectiveOutletId]);

  if (!isOpen) return null;

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) {
      error('Empty Cart', 'Please add at least one food item to place an order.');
      return;
    }

    if (!effectiveOutletId) {
      error('Outlet Required', 'Please select a canteen outlet.');
      return;
    }

    const payload = {
      outletId: Number(effectiveOutletId),
      customerName: (customerName || user?.fullName || user?.name || 'Mrs. Sunitha (Canteen Admin)').trim(),
      customerRole: user?.role || 'Admin',
      status: 'Accepted',
      paymentStatus: 'Paid',
      rollNo: user?.rollNo || 'ADM-01',
      department: 'Canteen Administration',
      phone: (customerPhone || '9876543210').trim(),
      email: user?.email || 'admin@canteen.edu',
      paymentMethod: paymentMethod,
      orderType: typeof isDineIn !== 'undefined' ? (isDineIn ? 'Dine In' : 'Takeaway') : undefined,
      packagingFee: typeof packagingFee !== 'undefined' ? packagingFee : undefined,
      transactionId: upiRefId.trim() ? (upiRefId.trim().startsWith('UTR-') ? upiRefId.trim() : `UTR-${upiRefId.trim()}`) : (paymentMethod === 'UPI' ? `TXN-POS-UPI-${Date.now()}` : undefined),
      paymentReference: upiRefId.trim() || undefined,
      items: cartItems.map(entry => ({
        menuItemId: Number(entry.item.id || entry.item.menuItemId),
        variantName: null,
        quantity: Number(entry.quantity)
      }))
    };

    try {
      setIsSubmitting(true);
      const res = await orderService.create(payload);
      const token = res?.token || res?.data?.token || 'T-ORDER';
      const orderId = res?.id || res?.data?.id || '';

      success(
        'Order Placed Successfully!',
        `Token: ${token} | Amount: ${formatCurrency(totalAmount)} (Status: Paid)`
      );

      onClearCart?.();
      onClose();
      if (onOrderSuccess) {
        onOrderSuccess(res?.data || res);
      }
    } catch (err) {
      console.error('Failed to place order:', err);
      const errMsg = err?.response?.data?.message || err?.message || 'Unable to place order. Please verify availability.';
      error('Order Failed', errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1050,
        display: 'flex',
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(3px)'
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          height: '100%',
          backgroundColor: 'var(--bg-surface)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-modal)',
          borderLeft: '1px solid var(--border-color)',
          animation: 'slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--bg-surface)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: 'var(--color-primary-light)',
                color: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <ShoppingBag size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                Your Order Cart
              </h2>
              <p style={{ fontSize: '12px', margin: 0, color: 'var(--text-muted)' }}>
                {totalQuantity} {totalQuantity === 1 ? 'item' : 'items'} selected
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {cartItems.length > 0 && (
              <button
                type="button"
                onClick={onClearCart}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--color-danger)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: '4px 8px',
                  borderRadius: '6px'
                }}
              >
                Clear
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Drawer Body */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}
        >
          {/* Canteen Outlet Selection */}
          <div
            style={{
              padding: '12px 14px',
              borderRadius: '12px',
              backgroundColor: 'var(--bg-muted)',
              border: '1px solid var(--border-color)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', color: 'var(--text-primary)', fontSize: '13px', fontWeight: 600 }}>
              <Store size={15} color="var(--color-primary)" />
              <span>Canteen Outlet</span>
            </div>
            <select
              value={effectiveOutletId}
              onChange={(e) => onOutletChange?.(Number(e.target.value))}
              style={{
                width: '100%',
                height: '36px',
                padding: '0 10px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-surface)',
                color: 'var(--text-primary)',
                fontSize: '13px',
                fontWeight: 500,
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              {outlets
                .filter(outlet => outlet.code !== 'WH-01' && !(outlet.name || '').toLowerCase().includes('warehouse'))
                .map((outlet) => (
                  <option key={outlet.outletId || outlet.id} value={outlet.outletId || outlet.id}>
                    {outlet.name} {outlet.code ? `(${outlet.code})` : ''}
                  </option>
                ))}
            </select>
          </div>

          {/* Customer / Ordering Info */}
          <div
            style={{
              padding: '12px 14px',
              borderRadius: '12px',
              backgroundColor: 'var(--bg-muted)',
              border: '1px solid var(--border-color)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Ordered By (Admin)
              </span>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  backgroundColor: 'var(--color-primary-light)',
                  color: 'var(--color-primary)'
                }}
              >
                Admin Order
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Customer Name"
                style={{
                  width: '100%',
                  height: '32px',
                  padding: '0 10px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-surface)',
                  color: 'var(--text-primary)',
                  fontSize: '13px'
                }}
              />
              <input
                type="text"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="Contact Phone"
                style={{
                  width: '100%',
                  height: '32px',
                  padding: '0 10px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-surface)',
                  color: 'var(--text-primary)',
                  fontSize: '13px'
                }}
              />
            </div>
          </div>

          {/* Item List */}
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px' }}>
              Selected Items ({totalQuantity})
            </div>

            {cartItems.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '36px 16px',
                  backgroundColor: 'var(--bg-muted)',
                  borderRadius: '12px',
                  color: 'var(--text-muted)'
                }}
              >
                <ShoppingBag size={36} style={{ margin: '0 auto 10px', opacity: 0.4 }} />
                <p style={{ margin: 0, fontSize: '13px', fontWeight: 500 }}>No food items added yet</p>
                <span style={{ fontSize: '12px' }}>Browse the catalog and tap '+' to add dishes.</span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {cartItems.map(({ item, quantity }) => {
                  const itemTotal = Number(item.price || 0) * quantity;
                  const isVeg = (item.foodType || '').toLowerCase().includes('veg') && !(item.foodType || '').toLowerCase().includes('non');

                  return (
                    <div
                      key={item.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        backgroundColor: 'var(--bg-surface)',
                        borderRadius: '10px',
                        border: '1px solid var(--border-color)',
                        gap: '12px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            width: '46px',
                            height: '46px',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            flexShrink: 0,
                            backgroundColor: 'var(--bg-muted)'
                          }}
                        >
                          <SafeImage
                            src={item.imageUrl}
                            alt={item.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <span
                              style={{
                                width: '6px',
                                height: '6px',
                                borderRadius: '50%',
                                backgroundColor: isVeg ? '#059669' : '#dc2626',
                                flexShrink: 0
                              }}
                            />
                            <span
                              style={{
                                fontSize: '13px',
                                fontWeight: 600,
                                color: 'var(--text-primary)',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}
                              title={item.name}
                            >
                              {item.name}
                            </span>
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                            {formatCurrency(item.price)} each
                          </div>
                        </div>
                      </div>

                      {/* Quantity Stepper & Item Total */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            backgroundColor: 'var(--bg-muted)',
                            borderRadius: '9999px',
                            border: '1px solid var(--border-color)',
                            padding: '2px 4px',
                            gap: '4px'
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity?.(item.id, quantity - 1)}
                            style={{
                              width: '22px',
                              height: '22px',
                              borderRadius: '50%',
                              backgroundColor: 'var(--bg-surface)',
                              border: '1px solid var(--border-color)',
                              color: 'var(--text-primary)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer'
                            }}
                          >
                            <Minus size={12} />
                          </button>

                          <span style={{ minWidth: '16px', textAlign: 'center', fontSize: '12px', fontWeight: 700 }}>
                            {quantity}
                          </span>

                          <button
                            type="button"
                            onClick={() => onUpdateQuantity?.(item.id, quantity + 1)}
                            style={{
                              width: '22px',
                              height: '22px',
                              borderRadius: '50%',
                              backgroundColor: '#f59e0b',
                              border: 'none',
                              color: '#ffffff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer'
                            }}
                          >
                            <Plus size={12} />
                          </button>
                        </div>

                        <div style={{ minWidth: '60px', textAlign: 'right', fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)' }}>
                          {formatCurrency(itemTotal)}
                        </div>

                        <button
                          type="button"
                          onClick={() => onUpdateQuantity?.(item.id, 0)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-placeholder)',
                            cursor: 'pointer',
                            padding: '4px'
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-placeholder)'; }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Dining Preference: Dine In vs Takeaway Toggle */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Utensils size={15} style={{ color: 'var(--color-primary)' }} />
                <span>Dining Preference</span>
              </span>
              <span style={{ fontSize: '11px', color: isDineIn ? 'var(--color-success)' : 'var(--text-muted)', fontWeight: 600 }}>
                {isDineIn ? 'Dine In (No Packaging Fee)' : `Takeaway (+₹${packagingFeeSetting.toFixed(2)} Fee)`}
              </span>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '6px',
              backgroundColor: 'var(--bg-muted)',
              padding: '4px',
              borderRadius: '10px',
              border: '1px solid var(--border-color)'
            }}>
              <button
                type="button"
                onClick={() => setIsDineIn(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: isDineIn ? '1px solid var(--color-primary)' : '1px solid transparent',
                  backgroundColor: isDineIn ? 'var(--color-primary)' : 'transparent',
                  color: isDineIn ? '#ffffff' : 'var(--text-secondary)',
                  fontSize: '12.5px',
                  fontWeight: isDineIn ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <Utensils size={14} />
                <span>Dine In</span>
              </button>
              <button
                type="button"
                onClick={() => setIsDineIn(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: !isDineIn ? '1px solid var(--color-primary)' : '1px solid transparent',
                  backgroundColor: !isDineIn ? 'var(--color-primary)' : 'transparent',
                  color: !isDineIn ? '#ffffff' : 'var(--text-secondary)',
                  fontSize: '12.5px',
                  fontWeight: !isDineIn ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <ShoppingBag size={14} />
                <span>Takeaway</span>
              </button>
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
              Payment Method (Marked as Paid)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {[
                { id: 'Cash', label: 'Cash', icon: Banknote },
                { id: 'UPI', label: 'UPI / QR', icon: Smartphone },
                { id: 'Campus Wallet', label: 'Wallet', icon: CreditCard }
              ].map(({ id, label, icon: Icon }) => {
                const isSelected = paymentMethod === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setPaymentMethod(id)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '10px 6px',
                      borderRadius: '10px',
                      border: isSelected ? '2px solid var(--color-primary)' : '1px solid var(--border-color)',
                      backgroundColor: isSelected ? 'var(--color-primary-light)' : 'var(--bg-surface)',
                      color: isSelected ? 'var(--color-primary)' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Icon size={18} />
                    <span style={{ fontSize: '11px', fontWeight: isSelected ? 700 : 500 }}>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dynamic QR Code Card when UPI is selected */}
          {paymentMethod === 'UPI' && (
            <div
              style={{
                padding: '14px',
                borderRadius: '12px',
                backgroundColor: 'var(--bg-muted)',
                border: '1.5px solid var(--color-primary-light, #bfdbfe)',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <QrIcon size={16} color="var(--color-primary)" />
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Counter UPI Dynamic QR
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsQrModalOpen(true)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    border: '1px solid var(--color-primary-border, #93c5fd)',
                    backgroundColor: 'var(--bg-surface)',
                    color: 'var(--color-primary)',
                    fontSize: '11.5px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                  title="Enlarge QR Code for customer to scan"
                >
                  <Maximize2 size={13} />
                  <span>Enlarge for Customer</span>
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div
                  style={{
                    padding: '8px',
                    backgroundColor: '#ffffff',
                    borderRadius: '10px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <DynamicQrCode value={upiUri} size={95} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    Scan & pay with any UPI app (GPay, PhonePe, Paytm):
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: 'var(--bg-surface)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      padding: '4px 8px'
                    }}
                  >
                    <span style={{ fontSize: '11.5px', fontFamily: 'monospace', fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {upiConfig.upiVpa}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyVpa}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '2px',
                        color: copiedVpa ? 'var(--color-success)' : 'var(--text-muted)'
                      }}
                      title="Copy UPI VPA"
                    >
                      {copiedVpa ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Payable: <strong style={{ color: 'var(--color-primary)' }}>{formatCurrency(totalAmount)}</strong>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  UTR / Transaction Ref No. (Optional for counter payment)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 12-digit UTR from customer app"
                  value={upiRefId}
                  onChange={(e) => setUpiRefId(e.target.value)}
                  maxLength={20}
                  style={{
                    height: '32px',
                    padding: '0 8px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-surface)',
                    fontSize: '12px',
                    fontFamily: 'monospace'
                  }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#047857' }}>
                <ShieldCheck size={14} />
                <span>Cashier POS: Order is auto-accepted with instant Paid status.</span>
              </div>
            </div>
          )}


          {/* Bill Breakdown */}
          <div
            style={{
              padding: '14px',
              borderRadius: '12px',
              backgroundColor: 'var(--bg-muted)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-secondary)' }}>
              <span>Items Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-secondary)' }}>
              <span>Takeaway Packaging Fee</span>
              <span style={{ fontWeight: 600, color: packagingFee === 0 ? 'var(--color-success)' : 'var(--text-primary)' }}>
                {packagingFee === 0 ? 'FREE' : formatCurrency(packagingFee)}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-secondary)' }}>
              <span>GST ({gstPercent}%)</span>
              <span>{formatCurrency(taxAmount)}</span>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                paddingTop: '8px',
                borderTop: '1px solid var(--border-color)',
                fontSize: '15px',
                fontWeight: 800,
                color: 'var(--text-primary)'
              }}
            >
              <span>Total Payable</span>
              <span style={{ color: 'var(--color-primary)' }}>{formatCurrency(totalAmount)}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'var(--color-success)', marginTop: '4px' }}>
              <ShieldCheck size={14} />
              <span>Payment status will be saved as <strong>Paid</strong> with automatic token assignment.</span>
            </div>
          </div>
        </div>

        {/* Drawer Footer */}
        <div
          style={{
            padding: '16px 20px',
            borderTop: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-surface)'
          }}
        >
          <button
            type="button"
            disabled={cartItems.length === 0 || isSubmitting}
            onClick={handlePlaceOrder}
            style={{
              width: '100%',
              height: '46px',
              borderRadius: '10px',
              backgroundColor: cartItems.length === 0 ? 'var(--bg-subtle)' : 'var(--color-primary)',
              color: cartItems.length === 0 ? 'var(--text-muted)' : '#ffffff',
              border: 'none',
              fontWeight: 700,
              fontSize: '15px',
              cursor: cartItems.length === 0 || isSubmitting ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: cartItems.length > 0 ? '0 4px 12px rgba(30, 58, 138, 0.25)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            {isSubmitting ? (
              <span>Placing Order...</span>
            ) : (
              <>
                <CheckCircle size={18} />
                <span>Place & Accept Order ({formatCurrency(totalAmount)})</span>
              </>
            )}
          </button>
        </div>
        {/* Enlarge QR Code Modal for Customer Display */}
        {isQrModalOpen && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 1200,
              backgroundColor: 'rgba(15, 23, 42, 0.75)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px'
            }}
            onClick={() => setIsQrModalOpen(false)}
          >
            <div
              style={{
                width: '100%',
                maxWidth: '380px',
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                gap: '14px',
                animation: 'scaleIn 0.2s ease-out'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <QrIcon size={20} color="var(--color-primary, #1e3a8a)" />
                  <span style={{ fontWeight: 700, fontSize: '16px', color: '#0f172a' }}>Scan to Pay at Counter</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsQrModalOpen(false)}
                  style={{
                    background: '#f1f5f9',
                    border: 'none',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <X size={16} />
                </button>
              </div>

              <div style={{ fontSize: '13px', color: '#475569' }}>
                Please scan using Google Pay, PhonePe, Paytm, or any BHIM UPI app:
              </div>

              <div
                style={{
                  padding: '16px',
                  backgroundColor: '#ffffff',
                  borderRadius: '16px',
                  border: '2px solid #e2e8f0',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              >
                <DynamicQrCode value={upiUri} size={230} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%' }}>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Merchant: {upiConfig.upiMerchantName}</span>
                <span style={{ fontSize: '13px', fontWeight: 600, fontFamily: 'monospace', color: '#0f172a' }}>
                  {upiConfig.upiVpa}
                </span>
                <div style={{ fontSize: '24px', fontWeight: 800, color: '#1e3a8a', marginTop: '4px' }}>
                  {formatCurrency(totalAmount)}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsQrModalOpen(false)}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '10px',
                  backgroundColor: '#1e3a8a',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: 600,
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                Done / Close QR
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartDrawer;
