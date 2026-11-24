import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../cart/hooks/useCart';
import { Plus, Minus, Clock, Star, Utensils, Zap } from 'lucide-react';
import { SafeImage } from '../../../../components/common/SafeImage';

export const FoodItemCard = ({ item }) => {
  const navigate = useNavigate();
  const { cartItems, addToCart, updateQuantity } = useCart();

  // Check if item is already in cart
  const safeCartItems = Array.isArray(cartItems) ? cartItems : [];
  const cartItem = safeCartItems.find(ci => ci && ci.id === item.id);
  const qty = cartItem ? cartItem.quantity : 0;
  const isAvailable = item.availability === 'Available' && (item.remainingCapacity === undefined || item.remainingCapacity > 0);

  const handleAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAvailable) return;
    addToCart(item, 1);
  };

  const handleIncrement = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (cartItem) {
      updateQuantity(cartItem.cartKey, cartItem.quantity + 1);
    } else {
      addToCart(item, 1);
    }
  };

  const handleDecrement = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (cartItem) {
      updateQuantity(cartItem.cartKey, cartItem.quantity - 1);
    }
  };

  const handleBuyNow = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAvailable) return;
    addToCart(item, 1);
    navigate('/customer/checkout');
  };

  return (
    <div style={{
      backgroundColor: 'var(--bg-surface)',
      border: '1px solid var(--border-color)',
      borderRadius: 'var(--border-radius-lg)',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: 'var(--shadow-xs)',
      transition: 'box-shadow var(--transition-fast), border-color var(--transition-fast)'
    }}>
      {/* Food Image Container */}
      <Link to={`/customer/item/${item.id}`} style={{ position: 'relative', display: 'block', textDecoration: 'none' }}>
        <SafeImage
          src={item.imageUrl}
          alt={item.name}
          style={{
            width: '100%',
            height: '160px',
            objectFit: 'cover',
            display: 'block'
          }}
          fallback={
            <div style={{
              width: '100%',
              height: '160px',
              backgroundColor: 'var(--bg-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)'
            }}>
              <Utensils size={32} />
            </div>
          }
        />

        {/* Dietary veg/nonveg indicator */}
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          padding: '2px 6px',
          borderRadius: 'var(--border-radius-xs)',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          fontSize: '11px',
          fontWeight: 700,
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <span style={{
            color: item.foodType === 'Veg' ? '#16a34a' : '#dc2626',
            fontSize: '13px',
            lineHeight: 1
          }}>
            {item.foodType === 'Veg' ? '●' : '▲'}
          </span>
          <span style={{ color: '#334155' }}>{item.foodType}</span>
        </div>

        {/* Discount Badge */}
        {Number(item.discountPercent || 0) > 0 && (
          <div style={{
            position: 'absolute',
            bottom: '10px',
            left: '10px',
            backgroundColor: '#dc2626',
            color: '#ffffff',
            padding: '2px 8px',
            borderRadius: 'var(--border-radius-xs)',
            fontSize: '11px',
            fontWeight: 800,
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }}>
            {item.discountPercent}% OFF
          </div>
        )}

        {/* Rating badge */}
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'rgba(15, 23, 42, 0.85)',
          color: '#ffffff',
          padding: '2px 8px',
          borderRadius: 'var(--border-radius-full)',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          fontSize: '11px',
          fontWeight: 600
        }}>
          <Star size={11} fill="#f59e0b" color="#f59e0b" />
          <span>{item.rating || '4.8'}</span>
        </div>
      </Link>

      {/* Item Body */}
      <div style={{
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        flex: 1
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
          <span style={{
            fontSize: '11px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            color: 'var(--color-accent)'
          }}>
            {typeof item.category === 'object' ? (item.category?.name || item.category?.id || '') : item.category}
          </span>
          <span style={{
            display: 'flex',
            alignItems: 'center',
            gap: '3px',
            fontSize: '11.5px',
            color: 'var(--text-muted)'
          }}>
            <Clock size={12} />
            {item.preparationTimeMinutes || 10}m
          </span>
        </div>

        <Link
          to={`/customer/item/${item.id}`}
          style={{
            textDecoration: 'none',
            color: 'var(--text-primary)',
            fontSize: '15px',
            fontWeight: 600,
            lineHeight: 1.3,
            marginBottom: '4px'
          }}
        >
          {item.name}
        </Link>

        <p style={{
          fontSize: '12px',
          color: 'var(--text-secondary)',
          margin: '0 0 14px 0',
          lineHeight: 1.4,
          flex: 1,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden'
        }}>
          {item.description}
        </p>

        {/* Price & Action Row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTop: '1px solid var(--border-color)',
          paddingTop: '12px',
          marginTop: 'auto'
        }}>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Price</span>
            {Number(item.discountPercent || 0) > 0 ? (
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                <span style={{ fontSize: '17px', fontWeight: 700, color: '#16a34a' }}>
                  ₹{(Number(item.price) * (1 - Number(item.discountPercent) / 100)).toFixed(2)}
                </span>
                <span style={{ fontSize: '12px', textDecoration: 'line-through', color: 'var(--text-muted)' }}>
                  ₹{Number(item.price).toFixed(2)}
                </span>
              </div>
            ) : (
              <span style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)' }}>
                ₹{Number(item.price).toFixed(2)}
              </span>
            )}
          </div>

          {!isAvailable ? (
            <span style={{
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--color-danger)',
              backgroundColor: 'var(--color-danger-bg)',
              padding: '4px 10px',
              borderRadius: 'var(--border-radius-sm)'
            }}>
              Out of Stock
            </span>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {qty > 0 ? (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  backgroundColor: 'var(--color-primary-light)',
                  border: '1px solid var(--color-primary-border)',
                  borderRadius: 'var(--border-radius-md)',
                  padding: '2px 4px'
                }}>
                  <button
                    type="button"
                    onClick={handleDecrement}
                    style={{
                      width: '26px',
                      height: '26px',
                      border: 'none',
                      backgroundColor: 'transparent',
                      color: 'var(--color-accent)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="Decrease quantity"
                  >
                    <Minus size={13} />
                  </button>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-accent)', minWidth: '18px', textAlign: 'center' }}>
                    {qty}
                  </span>
                  <button
                    type="button"
                    onClick={handleIncrement}
                    style={{
                      width: '26px',
                      height: '26px',
                      border: 'none',
                      backgroundColor: 'transparent',
                      color: 'var(--color-accent)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="Increase quantity"
                  >
                    <Plus size={13} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleAdd}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '3px',
                    padding: '5px 10px',
                    backgroundColor: 'var(--color-accent)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 'var(--border-radius-sm)',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'background-color var(--transition-fast)'
                  }}
                  title="Add to cart"
                >
                  <Plus size={12} strokeWidth={3} />
                  <span>+Cart</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleBuyNow}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px',
                  padding: '5px 10px',
                  backgroundColor: '#f59e0b',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 'var(--border-radius-sm)',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 1px 3px rgba(245, 158, 11, 0.25)',
                  transition: 'background-color var(--transition-fast)'
                }}
                title="Buy now and proceed straight to checkout"
              >
                <Zap size={12} fill="#ffffff" />
                <span>Buy</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FoodItemCard;
