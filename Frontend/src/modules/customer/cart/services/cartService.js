/**
 * Customer Cart Service
 * Pure in-memory cart service with zero localStorage / sessionStorage dependencies.
 */

import { TAX_RATE, PACKAGING_FEE } from '../constants/cartConstants';

const inMemoryCarts = {};
let inMemorySelectedOutlet = null;

let activeSettings = {
  gstPercent: 5.0,
  packagingFee: 5.0,
  enablePackagingFee: true
};

export const cartService = {
  setSettings: (settings) => {
    if (!settings) return;
    const rules = settings.orderRules || settings.OrderRules || settings;
    const payments = settings.payments || settings.Payments || {};
    const gst = rules.gstPercent ?? payments.gstPercent ?? rules.GstPercent ?? payments.GstPercent ?? 5.0;
    const fee = rules.packagingFee ?? rules.PackagingFee ?? 5.0;
    const enable = rules.enablePackagingFee ?? rules.EnablePackagingFee ?? true;
    activeSettings = {
      gstPercent: Number(gst) >= 0 ? Number(gst) : 5.0,
      packagingFee: Number(fee) >= 0 ? Number(fee) : 5.0,
      enablePackagingFee: enable !== false
    };
  },

  getSettings: () => ({ ...activeSettings }),

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
    inMemorySelectedOutlet = outlet || null;
    return inMemorySelectedOutlet;
  },

  calculateTotals: (items, isDineIn = true) => {
    const safeItems = Array.isArray(items) ? items : [];
    const subtotal = safeItems.reduce((acc, item) => {
      let itemPrice = Number(item.price) || 0;
      const discount = Number(item.discountPercent || 0);
      if (discount > 0) {
        itemPrice = Math.round(itemPrice * (1 - discount / 100) * 100) / 100;
      }
      const addOnsTotal = (item.selectedAddOns || []).reduce((a, addOn) => a + (Number(addOn.price) || 0), 0);
      return acc + (itemPrice + addOnsTotal) * (item.quantity || 1);
    }, 0);

    const gstPercent = activeSettings.gstPercent !== undefined ? activeSettings.gstPercent : 5.0;
    const taxAmount = Math.round(subtotal * (gstPercent / 100) * 100) / 100;
    const packagingFee = isDineIn || !activeSettings.enablePackagingFee || subtotal === 0
      ? 0
      : activeSettings.packagingFee;
    const totalAmount = Math.round((subtotal + taxAmount + packagingFee) * 100) / 100;

    return {
      subtotal,
      taxAmount,
      packagingFee,
      totalAmount,
      gstPercent,
      isDineIn,
      configuredPackagingFee: activeSettings.packagingFee,
      enablePackagingFee: activeSettings.enablePackagingFee,
      itemCount: safeItems.reduce((acc, item) => acc + (item.quantity || 1), 0)
    };
  }
};

export default cartService;
