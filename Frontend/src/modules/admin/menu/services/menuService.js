/**
 * Menu API Service
 */

import { apiClient, API_ENDPOINTS } from '../../../../services/api';
import { storageService } from '../../../../services/storageService';
import { INITIAL_MENU_ITEMS } from '../constants/menuConstants';

const STORAGE_KEY = 'cms_canteen_management_menu_items';

export const menuService = {
  getAll: async (params = {}) => {
    try {
      const data = await apiClient.get(API_ENDPOINTS.MENU.BASE, params);
      return data;
    } catch {
      const saved = storageService.getItem(STORAGE_KEY, null);
      if (!saved) {
        storageService.setItem(STORAGE_KEY, INITIAL_MENU_ITEMS);
        return [...INITIAL_MENU_ITEMS];
      }
      return saved;
    }
  },

  getById: async (id) => {
    try {
      return await apiClient.get(API_ENDPOINTS.MENU.BY_ID(id));
    } catch {
      const items = await menuService.getAll();
      return items.find(i => i.id === id) || null;
    }
  },

  create: async (data) => {
    // Basic validation
    if (!data.name || !data.price || Number(data.price) <= 0) {
      throw new Error('Valid menu item name and positive price are required.');
    }
    if (!data.dailyCapacity || Number(data.dailyCapacity) <= 0) {
      throw new Error('Daily capacity must be a positive integer.');
    }

    try {
      return await apiClient.post(API_ENDPOINTS.MENU.BASE, data);
    } catch {
      const items = await menuService.getAll();
      // Check duplicate code
      if (data.code && items.some(i => i.code?.toUpperCase() === data.code?.trim().toUpperCase())) {
        throw new Error(`Item code "${data.code}" already exists in menu registry.`);
      }

      const newItem = {
        ...data,
        id: `menu-${Date.now()}`,
        code: data.code?.trim().toUpperCase() || `ITM-${Math.floor(100 + Math.random() * 900)}`,
        price: Number(data.price),
        dailyCapacity: Number(data.dailyCapacity),
        remainingCapacity: Number(data.dailyCapacity),
        availability: data.availability || 'Available',
        status: data.status || 'Active',
        publicationStatus: data.publicationStatus || 'Published',
        historicalOrderCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const updated = [newItem, ...items];
      storageService.setItem(STORAGE_KEY, updated);
      return newItem;
    }
  },

  update: async (id, data) => {
    if (!data.name || !data.price || Number(data.price) <= 0) {
      throw new Error('Valid menu item name and positive price are required.');
    }

    try {
      return await apiClient.put(API_ENDPOINTS.MENU.BY_ID(id), data);
    } catch {
      const items = await menuService.getAll();
      const idx = items.findIndex(i => i.id === id);
      if (idx === -1) throw new Error(`Menu item with ID ${id} not found.`);

      const updatedItem = {
        ...items[idx],
        ...data,
        price: Number(data.price),
        dailyCapacity: Number(data.dailyCapacity || items[idx].dailyCapacity),
        updatedAt: new Date().toISOString()
      };

      items[idx] = updatedItem;
      storageService.setItem(STORAGE_KEY, [...items]);
      return updatedItem;
    }
  },

  toggleStatus: async (id) => {
    try {
      return await apiClient.patch(API_ENDPOINTS.MENU.TOGGLE_STATUS(id));
    } catch {
      const items = await menuService.getAll();
      const idx = items.findIndex(i => i.id === id);
      if (idx === -1) throw new Error(`Menu item with ID ${id} not found.`);

      const newStatus = items[idx].status === 'Active' ? 'Inactive' : 'Active';
      items[idx] = {
        ...items[idx],
        status: newStatus,
        availability: newStatus === 'Active' ? 'Available' : 'Unavailable',
        updatedAt: new Date().toISOString()
      };

      storageService.setItem(STORAGE_KEY, [...items]);
      return items[idx];
    }
  },

  togglePublish: async (id) => {
    try {
      return await apiClient.patch(API_ENDPOINTS.MENU.TOGGLE_PUBLISH(id));
    } catch {
      const items = await menuService.getAll();
      const idx = items.findIndex(i => i.id === id);
      if (idx === -1) throw new Error(`Menu item with ID ${id} not found.`);

      const newPubStatus = items[idx].publicationStatus === 'Published' ? 'Draft' : 'Published';
      items[idx] = {
        ...items[idx],
        publicationStatus: newPubStatus,
        updatedAt: new Date().toISOString()
      };

      storageService.setItem(STORAGE_KEY, [...items]);
      return items[idx];
    }
  },

  deleteItem: async (id) => {
    const items = await menuService.getAll();
    const target = items.find(i => i.id === id);
    if (!target) throw new Error(`Menu item with ID ${id} not found.`);

    // Institutional business rule: Preserve historical order references!
    if (target.historicalOrderCount && target.historicalOrderCount > 0) {
      return {
        success: false,
        blockedByPolicy: true,
        reason: `Institutional Policy Violation: Menu item "${target.name}" (${target.code}) has ${target.historicalOrderCount} historical student/faculty orders and cannot be permanently deleted. Please mark as 'Inactive' or 'Draft' instead.`
      };
    }

    try {
      await apiClient.delete(API_ENDPOINTS.MENU.BY_ID(id));
    } catch {
      // Local fallback
    }

    const filtered = items.filter(i => i.id !== id);
    storageService.setItem(STORAGE_KEY, filtered);
    return { success: true, blockedByPolicy: false };
  }
};

export default menuService;
