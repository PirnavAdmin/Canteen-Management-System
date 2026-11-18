import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../../../app/providers/AuthProvider';
import { useCart } from '../../cart/hooks/useCart';
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
    totalAmount
  } = useCart();

  const safeCartItems = Array.isArray(cartItems) ? cartItems : [];

  const [pickupSlot, setPickupSlot] = useState('express');
  const [cookingNotes, setCookingNotes] = useState('');
  const [orderError, setOrderError] = useState('');

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
      outletId: selectedOutlet?.id || 'canteen-001',
      outletName: selectedOutlet?.name || 'Central Dining Hall',
      items: safeCartItems.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        variant: typeof item.variant === 'object' ? (item.variant?.name || item.variant?.id) : (item.variant || null),
        addOns: (item.selectedAddOns || []).map(a => a.name)
      })),
      pricing: {
        subtotal,
        taxAmount,
        packagingFee,
        totalAmount
      },
      pickupSlot,
      cookingNotes,
      status: 'Placed',
      createdAt: new Date().toISOString()
    };

    sessionStorage.setItem('cms_customer_draft_order', JSON.stringify(draftOrder));
    navigate('/customer/payment');
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
                    {selectedOutlet?.name || 'Central Dining Hall'}
                  </h4>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '3px 0 0 0' }}>
                    {selectedOutlet?.location || 'Campus Center, Ground Floor'} • Open until {selectedOutlet?.closingTime || '10:00 PM'}
                  </p>
                </div>
              </div>
            </Card>

            {/* Pickup Schedule Slot Card */}
            <Card title="Pickup Window Slot" padding="20px">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  { id: 'express', label: 'Express Counter Pickup', desc: 'Ready in 10-15 minutes at counter' },
                  { id: 'lunch_slot_1', label: 'Lunch Break: 12:30 PM - 01:00 PM', desc: 'Reserved slot during peak lunch hour' },
                  { id: 'lunch_slot_2', label: 'Lunch Break: 01:00 PM - 01:30 PM', desc: 'Reserved slot during second lunch session' },
                  { id: 'tea_slot', label: 'Evening Refreshment: 04:30 PM - 05:00 PM', desc: 'High-tea and snack counter' }
                ].map((slot) => (
                  <label
                    key={slot.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 14px',
                      borderRadius: 'var(--border-radius-md)',
                      border: '1px solid',
                      borderColor: pickupSlot === slot.id ? 'var(--color-accent)' : 'var(--border-color)',
                      backgroundColor: pickupSlot === slot.id ? 'var(--color-primary-light)' : 'var(--bg-app)',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <input
                        type="radio"
                        name="pickupSlot"
                        value={slot.id}
                        checked={pickupSlot === slot.id}
                        onChange={(e) => setPickupSlot(e.target.value)}
                        style={{ cursor: 'pointer' }}
                      />
                      <div>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {slot.label}
                        </span>
                        <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>
                          {slot.desc}
                        </span>
                      </div>
                    </div>
                    <Clock size={16} style={{ color: pickupSlot === slot.id ? 'var(--color-accent)' : 'var(--text-muted)' }} />
                  </label>
                ))}
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

              {/* Billing breakdown */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1px solid var(--border-color)', paddingTop: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Items Subtotal:</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>₹{subtotal.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>GST (5%):</span>
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
