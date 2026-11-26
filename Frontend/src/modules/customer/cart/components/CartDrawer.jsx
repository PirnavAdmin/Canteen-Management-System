import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../hooks/useCart';
import { ShoppingBag, X, Plus, Minus, Trash2, ArrowRight } from 'lucide-react';
import styles from '../styles/cart.module.css';

export const CartDrawer = () => {
  const navigate = useNavigate();
  const {
    cartItems,
    isDrawerOpen,
    setIsDrawerOpen,
    updateQuantity,
    clearCart,
    subtotal,
    packagingFee,
    taxAmount,
    totalAmount,
    itemCount,
    selectedOutlet,
    gstPercent
  } = useCart();

  const safeCartItems = Array.isArray(cartItems) ? cartItems : [];
  const displayOutletName = safeCartItems.find(i => i && i.outletName && i.outletName !== 'All Outlets' && i.outletName !== 'All Campus Dining Halls')?.outletName
    || (selectedOutlet && selectedOutlet.id !== 'ALL' && selectedOutlet.name && selectedOutlet.name !== 'All Outlets' && selectedOutlet.name !== 'All Campus Dining Halls' ? selectedOutlet.name : '')
    || 'Main Canteen';

  if (!isDrawerOpen) return null;

  const handleProceedToCheckout = () => {
    setIsDrawerOpen(false);
    navigate('/customer/checkout');
  };

  return (
    <div className={styles.drawerOverlay} onClick={() => setIsDrawerOpen(false)}>
      <div className={styles.drawerContainer} onClick={(e) => e.stopPropagation()}>
        {/* Drawer Header */}
        <div className={styles.drawerHeader}>
          <div className={styles.drawerHeaderTitle}>
            <ShoppingBag size={20} className={styles.bagIcon} />
            <div>
              <h3>My Cart</h3>
              <p className={styles.outletSubtitle}>{safeCartItems.length > 0 ? displayOutletName : (selectedOutlet?.name || 'Main Canteen')}</p>
            </div>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={() => setIsDrawerOpen(false)}
            aria-label="Close cart"
          >
            <X size={20} />
          </button>
        </div>

        {/* Cart Items List */}
        <div className={styles.drawerBody}>
          {safeCartItems.length === 0 ? (
            <div className={styles.emptyCart}>
              <div className={styles.emptyIconCircle}>
                <ShoppingBag size={40} />
              </div>
              <h4>Your cart is empty</h4>
              <p>Explore delicious campus meals and add items to your cart.</p>
              <button
                type="button"
                className={styles.browseBtn}
                onClick={() => {
                  setIsDrawerOpen(false);
                  navigate('/customer/dashboard');
                }}
              >
                Browse Canteen Menu
              </button>
            </div>
          ) : (
            <div className={styles.itemList}>
              <div className={styles.traySummaryBar}>
                <span>{itemCount} {itemCount === 1 ? 'item' : 'items'} in cart</span>
                <button type="button" className={styles.clearAllBtn} onClick={clearCart}>
                  Clear all
                </button>
              </div>

              {safeCartItems.map((item) => {
                const itemTotal = (Number(item.price) + (item.selectedAddOns || []).reduce((a, b) => a + Number(b.price || 0), 0)) * item.quantity;
                return (
                  <div key={item.cartKey} className={styles.cartCard}>
                    <img src={item.imageUrl} alt={item.name} className={styles.itemThumb} />
                    <div className={styles.itemDetails}>
                      <div className={styles.itemNameRow}>
                        <span className={item.foodType === 'Veg' ? styles.vegTag : styles.nonVegTag}>
                          {item.foodType === 'Veg' ? '●' : '▲'}
                        </span>
                        <h4 className={styles.itemName}>{item.name}</h4>
                      </div>

                      {item.variant && (
                        <p className={styles.variantBadge}>
                          {typeof item.variant === 'object' ? (item.variant.name || item.variant.id) : item.variant}
                        </p>
                      )}

                      {(item.selectedAddOns || []).length > 0 && (
                        <p className={styles.addOnsText}>
                          + {item.selectedAddOns.map(a => a.name).join(', ')}
                        </p>
                      )}

                      <div className={styles.priceAndCounter}>
                        <span className={styles.itemPrice}>₹{itemTotal.toFixed(2)}</span>

                        <div className={styles.counter}>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.cartKey, item.quantity - 1)}
                            className={styles.counterBtn}
                            aria-label="Decrease quantity"
                          >
                            {item.quantity === 1 ? <Trash2 size={13} /> : <Minus size={13} />}
                          </button>
                          <span className={styles.qtyNumber}>{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.cartKey, item.quantity + 1)}
                            className={styles.counterBtn}
                            aria-label="Increase quantity"
                          >
                            <Plus size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        {safeCartItems.length > 0 && (
          <div className={styles.drawerFooter}>
            <div className={styles.billBreakdown}>
              <div className={styles.billRow}>
                <span>Items Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className={styles.billRow}>
                <span>Campus Packaging</span>
                <span>{packagingFee === 0 ? <strong className={styles.freeText}>FREE</strong> : `₹${packagingFee.toFixed(2)}`}</span>
              </div>
              <div className={styles.billRow}>
                <span>GST ({gstPercent || 5}%)</span>
                <span>₹{taxAmount.toFixed(2)}</span>
              </div>
              <div className={`${styles.billRow} ${styles.totalRow}`}>
                <span>Total Payable</span>
                <span>₹{totalAmount.toFixed(2)}</span>
              </div>
            </div>

            <button
              type="button"
              className={styles.checkoutBtn}
              onClick={handleProceedToCheckout}
            >
              <span>Proceed to Checkout</span>
              <div className={styles.checkoutBadge}>
                <span>₹{totalAmount.toFixed(2)}</span>
                <ArrowRight size={16} />
              </div>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartDrawer;
