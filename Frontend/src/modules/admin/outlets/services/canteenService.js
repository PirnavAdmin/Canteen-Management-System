import { apiClient } from '../../../../services/api/apiClient';
import { API_ENDPOINTS } from '../../../../services/api/apiEndpoints';
import { INITIAL_CANTEENS } from '../constants/canteenConstants';

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
  if (!admin || !admin.name) {
    admin = dto.assignedAdministrator || {
      id: `EMP-${id}`,
      name: 'Mrs. Sunitha',
      role: 'Outlet Administrator',
      email: 'admin@canteen.edu',
      phone: '+91 98765 43210'
    };
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
    contactPhone: dto.contactNumber || dto.contactPhone || '+91 40 2345 6789',
    contactEmail: dto.contactEmail || admin?.email || 'canteen@git.edu',
    fssaiLicenseNumber: dto.fssaiLicenseNo || dto.fssaiLicenseNumber || '10022044000123',
    status: dto.status || 'Active',
    isOrderAcceptanceEnabled: dto.isOrderAcceptanceEnabled !== false,
    workingDays: workingDays,
    assignedAdministrator: admin,
    assignedStaff: dto.assignedStaff || [
      { id: 'STF-101', name: 'Ravi', role: 'Kitchen & Counter Staff', status: 'Active' },
      { id: 'STF-102', name: 'Suresh', role: 'Counter Dispenser', status: 'Active' }
    ],
    createdAt: dto.createdAt || new Date().toISOString(),
    updatedAt: dto.updatedAt || new Date().toISOString()
  };
};

export const canteenService = {
  getAll: async (params = {}) => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.OUTLETS.BASE, params);
      if (response && response.success && Array.isArray(response.data)) {
        return response.data.map(normalizeCanteen);
      }
      return [...INITIAL_CANTEENS];
    } catch (err) {
      console.warn('Backend API unavailable, using seeded defaults:', err.message);
      return [...INITIAL_CANTEENS];
    }
  },

  getById: async (id) => {
    try {
      const numericId = parseInt(id.replace(/\D/g, ''), 10) || id;
      const response = await apiClient.get(API_ENDPOINTS.OUTLETS.BY_ID(numericId));
      if (response && response.success && response.data) {
        return normalizeCanteen(response.data);
      }
    } catch (err) {
      console.warn(`Error fetching outlet ${id} from API:`, err.message);
    }
    const fallbackList = await canteenService.getAll();
    return fallbackList.find(c => String(c.id) === String(id) || String(c.outletId) === String(id)) || null;
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

    try {
      const response = await apiClient.post(API_ENDPOINTS.OUTLETS.BASE, payload);
      if (response && response.success && response.data) {
        return normalizeCanteen(response.data);
      }
    } catch (err) {
      console.warn('API outlet creation failed, fallback simulation:', err.message);
    }

    // Local fallback return
    return normalizeCanteen({
      ...data,
      id: `canteen-${Date.now()}`,
      outletId: Date.now() % 10000,
      createdAt: new Date().toISOString()
    });
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

    try {
      const response = await apiClient.put(API_ENDPOINTS.OUTLETS.BY_ID(numericId), payload);
      if (response && response.success && response.data) {
        return normalizeCanteen(response.data);
      }
    } catch (err) {
      console.warn(`API outlet update failed for ${id}:`, err.message);
    }

    return normalizeCanteen({ ...data, id });
  },

  toggleStatus: async (id) => {
    const numericId = parseInt(String(id).replace(/\D/g, ''), 10) || id;
    const existing = await canteenService.getById(id);
    const newStatus = existing?.status === 'Active' ? 'Inactive' : 'Active';

    try {
      await apiClient.patch(API_ENDPOINTS.OUTLETS.TOGGLE_STATUS(numericId), { status: newStatus });
    } catch (err) {
      console.warn(`API status toggle failed for ${id}:`, err.message);
    }

    return {
      ...existing,
      status: newStatus,
      isOrderAcceptanceEnabled: newStatus === 'Active'
    };
  },

  getStats: async () => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.OUTLETS.STATS);
      if (response && response.success && response.data) {
        return response.data;
      }
    } catch (err) {
      console.warn('API getStats failed:', err.message);
    }
    return {
      totalOutlets: 5,
      activeOutlets: 4,
      inactiveOutlets: 1,
      totalMenuItems: 48,
      ordersToday: 398,
      revenueToday: 37940
    };
  },

  getSettings: async (id) => {
    const numericId = parseInt(String(id).replace(/\D/g, ''), 10) || id;
    try {
      const response = await apiClient.get(API_ENDPOINTS.OUTLETS.SETTINGS(numericId));
      if (response && response.success && response.data) {
        return response.data;
      }
    } catch (err) {
      console.warn(`API getSettings failed for outlet ${id}:`, err.message);
    }
    return {
      autoExpireUnpaidMinutes: 10,
      pickupHoldMinutes: 30,
      cancellationPolicy: 'UntilAccepted',
      allowUpi: true,
      allowCards: true,
      allowWallet: true,
      allowCash: true
    };
  },

  updateSettings: async (id, settingsData) => {
    const numericId = parseInt(String(id).replace(/\D/g, ''), 10) || id;
    try {
      const response = await apiClient.put(API_ENDPOINTS.OUTLETS.SETTINGS(numericId), settingsData);
      if (response && response.success && response.data) {
        return response.data;
      }
    } catch (err) {
      console.warn(`API updateSettings failed for outlet ${id}:`, err.message);
    }
    return settingsData;
  },

  assignStaffMember: async (canteenId, staffMember) => {
    const current = await canteenService.getById(canteenId);
    if (!current) throw new Error(`Canteen with ID ${canteenId} not found.`);
    const updatedStaff = [...(current.assignedStaff || []), {
      id: `STF-${Math.floor(300 + Math.random() * 600)}`,
      status: 'Active',
      ...staffMember
    }];
    return { ...current, assignedStaff: updatedStaff };
  },

  removeStaffMember: async (canteenId, staffId) => {
    const current = await canteenService.getById(canteenId);
    if (!current) throw new Error(`Canteen with ID ${canteenId} not found.`);
    const updatedStaff = (current.assignedStaff || []).filter(s => s.id !== staffId);
    return { ...current, assignedStaff: updatedStaff };
  },

  resetDefaults: async () => {
    return [...INITIAL_CANTEENS];
  }
};

export default canteenService;
