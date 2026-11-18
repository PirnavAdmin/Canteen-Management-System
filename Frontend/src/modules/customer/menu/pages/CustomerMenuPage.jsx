import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useCustomerMenu } from '../hooks/useCustomerMenu';
import { useCart } from '../../cart/hooks/useCart';
import { FoodItemCard } from '../components/FoodItemCard';
import { PageHeader } from '../../../../components/common/PageHeader';
import { Card } from '../../../../components/common/Card';
import { Button } from '../../../../components/common/Button';
import {
  UtensilsCrossed,
  Search,
  ShoppingCart,
  Store,
  MapPin,
  Clock,
  RotateCcw
} from 'lucide-react';

export const CustomerMenuPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const searchParam = searchParams.get('search') || '';
  const outletParam = searchParams.get('outlet') || null;
  const categoryParam = searchParams.get('category') || null;

  const {
    canteens = [],
    selectedOutlet,
    setSelectedOutlet,
    categories = [],
    selectedCategory,
    setSelectedCategory,
    selectedFoodType,
    setSelectedFoodType,
    searchQuery,
    setSearchQuery,
    filteredItems = [],
    foodItems = [],
    loading = false
  } = useCustomerMenu(outletParam);

  const { itemCount, totalAmount } = useCart();
  const [activeTab, setActiveTab] = useState(categoryParam || 'ALL');

  useEffect(() => {
    if (categoryParam) {
      setSelectedCategory(categoryParam);
      setActiveTab(categoryParam);
    }
  }, [categoryParam, setSelectedCategory]);

  // Resilient array resolution ensuring .length and .map() never throw on undefined
  const displayItems = useMemo(() => {
    if (Array.isArray(filteredItems)) return filteredItems;
    if (Array.isArray(foodItems)) return foodItems;
    return [];
  }, [filteredItems, foodItems]);

  // Normalize category objects cleanly so they are safe from object-as-React-child crashes
  const categoryList = useMemo(() => {
    const list = Array.isArray(categories) ? categories : [];
    const normalized = list.map(c => {
      if (typeof c === 'string') return { id: c, name: c };
      return { id: c?.id || c?.name || 'ALL', name: c?.name || c?.id || 'Category' };
    });

    if (!normalized.some(c => c.id === 'ALL')) {
      return [{ id: 'ALL', name: 'All Categories' }, ...normalized];
    }
    return normalized;
  }, [categories]);

  const handleCategorySelect = (categoryId) => {
    const id = typeof categoryId === 'object' ? (categoryId?.id || 'ALL') : categoryId;
    setSelectedCategory(id);
    setActiveTab(id);
  };

  const handleResetFilters = () => {
    setSelectedCategory('ALL');
    setSelectedFoodType('ALL');
    setSearchQuery('');
    setActiveTab('ALL');
  };

  return (
    <div>
      {/* Admin-standard PageHeader */}
      <PageHeader
        title="Campus Canteen Menus"
        description="Freshly prepared breakfast, executive meals, fast bites and hot beverages across all campus food counters."
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Canteen Selector Dropdown */}
            <div style={{ position: 'relative' }}>
              <select
                value={selectedOutlet ? selectedOutlet.id : 'ALL'}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === 'ALL') {
                    setSelectedOutlet({ id: 'ALL', name: 'All Campus Canteens' });
                  } else {
                    const match = canteens.find(c => c.id === val);
                    if (match) setSelectedOutlet(match);
                  }
                }}
                style={{
                  height: '38px',
                  padding: '0 12px 0 32px',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: 'var(--text-primary)',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--border-radius-md)',
                  cursor: 'pointer'
                }}
              >
                <option value="ALL">All Campus Dining Halls</option>
                {canteens.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <Store
                size={14}
                style={{
                  position: 'absolute',
                  left: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                  pointerEvents: 'none'
                }}
              />
            </div>

            {/* View Cart Button */}
            <Button
              variant="primary"
              icon={ShoppingCart}
              onClick={() => navigate('/customer/cart')}
            >
              My Cart ({itemCount}) • ₹{totalAmount.toFixed(2)}
            </Button>
          </div>
        }
      />

      {/* Selected Canteen Info Banner (if specific outlet is active) */}
      {selectedOutlet && selectedOutlet.id !== 'ALL' && (
        <div style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--border-radius-lg)',
          padding: '14px 20px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--border-radius-md)',
              backgroundColor: 'var(--color-primary-light)',
              color: 'var(--color-accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Store size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                {selectedOutlet.name}
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '2px', fontSize: '12px', color: 'var(--text-muted)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <MapPin size={12} />
                  {selectedOutlet.location}
                </span>
                <span>•</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={12} />
                  {selectedOutlet.openingTime} - {selectedOutlet.closingTime}
                </span>
              </div>
            </div>
          </div>

          <span style={{
            fontSize: '11.5px',
            fontWeight: 600,
            color: 'var(--color-success-text)',
            backgroundColor: 'var(--color-success-bg)',
            padding: '3px 10px',
            borderRadius: 'var(--border-radius-full)'
          }}>
            Accepting Orders
          </span>
        </div>
      )}

      {/* Filter and Search Card */}
      <Card padding="16px" style={{ marginBottom: '24px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          {/* Search Box */}
          <div style={{
            position: 'relative',
            flex: 1,
            minWidth: '240px',
            maxWidth: '400px'
          }}>
            <Search
              size={15}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)'
              }}
            />
            <input
              type="text"
              value={searchQuery || searchParam}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search dishes (e.g. Masala Dosa, Veg Thali, Coffee)..."
              style={{
                width: '100%',
                height: '38px',
                padding: '0 12px 0 36px',
                fontSize: '13px',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--border-radius-md)',
                backgroundColor: 'var(--bg-app)',
                color: 'var(--text-primary)',
                outline: 'none'
              }}
            />
          </div>

          {/* Dietary Filter Buttons (All, Veg, Non-Veg) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', marginRight: '4px' }}>Diet:</span>
            {['ALL', 'Veg', 'Non-veg'].map((diet) => (
              <button
                key={diet}
                type="button"
                onClick={() => setSelectedFoodType(diet)}
                style={{
                  padding: '5px 12px',
                  fontSize: '12px',
                  fontWeight: 600,
                  borderRadius: 'var(--border-radius-full)',
                  border: '1px solid',
                  borderColor: selectedFoodType === diet ? 'var(--color-accent)' : 'var(--border-color)',
                  backgroundColor: selectedFoodType === diet ? 'var(--color-primary-light)' : 'var(--bg-surface)',
                  color: selectedFoodType === diet ? 'var(--color-accent)' : 'var(--text-secondary)',
                  cursor: 'pointer'
                }}
              >
                {diet === 'Veg' ? '● Veg Only' : diet === 'Non-veg' ? '▲ Non-Veg' : 'All'}
              </button>
            ))}

            {(searchQuery || selectedCategory !== 'ALL' || selectedFoodType !== 'ALL') && (
              <Button
                variant="secondary"
                icon={RotateCcw}
                onClick={handleResetFilters}
                style={{ padding: '5px 10px', fontSize: '12px', marginLeft: '6px' }}
              >
                Reset
              </Button>
            )}
          </div>
        </div>

        {/* Category Pills Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          overflowX: 'auto',
          paddingTop: '14px',
          marginTop: '14px',
          borderTop: '1px solid var(--border-color-subtle)'
        }}>
          {categoryList.map((cat) => {
            const isSelected = selectedCategory === cat.id;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategorySelect(cat.id)}
                style={{
                  padding: '6px 14px',
                  fontSize: '12.5px',
                  fontWeight: isSelected ? 700 : 500,
                  borderRadius: 'var(--border-radius-md)',
                  border: '1px solid',
                  borderColor: isSelected ? 'var(--color-accent)' : 'var(--border-color)',
                  backgroundColor: isSelected ? 'var(--color-accent)' : 'var(--bg-surface)',
                  color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all var(--transition-fast)'
                }}
              >
                {cat.id === 'ALL' ? '🍽️ All Categories' : cat.name}
              </button>
            );
          })}
        </div>
      </Card>

      {/* Food Grid / Results */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)' }}>
          <p>Loading campus menu items...</p>
        </div>
      ) : displayItems.length === 0 ? (
        <Card padding="40px" style={{ textAlign: 'center' }}>
          <UtensilsCrossed size={36} style={{ color: 'var(--text-muted)', margin: '0 auto 12px auto' }} />
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
            No Food Items Match Your Filters
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Try clearing your search query or selecting a different food category.
          </p>
          <Button
            variant="secondary"
            onClick={handleResetFilters}
            style={{ marginTop: '14px' }}
          >
            Clear Filters
          </Button>
        </Card>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))',
          gap: '20px'
        }}>
          {displayItems.map((item) => (
            <FoodItemCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomerMenuPage;
