import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  ShoppingCart,
  Star,
  Plus,
  Minus,
  Clock,
  LayoutGrid,
  UtensilsCrossed,
  X,
  Zap,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../../../../app/providers/AuthProvider';
import { useTheme } from '../../../../hooks/useTheme';
import { useCustomerMenu } from '../../menu/hooks/useCustomerMenu';
import { useCart } from '../../cart/hooks/useCart';
import { customerOrderService } from '../../orders/services/customerOrderService';
import { SafeImage } from '../../../../components/common/SafeImage';
import { FoodRatingModal, inMemoryRatedOrderIds } from '../../feedback/components/FoodRatingModal';

export const CustomerDashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isDark } = useTheme();
  const {
    selectedOutlet,
    allFoodItems = [],
    categories = [],
    selectedCategory,
    setSelectedCategory,
    selectedFoodType,
    setSelectedFoodType
  } = useCustomerMenu();

  const {
    cartItems = [],
    addToCart,
    updateQuantity,
    removeFromCart,
    itemCount = 0,
    totalAmount = 0,
    setIsDrawerOpen
  } = useCart();

  const [orders, setOrders] = useState([]);
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedDiet, setSelectedDiet] = useState('ALL'); // 'ALL' | 'VEG' | 'NON_VEG'

  // Rating modal state
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [orderToRate, setOrderToRate] = useState(null);

  // Poll orders
  useEffect(() => {
    let isMounted = true;
    const fetchOrders = async () => {
      try {
        const list = await customerOrderService.getCustomerOrders(user);
        if (isMounted) setOrders(Array.isArray(list) ? list : []);
      } catch (err) {
        console.warn('Could not load orders:', err);
      }
    };
    fetchOrders();
    const interval = setInterval(fetchOrders, 8000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [user]);

  // When an order is completed, automatically trigger the feedback modal like Flipkart/Zomato
  useEffect(() => {
    const completed = orders.find(o => o && o.status === 'Completed');
    if (completed) {
      const orderId = String(completed.id || completed.orderId);
      if (!inMemoryRatedOrderIds.has(orderId)) {
        setOrderToRate(completed);
        setIsRatingModalOpen(true);
      }
    }
  }, [orders]);

  // Listen to external manual review open triggers
  useEffect(() => {
    const handleOpenRating = (e) => {
      if (e.detail?.order) {
        setOrderToRate(e.detail.order);
      } else if (orders.length > 0) {
        const target = orders.find(o => o.status === 'Completed') || orders[0];
        setOrderToRate(target);
      }
      setIsRatingModalOpen(true);
    };
    window.addEventListener('cms:open-rating-modal', handleOpenRating);
    return () => window.removeEventListener('cms:open-rating-modal', handleOpenRating);
  }, [orders]);

  // Normalize category pills list from live backend categories
  const categoryPills = useMemo(() => {
    const list = Array.isArray(categories) ? categories : [];
    const normalized = list.map(c => {
      if (typeof c === 'string') return { id: c, name: c };
      return {
        id: c?.name || c?.id || 'Category',
        name: c?.name || c?.id || 'Category',
        status: c?.status
      };
    });

    const activeList = normalized.filter(c => c.status !== 'Inactive');

    if (!activeList.some(c => c.id === 'ALL')) {
      return [{ id: 'ALL', name: 'All Categories' }, ...activeList];
    }
    return activeList;
  }, [categories]);

  // Dietary filter helpers
  const isItemVeg = useCallback((item) => {
    if (!item) return false;
    if (item.isVeg === true || item.isVegetarian === true) return true;
    const ft = (item.foodType || item.dietary || item.category || '').toLowerCase();
    if (ft.includes('non') || ft.includes('egg') || ft.includes('meat') || ft.includes('chicken') || ft.includes('mutton') || ft.includes('fish')) {
      return false;
    }
    return ft.includes('veg');
  }, []);

  const isItemNonVeg = useCallback((item) => {
    if (!item) return false;
    if (item.isVeg === false || item.isVegetarian === false) return true;
    const ft = (item.foodType || item.dietary || item.category || '').toLowerCase();
    return ft.includes('non') || ft.includes('egg') || ft.includes('meat') || ft.includes('chicken') || ft.includes('mutton') || ft.includes('fish');
  }, []);

  const handleDietSelect = (dietKey) => {
    setSelectedDiet(dietKey);
    if (setSelectedFoodType) {
      if (dietKey === 'ALL') setSelectedFoodType('ALL');
      else if (dietKey === 'VEG') setSelectedFoodType('Veg');
      else if (dietKey === 'NON_VEG') setSelectedFoodType('Non-veg');
    }
  };

  // Pure live items without seed injection or fallback data
  const baseItems = useMemo(() => {
    return Array.isArray(allFoodItems) ? allFoodItems : [];
  }, [allFoodItems]);

  // Filter items according to the selected category pills, dietary option, and search filter
  const filteredDishes = useMemo(() => {
    return baseItems.filter(item => {
      if (!item) return false;

      // 1. Outlet Filter
      const matchesOutlet =
        !selectedOutlet ||
        selectedOutlet.id === 'ALL' ||
        String(item.outletId) === String(selectedOutlet.id) ||
        String(item.canteenId) === String(selectedOutlet.id);

      // 2. Category Filter (Matches selected category pill)
      const itemCat = typeof item.category === 'object'
        ? (item.category?.name || item.category?.id || '')
        : String(item.category || item.categoryName || '');
      const itemCatId = item.categoryId || (typeof item.category === 'object' ? item.category?.id : '');

      const matchesCategory =
        !selectedCategory ||
        selectedCategory === 'ALL' ||
        String(itemCat).toLowerCase() === String(selectedCategory).toLowerCase() ||
        String(itemCatId) === String(selectedCategory) ||
        String(itemCat).toLowerCase().includes(String(selectedCategory).toLowerCase());

      // 3. Dietary Filter
      let matchesDiet = true;
      if (selectedDiet === 'VEG') {
        matchesDiet = isItemVeg(item);
      } else if (selectedDiet === 'NON_VEG') {
        matchesDiet = isItemNonVeg(item);
      }

      // 4. Search Filter
      const q = searchFilter.trim().toLowerCase();
      const matchesSearch =
        !q ||
        (item.name && item.name.toLowerCase().includes(q)) ||
        (item.description && item.description.toLowerCase().includes(q)) ||
        (itemCat && itemCat.toLowerCase().includes(q));

      return matchesOutlet && matchesCategory && matchesDiet && matchesSearch;
    });
  }, [baseItems, selectedOutlet, selectedCategory, selectedDiet, isItemVeg, isItemNonVeg, searchFilter]);

  // Cart quantity lookup helper
  const getCartQuantity = (itemId) => {
    const found = (cartItems || []).find(ci => ci && (ci.id === itemId || String(ci.id) === String(itemId)));
    return found ? found.quantity : 0;
  };

  const handleAddToCart = (item) => {
    addToCart(item, 1);
  };

  const handleBuyNow = (item) => {
    addToCart(item, 1);
    navigate('/customer/checkout');
  };

  const handleIncrement = (item) => {
    const found = (cartItems || []).find(ci => ci && (ci.id === item.id || String(ci.id) === String(item.id)));
    if (found) {
      updateQuantity(found.cartKey, found.quantity + 1);
    } else {
      addToCart(item, 1);
    }
  };

  const handleDecrement = (item) => {
    const found = (cartItems || []).find(ci => ci && (ci.id === item.id || String(ci.id) === String(item.id)));
    if (found) {
      if (found.quantity <= 1) {
        removeFromCart(found.cartKey);
      } else {
        updateQuantity(found.cartKey, found.quantity - 1);
      }
    }
  };

  // Dynamic greeting based on hour of day
  const greetingText = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning!';
    if (hour < 17) return 'Good Afternoon!';
    return 'Good Evening!';
  }, []);

  // Check if any order is completed to optionally surface rate dish shortcut
  const completedOrder = useMemo(() => orders.find(o => o.status === 'Completed'), [orders]);

  return (
    <div style={{ color: 'var(--text-primary)', display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {/* 1. Hero Banner (Sky Blue in Light / Deep Sleek Navy in Dark) */}
      <div style={{
        minHeight: '130px',
        borderRadius: '16px',
        padding: '20px 28px',
        position: 'relative',
        overflow: 'hidden',
        background: isDark
          ? 'linear-gradient(100deg, #1e293b 0%, #0f172a 48%, #1e3a8a 100%)'
          : 'linear-gradient(100deg, #dbeafe 0%, #eff6ff 48%, #bfdbfe 100%)',
        border: isDark ? '1px solid #334155' : '1px solid #bfdbfe',
        boxShadow: isDark ? '0 4px 16px rgba(0, 0, 0, 0.4)' : '0 4px 16px rgba(37, 99, 235, 0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ maxWidth: '62%', zIndex: 2 }}>
          <h2 style={{
            margin: '0 0 4px',
            fontSize: '28px',
            fontStyle: 'italic',
            fontWeight: 800,
            color: isDark ? '#93c5fd' : '#1e3a8a',
            letterSpacing: '-0.02em'
          }}>
            {greetingText}
          </h2>
          <p style={{
            margin: 0,
            fontSize: '14px',
            fontWeight: 500,
            color: isDark ? '#60a5fa' : '#2563eb',
            lineHeight: 1.4
          }}>
            Enjoy your meal, it&apos;s always better together!
          </p>
        </div>

        {/* Dish photo on the right */}
        <div style={{
          position: 'relative',
          width: '220px',
          height: '130px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          zIndex: 1
        }}>
          <img
            src="https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80"
            alt="Delicious Meal"
            style={{
              width: '160px',
              height: '160px',
              objectFit: 'cover',
              borderRadius: '50%',
              boxShadow: isDark ? '0 8px 24px rgba(0, 0, 0, 0.5)' : '0 10px 24px rgba(30, 58, 138, 0.22)',
              position: 'absolute',
              right: '-10px',
              top: '-15px'
            }}
          />
        </div>
      </div>

      {/* 2. Search & Dietary Bar (Small, Compact and Theme Based) */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '10px',
        backgroundColor: 'var(--bg-surface)',
        padding: '8px 14px',
        borderRadius: '12px',
        border: '1px solid var(--border-color)',
        boxShadow: 'var(--shadow-xs)'
      }}>
        {/* Search Input - Compact */}
        <div style={{ position: 'relative', flex: '1 1 280px' }}>
          <Search
            size={14}
            style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}
          />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Search dishes (e.g. Masala Dosa, Veg Thali, Coffee)..."
            style={{
              width: '100%',
              height: '32px',
              padding: '0 28px 0 32px',
              borderRadius: '6px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-app)',
              color: 'var(--text-primary)',
              fontSize: '12px',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
          {searchFilter && (
            <button
              type="button"
              onClick={() => setSearchFilter('')}
              style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '2px'
              }}
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Dietary Filter Segmented Control - Small, Compact & Theme Based */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>Diet:</span>
          <div style={{
            display: 'inline-flex',
            backgroundColor: 'var(--bg-app)',
            padding: '2px',
            borderRadius: '9999px',
            border: '1px solid var(--border-color)',
            gap: '2px'
          }}>
            {[
              { id: 'ALL', label: 'All', activeBg: isDark ? '#334155' : '#1e293b', activeColor: '#ffffff', activeBorder: isDark ? '#475569' : '#1e293b' },
              { id: 'VEG', label: '• Veg Only', activeBg: '#16a34a', activeColor: '#ffffff', activeBorder: '#16a34a', idleColor: '#16a34a' },
              { id: 'NON_VEG', label: '▲ Non-Veg', activeBg: '#dc2626', activeColor: '#ffffff', activeBorder: '#dc2626', idleColor: '#dc2626' }
            ].map((diet) => {
              const isSelected = selectedDiet === diet.id;
              return (
                <button
                  key={diet.id}
                  type="button"
                  onClick={() => handleDietSelect(diet.id)}
                  style={{
                    border: isSelected ? `1px solid ${diet.activeBorder}` : '1px solid transparent',
                    borderRadius: '9999px',
                    padding: '4px 10px',
                    fontSize: '11px',
                    fontWeight: isSelected ? 800 : 600,
                    cursor: 'pointer',
                    backgroundColor: isSelected ? diet.activeBg : 'transparent',
                    color: isSelected ? diet.activeColor : (diet.idleColor || 'var(--text-secondary)'),
                    boxShadow: isSelected ? '0 1px 3px rgba(0,0,0,0.15)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {diet.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Category Filter Bar (Small, Compact and Theme Based) */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        overflowX: 'auto',
        paddingBottom: '2px',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none'
      }}>
        {categoryPills.map((cat) => {
          const isSelected = selectedCategory === cat.id || (cat.id === 'ALL' && (!selectedCategory || selectedCategory === 'ALL'));
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '9999px',
                border: isSelected ? '1px solid var(--color-accent)' : '1px solid var(--border-color)',
                backgroundColor: isSelected ? 'var(--color-accent)' : 'var(--bg-surface)',
                color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                fontSize: '12px',
                fontWeight: isSelected ? 700 : 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                boxShadow: isSelected ? '0 2px 6px rgba(37, 99, 235, 0.25)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              {cat.id === 'ALL' && <UtensilsCrossed size={12} />}
              <span>{cat.name}</span>
            </button>
          );
        })}
      </div>

      {/* Optional Rate Recent Order Banner if completed order is present */}
      {completedOrder && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 16px',
          borderRadius: '10px',
          backgroundColor: isDark ? '#1e293b' : '#eff6ff',
          border: isDark ? '1px solid #334155' : '1px solid #bfdbfe'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '16px' }}>⭐</span>
            <div>
              <div style={{ fontSize: '12.5px', fontWeight: 700, color: isDark ? '#93c5fa' : '#1e3a8a' }}>
                Your order #{completedOrder.id || completedOrder.orderId} was completed!
              </div>
              <div style={{ fontSize: '11px', color: isDark ? '#60a5fa' : '#3b82f6' }}>
                How was the taste and quality? Leave a quick review for the kitchen.
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setOrderToRate(completedOrder);
              setIsRatingModalOpen(true);
            }}
            style={{
              padding: '5px 12px',
              backgroundColor: 'var(--color-accent)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '11.5px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Rate Food
          </button>
        </div>
      )}

      {/* 4. Popular Items Section with Theme-based Cards */}
      <div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '14px'
        }}>
          <h2 style={{
            margin: 0,
            fontSize: '18px',
            fontWeight: 700,
            color: 'var(--text-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Star size={18} fill="#f59e0b" color="#f59e0b" />
            <span>Popular Items</span>
          </h2>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Showing {filteredDishes.length} {filteredDishes.length === 1 ? 'dish' : 'dishes'}
          </div>
        </div>

        {/* Product Cards Grid with Compact "+Cart" and "Buy" */}
        {filteredDishes.length > 0 ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '16px'
          }}>
            {filteredDishes.map((item) => {
              const qty = getCartQuantity(item.id);
              const numId = Number(item.id || 1);
              const rating = Number(item.rating || (4.6 + ((numId % 5) * 0.1)));
              const isVeg = (item.foodType || 'Veg').toLowerCase().includes('veg') && !(item.foodType || '').toLowerCase().includes('non');
              const prepTime = item.prepTime || '10m';
              const categoryTitle = typeof item.category === 'object'
                ? (item.category?.name || 'SPECIALS')
                : (item.category || item.categoryName || 'SPECIALS');

              return (
                <div
                  key={item.id}
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderRadius: '14px',
                    border: '1px solid var(--border-color)',
                    overflow: 'hidden',
                    boxShadow: 'var(--shadow-xs)',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                    const img = e.currentTarget.querySelector('img');
                    if (img) img.style.transform = 'scale(1.08)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-xs)';
                    const img = e.currentTarget.querySelector('img');
                    if (img) img.style.transform = 'scale(1)';
                  }}
                >
                  {/* Food Image Container */}
                  <div style={{
                    height: '155px',
                    width: '100%',
                    position: 'relative',
                    overflow: 'hidden',
                    backgroundColor: 'var(--bg-muted)'
                  }}>
                    <SafeImage
                      src={item.imageUrl}
                      alt={item.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.35s ease' }}
                      fallback={
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-muted)', color: 'var(--text-muted)' }}>
                          <UtensilsCrossed size={28} />
                        </div>
                      }
                    />

                    {/* Veg / Non-veg Tag Badge */}
                    <div style={{
                      position: 'absolute',
                      top: '8px',
                      left: '8px',
                      backgroundColor: isDark ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.95)',
                      padding: '2px 7px',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '11px',
                      fontWeight: 700,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                    }}>
                      <span style={{
                        color: isVeg ? '#16a34a' : '#dc2626',
                        fontSize: '12px',
                        lineHeight: 1
                      }}>
                        {isVeg ? '●' : '▲'}
                      </span>
                      <span style={{ color: isDark ? '#e2e8f0' : '#334155' }}>
                        {isVeg ? 'Veg' : 'Non-veg'}
                      </span>
                    </div>

                    {/* Rating Badge */}
                    <div style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      backgroundColor: 'rgba(15, 23, 42, 0.85)',
                      color: '#ffffff',
                      padding: '2px 7px',
                      borderRadius: '999px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '10.5px',
                      fontWeight: 700,
                      boxShadow: '0 1px 4px rgba(0,0,0,0.2)'
                    }}>
                      <Star size={11} fill="#f59e0b" color="#f59e0b" />
                      <span>{rating.toFixed(1)}</span>
                    </div>
                  </div>

                  {/* Card Content Area */}
                  <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '5px', flex: 1 }}>
                    {/* Category Title & Prep time */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{
                        fontSize: '10.5px',
                        fontWeight: 700,
                        color: 'var(--color-accent)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em'
                      }}>
                        {categoryTitle}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px', color: 'var(--text-muted)' }}>
                        <Clock size={11} /> {prepTime}
                      </span>
                    </div>

                    {/* Dish Name */}
                    <h4 style={{
                      margin: '2px 0 0',
                      fontSize: '14.5px',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }} title={item.name}>
                      {item.name}
                    </h4>

                    {/* Short Description */}
                    <p style={{
                      margin: '0 0 8px',
                      fontSize: '11.5px',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.35,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      minHeight: '32px'
                    }}>
                      {item.description || 'Freshly prepared daily with institutional quality and authentic campus ingredients.'}
                    </p>

                    {/* Bottom Row: Price & Compact Action Buttons (+Cart and Buy) */}
                    <div style={{
                      marginTop: 'auto',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingTop: '6px',
                      borderTop: '1px solid var(--border-color)'
                    }}>
                      <div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Price
                        </div>
                        <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>
                          ₹{Number(item.price || 0).toFixed(2)}
                        </div>
                      </div>

                      {/* Action Buttons: Compact +Cart & Buy */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {qty > 0 ? (
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            height: '30px',
                            backgroundColor: 'var(--color-primary-light, #eff6ff)',
                            border: '1px solid var(--color-accent, #2563eb)',
                            borderRadius: '6px',
                            padding: '0 6px',
                            boxSizing: 'border-box'
                          }}>
                            <button
                              type="button"
                              onClick={() => handleDecrement(item)}
                              style={{
                                border: 'none',
                                background: 'none',
                                cursor: 'pointer',
                                color: 'var(--color-accent, #1d4ed8)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '2px'
                              }}
                              title="Decrease quantity"
                            >
                              <Minus size={12} strokeWidth={3} />
                            </button>
                            <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--color-accent, #1d4ed8)', minWidth: '16px', textAlign: 'center' }}>
                              {qty}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleIncrement(item)}
                              style={{
                                border: 'none',
                                background: 'none',
                                cursor: 'pointer',
                                color: 'var(--color-accent, #1d4ed8)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '2px'
                              }}
                              title="Increase quantity"
                            >
                              <Plus size={12} strokeWidth={3} />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleAddToCart(item)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '32px',
                              height: '30px',
                              backgroundColor: 'var(--color-accent, #2563eb)',
                              border: 'none',
                              borderRadius: '6px',
                              color: '#ffffff',
                              cursor: 'pointer',
                              boxShadow: '0 1px 4px rgba(37, 99, 235, 0.25)',
                              transition: 'background-color 0.15s ease, transform 0.15s ease'
                            }}
                            title="Add to Cart"
                            aria-label={`Add ${item.name} to Cart`}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#1d4ed8'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-accent, #2563eb)'; }}
                          >
                            <Plus size={16} strokeWidth={2.5} />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleBuyNow(item)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '3px',
                            padding: '5px 12px',
                            height: '30px',
                            backgroundColor: '#f59e0b',
                            border: 'none',
                            borderRadius: '6px',
                            color: '#ffffff',
                            fontSize: '12px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            boxShadow: '0 1px 4px rgba(245, 158, 11, 0.25)',
                            transition: 'background-color 0.15s ease'
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#d97706'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#f59e0b'; }}
                          title="Buy now and proceed straight to checkout"
                        >
                          <Zap size={12} fill="#ffffff" />
                          <span>Buy</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{
            padding: '40px 20px',
            textAlign: 'center',
            backgroundColor: 'var(--bg-surface)',
            borderRadius: '14px',
            border: '1px dashed var(--border-color)',
            color: 'var(--text-muted)'
          }}>
            <p style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
              No dishes found in &ldquo;{selectedCategory}&rdquo;
            </p>
            <p style={{ margin: 0, fontSize: '12.5px' }}>
              Try selecting &ldquo;All Categories&rdquo; or clearing the search filter.
            </p>
          </div>
        )}
      </div>

      {/* Floating Bottom Cart Bar */}
      {itemCount > 0 && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 999,
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            padding: '9px 18px',
            borderRadius: '9999px',
            backgroundColor: '#1e3a8a',
            color: '#ffffff',
            boxShadow: '0 10px 25px -5px rgba(30, 58, 138, 0.45), 0 8px 10px -6px rgba(30, 58, 138, 0.25)',
            border: isDark ? '1px solid #3b82f6' : 'none',
            animation: 'fadeInUp 0.2s ease-out'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                backgroundColor: '#f59e0b',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11.5px',
                fontWeight: 700
              }}
            >
              {itemCount}
            </span>
            <span style={{ fontSize: '12.5px', fontWeight: 600 }}>
              {itemCount === 1 ? '1 item' : `${itemCount} items`}
            </span>
            <span style={{ opacity: 0.6 }}>•</span>
            <span style={{ fontSize: '13.5px', fontWeight: 700 }}>
              ₹{Number(totalAmount || 0).toFixed(2)}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            style={{
              padding: '5px 14px',
              borderRadius: '9999px',
              backgroundColor: '#ffffff',
              color: '#1e3a8a',
              border: 'none',
              fontWeight: 700,
              fontSize: '12.5px',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
            }}
          >
            View Cart & Checkout
          </button>
        </div>
      )}

      {/* 5. Food Rating & Review Modal (Flipkart / E-commerce Style) */}
      <FoodRatingModal
        isOpen={isRatingModalOpen}
        onClose={() => setIsRatingModalOpen(false)}
        order={orderToRate}
      />
    </div>
  );
};

export default CustomerDashboardPage;
