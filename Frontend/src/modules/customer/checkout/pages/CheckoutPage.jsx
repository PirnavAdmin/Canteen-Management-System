import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../../../app/providers/AuthProvider';
import { useCart } from '../../cart/hooks/useCart';
import { canteenService } from '../../../../modules/admin/outlets/services/canteenService';
import { formatTime12Hour } from '../../../../utils/formatters';
import { PageHeader } from '../../../../components/common/PageHeader';
import { Card } from '../../../../components/common/Card';
import { Button } from '../../../../components/common/Button';
import {
  Store,
  Clock,
  ArrowRight,
  ShieldCheck,
  FileText,
  AlertCircle,
  GraduationCap,
  Briefcase,
  UtensilsCrossed
} from 'lucide-react';

export const CheckoutPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    cartItems,
    selectedOutlet,
    subtotal,
    packagingFee,
    taxAmount,
    totalAmount,
    gstPercent,
    isDineIn,
    setIsDineIn
  } = useCart();

  const safeCartItems = Array.isArray(cartItems) ? cartItems : [];

  const [cookingNotes, setCookingNotes] = useState('');
  const [orderError, setOrderError] = useState('');
  const [canteens, setCanteens] = useState([]);

  useEffect(() => {
    let isMounted = true;
    canteenService.getAll().then(res => {
      if (!isMounted) return;
      const list = Array.isArray(res) ? res : (res?.data || []);
      setCanteens(list.filter(c => c && (c.status === 'Active' || !c.status)));
    }).catch(err => {
      console.warn('Could not load canteens for checkout:', err);
    });
    return () => { isMounted = false; };
  }, []);

  // Resolve designated canteen directly from the cart item's outlet
  const designatedOutlet = useMemo(() => {
    const itemWithOutlet = safeCartItems.find(item => item && (item.outletId || item.canteenId));
    const targetOutletId = itemWithOutlet ? (itemWithOutlet.outletId || itemWithOutlet.canteenId) : (safeCartItems[0]?.outletId || safeCartItems[0]?.canteenId);
    const targetOutletName = safeCartItems.find(item => item && item.outletName && item.outletName !== 'All Outlets' && item.outletName !== 'All Campus Dining Halls')?.outletName || safeCartItems[0]?.outletName;

    // Look up in loaded canteens list matching targetOutletId or targetOutletName
    if (canteens.length > 0) {
      if (targetOutletId) {
        const matchById = canteens.find(c => c && (String(c.outletId) === String(targetOutletId) || String(c.id) === String(targetOutletId)));
        if (matchById) {
          return {
            id: matchById.outletId || matchById.id,
            outletId: matchById.outletId || matchById.id,
            name: matchById.name || matchById.outletName || 'Main Canteen',
            location: matchById.location || 'Campus Center, Ground Floor',
            closingTime: matchById.closingTime || matchById.closeTime || '10:00 PM'
          };
        }
      }
      if (targetOutletName && targetOutletName !== 'All Outlets' && targetOutletName !== 'All Campus Dining Halls') {
        const matchByName = canteens.find(c => c && c.name && c.name.toLowerCase() === targetOutletName.toLowerCase());
        if (matchByName) {
          return {
            id: matchByName.outletId || matchByName.id,
            outletId: matchByName.outletId || matchByName.id,
            name: matchByName.name || matchByName.outletName || 'Main Canteen',
            location: matchByName.location || 'Campus Center, Ground Floor',
            closingTime: matchByName.closingTime || matchByName.closeTime || '10:00 PM'
          };
        }
      }
    }

    // Direct item-derived fallback
    if (targetOutletName && targetOutletName !== 'All Outlets' && targetOutletName !== 'All Campus Dining Halls') {
      return {
        id: targetOutletId || 1,
        outletId: targetOutletId || 1,
        name: targetOutletName,
        location: targetOutletName.toLowerCase().includes('main') ? 'Campus Center, Ground Floor' : 'Campus Center, Ground Floor',
        closingTime: '10:00 PM'
      };
    }

    // Context selected outlet fallback (if specific)
    if (selectedOutlet && selectedOutlet.id !== 'ALL' && selectedOutlet.name && selectedOutlet.name !== 'All Outlets' && selectedOutlet.name !== 'All Campus Dining Halls') {
      return {
        id: selectedOutlet.id,
        outletId: selectedOutlet.id,
        name: selectedOutlet.name,
        location: selectedOutlet.location || 'Campus Center, Ground Floor',
        closingTime: selectedOutlet.closingTime || '10:00 PM'
      };
    }

    // First active canteen fallback
    if (canteens.length > 0) {
      const first = canteens[0];
      return {
        id: first.outletId || first.id || 1,
        outletId: first.outletId || first.id || 1,
        name: first.name || 'Main Canteen',
        location: first.location || 'Campus Center, Ground Floor',
        closingTime: first.closingTime || first.closeTime || '10:00 PM'
      };
    }

    return {
      id: 1,
      outletId: 1,
      name: 'Main Canteen',
      location: 'Campus Center, Ground Floor',
      closingTime: '10:00 PM'
    };
  }, [safeCartItems, canteens, selectedOutlet]);

  const displayName = user?.fullName || user?.username || 'Campus Diner';
  const rawRole = user?.role || user?.roleCode || user?.userType || 'Student';
  const isFaculty = String(rawRole).toUpperCase().includes('FACULTY');
  const role = isFaculty ? 'Faculty' : 'Student';
  const rollNo = user?.rollNo || user?.facultyId || user?.studentId || (isFaculty ? 'FAC-BIO-012' : '2023-CSE-042');
  const department = user?.department || (isFaculty ? 'Biotechnology & Bioengineering' : 'Computer Science & Engineering');
  const email = user?.email || (isFaculty ? 'sunita.rao@faculty.apexinstitute.edu' : 'aarav.mehta@students.apexinstitute.edu');

  const handleProceedToPayment = (e) => {
    e.preventDefault();
    if (safeCartItems.length === 0) {
      setOrderError('Your cart is empty. Please select food items before checking out.');
      return;
    }

    const safeOutletId = Number(designatedOutlet.outletId || designatedOutlet.id) || 1;
    const safeOutletName = designatedOutlet.name || 'Main Canteen';

    // Prepare draft order payload in session
    const draftOrder = {
      orderId: `ORD-${Date.now().toString().slice(-6)}`,
      customer: {
        name: displayName,
        email: email,
        rollNo: rollNo,
        role: role,
        department: department
      },
      outletId: safeOutletId,
      outletName: safeOutletName,
      items: safeCartItems.map(item => ({
        id: item.id,
        menuItemId: Number(item.id || item.menuItemId || 1),
        name: item.name,
        price: item.price,
        imageUrl: item.imageUrl,
        quantity: item.quantity,
        outletId: safeOutletId,
        variant: typeof item.variant === 'object' ? (item.variant?.name || item.variant?.id) : (item.variant || null),
        addOns: (item.selectedAddOns || []).map(a => a.name)
      })),
      pricing: {
        subtotal,
        taxAmount,
        packagingFee,
        totalAmount,
        gstPercent: gstPercent || 5.0
      },
      orderType: isDineIn ? 'Dine In' : 'Takeaway',
      isDineIn,
      cookingNotes,
      status: 'Placed',
      createdAt: new Date().toISOString()
    };

    window.__cms_customer_draft_order = draftOrder;
    navigate('/customer/payment', { state: { draftOrder } });
  };

  if (safeCartItems.length === 0) {
    return (
      <div>
        <PageHeader title="Order Checkout & Verification" />
        <Card padding="40px" style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>
            No items in cart to checkout.
          </p>
          <Link to="/customer/menu">
            <Button variant="primary">Browse Canteen Menu</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div>
      {/* Admin PageHeader */}
      <PageHeader
        title="Order Checkout & Verification"
        description="Verify your student / faculty credentials, designate meal pickup schedule, and review billing."
        actions={
          <Button
            variant="secondary"
            onClick={() => navigate('/customer/cart')}
          >
            Edit Tray Items
          </Button>
        }
      />

      {orderError && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '12px 16px',
          borderRadius: 'var(--border-radius-md)',
          backgroundColor: 'var(--color-danger-bg)',
          color: 'var(--color-danger-text)',
          border: '1px solid var(--color-danger-border)',
          marginBottom: '20px',
          fontSize: '13px'
        }}>
          <AlertCircle size={16} />
          <span>{orderError}</span>
        </div>
      )}

      {/* Checkout Form & Layout */}
      <form onSubmit={handleProceedToPayment}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '24px',
          alignItems: 'start'
        }}>
          {/* Left Column: Customer Identity & Pickup Options */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Customer Details Card */}
            <Card title="Verified Campus Identity" padding="20px">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Account Holder</span>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{displayName}</span>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Role & ID</span>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {isFaculty ? <Briefcase size={13} /> : <GraduationCap size={13} />}
                    {role} • {rollNo}
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Department</span>
                  <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>{department}</span>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Institutional Email</span>
                  <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>{email}</span>
                </div>
              </div>
            </Card>

            {/* Selected Canteen Outlet Card */}
            <Card title="Designated Campus Canteen" padding="20px">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: 'var(--border-radius-md)',
                  backgroundColor: 'var(--color-primary-light)',
                  color: 'var(--color-accent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Store size={22} />
                </div>
                <div>
                  <h4 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                    {designatedOutlet.name}
                  </h4>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '3px 0 0 0' }}>
                    {designatedOutlet.location} • Open until {formatTime12Hour(designatedOutlet.closingTime)}
                  </p>
                </div>
              </div>
            </Card>

            {/* Cooking Notes Input */}
            <Card title="Special Cooking Notes & Dietary Instructions" padding="20px">
              <textarea
                value={cookingNotes}
                onChange={(e) => setCookingNotes(e.target.value)}
                placeholder="E.g., Less spicy, no coriander, extra hot sambar on the side..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 'var(--border-radius-md)',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-app)',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  outline: 'none',
                  fontFamily: 'inherit'
                }}
              />
            </Card>
          </div>

          {/* Right Column: Order Review & Billing Summary */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <Card title="Order Items Breakdown" padding="20px">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
                {cartItems.map((item) => (
                  <div
                    key={item.cartKey}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderBottom: '1px solid var(--border-color-subtle)',
                      paddingBottom: '10px'
                    }}
                  >
                    <div>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {item.quantity}x {item.name}
                      </span>
                      {(item.servingSize || item.calories) && (
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginTop: '1px' }}>
                          {[
                            item.servingSize ? item.servingSize : null,
                            item.calories ? (String(item.calories).toLowerCase().includes('cal') ? item.calories : `${item.calories} kcal`) : null
                          ].filter(Boolean).join(' • ')}
                        </span>
                      )}
                      {item.variant && (
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>
                          ({typeof item.variant === 'object' ? (item.variant.name || item.variant.id) : item.variant})
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      ₹{((Number(item.price) + (item.selectedAddOns || []).reduce((a, b) => a + Number(b.price || 0), 0)) * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Dining Preference: Dine In vs Takeaway Toggle */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                backgroundColor: 'var(--bg-muted)',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                marginBottom: '10px'
              }}>
                <div>
                  <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)', display: 'block' }}>
                    Dining Preference
                  </span>
                  <span style={{ fontSize: '11px', color: isDineIn ? 'var(--color-success)' : 'var(--text-muted)' }}>
                    {isDineIn ? 'Dine In (No Packaging Fee)' : 'Takeaway (+Packaging Fee)'}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '4px', backgroundColor: 'var(--bg-surface)', padding: '2px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                  <button
                    type="button"
                    onClick={() => setIsDineIn(true)}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '5px',
                      border: 'none',
                      backgroundColor: isDineIn ? 'var(--color-primary)' : 'transparent',
                      color: isDineIn ? '#ffffff' : 'var(--text-secondary)',
                      fontSize: '12px',
                      fontWeight: isDineIn ? 700 : 500,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    Dine In
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsDineIn(false)}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '5px',
                      border: 'none',
                      backgroundColor: !isDineIn ? 'var(--color-primary)' : 'transparent',
                      color: !isDineIn ? '#ffffff' : 'var(--text-secondary)',
                      fontSize: '12px',
                      fontWeight: !isDineIn ? 700 : 500,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    Takeaway
                  </button>
                </div>
              </div>

              {/* Billing breakdown */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1px solid var(--border-color)', paddingTop: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Items Subtotal:</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>₹{subtotal.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>GST ({gstPercent || 5}%):</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>₹{taxAmount.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Packaging Fee:</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    {packagingFee > 0 ? `₹${packagingFee.toFixed(2)}` : 'FREE'}
                  </span>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderTop: '1px solid var(--border-color)',
                  paddingTop: '12px',
                  marginTop: '4px'
                }}>
                  <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>Total Payable:</span>
                  <span style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-accent)' }}>
                    ₹{totalAmount.toFixed(2)}
                  </span>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  icon={ArrowRight}
                  style={{
                    height: '44px',
                    fontSize: '14px',
                    fontWeight: 600,
                    marginTop: '12px',
                    justifyContent: 'center'
                  }}
                >
                  Proceed to Payment & Place Order
                </Button>
              </div>
            </Card>

            <Card padding="16px">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <ShieldCheck size={20} style={{ color: 'var(--color-success)', flexShrink: 0 }} />
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  Order tokens are synchronized in real-time with kitchen display units and staff verification screens.
                </span>
              </div>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CheckoutPage;
