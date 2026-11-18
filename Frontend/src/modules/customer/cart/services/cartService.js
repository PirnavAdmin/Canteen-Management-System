/**
 * Customer Cart Service
 * Manages active cart items in localStorage with outlet consistency guards.
 */

import { storageService } from '../../../../services/storageService';
import { CART_STORAGE_KEY, SELECTED_OUTLET_KEY, TAX_RATE, PACKAGING_FEE } from '../constants/cartConstants';

export const cartService = {
  getCartKey: (userId = 'guest') => {
    const cleanId = String(userId || 'guest').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_');
    return `${CART_STORAGE_KEY}_${cleanId}`;
  },

  getCart: (userId = 'guest') => {
    const key = cartService.getCartKey(userId);
    return storageService.getItem(key, []);
  },

  saveCart: (items, userId = 'guest') => {
    const key = cartService.getCartKey(userId);
    storageService.setItem(key, items);
    return items;
  },

  clearCart: (userId = 'guest') => {
    const key = cartService.getCartKey(userId);
    storageService.removeItem(key);
    return [];
  },

  getSelectedOutlet: () => {
    return storageService.getItem(SELECTED_OUTLET_KEY, {
      id: 'canteen-001',
      name: 'Central Dining Hall',
      campus: 'Main Campus',
      location: 'Ground Floor, Campus Central Building'
    });
  },

  setSelectedOutlet: (outlet) => {
    storageService.setItem(SELECTED_OUTLET_KEY, outlet);
    return outlet;
  },

  calculateTotals: (items) => {
    const safeItems = Array.isArray(items) ? items : [];
    const subtotal = safeItems.reduce((acc, item) => {
      const itemPrice = Number(item.price) || 0;
      const addOnsTotal = (item.selectedAddOns || []).reduce((a, addOn) => a + (Number(addOn.price) || 0), 0);
      return acc + (itemPrice + addOnsTotal) * (item.quantity || 1);
    }, 0);

    const taxAmount = Math.round(subtotal * TAX_RATE * 100) / 100;
    const packagingFee = subtotal > 200 || subtotal === 0 ? 0 : PACKAGING_FEE;
    const totalAmount = Math.round((subtotal + taxAmount + packagingFee) * 100) / 100;

    return {
      subtotal,
      taxAmount,
      packagingFee,
      totalAmount,
      itemCount: safeItems.reduce((acc, item) => acc + (item.quantity || 1), 0)
    };
  }
};

export default cartService;
