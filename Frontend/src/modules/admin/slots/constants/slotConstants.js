/**
 * Slot Management Constants & Seed Data
 */

import { SLOT_STATUS } from '../../../../constants/appConstants';

export const INITIAL_SLOTS = [
  {
    id: 'slot-101',
    outletId: 'canteen-001',
    outletName: 'Central Dining Hall',
    date: '2026-11-11',
    mealSession: 'Breakfast',
    startTime: '08:00',
    endTime: '08:30',
    slotDuration: '30 mins',
    maxCapacity: 60,
    bookedOrders: 58,
    remainingCapacity: 2,
    cutoffMinutes: 15, // 15 mins before slot start
    cutoffTime: '07:45',
    status: SLOT_STATUS.FAST_FILLING
  },
  {
    id: 'slot-102',
    outletId: 'canteen-001',
    outletName: 'Central Dining Hall',
    date: '2026-11-11',
    mealSession: 'Breakfast',
    startTime: '08:30',
    endTime: '09:00',
    slotDuration: '30 mins',
    maxCapacity: 60,
    bookedOrders: 60,
    remainingCapacity: 0,
    cutoffMinutes: 15,
    cutoffTime: '08:15',
    status: SLOT_STATUS.FULL
  },
  {
    id: 'slot-103',
    outletId: 'canteen-001',
    outletName: 'Central Dining Hall',
    date: '2026-11-11',
    mealSession: 'Lunch',
    startTime: '12:00',
    endTime: '12:30',
    slotDuration: '30 mins',
    maxCapacity: 100,
    bookedOrders: 78,
    remainingCapacity: 22,
    cutoffMinutes: 20,
    cutoffTime: '11:40',
    status: SLOT_STATUS.OPEN
  },
  {
    id: 'slot-104',
    outletId: 'canteen-001',
    outletName: 'Central Dining Hall',
    date: '2026-11-11',
    mealSession: 'Lunch',
    startTime: '12:30',
    endTime: '13:00',
    slotDuration: '30 mins',
    maxCapacity: 120,
    bookedOrders: 112,
    remainingCapacity: 8,
    cutoffMinutes: 20,
    cutoffTime: '12:10',
    status: SLOT_STATUS.FAST_FILLING
  },
  {
    id: 'slot-105',
    outletId: 'canteen-001',
    outletName: 'Central Dining Hall',
    date: '2026-11-11',
    mealSession: 'Lunch',
    startTime: '13:00',
    endTime: '13:30',
    slotDuration: '30 mins',
    maxCapacity: 120,
    bookedOrders: 45,
    remainingCapacity: 75,
    cutoffMinutes: 20,
    cutoffTime: '12:40',
    status: SLOT_STATUS.OPEN
  },
  {
    id: 'slot-106',
    outletId: 'canteen-002',
    outletName: 'North Campus Food Court',
    date: '2026-11-11',
    mealSession: 'Lunch',
    startTime: '12:30',
    endTime: '13:00',
    slotDuration: '30 mins',
    maxCapacity: 80,
    bookedOrders: 32,
    remainingCapacity: 48,
    cutoffMinutes: 15,
    cutoffTime: '12:15',
    status: SLOT_STATUS.OPEN
  },
  {
    id: 'slot-107',
    outletId: 'canteen-003',
    outletName: 'Engineering Block Kiosk',
    date: '2026-11-11',
    mealSession: 'Evening Snacks',
    startTime: '16:00',
    endTime: '16:30',
    slotDuration: '30 mins',
    maxCapacity: 50,
    bookedOrders: 14,
    remainingCapacity: 36,
    cutoffMinutes: 10,
    cutoffTime: '15:50',
    status: SLOT_STATUS.OPEN
  }
];
