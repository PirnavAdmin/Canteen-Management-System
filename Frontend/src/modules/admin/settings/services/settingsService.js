/**
 * Settings & Privacy API Service
 */

import { apiClient, API_ENDPOINTS } from '../../../../services/api';
import { storageService } from '../../../../services/storageService';
import { INITIAL_SETTINGS } from '../constants/settingsConstants';

const STORAGE_KEY = 'cms_canteen_system_settings';

export const settingsService = {
  getSettings: async () => {
    try {
      return await apiClient.get(API_ENDPOINTS.SETTINGS.OUTLET);
    } catch {
      const saved = storageService.getItem(STORAGE_KEY, null);
      if (!saved) {
        storageService.setItem(STORAGE_KEY, INITIAL_SETTINGS);
        return { ...INITIAL_SETTINGS };
      }
      return saved;
    }
  },

  updateOutletSettings: async (outletData) => {
    try {
      return await apiClient.put(API_ENDPOINTS.SETTINGS.OUTLET, outletData);
    } catch {
      const settings = await settingsService.getSettings();
      settings.outlet = { ...settings.outlet, ...outletData };
      storageService.setItem(STORAGE_KEY, settings);
      return settings.outlet;
    }
  },

  updatePaymentSettings: async (paymentData) => {
    try {
      return await apiClient.put(API_ENDPOINTS.SETTINGS.PAYMENTS, paymentData);
    } catch {
      const settings = await settingsService.getSettings();
      settings.payments = { ...settings.payments, ...paymentData };
      storageService.setItem(STORAGE_KEY, settings);
      return settings.payments;
    }
  },

  updateOrderRules: async (rulesData) => {
    try {
      return await apiClient.put(API_ENDPOINTS.SETTINGS.RULES, rulesData);
    } catch {
      const settings = await settingsService.getSettings();
      settings.orderRules = { ...settings.orderRules, ...rulesData };
      storageService.setItem(STORAGE_KEY, settings);
      return settings.orderRules;
    }
  },

  updatePrivacySettings: async (privacyData) => {
    try {
      return await apiClient.put(API_ENDPOINTS.SETTINGS.PRIVACY, privacyData);
    } catch {
      const settings = await settingsService.getSettings();
      settings.privacy = { ...settings.privacy, ...privacyData };
      storageService.setItem(STORAGE_KEY, settings);
      return settings.privacy;
    }
  },

  updateDsarStatus: async (requestId, status, notes = '') => {
    try {
      return await apiClient.patch(API_ENDPOINTS.SETTINGS.UPDATE_REQUEST_STATUS(requestId), { status, notes });
    } catch {
      const settings = await settingsService.getSettings();
      const requests = settings.privacy?.dsarRequests || [];
      const idx = requests.findIndex(r => r.id === requestId);
      if (idx === -1) throw new Error('DSAR Request not found.');

      // Institutional Rule Check for Erasure
      if (status === 'Fulfilled' && requests[idx].requestType.includes('Erasure')) {
        notes = `${notes} (Note: Personal account credentials and contact data anonymized. Order audit trails and billing invoices retained under 7-year statutory financial retention policy)`;
      }

      requests[idx] = {
        ...requests[idx],
        status,
        notes: notes || requests[idx].notes,
        fulfilledAt: new Date().toISOString()
      };

      settings.privacy.dsarRequests = [...requests];
      storageService.setItem(STORAGE_KEY, settings);
      return requests[idx];
    }
  }
};

export default settingsService;
