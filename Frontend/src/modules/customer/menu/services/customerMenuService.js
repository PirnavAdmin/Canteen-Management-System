/**
 * Customer Menu Service
 * Connects with outlet and menu data, filtering active and available food items.
 */

import { storageService } from '../../../../services/storageService';
import { CUSTOMER_FOOD_ITEMS, CUSTOMER_CATEGORIES } from '../constants/customerMenuConstants';
import { canteenService } from '../../../admin/outlets/services/canteenService';

const MENU_STORAGE_KEY = 'cms_customer_menu_items';

const FALLBACK_CANTEENS = [
  {
    id: 'canteen-001',
    name: 'Central Dining Hall',
    code: 'CDH-01',
    campus: 'Main Campus',
    location: 'Campus Central Building, Ground Floor',
    openingTime: '07:30',
    closingTime: '21:00',
    status: 'Active',
    isOrderAcceptanceEnabled: true
  },
  {
    id: 'canteen-002',
    name: 'North Campus Food Court',
    code: 'NCFC-02',
    campus: 'North Campus',
    location: 'Science Complex, 1st Floor',
    openingTime: '08:00',
    closingTime: '20:30',
    status: 'Active',
    isOrderAcceptanceEnabled: true
  },
  {
    id: 'canteen-003',
    name: 'Engineering Block Kiosk',
    code: 'EBK-03',
    campus: 'Engineering Block',
    location: 'Tech Tower Atrium',
    openingTime: '08:30',
    closingTime: '18:00',
    status: 'Active',
    isOrderAcceptanceEnabled: true
  }
];

export const customerMenuService = {
  getAllFoodItems: async () => {
    try {
      const saved = storageService.getItem(MENU_STORAGE_KEY, null);
      if (!saved || !Array.isArray(saved) || saved.length === 0) {
        storageService.setItem(MENU_STORAGE_KEY, CUSTOMER_FOOD_ITEMS);
        return Array.isArray(CUSTOMER_FOOD_ITEMS) ? [...CUSTOMER_FOOD_ITEMS] : [];
      }
      return Array.isArray(saved) ? saved : (Array.isArray(CUSTOMER_FOOD_ITEMS) ? [...CUSTOMER_FOOD_ITEMS] : []);
    } catch {
      return Array.isArray(CUSTOMER_FOOD_ITEMS) ? [...CUSTOMER_FOOD_ITEMS] : [];
    }
  },

  getCategories: () => {
    return Array.isArray(CUSTOMER_CATEGORIES) ? [...CUSTOMER_CATEGORIES] : [];
  },

  getActiveCanteens: async () => {
    try {
      const canteens = await canteenService.getAll();
      if (Array.isArray(canteens) && canteens.length > 0) {
        return canteens.filter(c => c && (c.status === 'Active' || !c.status));
      }
    } catch (err) {
      console.warn('Unable to load canteens from service, using fallback:', err);
    }
    return [...FALLBACK_CANTEENS];
  },

  getItemById: async (itemId) => {
    const allItems = await customerMenuService.getAllFoodItems();
    const safeItems = Array.isArray(allItems) ? allItems : [];
    return safeItems.find(i => i && (String(i.id) === String(itemId) || String(i.code) === String(itemId))) || null;
  },

  getFoodItemById: async (itemId) => {
    return await customerMenuService.getItemById(itemId);
  },

  getFeaturedItems: async (outletId = null) => {
    const all = await customerMenuService.getAllFoodItems();
    const safeItems = Array.isArray(all) ? all : [];
    return safeItems.filter(item => {
      if (!item) return false;
      const outletMatch = !outletId || outletId === 'ALL' || item.outletId === outletId;
      return outletMatch && item.isFeatured;
    });
  },

  getPopularItems: async (outletId = null) => {
    const all = await customerMenuService.getAllFoodItems();
    const safeItems = Array.isArray(all) ? all : [];
    return safeItems.filter(item => {
      if (!item) return false;
      const outletMatch = !outletId || outletId === 'ALL' || item.outletId === outletId;
      return outletMatch && item.isPopular;
    });
  }
};

export default customerMenuService;
