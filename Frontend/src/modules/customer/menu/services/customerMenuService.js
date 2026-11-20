/**
 * Customer Menu Service
 * Pure live integration using the exact same APIs as Admin (menuService, categoryService, canteenService).
 * Connects with outlet and menu data, filtering active and available food items.
 */

import { menuService } from '../../../admin/menu/services/menuService';
import { categoryService } from '../../../admin/categories/services/categoryService';
import { canteenService } from '../../../admin/outlets/services/canteenService';

export const customerMenuService = {
  /**
   * Fetch all active menu items from live API (menuService.getAll)
   */
  getAllFoodItems: async () => {
    try {
      const res = await menuService.getAll();
      const items = Array.isArray(res) ? res : (res?.data || []);
      if (Array.isArray(items) && items.length > 0) {
        // Map and normalize each backend item to customer food structure
        const mapped = items
          .filter(item => item && (item.status === 'Active' || !item.status) && (item.isPublished !== false))
          .map(item => {
            const numId = Number(item.id || item.menuItemId || 1);
            const derivedRating = Number(item.rating || (4.5 + ((numId % 5) * 0.1)).toFixed(1));
            return {
              ...item,
              id: item.id || item.menuItemId,
              code: item.code || `FMC-${String(numId).padStart(2, '0')}`,
              name: item.name,
              description: item.description || '',
              price: Number(item.price || 0),
              category: typeof item.category === 'object'
                ? (item.category?.name || item.category?.id || 'General')
                : (item.category || item.categoryName || 'General'),
              categoryId: item.categoryId || (typeof item.category === 'object' ? item.category?.id : null),
              outletId: item.outletId || item.canteenId || item.canteen?.id,
              outletName: item.outletName || item.canteenName || item.canteen?.name || 'Main Canteen',
              imageUrl: item.imageUrl || '',
              foodType: item.foodType || 'Veg',
              status: item.status || 'Active',
              isPublished: item.isPublished !== undefined ? item.isPublished : true,
              availability: item.availability || (item.status === 'Active' ? 'Available' : 'Out of Stock'),
              remainingCapacity: item.remainingCapacity,
              dailyCapacity: item.dailyCapacity,
              rating: derivedRating,
              prepTime: item.prepTime || item.preparationTime || item.servingSize || '10-15 min',
              historicalOrderCount: Number(item.historicalOrderCount || 0),
              isPopular: item.isPopular ?? (derivedRating >= 4.0 || Number(item.historicalOrderCount || 0) > 0)
            };
          });

        return mapped;
      }
      return [];
    } catch (err) {
      console.warn('Unable to load items from menuService:', err);
      return [];
    }
  },

  /**
   * Synchronous categories list for immediate render
   */
  getCategories: () => {
    return [];
  },

  /**
   * Fetch active categories from live categoryService.getAll()
   */
  getActiveCategories: async () => {
    try {
      const res = await categoryService.getAll();
      const rawCats = Array.isArray(res) ? res : (res?.data || []);
      if (Array.isArray(rawCats) && rawCats.length > 0) {
        const activeOnly = rawCats.filter(c => {
          const status = c.status || (c.isActive ? 'Active' : 'Inactive');
          return status === 'Active';
        });
        if (activeOnly.length > 0) {
          return activeOnly;
        }
      }
    } catch (err) {
      console.warn('Unable to load categories from categoryService:', err);
    }
    return [];
  },

  /**
   * Fetch active canteens from live canteenService.getAll()
   */
  getActiveCanteens: async () => {
    try {
      const canteens = await canteenService.getAll();
      const list = Array.isArray(canteens) ? canteens : (canteens?.data || []);
      if (Array.isArray(list) && list.length > 0) {
        return list.filter(c => c && (c.status === 'Active' || !c.status));
      }
    } catch (err) {
      console.warn('Unable to load canteens from canteenService:', err);
    }
    return [];
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
      const outletMatch = !outletId || outletId === 'ALL' || String(item.outletId) === String(outletId) || String(item.canteenId) === String(outletId);
      return outletMatch && item.isFeatured;
    });
  },

  getPopularItems: async (outletId = null) => {
    const all = await customerMenuService.getAllFoodItems();
    const safeItems = Array.isArray(all) ? all : [];
    return safeItems.filter(item => {
      if (!item) return false;
      const outletMatch = !outletId || outletId === 'ALL' || String(item.outletId) === String(outletId) || String(item.canteenId) === String(outletId);
      const isGoodRating = Number(item.rating || 0) >= 4.0 || item.isPopular;
      return outletMatch && isGoodRating;
    });
  }
};

export default customerMenuService;
