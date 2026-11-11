import { useState, useEffect, useCallback } from 'react';
import { menuService } from '../services/menuService';
import { useToast } from '../../../../app/providers/ToastProvider';

export const useMenuItems = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { success, error: toastError, info, warning } = useToast();

  const loadMenuItems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await menuService.getAll();
      setMenuItems(data);
    } catch (err) {
      console.error('Failed to load menu items:', err);
      setError(err.message || 'Error loading menu');
      toastError('Menu Error', 'Could not load menu items from registry.');
    } finally {
      setLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    loadMenuItems();
  }, [loadMenuItems]);

  const createMenuItem = useCallback(async (data) => {
    try {
      const created = await menuService.create(data);
      setMenuItems(prev => [created, ...prev]);
      success('Menu Item Added', `"${created.name}" (${created.code}) created successfully.`);
      return created;
    } catch (err) {
      toastError('Creation Failed', err.message);
      throw err;
    }
  }, [success, toastError]);

  const updateMenuItem = useCallback(async (id, data) => {
    try {
      const updated = await menuService.update(id, data);
      setMenuItems(prev => prev.map(item => item.id === id ? updated : item));
      success('Item Updated', `"${updated.name}" updated successfully.`);
      return updated;
    } catch (err) {
      toastError('Update Failed', err.message);
      throw err;
    }
  }, [success, toastError]);

  const toggleStatus = useCallback(async (id) => {
    try {
      const updated = await menuService.toggleStatus(id);
      setMenuItems(prev => prev.map(item => item.id === id ? updated : item));
      info('Status Changed', `"${updated.name}" is now ${updated.status}.`);
      return updated;
    } catch (err) {
      toastError('Error', err.message);
      throw err;
    }
  }, [info, toastError]);

  const togglePublish = useCallback(async (id) => {
    try {
      const updated = await menuService.togglePublish(id);
      setMenuItems(prev => prev.map(item => item.id === id ? updated : item));
      info('Publication Updated', `"${updated.name}" marked as ${updated.publicationStatus}.`);
      return updated;
    } catch (err) {
      toastError('Error', err.message);
      throw err;
    }
  }, [info, toastError]);

  const deleteItem = useCallback(async (id) => {
    try {
      const res = await menuService.deleteItem(id);
      if (res.blockedByPolicy) {
        warning('Action Blocked by Institutional Policy', res.reason);
        return res;
      }
      setMenuItems(prev => prev.filter(item => item.id !== id));
      success('Item Deleted', 'Menu item permanently removed.');
      return res;
    } catch (err) {
      toastError('Deletion Failed', err.message);
      throw err;
    }
  }, [success, warning, toastError]);

  return {
    menuItems,
    loading,
    error,
    createMenuItem,
    updateMenuItem,
    toggleStatus,
    togglePublish,
    deleteItem,
    refreshMenu: loadMenuItems
  };
};

export default useMenuItems;
