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

  const updateOutlet = useCallback(async (data) => {
    try {
      const updated = await settingsService.updateOutletSettings(data);
      setSettings(prev => ({ ...prev, outlet: updated }));
      success('Settings Saved', 'Outlet profile updated successfully.');
      return updated;
    } catch (err) {
      toastError('Update Failed', err.message);
      throw err;
    }
  }, [success, toastError]);

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

  const updatePrivacy = useCallback(async (data) => {
    try {
      const updated = await settingsService.updatePrivacySettings(data);
      setSettings(prev => ({ ...prev, privacy: updated }));
      success('Privacy Settings Updated', 'Data protection preferences and policies saved.');
      return updated;
    } catch (err) {
      toastError('Update Failed', err.message);
      throw err;
    }
  }, [success, toastError]);

  const updateDsar = useCallback(async (id, status, notes) => {
    try {
      const updated = await settingsService.updateDsarStatus(id, status, notes);
      setSettings(prev => {
        const reqs = prev.privacy.dsarRequests.map(r => r.id === id ? updated : r);
        return { ...prev, privacy: { ...prev.privacy, dsarRequests: reqs } };
      });
      success('DSAR Status Updated', `Data Subject Request moved to ${status}.`);
      return updated;
    } catch (err) {
      toastError('DSAR Error', err.message);
      throw err;
    }
  }, [success, toastError]);

  return {
    settings,
    loading,
    error,
    updateOutlet,
    updatePayments,
    updateRules,
    updatePrivacy,
    updateDsar,
    refreshSettings: loadSettings
  };
};

export default useSettings;
