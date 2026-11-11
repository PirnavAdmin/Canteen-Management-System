import { useState, useEffect, useCallback } from 'react';
import { slotService } from '../services/slotService';
import { useToast } from '../../../../app/providers/ToastProvider';

export const useSlots = () => {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { success, error: toastError, info } = useToast();

  const loadSlots = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await slotService.getAll();
      setSlots(data);
    } catch (err) {
      console.error('Failed to load slots:', err);
      setError(err.message || 'Error loading slots');
      toastError('Slot Error', 'Unable to retrieve meal slots configuration.');
    } finally {
      setLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    loadSlots();
  }, [loadSlots]);

  const createSlot = useCallback(async (data) => {
    try {
      const created = await slotService.create(data);
      setSlots(prev => [...prev, created]);
      success('Slot Created', `Created ${created.mealSession} slot (${created.startTime} - ${created.endTime}).`);
      return created;
    } catch (err) {
      toastError('Creation Failed', err.message);
      throw err;
    }
  }, [success, toastError]);

  const updateCapacity = useCallback(async (id, newMax) => {
    try {
      const updated = await slotService.updateCapacity(id, newMax);
      setSlots(prev => prev.map(s => s.id === id ? updated : s));
      success('Capacity Adjusted', `Slot capacity updated to ${updated.maxCapacity} orders.`);
      return updated;
    } catch (err) {
      toastError('Policy Restriction', err.message);
      throw err;
    }
  }, [success, toastError]);

  const togglePause = useCallback(async (id) => {
    try {
      const updated = await slotService.togglePause(id);
      setSlots(prev => prev.map(s => s.id === id ? updated : s));
      info('Slot Status', `Slot is now ${updated.status}.`);
      return updated;
    } catch (err) {
      toastError('Error', err.message);
      throw err;
    }
  }, [info, toastError]);

  return {
    slots,
    loading,
    error,
    createSlot,
    updateCapacity,
    togglePause,
    refreshSlots: loadSlots
  };
};

export default useSlots;
