import React, { useState, useMemo, useEffect } from 'react';
import { X, Trash2, Plus, Minus, ShoppingBag, ShieldCheck, CreditCard, Banknote, Smartphone, CheckCircle, Store, Copy, Check, QrCode as QrIcon, Maximize2 } from 'lucide-react';
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
          setGstPercent(Number(gst) >= 0 ? Number(gst) : 5.0);
        }
      })
      .catch(() => {});
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

  // Dynamic GST from settings
  const taxAmount = useMemo(() => {
    return Math.round(subtotal * (gstPercent / 100) * 100) / 100;
  }, [subtotal, gstPercent]);

  const totalAmount = useMemo(() => {
    return subtotal + taxAmount;
  }, [subtotal, taxAmount]);

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
      customerRole: 'Admin',
      rollNo: user?.rollNo || 'ADM-01',
      department: 'Canteen Administration',
      phone: (customerPhone || '9876543210').trim(),
      email: user?.email || 'admin@canteen.edu',
      paymentMethod: paymentMethod,
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
                <span>Place Order & Pay {formatCurrency(totalAmount)}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartDrawer;
