import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, ShoppingBag, Filter, ArrowUpDown, Store, RefreshCw, AlertCircle } from 'lucide-react';
import { menuService } from '../../menu/services/menuService';
import { categoryService } from '../../categories/services/categoryService';
import { canteenService } from '../../outlets/services/canteenService';
import { useCanteens } from '../../outlets/hooks/useCanteens';
import { ProductCard } from './ProductCard';
import { CartDrawer } from './CartDrawer';
import { formatCurrency } from '../../../../utils/formatters';
import { useToast } from '../../../../app/providers/ToastProvider';

export const PlaceOrderCatalog = ({ onOrderPlaced }) => {
  const { error: toastError } = useToast();
  const { selectedOutlet: globalOutlet, setSelectedOutlet: setGlobalOutlet } = useCanteens();

  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [outlets, setOutlets] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Sorting
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedOutlet, setSelectedOutlet] = useState(globalOutlet || 'ALL');
  const [sortBy, setSortBy] = useState('popular');

  useEffect(() => {
    setSelectedOutlet(globalOutlet || 'ALL');
  }, [globalOutlet]);

  // Cart state: { [itemId]: { item, quantity } }
  const [cart, setCart] = useState({});
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Load initial data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [menuRes, catRes, outRes] = await Promise.all([
        menuService.getAll().catch(() => []),
        categoryService.getAll().catch(() => []),
        canteenService.getAll().catch(() => [])
      ]);

      const items = Array.isArray(menuRes) ? menuRes : (menuRes?.data || []);
      // Filter out permanently deleted / disabled items if any, keep active or published items
      setMenuItems(items);

      const rawCats = Array.isArray(catRes) ? catRes : (catRes?.data || []);
      // Only keep active categories as requested in previous guidelines
      const activeCats = rawCats.filter(c => {
        const status = c.status || (c.isActive ? 'Active' : 'Inactive');
        return status === 'Active';
      });
      setCategories(activeCats);

      const outs = Array.isArray(outRes) ? outRes : (outRes?.data || []);
      setOutlets(outs);
    } catch (err) {
      console.error('Failed to load menu catalog data:', err);
      toastError('Catalog Error', 'Could not load menu catalog.');
    } finally {
      setLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Cart operations
  const handleAddToCart = (item) => {
    setCart(prev => {
      const current = prev[item.id] ? prev[item.id].quantity : 0;
      return {
        ...prev,
        [item.id]: {
          item,
          quantity: current + 1
        }
      };
    });
  };

  const handleRemoveFromCart = (itemId) => {
    setCart(prev => {
      const current = prev[itemId] ? prev[itemId].quantity : 0;
      if (current <= 1) {
        const copy = { ...prev };
        delete copy[itemId];
        return copy;
      }
      return {
        ...prev,
        [itemId]: {
          ...prev[itemId],
          quantity: current - 1
        }
      };
    });
  };

  const handleUpdateQuantity = (itemId, newQty) => {
    setCart(prev => {
      if (newQty <= 0) {
        const copy = { ...prev };
        delete copy[itemId];
        return copy;
      }
      if (!prev[itemId]) return prev;
      return {
        ...prev,
        [itemId]: {
          ...prev[itemId],
          quantity: newQty
        }
      };
    });
  };

  const handleClearCart = () => {
    setCart({});
  };

  // Cart calculations
  const totalCartCount = useMemo(() => {
    return Object.values(cart).reduce((acc, entry) => acc + (entry?.quantity || 0), 0);
  }, [cart]);

  const cartSubtotal = useMemo(() => {
    return Object.values(cart).reduce((acc, entry) => {
      const price = Number(entry?.item?.price || 0);
      return acc + (price * (entry?.quantity || 0));
    }, 0);
  }, [cart]);

  // Filtered & Sorted items
  const filteredItems = useMemo(() => {
    let result = [...menuItems];

    // Search filter
    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      result = result.filter(item =>
        (item.name && item.name.toLowerCase().includes(q)) ||
        (item.code && item.code.toLowerCase().includes(q)) ||
        (item.category && item.category.toLowerCase().includes(q)) ||
        (item.description && item.description.toLowerCase().includes(q))
      );
    }

    // Category filter
    if (selectedCategory !== 'ALL') {
      result = result.filter(item =>
        item.category === selectedCategory ||
        String(item.categoryId) === String(selectedCategory)
      );
    }

    // Outlet filter
    if (selectedOutlet !== 'ALL') {
      result = result.filter(item =>
        String(item.outletId) === String(selectedOutlet)
      );
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'price-asc') return Number(a.price || 0) - Number(b.price || 0);
      if (sortBy === 'price-desc') return Number(b.price || 0) - Number(a.price || 0);
      if (sortBy === 'name-asc') return (a.name || '').localeCompare(b.name || '');
      // 'popular' default
      const ordersA = Number(a.historicalOrderCount || 0);
      const ordersB = Number(b.historicalOrderCount || 0);
      if (ordersB !== ordersA) return ordersB - ordersA;
      return Number(a.id || 0) - Number(b.id || 0);
    });

    return result;
  }, [menuItems, searchTerm, selectedCategory, selectedOutlet, sortBy]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Top Filter and Search Bar */}
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          padding: '12px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          boxShadow: 'var(--shadow-xs)'
        }}
      >
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Search Input */}
          <div style={{ position: 'relative', flex: '1 1 240px' }}>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search dishes, snacks, beverages..."
              style={{
                width: '100%',
                height: '38px',
                padding: '0 12px 0 34px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-app)',
                color: 'var(--text-primary)',
                fontSize: '13px',
                outline: 'none'
              }}
            />
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-placeholder)',
                pointerEvents: 'none'
              }}
            />
          </div>

          {/* Outlet Selector Filter */}
          <div style={{ minWidth: '160px', flex: '0 1 200px' }}>
            <select
              value={selectedOutlet}
              onChange={(e) => {
                setSelectedOutlet(e.target.value);
                setGlobalOutlet(e.target.value);
              }}
              style={{
                width: '100%',
                height: '38px',
                padding: '0 10px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-app)',
                color: 'var(--text-primary)',
                fontSize: '13px',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="ALL">All Outlets</option>
              {outlets.map(o => (
                <option key={o.outletId || o.id} value={o.outletId || o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By Dropdown */}
          <div style={{ minWidth: '160px', flex: '0 1 180px' }}>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                width: '100%',
                height: '38px',
                padding: '0 10px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-app)',
                color: 'var(--text-primary)',
                fontSize: '13px',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="popular">Sort by: Popular</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="name-asc">Name: A to Z</option>
            </select>
          </div>

          {/* Cart Trigger Button in Header */}
          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            style={{
              height: '38px',
              padding: '0 16px',
              borderRadius: '8px',
              backgroundColor: totalCartCount > 0 ? 'var(--color-primary)' : 'var(--bg-app)',
              color: totalCartCount > 0 ? '#ffffff' : 'var(--text-primary)',
              border: totalCartCount > 0 ? 'none' : '1px solid var(--border-color)',
              fontWeight: 600,
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              marginLeft: 'auto',
              boxShadow: totalCartCount > 0 ? '0 2px 6px rgba(30, 58, 138, 0.25)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <ShoppingBag size={16} />
            <span>Cart</span>
            {totalCartCount > 0 && (
              <span
                style={{
                  backgroundColor: '#f59e0b',
                  color: '#ffffff',
                  padding: '1px 6px',
                  borderRadius: '9999px',
                  fontSize: '11px',
                  fontWeight: 700
                }}
              >
                {totalCartCount}
              </span>
            )}
          </button>
        </div>

        {/* Category Pills Bar */}
        <div
          className="no-scrollbar"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            overflowX: 'auto',
            paddingBottom: '2px',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}
        >
          <button
            type="button"
            onClick={() => setSelectedCategory('ALL')}
            style={{
              padding: '6px 14px',
              borderRadius: '9999px',
              fontSize: '12px',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              border: selectedCategory === 'ALL' ? 'none' : '1px solid var(--border-color)',
              backgroundColor: selectedCategory === 'ALL' ? 'var(--color-primary)' : 'var(--bg-app)',
              color: selectedCategory === 'ALL' ? '#ffffff' : 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            All Items ({menuItems.length})
          </button>

          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.name || String(selectedCategory) === String(cat.id);
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(isSelected ? 'ALL' : cat.name)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '9999px',
                  fontSize: '12px',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  border: isSelected ? 'none' : '1px solid var(--border-color)',
                  backgroundColor: isSelected ? 'var(--color-primary)' : 'var(--bg-app)',
                  color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {cat.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Meta Bar: Total Count */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px' }}>
        <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
          {filteredItems.length} {filteredItems.length === 1 ? 'Menu Item' : 'Menu Items'} Available
        </div>
      </div>

      {/* Food Product Cards Grid */}
      {loading ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '260px',
            backgroundColor: 'var(--bg-surface)',
            borderRadius: '16px',
            border: '1px solid var(--border-color)'
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
            <RefreshCw size={24} className="spin" />
            <span style={{ fontSize: '13px' }}>Loading menu catalog...</span>
          </div>
        </div>
      ) : filteredItems.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '48px 20px',
            backgroundColor: 'var(--bg-surface)',
            borderRadius: '16px',
            border: '1px solid var(--border-color)'
          }}
        >
          <AlertCircle size={40} style={{ margin: '0 auto 12px', color: 'var(--text-placeholder)' }} />
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px 0' }}>
            No food items found
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 16px 0' }}>
            No active menu items match your search or category filter.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('ALL');
              setSelectedOutlet('ALL');
            }}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              backgroundColor: 'var(--color-primary-light)',
              color: 'var(--color-primary)',
              border: '1px solid var(--color-primary-border)',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
            gap: '16px'
          }}
        >
          {filteredItems.map((item) => (
            <ProductCard
              key={item.id}
              item={item}
              quantity={cart[item.id]?.quantity || 0}
              onAdd={() => handleAddToCart(item)}
              onRemove={() => handleRemoveFromCart(item.id)}
            />
          ))}
        </div>
      )}

      {/* Floating Bottom Cart Bar when items are selected */}
      {totalCartCount > 0 && !isCartOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 900,
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            padding: '10px 18px',
            borderRadius: '9999px',
            backgroundColor: 'var(--color-primary)',
            color: '#ffffff',
            boxShadow: '0 10px 25px -5px rgba(30, 58, 138, 0.4), 0 8px 10px -6px rgba(30, 58, 138, 0.2)',
            animation: 'fadeInUp 0.2s ease-out'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                backgroundColor: '#f59e0b',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 700
              }}
            >
              {totalCartCount}
            </span>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>
              {totalCartCount === 1 ? '1 item' : `${totalCartCount} items`}
            </span>
            <span style={{ opacity: 0.6 }}>•</span>
            <span style={{ fontSize: '14px', fontWeight: 700 }}>
              {formatCurrency(cartSubtotal * 1.05)}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            style={{
              padding: '6px 16px',
              borderRadius: '9999px',
              backgroundColor: '#ffffff',
              color: 'var(--color-primary)',
              border: 'none',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
            }}
          >
            View Cart & Checkout
          </button>
        </div>
      )}

      {/* Cart Drawer Modal */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onClearCart={handleClearCart}
        outlets={outlets}
        selectedOutletId={selectedOutlet !== 'ALL' ? Number(selectedOutlet) : undefined}
        onOutletChange={(id) => setSelectedOutlet(String(id))}
        onOrderSuccess={(createdOrder) => {
          if (onOrderPlaced) onOrderPlaced(createdOrder);
        }}
      />
    </div>
  );
};

export default PlaceOrderCatalog;