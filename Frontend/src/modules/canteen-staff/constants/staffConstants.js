/**
 * Canteen Staff Module Constants
 */

export const STAFF_SECTIONS = {
  ALL: 'ALL',
  MAIN_KITCHEN: 'MAIN_KITCHEN',
  SNACKS_COUNTER: 'SNACKS_COUNTER',
  BEVERAGE_BAR: 'BEVERAGE_BAR'
};

export const KITCHEN_STATIONS = [
  { id: 'station-1', name: 'Hot Meals Line (Wok & Curries)' },
  { id: 'station-2', name: 'Snacks & Quick Bites Counter' },
  { id: 'station-3', name: 'Fresh Beverages & Shakes' }
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
