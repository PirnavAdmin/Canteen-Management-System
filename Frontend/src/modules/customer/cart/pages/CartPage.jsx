import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../hooks/useCart';
import { PageHeader } from '../../../../components/common/PageHeader';
import { Card } from '../../../../components/common/Card';
import { Button } from '../../../../components/common/Button';
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  ArrowRight,
  Store,
  ShieldCheck,
  UtensilsCrossed,
  Info
} from 'lucide-react';

export const CartPage = () => {
  const navigate = useNavigate();
  const {
    cartItems,
    selectedOutlet,
    updateQuantity,
    removeFromCart,
    clearCart,
    subtotal,
    packagingFee,
    taxAmount,
    totalAmount,
    itemCount
  } = useCart();

  const safeCartItems = Array.isArray(cartItems) ? cartItems : [];

  if (safeCartItems.length === 0) {
    return (
      <div>
        <PageHeader
          title="My Cart"
          description="Review your pre-order dishes, adjust quantities, and verify pickup details."
        />
        <Card padding="48px 24px" style={{ textAlign: 'center' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: 'var(--color-primary-light)',
            color: 'var(--color-accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px auto'
          }}>
            <ShoppingCart size={32} />
          </div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
            Your Cart is Empty
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '420px', margin: '0 auto 20px auto' }}>
            Explore menus from active campus dining halls and add meals or beverages to order ahead without standing in counter queues.
          </p>
          <Button
            variant="primary"
            icon={UtensilsCrossed}
            onClick={() => navigate('/customer/menu')}
          >
            Browse Campus Menus
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div>
      {/* Admin PageHeader */}
      <PageHeader
        title="My Cart"
        description="Review selected campus dishes, update portions, and inspect itemized packaging & GST summary."
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Button
              variant="secondary"
              icon={Trash2}
              onClick={clearCart}
            >
              Clear Cart
            </Button>
            <Button
              variant="primary"
              icon={ArrowRight}
              onClick={() => navigate('/customer/checkout')}
            >
              Proceed to Checkout
            </Button>
          </div>
        }
      />

      {/* Cart Layout Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '24px',
        alignItems: 'start'
      }}>
        {/* Left Column: Tray Items Table */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Card
            title={`Selected Meals (${itemCount} Items)`}
            subtitle={selectedOutlet ? `Outlet: ${selectedOutlet.name}` : 'Campus Canteen'}
            padding="0"
          >
            <div style={{ overflowX: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '13px',
                textAlign: 'left'
              }}>
                <thead>
                  <tr style={{
                    backgroundColor: 'var(--bg-app)',
                    borderBottom: '1px solid var(--border-color)',
                    color: 'var(--text-secondary)'
                  }}>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Dish / Item</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'center' }}>Unit Price</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'center' }}>Quantity</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right' }}>Total</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {safeCartItems.map((item) => {
                    const itemBasePrice = Number(item.price) + (item.selectedAddOns || []).reduce((a, b) => a + Number(b.price || 0), 0);
                    const itemRowTotal = itemBasePrice * item.quantity;

                    return (
                      <tr
                        key={item.cartKey}
                        style={{
                          borderBottom: '1px solid var(--border-color-subtle)',
                          transition: 'background-color var(--transition-fast)'
                        }}
                      >
                        {/* Food info */}
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              style={{
                                width: '48px',
                                height: '48px',
                                objectFit: 'cover',
                                borderRadius: 'var(--border-radius-md)'
                              }}
                            />
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{
                                  color: item.foodType === 'Veg' ? '#16a34a' : '#dc2626',
                                  fontSize: '11px',
                                  fontWeight: 700
                                }}>
                                  {item.foodType === 'Veg' ? '●' : '▲'}
                                </span>
                                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                  {item.name}
                                </span>
                              </div>
                              {item.variant && (
                                <span style={{ fontSize: '11px', color: 'var(--color-accent)', display: 'block' }}>
                                  Portion: {typeof item.variant === 'object' ? (item.variant.name || item.variant.id) : item.variant}
                                </span>
                              )}
                              {(item.selectedAddOns || []).length > 0 && (
                                <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>
                                  + {item.selectedAddOns.map(a => a.name).join(', ')}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Unit Price */}
                        <td style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 500 }}>
                          ₹{itemBasePrice.toFixed(2)}
                        </td>

                        {/* Quantity controls */}
                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                          <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            border: '1px solid var(--border-color)',
                            borderRadius: 'var(--border-radius-md)',
                            backgroundColor: 'var(--bg-surface)'
                          }}>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.cartKey, item.quantity - 1)}
                              style={{
                                width: '28px',
                                height: '28px',
                                border: 'none',
                                backgroundColor: 'transparent',
                                color: 'var(--text-primary)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                              title="Decrease"
                            >
                              <Minus size={13} />
                            </button>
                            <span style={{ fontSize: '13px', fontWeight: 700, minWidth: '24px', textAlign: 'center' }}>
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.cartKey, item.quantity + 1)}
                              style={{
                                width: '28px',
                                height: '28px',
                                border: 'none',
                                backgroundColor: 'transparent',
                                color: 'var(--text-primary)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                              title="Increase"
                            >
                              <Plus size={13} />
                            </button>
                          </div>
                        </td>

                        {/* Row Total */}
                        <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 700, color: 'var(--text-primary)' }}>
                          ₹{itemRowTotal.toFixed(2)}
                        </td>

                        {/* Remove */}
                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => removeFromCart(item.cartKey)}
                            style={{
                              border: 'none',
                              backgroundColor: 'transparent',
                              color: 'var(--color-danger)',
                              cursor: 'pointer',
                              padding: '6px'
                            }}
                            title="Remove item"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Bottom Actions Row */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 20px',
              borderTop: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-app)'
            }}>
              <Link to="/customer/menu" style={{ textDecoration: 'none' }}>
                <Button variant="secondary" icon={UtensilsCrossed}>
                  Add More Dishes
                </Button>
              </Link>
              <Button variant="secondary" icon={Trash2} onClick={clearCart}>
                Clear All Items
              </Button>
            </div>
          </Card>
        </div>

        {/* Right Column: Order Summary & Checkout Trigger */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Card title="Billing & Tax Breakdown" padding="20px">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Items Subtotal:</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>₹{subtotal.toFixed(2)}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Institutional GST (5%):</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>₹{taxAmount.toFixed(2)}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Eco-Friendly Packaging:</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  {packagingFee > 0 ? `₹${packagingFee.toFixed(2)}` : 'FREE'}
                </span>
              </div>

              <div style={{
                borderTop: '1px solid var(--border-color)',
                paddingTop: '14px',
                marginTop: '4px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>Total Amount:</span>
                <span style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-accent)' }}>
                  ₹{totalAmount.toFixed(2)}
                </span>
              </div>

              <Button
                variant="primary"
                icon={ArrowRight}
                onClick={() => navigate('/customer/checkout')}
                style={{
                  height: '44px',
                  fontSize: '14px',
                  fontWeight: 600,
                  marginTop: '10px',
                  justifyContent: 'center'
                }}
              >
                Proceed to Checkout
              </Button>
            </div>
          </Card>

          {/* Institutional Trust Notice */}
          <Card padding="16px">
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <ShieldCheck size={18} style={{ color: 'var(--color-success)', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                  Guaranteed Fresh & Fast Prep
                </h4>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0 0', lineHeight: 1.4 }}>
                  Orders are routed directly to the kitchen display of the designated counter. Counter pickup tokens will be issued instantly upon order confirmation.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
