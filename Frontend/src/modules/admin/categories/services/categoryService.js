import { INITIAL_CATEGORIES } from '../constants/categoryConstants';
import { storageService } from '../../../../services/storageService';
import { apiClient, API_ENDPOINTS } from '../../../../services/api';

const STORAGE_KEY = 'cms_canteen_management_categories';

export const categoryService = {
  getAll: async () => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.CATEGORIES.BASE);
      const data = response?.data || response;
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    } catch (err) {
      console.warn('Backend Categories API unavailable, falling back to local storage:', err.message);
    }

    const saved = storageService.getItem(STORAGE_KEY, null);
    if (!saved) {
      storageService.setItem(STORAGE_KEY, INITIAL_CATEGORIES);
      return [...INITIAL_CATEGORIES];
    }
    return saved;
  },

  getById: async (id) => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.CATEGORIES.BY_ID(id));
      return response?.data || response;
    } catch {
      const categories = await categoryService.getAll();
      return categories.find(c => c.id === id || c.id === Number(id)) || null;
    }
  },

  create: async (data) => {
    try {
      const response = await apiClient.post(API_ENDPOINTS.CATEGORIES.BASE, {
        name: data.name,
        description: data.description,
        displayOrder: Number(data.displayOrder) || 1,
        status: data.status || 'Active'
      });
      return response?.data || response;
    } catch {
      const categories = await categoryService.getAll();
      const newCategory = {
        ...data,
        id: `cat-${Date.now()}`,
        institutionId: 1,
        displayOrder: Number(data.displayOrder),
        linkedItemCount: 0,
        historicalOrderCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      const updated = [...categories, newCategory];
      storageService.setItem(STORAGE_KEY, updated);
      return newCategory;
    }
  },

  update: async (id, data) => {
    try {
      const response = await apiClient.put(API_ENDPOINTS.CATEGORIES.BY_ID(id), {
        name: data.name,
        description: data.description,
        displayOrder: Number(data.displayOrder) || 1,
        status: data.status || 'Active'
      });
      return response?.data || response;
    } catch {
      const categories = await categoryService.getAll();
      const index = categories.findIndex(c => c.id === id || c.id === Number(id));
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
    }
  },

  toggleStatus: async (id) => {
    try {
      const response = await apiClient.patch(API_ENDPOINTS.CATEGORIES.TOGGLE_STATUS(id));
      return response?.data || response;
    } catch {
      const categories = await categoryService.getAll();
      const index = categories.findIndex(c => c.id === id || c.id === Number(id));
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
    }
  },

  /**
   * Attempt deletion with SRS Section 3.2 business rule enforcement
   */
  deleteCategory: async (id) => {
    try {
      await apiClient.delete(API_ENDPOINTS.CATEGORIES.BY_ID(id));
      return { success: true, blockedByPolicy: false };
    } catch (err) {
      if (err.status === 409 || err.raw?.response?.status === 409) {
        return {
          success: false,
          blockedByPolicy: true,
          reason: err.message || 'Institutional Policy Violation (SRS §3.2): Category cannot be deleted because dependent items or orders exist.'
        };
      }

      const categories = await categoryService.getAll();
      const target = categories.find(c => c.id === id || c.id === Number(id));
      if (!target) throw new Error(`Category with ID ${id} not found.`);

      if ((target.linkedItemCount && target.linkedItemCount > 0) ||
        (target.historicalOrderCount && target.historicalOrderCount > 0)) {
        return {
          success: false,
          blockedByPolicy: true,
          reason: `Institutional Policy Violation (SRS §3.2): Category '${target.name}' cannot be permanently deleted because dependent records exist. Please deactivate instead.`
        };
      }

      const filtered = categories.filter(c => c.id !== id && c.id !== Number(id));
      storageService.setItem(STORAGE_KEY, filtered);
      return { success: true, blockedByPolicy: false };
    }
  },

  resetDefaults: async () => {
    storageService.setItem(STORAGE_KEY, INITIAL_CATEGORIES);
    return [...INITIAL_CATEGORIES];
  }
};

export default categoryService;
