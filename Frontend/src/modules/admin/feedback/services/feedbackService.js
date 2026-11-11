/**
 * Feedback & Grievance API Service
 */

import { apiClient, API_ENDPOINTS } from '../../../../services/api';
import { storageService } from '../../../../services/storageService';
import { INITIAL_FEEDBACK } from '../constants/feedbackConstants';

const STORAGE_KEY = 'cms_canteen_feedback_tickets';

export const feedbackService = {
  getAll: async (params = {}) => {
    try {
      return await apiClient.get(API_ENDPOINTS.FEEDBACK.BASE, params);
    } catch {
      const saved = storageService.getItem(STORAGE_KEY, null);
      if (!saved) {
        storageService.setItem(STORAGE_KEY, INITIAL_FEEDBACK);
        return [...INITIAL_FEEDBACK];
      }
      return saved;
    }
  },

  getById: async (id) => {
    try {
      return await apiClient.get(API_ENDPOINTS.FEEDBACK.BY_ID(id));
    } catch {
      const all = await feedbackService.getAll();
      return all.find(f => f.id === id) || null;
    }
  },

  resolveTicket: async (id, resolutionData) => {
    try {
      return await apiClient.post(API_ENDPOINTS.FEEDBACK.RESOLVE(id), resolutionData);
    } catch {
      const tickets = await feedbackService.getAll();
      const idx = tickets.findIndex(t => t.id === id);
      if (idx === -1) throw new Error(`Ticket with ID ${id} not found.`);

      const ticket = tickets[idx];
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const updatedHistory = [
        ...ticket.history,
        {
          status: resolutionData.status,
          timestamp: timeStr,
          note: resolutionData.notes
        }
      ];

      const updatedTicket = {
        ...ticket,
        status: resolutionData.status,
        resolutionNotes: resolutionData.notes,
        resolvedBy: resolutionData.resolvedBy || 'Dr. Rajesh Sharma (Administrator)',
        resolvedAt: now.toISOString(),
        history: updatedHistory
      };

      tickets[idx] = updatedTicket;
      storageService.setItem(STORAGE_KEY, [...tickets]);
      return updatedTicket;
    }
  }
};

export default feedbackService;
