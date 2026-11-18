import { useState, useEffect, useCallback } from 'react';
import { settingsService } from '../services/settingsService';
import { useToast } from '../../../../app/providers/ToastProvider';

export const useSettings = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { success, error: toastError } = useToast();

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await settingsService.getSettings();
      setSettings(data);
    } catch (err) {
      console.error('Failed to load settings:', err);
      setError(err.message || 'Error loading settings');
      toastError('Settings Error', 'Unable to retrieve system configuration.');
    } finally {
      setLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const updatePayments = useCallback(async (data) => {
    try {
      const updated = await settingsService.updatePaymentSettings(data);
      setSettings(prev => ({ ...prev, payments: updated }));
      success('Payments Updated', 'Payment gateway toggles and parameters saved.');
      return updated;
    } catch (err) {
      toastError('Update Failed', err.message);
      throw err;
    }
  }, [success, toastError]);

  const updateRules = useCallback(async (data) => {
    try {
      const updated = await settingsService.updateOrderRules(data);
      setSettings(prev => ({ ...prev, orderRules: updated }));
      success('Rules Updated', 'Order and slot thresholds saved.');
      return updated;
    } catch (err) {
      toastError('Update Failed', err.message);
      throw err;
    }
  }, [success, toastError]);

  return {
    settings,
    loading,
    error,
    updatePayments,
    updateRules,
    refreshSettings: loadSettings
  };
};

export default useSettings;
