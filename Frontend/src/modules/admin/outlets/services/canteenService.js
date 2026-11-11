import { INITIAL_CANTEENS } from '../constants/canteenConstants';
import { storageService } from '../../../../services/storageService';

const STORAGE_KEY = 'cms_canteen_management_outlets';

export const canteenService = {
  getAll: async () => {
    const saved = storageService.getItem(STORAGE_KEY, null);
    if (!saved) {
      storageService.setItem(STORAGE_KEY, INITIAL_CANTEENS);
      return [...INITIAL_CANTEENS];
    }
    return saved;
  },

  getById: async (id) => {
    const canteens = await canteenService.getAll();
    return canteens.find(c => c.id === id) || null;
  },

  create: async (data) => {
    const canteens = await canteenService.getAll();
    const newCanteen = {
      ...data,
      id: `canteen-${Date.now()}`,
      institutionId: 'INST-APEX-01',
      code: data.code.trim().toUpperCase(),
      assignedAdministrator: data.assignedAdministrator || {
        id: `EMP-${Math.floor(100 + Math.random() * 900)}`,
        name: 'Unassigned Admin',
        role: 'Outlet Administrator',
        email: 'staff@apexinstitute.edu',
        phone: '+1 (555) 000-0000'
      },
      assignedStaff: data.assignedStaff || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const updated = [newCanteen, ...canteens];
    storageService.setItem(STORAGE_KEY, updated);
    return newCanteen;
  },

  update: async (id, data) => {
    const canteens = await canteenService.getAll();
    const index = canteens.findIndex(c => c.id === id);
    if (index === -1) throw new Error(`Canteen with ID ${id} not found.`);

    const updatedCanteen = {
      ...canteens[index],
      ...data,
      code: data.code.trim().toUpperCase(),
      updatedAt: new Date().toISOString()
    };
    canteens[index] = updatedCanteen;
    storageService.setItem(STORAGE_KEY, [...canteens]);
    return updatedCanteen;
  },

  toggleStatus: async (id) => {
    const canteens = await canteenService.getAll();
    const index = canteens.findIndex(c => c.id === id);
    if (index === -1) throw new Error(`Canteen with ID ${id} not found.`);

    const currentStatus = canteens[index].status;
    const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
    // When activating, default order acceptance to true; when deactivating, turn off
    const newOrderAcceptance = newStatus === 'Active';

    canteens[index] = {
      ...canteens[index],
      status: newStatus,
      isOrderAcceptanceEnabled: newOrderAcceptance,
      updatedAt: new Date().toISOString()
    };
    storageService.setItem(STORAGE_KEY, [...canteens]);
    return canteens[index];
  },

  assignStaffMember: async (canteenId, staffMember) => {
    const canteens = await canteenService.getAll();
    const index = canteens.findIndex(c => c.id === canteenId);
    if (index === -1) throw new Error(`Canteen with ID ${canteenId} not found.`);

    const current = canteens[index];
    const staffList = current.assignedStaff || [];
    const newStaff = {
      id: `STF-${Math.floor(300 + Math.random() * 600)}`,
      status: 'Active',
      ...staffMember
    };
    const updatedStaff = [...staffList, newStaff];
    
    canteens[index] = {
      ...current,
      assignedStaff: updatedStaff,
      updatedAt: new Date().toISOString()
    };
    storageService.setItem(STORAGE_KEY, [...canteens]);
    return canteens[index];
  },

  removeStaffMember: async (canteenId, staffId) => {
    const canteens = await canteenService.getAll();
    const index = canteens.findIndex(c => c.id === canteenId);
    if (index === -1) throw new Error(`Canteen with ID ${canteenId} not found.`);

    const current = canteens[index];
    const updatedStaff = (current.assignedStaff || []).filter(s => s.id !== staffId);
    
    canteens[index] = {
      ...current,
      assignedStaff: updatedStaff,
      updatedAt: new Date().toISOString()
    };
    storageService.setItem(STORAGE_KEY, [...canteens]);
    return canteens[index];
  },

  resetDefaults: async () => {
    storageService.setItem(STORAGE_KEY, INITIAL_CANTEENS);
    return [...INITIAL_CANTEENS];
  }
};

