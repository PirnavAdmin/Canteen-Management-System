/**
 * Dashboard Constants and Seed Contracts
 */

export const INITIAL_DASHBOARD_SUMMARY = {
  totalOrders: 348,
  pendingOrders: 14,
  acceptedOrders: 18,
  preparingOrders: 26,
  readyForPickup: 19,
  completedOrders: 261,
  cancelledOrders: 10,
  totalSales: 48950.00,
  activeOutlets: 4,
  averagePreparationTime: '12 mins',
  hourlyPeakTime: '12:30 PM - 01:45 PM'
};

export const INITIAL_HOURLY_SALES = [
  { hour: '08:00 AM', orders: 12, sales: 1450 },
  { hour: '09:00 AM', orders: 28, sales: 3420 },
  { hour: '10:00 AM', orders: 34, sales: 4180 },
  { hour: '11:00 AM', orders: 22, sales: 2900 },
  { hour: '12:00 PM', orders: 68, sales: 9850 },
  { hour: '01:00 PM', orders: 74, sales: 11200 },
  { hour: '02:00 PM', orders: 42, sales: 6100 },
  { hour: '03:00 PM', orders: 20, sales: 2750 },
  { hour: '04:00 PM', orders: 25, sales: 3800 },
  { hour: '05:00 PM', orders: 18, sales: 2450 },
  { hour: '06:00 PM', orders: 5, sales: 850 }
];

export const INITIAL_LIVE_ORDERS = [
  {
    id: 'ORD-9801',
    token: 'T-104',
    customer: 'Aarav Mehta',
    customerRole: 'Student (CSE 3rd Yr)',
    outletName: 'Central Dining Hall',
    outletCode: 'CDH-MAIN',
    items: [
      { name: 'Paneer Butter Masala Combo', qty: 1, price: 120 },
      { name: 'Fresh Mint Lemonade', qty: 1, price: 30 }
    ],
    total: 150,
    slot: '12:30 PM - 12:45 PM',
    status: 'Ready for Pickup',
    paymentMethod: 'Campus Wallet',
    orderTime: '12:18 PM'
  },
  {
    id: 'ORD-9802',
    token: 'T-105',
    customer: 'Dr. Sunita Rao',
    customerRole: 'Faculty (Biotech)',
    outletName: 'Central Dining Hall',
    outletCode: 'CDH-MAIN',
    items: [
      { name: 'South Indian Thali', qty: 1, price: 90 },
      { name: 'Filter Coffee', qty: 2, price: 50 }
    ],
    total: 140,
    slot: '12:45 PM - 01:00 PM',
    status: 'Preparing',
    paymentMethod: 'UPI',
    orderTime: '12:22 PM'
  },
  {
    id: 'ORD-9803',
    token: 'T-106',
    customer: 'Kavita Singh',
    customerRole: 'Student (Mech 2nd Yr)',
    outletName: 'North Campus Food Court',
    outletCode: 'NCFC-02',
    items: [
      { name: 'Veg Hakka Noodles', qty: 1, price: 85 },
      { name: 'Veg Spring Rolls', qty: 1, price: 60 }
    ],
    total: 145,
    slot: '01:00 PM - 01:15 PM',
    status: 'Accepted',
    paymentMethod: 'UPI',
    orderTime: '12:29 PM'
  },
  {
    id: 'ORD-9804',
    token: 'T-107',
    customer: 'Rohan Verma',
    customerRole: 'Student (ECE 4th Yr)',
    outletName: 'Engineering Block Kiosk',
    outletCode: 'EBK-03',
    items: [
      { name: 'Club Sandwich Grilled', qty: 2, price: 140 },
      { name: 'Cold Coffee', qty: 1, price: 45 }
    ],
    total: 185,
    slot: '01:00 PM - 01:15 PM',
    status: 'Placed',
    paymentMethod: 'Campus Wallet',
    orderTime: '12:34 PM'
  }
];

export const INITIAL_TOP_SELLING = [
  { id: 'item-1', name: 'Paneer Butter Masala Combo', category: 'Main Course', count: 86, revenue: 10320, foodType: 'Veg' },
  { id: 'item-2', name: 'South Indian Thali Special', category: 'Meals & Thalis', count: 74, revenue: 6660, foodType: 'Veg' },
  { id: 'item-3', name: 'Grilled Cheese Club Sandwich', category: 'Snacks & Quick Bites', count: 62, revenue: 4340, foodType: 'Veg' },
  { id: 'item-4', name: 'Egg Fried Rice & Manchurian', category: 'Rice Bowls', count: 51, revenue: 5100, foodType: 'Egg' },
  { id: 'item-5', name: 'Masala Chai & Samosa Combo', category: 'Beverages & Chai', count: 98, revenue: 3920, foodType: 'Veg' }
];

export const INITIAL_STOCK_ALERTS = [
  { id: 'inv-1', ingredient: 'Full Cream Milk (Amul)', available: '12 Liters', reorderLevel: '30 Liters', status: 'Low Stock', outlet: 'Central Dining Hall', daysToDeplete: '1 day' },
  { id: 'inv-2', ingredient: 'Paneer Fresh Block', available: '4.5 kg', reorderLevel: '10 kg', status: 'Low Stock', outlet: 'Central Dining Hall', daysToDeplete: 'Today' },
  { id: 'inv-3', ingredient: 'Burger Buns (Pack of 6)', available: '8 packs', reorderLevel: '25 packs', expiry: 'Tomorrow', status: 'Expiring Soon', outlet: 'Engineering Block Kiosk' },
  { id: 'inv-4', ingredient: 'Cooking Oil (Sunflower 15L)', available: '1 Tin', reorderLevel: '3 Tins', status: 'Low Stock', outlet: 'North Campus Food Court' }
];

export const INITIAL_OUTLET_SALES = [
  { outletId: 'canteen-001', name: 'Central Dining Hall', orders: 194, revenue: 27800, percentage: 56.8 },
  { outletId: 'canteen-002', name: 'North Campus Food Court', orders: 92, revenue: 13150, percentage: 26.9 },
  { outletId: 'canteen-003', name: 'Engineering Block Kiosk', orders: 46, revenue: 5850, percentage: 11.9 },
  { outletId: 'canteen-004', name: 'Hostel Mess Canteen', orders: 16, revenue: 2150, percentage: 4.4 }
];

