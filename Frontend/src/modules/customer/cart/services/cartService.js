/**
 * Customer Cart Service
 * Pure in-memory cart service with zero localStorage / sessionStorage dependencies.
 */

import { TAX_RATE, PACKAGING_FEE } from '../constants/cartConstants';

const inMemoryCarts = {};
let inMemorySelectedOutlet = {
  id: 'ALL',
  name: 'All Campus Dining Halls'
};

export const cartService = {
  getCart: (userId = 'guest') => {
    const cleanId = String(userId || 'guest').trim().toLowerCase();
    return Array.isArray(inMemoryCarts[cleanId]) ? [...inMemoryCarts[cleanId]] : [];
  },

  saveCart: (items, userId = 'guest') => {
    const cleanId = String(userId || 'guest').trim().toLowerCase();
    inMemoryCarts[cleanId] = Array.isArray(items) ? [...items] : [];
    return inMemoryCarts[cleanId];
  },

  clearCart: (userId = 'guest') => {
    const cleanId = String(userId || 'guest').trim().toLowerCase();
    inMemoryCarts[cleanId] = [];
    return [];
  },

  getSelectedOutlet: () => {
    return inMemorySelectedOutlet;
  },

  setSelectedOutlet: (outlet) => {
    inMemorySelectedOutlet = outlet || { id: 'ALL', name: 'All Campus Dining Halls' };
    return inMemorySelectedOutlet;
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
