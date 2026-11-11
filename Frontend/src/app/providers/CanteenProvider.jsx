import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { canteenService } from '../../modules/admin/outlets/services/canteenService';
import { useToast } from './ToastProvider';

const CanteenContext = createContext(null);

export const CanteenProvider = ({ children }) => {
  const [canteens, setCanteens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { success, error: toastError, info } = useToast();

  const loadCanteens = useCallback(async () => {
    try {
      setLoading(true);
      const data = await canteenService.getAll();
      setCanteens(data);
      setError(null);
    } catch (err) {
      console.error('Failed to load canteens:', err);
      setError(err.message || 'Failed to load canteens');
      toastError('Load Error', 'Unable to retrieve canteens master list.');
    } finally {
      setLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    loadCanteens();
  }, [loadCanteens]);

  const getCanteen = useCallback((id) => {
    return canteens.find(c => c.id === id) || null;
  }, [canteens]);

  const createCanteen = useCallback(async (formData) => {
    try {
      const created = await canteenService.create(formData);
      setCanteens(prev => [created, ...prev]);
      success('Canteen Created', `Successfully registered outlet "${created.name}" (${created.code}).`);
      return created;
    } catch (err) {
      toastError('Registration Failed', err.message || 'Error creating canteen.');
      throw err;
    }
  }, [success, toastError]);

  const updateCanteen = useCallback(async (id, formData) => {
    try {
      const updated = await canteenService.update(id, formData);
      setCanteens(prev => prev.map(c => c.id === id ? updated : c));
      success('Canteen Updated', `Updated configuration for "${updated.name}".`);
      return updated;
    } catch (err) {
      toastError('Update Failed', err.message || 'Error updating canteen.');
      throw err;
    }
  }, [success, toastError]);

  const toggleCanteenStatus = useCallback(async (id) => {
    try {
      const updated = await canteenService.toggleStatus(id);
      setCanteens(prev => prev.map(c => c.id === id ? updated : c));
      const statusText = updated.status === 'Active' ? 'Activated' : 'Deactivated';
      info(`Status Changed`, `Outlet "${updated.name}" is now ${statusText}.`);
      return updated;
    } catch (err) {
      toastError('Status Update Error', err.message || 'Error toggling canteen status.');
      throw err;
    }
  }, [info, toastError]);

  const assignStaff = useCallback(async (canteenId, staffData) => {
    try {
      const updated = await canteenService.assignStaffMember(canteenId, staffData);
      setCanteens(prev => prev.map(c => c.id === canteenId ? updated : c));
      success('Staff Assigned', `Successfully assigned "${staffData.name}" as ${staffData.role}.`);
      return updated;
    } catch (err) {
      toastError('Assignment Failed', err.message || 'Error assigning staff member.');
      throw err;
    }
  }, [success, toastError]);

  const removeStaff = useCallback(async (canteenId, staffId) => {
    try {
      const updated = await canteenService.removeStaffMember(canteenId, staffId);
      setCanteens(prev => prev.map(c => c.id === canteenId ? updated : c));
      info('Staff Removed', 'Staff assignment removed from outlet.');
      return updated;
    } catch (err) {
      toastError('Removal Failed', err.message || 'Error removing staff assignment.');
      throw err;
    }
  }, [info, toastError]);

  const resetDefaults = useCallback(async () => {
    const defaults = await canteenService.resetDefaults();
    setCanteens(defaults);
    info('Defaults Restored', 'Canteens have been reset to default institution seeds.');
  }, [info]);

  return (
    <CanteenContext.Provider
      value={{
        canteens,
        loading,
        error,
        getCanteen,
        createCanteen,
        updateCanteen,
        toggleCanteenStatus,
        assignStaff,
        removeStaff,
        resetDefaults,
        refreshCanteens: loadCanteens
      }}
    >
      {children}
    </CanteenContext.Provider>
  );
};

export const useCanteensContext = () => {
  const context = useContext(CanteenContext);
  if (!context) {
    throw new Error('useCanteensContext must be used within a CanteenProvider');
  }
  return context;
};

