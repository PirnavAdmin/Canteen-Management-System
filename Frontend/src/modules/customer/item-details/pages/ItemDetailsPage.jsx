import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { customerMenuService } from '../../menu/services/customerMenuService';
import { useCart } from '../../cart/hooks/useCart';
import { PageHeader } from '../../../../components/common/PageHeader';
import { Card } from '../../../../components/common/Card';
import { Button } from '../../../../components/common/Button';
import {
  ArrowLeft,
  ShoppingCart,
  Plus,
  Minus,
  Clock,
  Flame,
  Check,
  Star,
  CheckCircle2,
  Store
} from 'lucide-react';

export const ItemDetailsPage = () => {
  const { itemId } = useParams();
  const navigate = useNavigate();
  const { addToCart, setIsDrawerOpen } = useCart();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedAddOns, setSelectedAddOns] = useState([]);
  const [addedToast, setAddedToast] = useState(false);

  useEffect(() => {
    const fetchItem = async () => {
      try {
        setLoading(true);
        const data = await customerMenuService.getFoodItemById(itemId);
        if (data) {
          setItem(data);
          if (data.variants && data.variants.length > 0) {
            setSelectedVariant(data.variants[0]);
          }
        }
      } catch (err) {
        console.error('Failed to load item:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchItem();
  }, [itemId]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
        <p>Loading dish specifications...</p>
      </div>
    );
  }

  if (!item) {
    return (
      <Card padding="40px" style={{ textAlign: 'center' }}>
        <h3>Food Item Not Found</h3>
        <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>
          The requested menu item could not be retrieved from campus kitchens.
        </p>
        <Link to="/customer/menu">
          <Button variant="primary">Return to Menu</Button>
        </Link>
      </Card>
    );
  }

  const discount = Number(item.discountPercent || 0);
  let basePrice = selectedVariant ? Number(selectedVariant.price) : Number(item.price);
  if (discount > 0 && !selectedVariant) {
    basePrice = Math.round(basePrice * (1 - discount / 100) * 100) / 100;
  }
  const addOnsTotal = selectedAddOns.reduce((acc, curr) => acc + Number(curr.price), 0);
  const unitPrice = basePrice + addOnsTotal;
  const totalPrice = unitPrice * quantity;
  const isAvailable = item.availability === 'Available' && (item.remainingCapacity === undefined || item.remainingCapacity > 0);

  const toggleAddOn = (addon) => {
    if (selectedAddOns.some(a => a.id === addon.id)) {
      setSelectedAddOns(selectedAddOns.filter(a => a.id !== addon.id));
    } else {
      setSelectedAddOns([...selectedAddOns, addon]);
    }
  };

  const handleAddToCart = () => {
    if (!isAvailable) return;
    addToCart(item, quantity, selectedVariant, selectedAddOns);
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 2500);
  };

  return (
    <div>
      {/* Admin-styled PageHeader */}
      <PageHeader
        title={item.name}
        description={`Category: ${typeof item.category === 'object' ? (item.category?.name || item.category?.id || 'Menu') : item.category} • Prepared fresh at ${item.outletName || 'Campus Central Canteen'}`}
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Button
              variant="secondary"
              icon={ArrowLeft}
              onClick={() => navigate('/customer/menu')}
            >
              Back to Menu
            </Button>
            <Button
              variant="primary"
              icon={ShoppingCart}
              onClick={() => navigate('/customer/cart')}
            >
              View Cart
            </Button>
          </div>
        }
      />

      {/* Item Details Layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
        gap: '24px',
        alignItems: 'start'
      }}>
        {/* Left Column: Food Photography & Nutritional Disclosures */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Card padding="0" style={{ overflow: 'hidden' }}>
            <div style={{ position: 'relative' }}>
              <img
                src={item.imageUrl}
                alt={item.name}
                style={{
                  width: '100%',
                  height: '320px',
                  objectFit: 'cover',
                  display: 'block'
                }}
              />
              <div style={{
                position: 'absolute',
                top: '16px',
                left: '16px',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                padding: '4px 10px',
                borderRadius: 'var(--border-radius-sm)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                fontWeight: 700
              }}>
                <span style={{ color: item.foodType === 'Veg' ? '#16a34a' : '#dc2626' }}>
                  {item.foodType === 'Veg' ? '●' : '▲'}
                </span>
                <span>{item.foodType} Meal</span>
              </div>

              <div style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                backgroundColor: 'rgba(15, 23, 42, 0.85)',
                color: '#ffffff',
                padding: '4px 10px',
                borderRadius: 'var(--border-radius-full)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '12px',
                fontWeight: 600
              }}>
                <Star size={13} fill="#f59e0b" color="#f59e0b" />
                <span>{item.rating || '4.8'} (240+ reviews)</span>
              </div>
            </div>

            <div style={{ padding: '20px' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '12px',
                textAlign: 'center'
              }}>
                <div style={{ padding: '10px', backgroundColor: 'var(--bg-app)', borderRadius: 'var(--border-radius-md)' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Prep Time</span>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginTop: '2px' }}>
                    <Clock size={13} />
                    {item.preparationTimeMinutes || 10} Mins
                  </span>
                </div>
                <div style={{ padding: '10px', backgroundColor: 'var(--bg-app)', borderRadius: 'var(--border-radius-md)' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Energy</span>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginTop: '2px' }}>
                    <Flame size={13} style={{ color: '#ea580c' }} />
                    {item.nutrition?.calories || 320} kcal
                  </span>
                </div>
                <div style={{ padding: '10px', backgroundColor: 'var(--bg-app)', borderRadius: 'var(--border-radius-md)' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Kitchen Status</span>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: isAvailable ? 'var(--color-success)' : 'var(--color-danger)', marginTop: '2px', display: 'block' }}>
                    {isAvailable ? 'In Stock' : 'Sold Out'}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Nutritional Breakdown Card */}
          <Card title="Nutritional Transparency & Allergens" padding="16px">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '14px' }}>
              <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-sm)', padding: '8px', textAlign: 'center' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Protein</span>
                <span style={{ fontSize: '13px', fontWeight: 600, display: 'block' }}>{item.nutrition?.protein || '8.5g'}</span>
              </div>
              <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-sm)', padding: '8px', textAlign: 'center' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Carbohydrates</span>
                <span style={{ fontSize: '13px', fontWeight: 600, display: 'block' }}>{item.nutrition?.carbs || '42g'}</span>
              </div>
              <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-sm)', padding: '8px', textAlign: 'center' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Fat</span>
                <span style={{ fontSize: '13px', fontWeight: 600, display: 'block' }}>{item.nutrition?.fat || '6.0g'}</span>
              </div>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
              <strong>Allergen Advisory:</strong> {(item.allergens || ['Dairy', 'Gluten']).join(', ')}. Prepared in an institutional kitchen handling nuts and dairy.
            </p>
          </Card>
        </div>

        {/* Right Column: Customization & Add to Cart Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Card title="Dish Description & Customization" padding="20px">
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
              {item.name}
            </h2>
            <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 20px 0' }}>
              {item.description}
            </p>

            {/* Outlet Info */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 14px',
              borderRadius: 'var(--border-radius-md)',
              backgroundColor: 'var(--bg-app)',
              border: '1px solid var(--border-color)',
              marginBottom: '20px'
            }}>
              <Store size={16} style={{ color: 'var(--color-accent)' }} />
              <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                Sold by <strong>{item.outletName || 'Central Dining Hall'}</strong>
              </span>
            </div>

            {/* Portion Variants (if any) */}
            {Array.isArray(item.variants) && item.variants.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '8px' }}>
                  Select Portion Size:
                </label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {item.variants.map((v) => (
                    <button
                      key={v.name}
                      type="button"
                      onClick={() => setSelectedVariant(v)}
                      style={{
                        flex: 1,
                        padding: '10px',
                        borderRadius: 'var(--border-radius-md)',
                        border: '1px solid',
                        borderColor: selectedVariant?.name === v.name ? 'var(--color-accent)' : 'var(--border-color)',
                        backgroundColor: selectedVariant?.name === v.name ? 'var(--color-primary-light)' : 'var(--bg-surface)',
                        color: selectedVariant?.name === v.name ? 'var(--color-accent)' : 'var(--text-primary)',
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                    >
                      <div style={{ fontSize: '13px', fontWeight: 600 }}>{v.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>₹{Number(v.price).toFixed(2)}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Add-ons Checkboxes */}
            {(() => {
              const addOnsList = Array.isArray(item.availableAddOns)
                ? item.availableAddOns
                : (Array.isArray(item.addOns) ? item.addOns : []);

              if (addOnsList.length === 0) return null;

              return (
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '8px' }}>
                    Optional Meal Add-ons:
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {addOnsList.map((addon) => {
                      const isChecked = selectedAddOns.some(a => a.id === addon.id);
                      return (
                        <label
                          key={addon.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '10px 14px',
                            borderRadius: 'var(--border-radius-md)',
                            border: '1px solid',
                            borderColor: isChecked ? 'var(--color-accent)' : 'var(--border-color)',
                            backgroundColor: isChecked ? 'var(--color-primary-light)' : 'var(--bg-app)',
                            cursor: 'pointer'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleAddOn(addon)}
                              style={{ cursor: 'pointer' }}
                            />
                            <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>
                              {addon.name}
                            </span>
                          </div>
                          <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                            +₹{Number(addon.price).toFixed(2)}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* Quantity Selector & Add to Tray Action */}
            <div style={{
              borderTop: '1px solid var(--border-color)',
              paddingTop: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>Quantity:</span>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--border-radius-md)',
                  backgroundColor: 'var(--bg-surface)'
                }}>
                  <button
                    type="button"
                    disabled={quantity <= 1}
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    style={{
                      width: '36px',
                      height: '36px',
                      border: 'none',
                      backgroundColor: 'transparent',
                      color: quantity <= 1 ? 'var(--text-placeholder)' : 'var(--text-primary)',
                      cursor: quantity <= 1 ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Minus size={15} />
                  </button>
                  <span style={{ fontSize: '15px', fontWeight: 700, minWidth: '32px', textAlign: 'center' }}>
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    style={{
                      width: '36px',
                      height: '36px',
                      border: 'none',
                      backgroundColor: 'transparent',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Plus size={15} />
                  </button>
                </div>
              </div>

              {/* Total Calculation Row */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                backgroundColor: 'var(--bg-app)',
                borderRadius: 'var(--border-radius-md)'
              }}>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Total Payable</span>
                <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-accent)' }}>
                  ₹{totalPrice.toFixed(2)}
                </span>
              </div>

              {/* Add to Tray Button */}
              <Button
                variant="primary"
                icon={addedToast ? Check : Plus}
                onClick={handleAddToCart}
                disabled={!isAvailable}
                style={{
                  height: '44px',
                  fontSize: '14px',
                  fontWeight: 600,
                  justifyContent: 'center',
                  backgroundColor: addedToast ? 'var(--color-success)' : undefined
                }}
              >
                {addedToast ? 'Added to Dining Tray!' : `Add to Tray (₹${totalPrice.toFixed(2)})`}
              </Button>

              {addedToast && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  backgroundColor: 'var(--color-success-bg)',
                  border: '1px solid var(--color-success-border)',
                  borderRadius: 'var(--border-radius-sm)',
                  fontSize: '12px',
                  color: 'var(--color-success-text)'
                }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle2 size={14} />
                    Item updated in active tray
                  </span>
                  <Link
                    to="/customer/cart"
                    style={{ color: 'var(--color-success-text)', fontWeight: 700, textDecoration: 'underline' }}
                  >
                    Go to Checkout
                  </Link>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ItemDetailsPage;
