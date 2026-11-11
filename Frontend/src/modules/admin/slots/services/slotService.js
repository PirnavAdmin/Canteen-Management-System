/**
 * Slot Management API Service
 */

import { apiClient, API_ENDPOINTS } from '../../../../services/api';
import { storageService } from '../../../../services/storageService';
import { INITIAL_SLOTS } from '../constants/slotConstants';
import { SLOT_STATUS } from '../../../../constants/appConstants';

const STORAGE_KEY = 'cms_canteen_management_slots';

export const slotService = {
  getAll: async (params = {}) => {
    try {
      return await apiClient.get(API_ENDPOINTS.SLOTS.BASE, params);
    } catch {
      const saved = storageService.getItem(STORAGE_KEY, null);
      if (!saved) {
        storageService.setItem(STORAGE_KEY, INITIAL_SLOTS);
        return [...INITIAL_SLOTS];
      }
      return saved;
    }
  },

  getById: async (id) => {
    try {
      return await apiClient.get(API_ENDPOINTS.SLOTS.BY_ID(id));
    } catch {
      const slots = await slotService.getAll();
      return slots.find(s => s.id === id) || null;
    }
  },

  create: async (data) => {
    if (!data.startTime || !data.endTime || !data.maxCapacity) {
      throw new Error('Start time, end time, and maximum capacity are required.');
    }
    const max = Number(data.maxCapacity);
    if (max <= 0) {
      throw new Error('Maximum order capacity must be a positive number.');
    }

    try {
      return await apiClient.post(API_ENDPOINTS.SLOTS.BASE, data);
    } catch {
      const slots = await slotService.getAll();

      // Check overlapping slot for same outlet & date & session
      const conflict = slots.find(s =>
        s.outletId === data.outletId &&
        s.date === data.date &&
        ((data.startTime >= s.startTime && data.startTime < s.endTime) ||
         (data.endTime > s.startTime && data.endTime <= s.endTime))
      );

      if (conflict) {
        throw new Error(`Schedule Conflict: An active slot (${conflict.startTime} - ${conflict.endTime}) already exists for this outlet on ${data.date}.`);
      }

      const newSlot = {
        ...data,
        id: `slot-${Date.now()}`,
        maxCapacity: max,
        bookedOrders: 0,
        remainingCapacity: max,
        status: SLOT_STATUS.OPEN,
        createdAt: new Date().toISOString()
      };

      const updated = [...slots, newSlot];
      storageService.setItem(STORAGE_KEY, updated);
      return newSlot;
    }
  },

  updateCapacity: async (id, newMaxCapacity) => {
    const max = Number(newMaxCapacity);
    if (isNaN(max) || max <= 0) {
      throw new Error('Capacity must be a valid positive integer.');
    }

    try {
      return await apiClient.patch(API_ENDPOINTS.SLOTS.UPDATE_CAPACITY(id), { maxCapacity: max });
    } catch {
      const slots = await slotService.getAll();
      const idx = slots.findIndex(s => s.id === id);
      if (idx === -1) throw new Error(`Slot with ID ${id} not found.`);

      const slot = slots[idx];
      // Business Rule: "Do not reduce capacity below existing confirmed bookings"
      if (max < slot.bookedOrders) {
        throw new Error(`Validation Error: Cannot reduce capacity to ${max} because ${slot.bookedOrders} confirmed orders are already booked for this slot. Institutional policy protects existing confirmed bookings.`);
      }

      const remaining = max - slot.bookedOrders;
      let newStatus = slot.status;
      if (newStatus !== SLOT_STATUS.PAUSED && newStatus !== SLOT_STATUS.CLOSED) {
        if (remaining <= 0) newStatus = SLOT_STATUS.FULL;
        else if (remaining <= 10) newStatus = SLOT_STATUS.FAST_FILLING;
        else newStatus = SLOT_STATUS.OPEN;
      }

      const updatedSlot = {
        ...slot,
        maxCapacity: max,
        remainingCapacity: remaining,
        status: newStatus,
        updatedAt: new Date().toISOString()
      };

      slots[idx] = updatedSlot;
      storageService.setItem(STORAGE_KEY, [...slots]);
      return updatedSlot;
    }
  },

  togglePause: async (id) => {
    try {
      return await apiClient.patch(API_ENDPOINTS.SLOTS.TOGGLE_STATUS(id));
    } catch {
      const slots = await slotService.getAll();
      const idx = slots.findIndex(s => s.id === id);
      if (idx === -1) throw new Error(`Slot with ID ${id} not found.`);

      const slot = slots[idx];
      let newStatus = slot.status === SLOT_STATUS.PAUSED ? SLOT_STATUS.OPEN : SLOT_STATUS.PAUSED;

      if (newStatus === SLOT_STATUS.OPEN) {
        if (slot.remainingCapacity <= 0) newStatus = SLOT_STATUS.FULL;
        else if (slot.remainingCapacity <= 10) newStatus = SLOT_STATUS.FAST_FILLING;
      }

      slots[idx] = {
        ...slot,
        status: newStatus,
        updatedAt: new Date().toISOString()
      };

      storageService.setItem(STORAGE_KEY, [...slots]);
      return slots[idx];
    }
  }
};

export default slotService;
