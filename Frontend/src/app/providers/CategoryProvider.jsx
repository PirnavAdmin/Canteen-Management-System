import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { categoryService } from '../../modules/admin/categories/services/categoryService';
import { useToast } from './ToastProvider';

const CategoryContext = createContext(null);

export const CategoryProvider = ({ children }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { success, error: toastError, info, warning } = useToast();

  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      const data = await categoryService.getAll();
      setCategories(data);
      setError(null);
    } catch (err) {
      console.error('Failed to load categories:', err);
      setError(err.message || 'Failed to load categories');
      toastError('Load Error', 'Unable to retrieve food categories.');
    } finally {
      setLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const getCategory = useCallback((id) => {
    return categories.find(c => c.id === id) || null;
  }, [categories]);

  const createCategory = useCallback(async (formData) => {
    try {
      const created = await categoryService.create(formData);
      setCategories(prev => [...prev, created]);
      success('Category Created', `New menu category "${created.name}" registered with order #${created.displayOrder}.`);
      return created;
    } catch (err) {
      toastError('Creation Failed', err.message || 'Error creating category.');
      throw err;
    }
  }, [success, toastError]);

  const updateCategory = useCallback(async (id, formData) => {
    try {
      const updated = await categoryService.update(id, formData);
      setCategories(prev => prev.map(c => c.id === id ? updated : c));
      success('Category Updated', `Category "${updated.name}" updated successfully.`);
      return updated;
    } catch (err) {
      toastError('Update Failed', err.message || 'Error updating category.');
      throw err;
    }
  }, [success, toastError]);

  const toggleCategoryStatus = useCallback(async (id) => {
    try {
      const updated = await categoryService.toggleStatus(id);
      setCategories(prev => prev.map(c => c.id === id ? updated : c));
      const statusText = updated.status === 'Active' ? 'Activated' : 'Deactivated';
      info('Status Changed', `Category "${updated.name}" is now ${statusText}.`);
      return updated;
    } catch (err) {
      toastError('Status Error', err.message || 'Error toggling category status.');
      throw err;
    }
  }, [info, toastError]);

  const deleteCategory = useCallback(async (id) => {
    try {
      const result = await categoryService.deleteCategory(id);
      if (result.blockedByPolicy) {
        warning('Action Blocked by SRS Policy', result.reason);
        return result;
      }
      setCategories(prev => prev.filter(c => c.id !== id));
      success('Category Deleted', 'Category removed successfully.');
      return result;
    } catch (err) {
      toastError('Deletion Failed', err.message || 'Error removing category.');
      throw err;
    }
  }, [success, warning, toastError]);

  const resetDefaults = useCallback(async () => {
    const defaults = await categoryService.resetDefaults();
    setCategories(defaults);
    info('Defaults Restored', 'Food categories have been reset to default university seeds.');
  }, [info]);

  return (
    <CategoryContext.Provider
      value={{
        categories,
        loading,
        error,
        getCategory,
        createCategory,
        updateCategory,
        toggleCategoryStatus,
        deleteCategory,
        resetDefaults,
        refreshCategories: loadCategories
      }}
    >
      {children}
    </CategoryContext.Provider>
  );
};

export const useCategoriesContext = () => {
  const context = useContext(CategoryContext);
  if (!context) {
    throw new Error('useCategoriesContext must be used within a CategoryProvider');
  }
  return context;
};

