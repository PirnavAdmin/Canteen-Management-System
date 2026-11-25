/**
 * Canteen Staff Module Constants
 * Pure live constants and configurations.
 * No mock data, no dummy records.
 */

import { ORDER_STATUS } from '../../../constants/appConstants';

export const STAFF_SECTIONS = {
  ALL: 'ALL',
  MAIN_KITCHEN: 'MAIN_KITCHEN',
  SNACKS_COUNTER: 'SNACKS_COUNTER',
  BEVERAGE_BAR: 'BEVERAGE_BAR'
};

export const KITCHEN_STATIONS = [
  { id: 'all', name: 'All Kitchen Stations' },
  { id: 'station-1', name: 'Station 1: Hot Meals Line (Wok & Curries)' },
  { id: 'station-2', name: 'Station 2: Snacks & Quick Bites Counter' },
  { id: 'station-3', name: 'Station 3: Fresh Beverages & Shakes' }
];

export const ORDER_URGENCY_MINUTES = {
  NORMAL: 10,
  WARNING: 15
};

export const STAFF_ORDER_STATUS = {
  PLACED: 'Placed',
  ACCEPTED: 'Accepted',
  PREPARING: 'Preparing',
  READY_FOR_PICKUP: 'Ready for Pickup',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled'
};

export const STOCK_REQUEST_STATUS = {
  PENDING: 'Pending Review',
  APPROVED: 'Approved',
  DISPATCHED: 'Dispatched',
  FULFILLED: 'Fulfilled',
  REJECTED: 'Rejected'
};

export const STOCK_REQUEST_URGENCY = {
  NORMAL: 'Normal',
  HIGH: 'High',
  EMERGENCY: 'Emergency'
};

export const INVENTORY_STATUS = {
  IN_STOCK: 'In Stock',
  LOW_STOCK: 'Low Stock',
  CRITICAL: 'Critical',
  EXPIRING_SOON: 'Expiring Soon',
  EXPIRED: 'Expired',
  OUT_OF_STOCK: 'Out of Stock'
};
