import { INITIAL_CATEGORIES } from '../constants/categoryConstants';
import { storageService } from '../../../services/storageService';

const STORAGE_KEY = 'cms_canteen_management_categories';

export const categoryService = {
  getAll: async () => {
    const saved = storageService.getItem(STORAGE_KEY, null);
    if (!saved) {
      storageService.setItem(STORAGE_KEY, INITIAL_CATEGORIES);
      return [...INITIAL_CATEGORIES];
    }
    return saved;
  },

  getById: async (id) => {
    const categories = await categoryService.getAll();
    return categories.find(c => c.id === id) || null;
  },

  create: async (data) => {
    const categories = await categoryService.getAll();
    const newCategory = {
      ...data,
      id: `cat-${Date.now()}`,
      institutionId: 'INST-APEX-01',
      displayOrder: Number(data.displayOrder),
      linkedItemCount: 0,
      historicalOrderCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const updated = [...categories, newCategory];
    storageService.setItem(STORAGE_KEY, updated);
    return newCategory;
  },

  update: async (id, data) => {
    const categories = await categoryService.getAll();
    const index = categories.findIndex(c => c.id === id);
    if (index === -1) throw new Error(`Category with ID ${id} not found.`);

    const updatedCategory = {
      ...categories[index],
      ...data,
      displayOrder: Number(data.displayOrder),
      updatedAt: new Date().toISOString()
    };
    categories[index] = updatedCategory;
    storageService.setItem(STORAGE_KEY, [...categories]);
    return updatedCategory;
  },

  toggleStatus: async (id) => {
    const categories = await categoryService.getAll();
    const index = categories.findIndex(c => c.id === id);
    if (index === -1) throw new Error(`Category with ID ${id} not found.`);

    const currentStatus = categories[index].status;
    const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';

    categories[index] = {
      ...categories[index],
      status: newStatus,
      updatedAt: new Date().toISOString()
    };
    storageService.setItem(STORAGE_KEY, [...categories]);
    return categories[index];
  },

  /**
   * Attempt deletion with SRS Section 3.2 business rule enforcement:
   * "Prevent deletion where historical food/order records depend on the category; use inactive status instead."
   */
  deleteCategory: async (id) => {
    const categories = await categoryService.getAll();
    const target = categories.find(c => c.id === id);
    if (!target) throw new Error(`Category with ID ${id} not found.`);

    // Check for historical dependencies
    if ((target.linkedItemCount && target.linkedItemCount > 0) || 
        (target.historicalOrderCount && target.historicalOrderCount > 0)) {
      return {
        success: false,
        blockedByPolicy: true,
        reason: `Institutional Policy Violation (SRS §3.2): Category '${target.name}' cannot be permanently deleted because it has ${target.linkedItemCount || 0} menu items and ${target.historicalOrderCount || 0} historical order records depending on it. Please deactivate the category instead.`
      };
    }

    const filtered = categories.filter(c => c.id !== id);
    storageService.setItem(STORAGE_KEY, filtered);
    return {
      success: true,
      blockedByPolicy: false
    };
  },

  resetDefaults: async () => {
    storageService.setItem(STORAGE_KEY, INITIAL_CATEGORIES);
    return [...INITIAL_CATEGORIES];
  }
};

