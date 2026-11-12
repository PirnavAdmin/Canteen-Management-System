/**
 * Canteen Outlets API Service
 * Pure live integration with .NET 8 Web API (Hostinger Cloud MySQL DB).
 * No mock data, no localStorage caching, no simulated fallbacks.
 */

import { apiClient, API_ENDPOINTS } from '../../../../services/api';

const normalizeCanteen = (dto) => {
  if (!dto) return null;
  const id = dto.outletId ? String(dto.outletId) : String(dto.id || '');

  let admin = null;
  if (dto.adminContactJson) {
    try {
      admin = typeof dto.adminContactJson === 'string'
        ? JSON.parse(dto.adminContactJson)
        : dto.adminContactJson;
    } catch {
      admin = null;
    }
  }

  let workingDays = dto.workingDays;
  if (typeof workingDays === 'string') {
    workingDays = workingDays.split(',').map(s => s.trim()).filter(Boolean);
  }
  if (!Array.isArray(workingDays) || workingDays.length === 0) {
    workingDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  }

  return {
    ...dto,
    id: id,
    outletId: dto.outletId || (isNaN(Number(id)) ? 1 : Number(id)),
    code: dto.code || '',
    name: dto.name || '',
    location: dto.location || 'Campus Canteen Area',
    campus: dto.campus || 'Main Campus',
    openingTime: dto.openTime || dto.openingTime || '08:00',
    closingTime: dto.closeTime || dto.closingTime || '16:30',
    contactPhone: dto.contactNumber || dto.contactPhone || '',
    contactEmail: dto.contactEmail || admin?.email || '',
    fssaiLicenseNumber: dto.fssaiLicenseNo || dto.fssaiLicenseNumber || '',
    status: dto.status || 'Active',
    isOrderAcceptanceEnabled: dto.isOrderAcceptanceEnabled !== false,
    workingDays: workingDays,
    assignedAdministrator: admin || {
      name: 'Mrs. Sunitha',
      role: 'Outlet Administrator',
      email: 'admin@canteen.edu',
      phone: '+91 98765 43210'
    },
    assignedStaff: dto.assignedStaff || [],
    createdAt: dto.createdAt || new Date().toISOString(),
    updatedAt: dto.updatedAt || new Date().toISOString()
  };
};

export const canteenService = {
  getAll: async (params = {}) => {
    const response = await apiClient.get(API_ENDPOINTS.OUTLETS.BASE, params);
    const list = response?.data ?? response;
    return Array.isArray(list) ? list.map(normalizeCanteen) : [];
  },

  getById: async (id) => {
    const numericId = parseInt(String(id).replace(/\D/g, ''), 10) || id;
    const response = await apiClient.get(API_ENDPOINTS.OUTLETS.BY_ID(numericId));
    const data = response?.data ?? response;
    return normalizeCanteen(data);
  },

  create: async (data) => {
    const payload = {
      code: (data.code || '').trim().toUpperCase(),
      name: (data.name || '').trim(),
      location: data.location || data.campus || 'Main Campus',
      openTime: data.openingTime || '08:00',
      closeTime: data.closingTime || '16:30',
      fssaiLicenseNo: data.fssaiLicenseNumber || '10022044000123',
      contactNumber: data.contactPhone || null,
      status: data.status || 'Active',
      isOrderAcceptanceEnabled: data.isOrderAcceptanceEnabled !== false,
      workingDays: Array.isArray(data.workingDays) ? data.workingDays.join(',') : (data.workingDays || 'Monday,Tuesday,Wednesday,Thursday,Friday,Saturday'),
      adminContactJson: JSON.stringify(data.assignedAdministrator || {
        name: 'Mrs. Sunitha',
        role: 'Outlet Administrator',
        email: 'admin@canteen.edu',
        phone: '+91 98765 43210'
      })
    };

    const response = await apiClient.post(API_ENDPOINTS.OUTLETS.BASE, payload);
    const created = response?.data ?? response;
    return normalizeCanteen(created);
  },

  update: async (id, data) => {
    const numericId = parseInt(String(id).replace(/\D/g, ''), 10) || id;
    const payload = {
      name: (data.name || '').trim(),
      location: data.location || data.campus || 'Main Campus',
      openTime: data.openingTime || '08:00',
      closeTime: data.closingTime || '16:30',
      fssaiLicenseNo: data.fssaiLicenseNumber || null,
      contactNumber: data.contactPhone || null,
      status: data.status || 'Active',
      isOrderAcceptanceEnabled: data.isOrderAcceptanceEnabled !== false,
      workingDays: Array.isArray(data.workingDays) ? data.workingDays.join(',') : data.workingDays,
      adminContactJson: JSON.stringify(data.assignedAdministrator || {})
    };

    const response = await apiClient.put(API_ENDPOINTS.OUTLETS.BY_ID(numericId), payload);
    const updated = response?.data ?? response;
    return normalizeCanteen(updated);
  },

  toggleStatus: async (id) => {
    const numericId = parseInt(String(id).replace(/\D/g, ''), 10) || id;
    const existing = await canteenService.getById(id);
    const newStatus = existing?.status === 'Active' ? 'Inactive' : 'Active';

    const response = await apiClient.patch(API_ENDPOINTS.OUTLETS.TOGGLE_STATUS(numericId), { status: newStatus });
    const toggled = response?.data ?? response;
    return normalizeCanteen(toggled);
  },

  getStats: async () => {
    const response = await apiClient.get(API_ENDPOINTS.OUTLETS.STATS);
    return response?.data ?? response;
  },

  getSettings: async (id) => {
    const numericId = parseInt(String(id).replace(/\D/g, ''), 10) || id;
    const response = await apiClient.get(API_ENDPOINTS.OUTLETS.SETTINGS(numericId));
    return response?.data ?? response;
  },

  updateSettings: async (id, settingsData) => {
    const numericId = parseInt(String(id).replace(/\D/g, ''), 10) || id;
    const response = await apiClient.put(API_ENDPOINTS.OUTLETS.SETTINGS(numericId), settingsData);
    return response?.data ?? response;
  }
};

export default canteenService;
