import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { cartService } from '../services/cartService';
import { useAuth } from '../../../../app/providers/AuthProvider';

export const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const userId = user?.userId
    ? String(user.userId)
    : (user?.username || user?.rollNo || user?.facultyId || user?.email || 'guest');

  const [cartItems, setCartItems] = useState(() => cartService.getCart(userId));
  const [selectedOutlet, setSelectedOutletState] = useState(() => cartService.getSelectedOutlet());
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Load live system settings for GST and packaging fee
  useEffect(() => {
    import('../../../admin/settings/services/settingsService')
      .then(m => m.settingsService.getSettings())
      .then(settings => {
        if (settings) {
          cartService.setSettings(settings);
          setCartItems(prev => [...prev]);
        }
      })
      .catch(() => {});
  }, []);

  // Sync / reload cart when the authenticated user changes (Student vs Faculty isolation)
  useEffect(() => {
    setCartItems(cartService.getCart(userId));
  }, [userId]);

  // Sync to local storage for the active authenticated user
  useEffect(() => {
    cartService.saveCart(cartItems, userId);
  }, [cartItems, userId]);

  const setSelectedOutlet = useCallback((outlet) => {
    setSelectedOutletState(outlet);
    cartService.setSelectedOutlet(outlet);
  }, []);

  const addToCart = useCallback((item, quantity = 1, variant = null, selectedAddOns = []) => {
    setCartItems(prev => {
      // Build unique composite key for item + variant + addons
      const cartKey = `${item.id}-${variant?.id || 'std'}-${(selectedAddOns || []).map(a => a.id).sort().join('-')}`;
      
      const existingIdx = prev.findIndex(ci => ci.cartKey === cartKey);
      if (existingIdx > -1) {
        const updated = [...prev];
        const newQty = updated[existingIdx].quantity + quantity;
        updated[existingIdx] = {
          ...updated[existingIdx],
          quantity: newQty
        };
        return updated;
      }

      const discount = Number(item.discountPercent || 0);
      let effectivePrice = variant?.price ? Number(variant.price) : Number(item.price);
      if (discount > 0 && !variant?.price) {
        effectivePrice = Math.round(effectivePrice * (1 - discount / 100) * 100) / 100;
      }

      const newItem = {
        cartKey,
        id: item.id,
        code: item.code || '',
        name: item.name,
        foodType: item.foodType || 'Veg',
        price: effectivePrice,
        basePrice: Number(item.price),
        discountPercent: discount,
        imageUrl: item.imageUrl,
        category: item.category,
        outletId: item.outletId || selectedOutlet?.id || 'canteen-001',
        outletName: item.outletName || selectedOutlet?.name || 'Central Dining Hall',
        quantity,
        variant,
        selectedAddOns,
        servingSize: item.servingSize || '1 Serving'
      };

      return [...prev, newItem];
    });
  }, [selectedOutlet]);

  const updateQuantity = useCallback((cartKey, newQuantity) => {
    if (newQuantity <= 0) {
      setCartItems(prev => prev.filter(ci => ci.cartKey !== cartKey));
      return;
    }
    setCartItems(prev => prev.map(ci => ci.cartKey === cartKey ? { ...ci, quantity: newQuantity } : ci));
  }, []);

  const removeFromCart = useCallback((cartKey) => {
    setCartItems(prev => prev.filter(ci => ci.cartKey !== cartKey));
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
    cartService.clearCart(userId);
  }, [userId]);

  const totals = useMemo(() => {
    return cartService.calculateTotals(cartItems);
  }, [cartItems]);

  const value = useMemo(() => ({
    cartItems,
    selectedOutlet,
    setSelectedOutlet,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    isDrawerOpen,
    setIsDrawerOpen,
    ...totals
  }), [cartItems, selectedOutlet, setSelectedOutlet, addToCart, updateQuantity, removeFromCart, clearCart, isDrawerOpen, totals]);

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export default CartContext;
