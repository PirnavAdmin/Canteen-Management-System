/**
 * Canteen Staff Module Constants & Fresh Realistic Mock Data
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

// Date helper utilities to guarantee fresh, realistic live relative timestamps
const minutesAgo = (mins) => new Date(Date.now() - mins * 60 * 1000).toISOString();
const hoursAgo = (hrs) => new Date(Date.now() - hrs * 3600 * 1000).toISOString();
const daysAgo = (days) => new Date(Date.now() - days * 24 * 3600 * 1000).toISOString();
const daysAhead = (days) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};

const formatTimeStr = (iso) => {
  try {
    return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  } catch {
    return '12:30 PM';
  }
};

/**
 * Fresh Realistic Staff Personnel Profile
 */
export const INITIAL_STAFF_PROFILE = {
  id: 'STF-2026-042',
  fullName: 'Rameshwar Rao',
  username: 'staff',
  role: 'Canteen Staff (Kitchen & Pickup Counter)',
  department: 'Food & Beverage Operations',
  shift: 'Morning & Lunch Shift (06:30 AM - 03:00 PM)',
  contactNumber: '+91 98451 22890',
  email: 'staff.counter02@apexinstitute.edu',
  assignedOutlet: 'Central Dining Hall',
  outletId: 'canteen-001',
  assignedCounter: 'Counter 02 (Express Pickup & Hot Meals)',
  activeStation: 'Station 1: Hot Meals Line (Wok & Curries)',
  authorizedStations: [
    'Station 1: Hot Meals Line (Wok & Curries)',
    'Station 2: Snacks & Quick Bites Counter'
  ],
  emergencyContact: '+91 94480 55123 (Supervisor - Manoj Kumar)',
  campus: 'Main Campus',
  joiningDate: '15 Jan 2024',
  fssaiCertified: true
};

/**
 * Fresh Realistic Canteen Staff Inventory (16 Ingredients across Dairy, Grains, Produce, Bakery, Spices, Beverages)
 */
export const getFreshStaffInventory = () => [
  {
    id: 'inv-01',
    itemCode: 'ING-MLK-01',
    ingredientName: 'Full Cream Milk (Amul 1L Pouch)',
    category: 'Dairy',
    unit: 'liters',
    availableQuantity: 8,
    reorderLevel: 30,
    batchNumber: 'B-AML-904',
    expiryDate: daysAhead(1), // Critical: Expiring tomorrow
    supplierId: 'sup-01',
    supplierName: 'Amul Dairy Cooperative',
    outletId: 'canteen-001',
    outletName: 'Central Dining Hall',
    status: INVENTORY_STATUS.LOW_STOCK,
    costPerUnit: 56.00
  },
  {
    id: 'inv-02',
    itemCode: 'ING-PNR-02',
    ingredientName: 'Fresh Malai Paneer Blocks',
    category: 'Dairy',
    unit: 'kg',
    availableQuantity: 3.5,
    reorderLevel: 12,
    batchNumber: 'B-PNR-512',
    expiryDate: daysAhead(2), // Critical: Expiring in 2 days
    supplierId: 'sup-01',
    supplierName: 'Amul Dairy Cooperative',
    outletId: 'canteen-001',
    outletName: 'Central Dining Hall',
    status: INVENTORY_STATUS.LOW_STOCK,
    costPerUnit: 320.00
  },
  {
    id: 'inv-03',
    itemCode: 'ING-RIC-03',
    ingredientName: 'Basmati Rice (Daawat Super Premium)',
    category: 'Grains & Pulses',
    unit: 'kg',
    availableQuantity: 165,
    reorderLevel: 45,
    batchNumber: 'B-DWT-108',
    expiryDate: daysAhead(240),
    supplierId: 'sup-02',
    supplierName: 'Agro Foods Distribution Ltd',
    outletId: 'canteen-001',
    outletName: 'Central Dining Hall',
    status: INVENTORY_STATUS.IN_STOCK,
    costPerUnit: 85.00
  },
  {
    id: 'inv-04',
    itemCode: 'ING-OIL-04',
    ingredientName: 'Refined Sunflower Oil (Fortune 15L)',
    category: 'Oils & Ghee',
    unit: 'boxes',
    availableQuantity: 1,
    reorderLevel: 4,
    batchNumber: 'B-FTN-771',
    expiryDate: daysAhead(180),
    supplierId: 'sup-02',
    supplierName: 'Agro Foods Distribution Ltd',
    outletId: 'canteen-001',
    outletName: 'Central Dining Hall',
    status: INVENTORY_STATUS.LOW_STOCK,
    costPerUnit: 1850.00
  },
  {
    id: 'inv-05',
    itemCode: 'ING-BUN-05',
    ingredientName: 'Burger Buns & Pav (Pack of 12)',
    category: 'Bakery',
    unit: 'packets',
    availableQuantity: 6,
    reorderLevel: 20,
    batchNumber: 'B-BAK-401',
    expiryDate: daysAhead(0), // Expiring Today!
    supplierId: 'sup-03',
    supplierName: 'Fresh Bakers Campus Supply',
    outletId: 'canteen-001',
    outletName: 'Central Dining Hall',
    status: INVENTORY_STATUS.EXPIRING_SOON,
    costPerUnit: 40.00
  },
  {
    id: 'inv-06',
    itemCode: 'ING-ATT-06',
    ingredientName: 'Whole Wheat Atta (Aashirvaad 50kg)',
    category: 'Grains & Pulses',
    unit: 'kg',
    availableQuantity: 140,
    reorderLevel: 40,
    batchNumber: 'B-ASH-302',
    expiryDate: daysAhead(150),
    supplierId: 'sup-02',
    supplierName: 'Agro Foods Distribution Ltd',
    outletId: 'canteen-001',
    outletName: 'Central Dining Hall',
    status: INVENTORY_STATUS.IN_STOCK,
    costPerUnit: 42.00
  },
  {
    id: 'inv-07',
    itemCode: 'ING-CUR-07',
    ingredientName: 'Fresh Curd & Dahi Tubs (5kg)',
    category: 'Dairy',
    unit: 'tubs',
    availableQuantity: 2,
    reorderLevel: 6,
    batchNumber: 'B-CRD-208',
    expiryDate: daysAhead(1), // Critical within 1 day
    supplierId: 'sup-01',
    supplierName: 'Heritage Foods Ltd',
    outletId: 'canteen-001',
    outletName: 'Central Dining Hall',
    status: INVENTORY_STATUS.EXPIRING_SOON,
    costPerUnit: 240.00
  },
  {
    id: 'inv-08',
    itemCode: 'ING-EGG-08',
    ingredientName: 'Fresh Farm Eggs (Tray of 30)',
    category: 'Poultry',
    unit: 'boxes',
    availableQuantity: 9,
    reorderLevel: 5,
    batchNumber: 'B-EGG-820',
    expiryDate: daysAhead(12),
    supplierId: 'sup-04',
    supplierName: 'Greenfield Poultry Farms',
    outletId: 'canteen-001',
    outletName: 'Central Dining Hall',
    status: INVENTORY_STATUS.IN_STOCK,
    costPerUnit: 180.00
  },
  {
    id: 'inv-09',
    itemCode: 'ING-DAL-09',
    ingredientName: 'Toor Dal Premium (Unpolished)',
    category: 'Grains & Pulses',
    unit: 'kg',
    availableQuantity: 80,
    reorderLevel: 25,
    batchNumber: 'B-DAL-605',
    expiryDate: daysAhead(210),
    supplierId: 'sup-02',
    supplierName: 'Agro Foods Distribution Ltd',
    outletId: 'canteen-001',
    outletName: 'Central Dining Hall',
    status: INVENTORY_STATUS.IN_STOCK,
    costPerUnit: 130.00
  },
  {
    id: 'inv-10',
    itemCode: 'ING-VEG-10',
    ingredientName: 'Fresh Hybrid Tomatoes & Red Onions',
    category: 'Fresh Produce',
    unit: 'kg',
    availableQuantity: 5.5,
    reorderLevel: 25,
    batchNumber: 'B-VEG-110',
    expiryDate: daysAhead(3), // Soon within 3 days
    supplierId: 'sup-05',
    supplierName: 'Green Valley Fresh Produce Hub',
    outletId: 'canteen-001',
    outletName: 'Central Dining Hall',
    status: INVENTORY_STATUS.CRITICAL,
    costPerUnit: 35.00
  },
  {
    id: 'inv-11',
    itemCode: 'ING-GGP-11',
    ingredientName: 'Ginger-Garlic Paste (5kg Commercial Tub)',
    category: 'Spices & Condiments',
    unit: 'tubs',
    availableQuantity: 5,
    reorderLevel: 2,
    batchNumber: 'B-GGP-219',
    expiryDate: daysAhead(45),
    supplierId: 'sup-02',
    supplierName: "Mother's Recipe Commercial Line",
    outletId: 'canteen-001',
    outletName: 'Central Dining Hall',
    status: INVENTORY_STATUS.IN_STOCK,
    costPerUnit: 350.00
  },
  {
    id: 'inv-12',
    itemCode: 'ING-TEA-12',
    ingredientName: 'Premium Assam CTC Tea Leaves (10kg)',
    category: 'Beverages',
    unit: 'bags',
    availableQuantity: 4,
    reorderLevel: 1,
    batchNumber: 'B-TEA-045',
    expiryDate: daysAhead(320),
    supplierId: 'sup-06',
    supplierName: 'Tata Tea Institutional Distribution',
    outletId: 'canteen-001',
    outletName: 'Central Dining Hall',
    status: INVENTORY_STATUS.IN_STOCK,
    costPerUnit: 2800.00
  },
  {
    id: 'inv-13',
    itemCode: 'ING-CHS-13',
    ingredientName: 'Amul Processed Cheese Blocks (1kg)',
    category: 'Dairy',
    unit: 'kg',
    availableQuantity: 2,
    reorderLevel: 6,
    batchNumber: 'B-CHS-334',
    expiryDate: daysAhead(5), // Soon within 5 days
    supplierId: 'sup-01',
    supplierName: 'Amul Dairy Cooperative',
    outletId: 'canteen-001',
    outletName: 'Central Dining Hall',
    status: INVENTORY_STATUS.LOW_STOCK,
    costPerUnit: 480.00
  },
  {
    id: 'inv-14',
    itemCode: 'ING-YOG-14',
    ingredientName: 'Flavored Greek Yogurt Cups (100g)',
    category: 'Dairy',
    unit: 'cups',
    availableQuantity: 4,
    reorderLevel: 15,
    batchNumber: 'B-YOG-099',
    expiryDate: daysAgo(1), // Expired yesterday (for waste tracking demo)
    supplierId: 'sup-01',
    supplierName: 'Mother Dairy Campus Line',
    outletId: 'canteen-001',
    outletName: 'Central Dining Hall',
    status: INVENTORY_STATUS.EXPIRED,
    costPerUnit: 35.00
  },
  {
    id: 'inv-15',
    itemCode: 'ING-COF-15',
    ingredientName: 'South Indian Filter Coffee Blend (5kg)',
    category: 'Beverages',
    unit: 'bags',
    availableQuantity: 3,
    reorderLevel: 1,
    batchNumber: 'B-COF-091',
    expiryDate: daysAhead(180),
    supplierId: 'sup-07',
    supplierName: "Narasu's Coffee Ltd",
    outletId: 'canteen-001',
    outletName: 'Central Dining Hall',
    status: INVENTORY_STATUS.IN_STOCK,
    costPerUnit: 1950.00
  },
  {
    id: 'inv-16',
    itemCode: 'ING-SPC-16',
    ingredientName: 'Whole Garam Masala & Green Cardamom',
    category: 'Spices & Condiments',
    unit: 'kg',
    availableQuantity: 8.5,
    reorderLevel: 3,
    batchNumber: 'B-SPC-780',
    expiryDate: daysAhead(365),
    supplierId: 'sup-02',
    supplierName: 'MDH Commercial Spices',
    outletId: 'canteen-001',
    outletName: 'Central Dining Hall',
    status: INVENTORY_STATUS.IN_STOCK,
    costPerUnit: 820.00
  }
];

export const INITIAL_STAFF_INVENTORY = getFreshStaffInventory();

/**
 * Fresh Realistic Admin Stock Requisitions Ledger (8 Requisitions covering all statuses)
 */
export const getFreshStaffStockRequests = () => [
  {
    id: 'REQ-2026-0816',
    itemCode: 'ING-MLK-01',
    itemName: 'Full Cream Milk (Amul 1L Pouch)',
    category: 'Dairy',
    requestedQuantity: 35,
    unit: 'liters',
    outletId: 'canteen-001',
    outletName: 'Central Dining Hall',
    urgency: STOCK_REQUEST_URGENCY.HIGH,
    requiredByDate: daysAhead(1),
    notes: 'Breakfast chai, filter coffee and sweet lassi morning surge. Current stock below 8 liters.',
    requestedBy: 'Rameshwar Rao (Head Kitchen Staff)',
    status: STOCK_REQUEST_STATUS.PENDING,
    adminNotes: '',
    createdAt: hoursAgo(2)
  },
  {
    id: 'REQ-2026-0815',
    itemCode: 'ING-PNR-02',
    itemName: 'Fresh Malai Paneer Blocks',
    category: 'Dairy',
    requestedQuantity: 20,
    unit: 'kg',
    outletId: 'canteen-001',
    outletName: 'Central Dining Hall',
    urgency: STOCK_REQUEST_URGENCY.EMERGENCY,
    requiredByDate: daysAhead(0),
    notes: 'Dinner feast prep for hostellers & evening seminar guests. Urgent replenishment needed.',
    requestedBy: 'Rameshwar Rao (Head Kitchen Staff)',
    status: STOCK_REQUEST_STATUS.APPROVED,
    adminNotes: 'Approved by Canteen Admin Mrs. Sunitha. Local vendor dispatched from Anand Dairy depot.',
    createdAt: hoursAgo(5)
  },
  {
    id: 'REQ-2026-0814',
    itemCode: 'ING-BUN-05',
    itemName: 'Burger Buns & Pav (Pack of 12)',
    category: 'Bakery',
    requestedQuantity: 40,
    unit: 'packets',
    outletId: 'canteen-001',
    outletName: 'Central Dining Hall',
    urgency: STOCK_REQUEST_URGENCY.HIGH,
    requiredByDate: daysAhead(1),
    notes: 'Evening tea-time snacks & samosa pav rush replenishment.',
    requestedBy: 'Rameshwar Rao (Head Kitchen Staff)',
    status: STOCK_REQUEST_STATUS.DISPATCHED,
    adminNotes: 'Dispatched from Central Campus Bakery Hub via transit van. Expected by 02:00 PM.',
    createdAt: hoursAgo(8)
  },
  {
    id: 'REQ-2026-0813',
    itemCode: 'ING-VEG-10',
    itemName: 'Fresh Hybrid Tomatoes & Red Onions',
    category: 'Fresh Produce',
    requestedQuantity: 50,
    unit: 'kg',
    outletId: 'canteen-001',
    outletName: 'Central Dining Hall',
    urgency: STOCK_REQUEST_URGENCY.EMERGENCY,
    requiredByDate: daysAhead(0),
    notes: 'Gravy bases, sambar and curry preparation stock critically low.',
    requestedBy: 'Rameshwar Rao (Head Kitchen Staff)',
    status: STOCK_REQUEST_STATUS.PENDING,
    adminNotes: '',
    createdAt: hoursAgo(3)
  },
  {
    id: 'REQ-2026-0812',
    itemCode: 'ING-RIC-03',
    itemName: 'Basmati Rice (Daawat Super Premium)',
    category: 'Grains & Pulses',
    requestedQuantity: 100,
    unit: 'kg',
    outletId: 'canteen-001',
    outletName: 'Central Dining Hall',
    urgency: STOCK_REQUEST_URGENCY.NORMAL,
    requiredByDate: daysAgo(2).split('T')[0],
    notes: 'Weekly standard dining hall quota buffer replenishment.',
    requestedBy: 'Rameshwar Rao (Head Kitchen Staff)',
    status: STOCK_REQUEST_STATUS.FULFILLED,
    adminNotes: 'Received and verified in Storeroom A on Nov 17 by Storekeeper M. Naidu.',
    createdAt: daysAgo(3)
  },
  {
    id: 'REQ-2026-0811',
    itemCode: 'ING-OIL-04',
    itemName: 'Refined Sunflower Oil (Fortune 15L)',
    category: 'Oils & Ghee',
    requestedQuantity: 4,
    unit: 'boxes',
    outletId: 'canteen-001',
    outletName: 'Central Dining Hall',
    urgency: STOCK_REQUEST_URGENCY.NORMAL,
    requiredByDate: daysAgo(3).split('T')[0],
    notes: 'Monthly deep-frying and tiffin preparation batch buffer.',
    requestedBy: 'Rameshwar Rao (Head Kitchen Staff)',
    status: STOCK_REQUEST_STATUS.FULFILLED,
    adminNotes: 'Delivered by Agro Foods distributor. Invoice signed and uploaded.',
    createdAt: daysAgo(4)
  },
  {
    id: 'REQ-2026-0810',
    itemCode: 'ING-EGG-08',
    itemName: 'Fresh Farm Eggs (Tray of 30)',
    category: 'Poultry',
    requestedQuantity: 12,
    unit: 'boxes',
    outletId: 'canteen-001',
    outletName: 'Central Dining Hall',
    urgency: STOCK_REQUEST_URGENCY.NORMAL,
    requiredByDate: daysAgo(4).split('T')[0],
    notes: 'Breakfast omelette & egg fried rice demand buffer.',
    requestedBy: 'Rameshwar Rao (Head Kitchen Staff)',
    status: STOCK_REQUEST_STATUS.FULFILLED,
    adminNotes: 'Delivered by Greenfield Farms.',
    createdAt: daysAgo(5)
  },
  {
    id: 'REQ-2026-0809',
    itemCode: 'ING-EXO-99',
    itemName: 'Organic Imported Swiss Cheese',
    category: 'Dairy',
    requestedQuantity: 15,
    unit: 'kg',
    outletId: 'canteen-001',
    outletName: 'Central Dining Hall',
    urgency: STOCK_REQUEST_URGENCY.NORMAL,
    requiredByDate: daysAgo(5).split('T')[0],
    notes: 'Special continental pasta week proposal.',
    requestedBy: 'Rameshwar Rao (Head Kitchen Staff)',
    status: STOCK_REQUEST_STATUS.REJECTED,
    adminNotes: 'Rejected by Admin: Exceeds standard budget allocation. Use institutional Amul Cheddar instead.',
    createdAt: daysAgo(6)
  }
];

export const INITIAL_STAFF_STOCK_REQUESTS = getFreshStaffStockRequests();

/**
 * Fresh Realistic Canteen Orders (18 Live Orders covering Placed, Accepted, Preparing, Ready for Pickup, Completed, Cancelled)
 */
export const getFreshStaffOrders = () => {
  const todayDate = new Date().toISOString().split('T')[0];

  return [
    // --- 1. NEW / PLACED ORDERS (Awaiting Acceptance) ---
    {
      id: 'ORD-2026-9101',
      token: 'T-301',
      outletId: 'canteen-001',
      outletName: 'Central Dining Hall',
      outletCode: 'CDH-MAIN',
      stationId: 'station-1',
      customer: {
        name: 'Rohan Verma',
        role: 'Student',
        rollNo: '2024-ECE-089',
        department: 'Electronics & Communication',
        phone: '+91 98765 43210',
        email: 'rohan.verma@students.apexinstitute.edu'
      },
      items: [
        {
          id: 'i-101',
          name: 'Paneer Butter Masala Combo',
          variant: 'With Butter Naan (2 pcs)',
          price: 120.00,
          quantity: 1,
          total: 120.00,
          foodType: 'Veg',
          category: 'Main Course',
          stationId: 'station-1',
          imageUrl: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=600&q=80'
        },
        {
          id: 'i-102',
          name: 'Fresh Mint Lemonade',
          variant: 'Sweet Mint Blend',
          price: 30.00,
          quantity: 1,
          total: 30.00,
          foodType: 'Veg',
          category: 'Beverages',
          stationId: 'station-3',
          imageUrl: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80'
        }
      ],
      subtotal: 150.00,
      taxAmount: 7.50,
      totalAmount: 157.50,
      orderType: 'Pickup',
      status: ORDER_STATUS.PLACED,
      slot: {
        id: 'slot-301',
        session: 'Lunch',
        timeWindow: '12:45 PM - 01:00 PM',
        date: todayDate
      },
      orderDate: minutesAgo(3),
      createdAt: minutesAgo(3),
      payment: {
        method: 'UPI',
        status: 'Paid',
        transactionId: 'TXN-UPI-994101',
        paidAt: minutesAgo(3)
      },
      timeline: [
        {
          status: ORDER_STATUS.PLACED,
          timestamp: formatTimeStr(minutesAgo(3)),
          note: 'Order placed via Student Portal',
          operator: 'Student Self-Service'
        }
      ]
    },
    {
      id: 'ORD-2026-9102',
      token: 'T-302',
      outletId: 'canteen-001',
      outletName: 'Central Dining Hall',
      outletCode: 'CDH-MAIN',
      stationId: 'station-2',
      customer: {
        name: 'Ananya Deshmukh',
        role: 'Student',
        rollNo: '2025-CSE-142',
        department: 'Computer Science',
        phone: '+91 97654 32109',
        email: 'ananya.d@students.apexinstitute.edu'
      },
      items: [
        {
          id: 'i-103',
          name: 'Veg Hakka Noodles',
          variant: 'Extra Spicy',
          price: 85.00,
          quantity: 1,
          total: 85.00,
          foodType: 'Veg',
          category: 'Snacks & Quick Bites',
          stationId: 'station-2',
          imageUrl: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=600&q=80'
        },
        {
          id: 'i-104',
          name: 'Crispy Veg Spring Rolls (4 pcs)',
          variant: 'With Sweet Chilli Dip',
          price: 60.00,
          quantity: 2,
          total: 120.00,
          foodType: 'Veg',
          category: 'Snacks & Quick Bites',
          stationId: 'station-2',
          imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80'
        }
      ],
      subtotal: 205.00,
      taxAmount: 10.25,
      totalAmount: 215.25,
      orderType: 'Dine-in',
      status: ORDER_STATUS.PLACED,
      slot: {
        id: 'slot-302',
        session: 'Lunch',
        timeWindow: '01:00 PM - 01:15 PM',
        date: todayDate
      },
      orderDate: minutesAgo(6),
      createdAt: minutesAgo(6),
      payment: {
        method: 'Campus Wallet',
        status: 'Paid',
        transactionId: 'TXN-WAL-994102',
        paidAt: minutesAgo(6)
      },
      timeline: [
        {
          status: ORDER_STATUS.PLACED,
          timestamp: formatTimeStr(minutesAgo(6)),
          note: 'Order placed via Campus Mobile Web',
          operator: 'Student Self-Service'
        }
      ]
    },
    {
      id: 'ORD-2026-9103',
      token: 'T-303',
      outletId: 'canteen-001',
      outletName: 'Central Dining Hall',
      outletCode: 'CDH-MAIN',
      stationId: 'station-1',
      customer: {
        name: 'Dr. K. Srinivas',
        role: 'Faculty',
        rollNo: 'FAC-MECH-018',
        department: 'Mechanical Engineering',
        phone: '+91 94401 22334',
        email: 'k.srinivas@faculty.apexinstitute.edu'
      },
      items: [
        {
          id: 'i-105',
          name: 'South Indian Thali Special',
          variant: 'Executive Thali Meal',
          price: 90.00,
          quantity: 1,
          total: 90.00,
          foodType: 'Veg',
          category: 'Meals & Thalis',
          stationId: 'station-1',
          imageUrl: 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?auto=format&fit=crop&w=600&q=80'
        },
        {
          id: 'i-106',
          name: 'Filter Coffee',
          variant: 'Strong Decoction',
          price: 25.00,
          quantity: 1,
          total: 25.00,
          foodType: 'Veg',
          category: 'Beverages',
          stationId: 'station-3',
          imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80'
        }
      ],
      subtotal: 115.00,
      taxAmount: 5.75,
      totalAmount: 120.75,
      orderType: 'Takeaway',
      status: ORDER_STATUS.PLACED,
      slot: {
        id: 'slot-303',
        session: 'Lunch',
        timeWindow: '12:45 PM - 01:00 PM',
        date: todayDate
      },
      orderDate: minutesAgo(9),
      createdAt: minutesAgo(9),
      payment: {
        method: 'UPI',
        status: 'Paid',
        transactionId: 'TXN-UPI-994103',
        paidAt: minutesAgo(9)
      },
      timeline: [
        {
          status: ORDER_STATUS.PLACED,
          timestamp: formatTimeStr(minutesAgo(9)),
          note: 'Faculty order placed',
          operator: 'Faculty Portal'
        }
      ]
    },

    // --- 2. ACCEPTED ORDERS (Queued for Kitchen Prep) ---
    {
      id: 'ORD-2026-9104',
      token: 'T-304',
      outletId: 'canteen-001',
      outletName: 'Central Dining Hall',
      outletCode: 'CDH-MAIN',
      stationId: 'station-2',
      customer: {
        name: 'Vikramaditya Rao',
        role: 'Student',
        rollNo: '2025-MBA-034',
        department: 'School of Management',
        phone: '+91 99887 76655',
        email: 'vikram.rao@students.apexinstitute.edu'
      },
      items: [
        {
          id: 'i-107',
          name: 'Grilled Veg Club Sandwich',
          variant: 'Three-Layer Cheese & Veggies',
          price: 70.00,
          quantity: 2,
          total: 140.00,
          foodType: 'Veg',
          category: 'Snacks & Quick Bites',
          stationId: 'station-2',
          imageUrl: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=600&q=80'
        },
        {
          id: 'i-108',
          name: 'Cold Coffee with Ice Cream',
          variant: 'Vanilla Scoop Topping',
          price: 55.00,
          quantity: 2,
          total: 110.00,
          foodType: 'Veg',
          category: 'Beverages',
          stationId: 'station-3',
          imageUrl: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=600&q=80'
        }
      ],
      subtotal: 250.00,
      taxAmount: 12.50,
      totalAmount: 262.50,
      orderType: 'Pickup',
      status: ORDER_STATUS.ACCEPTED,
      slot: {
        id: 'slot-304',
        session: 'Lunch',
        timeWindow: '01:00 PM - 01:15 PM',
        date: todayDate
      },
      orderDate: minutesAgo(12),
      createdAt: minutesAgo(12),
      payment: {
        method: 'UPI',
        status: 'Paid',
        transactionId: 'TXN-UPI-994104',
        paidAt: minutesAgo(12)
      },
      timeline: [
        { status: ORDER_STATUS.PLACED, timestamp: formatTimeStr(minutesAgo(12)), note: 'Order placed by student' },
        { status: ORDER_STATUS.ACCEPTED, timestamp: formatTimeStr(minutesAgo(10)), note: 'Accepted by Kitchen Counter Staff' }
      ]
    },
    {
      id: 'ORD-2026-9105',
      token: 'T-305',
      outletId: 'canteen-001',
      outletName: 'Central Dining Hall',
      outletCode: 'CDH-MAIN',
      stationId: 'station-1',
      customer: {
        name: 'Pooja Hegde',
        role: 'Student',
        rollNo: '2023-BIO-012',
        department: 'Biotechnology',
        phone: '+91 91234 56780',
        email: 'pooja.h@students.apexinstitute.edu'
      },
      items: [
        {
          id: 'i-109',
          name: 'Masala Dosa Crisp',
          variant: 'Ghee Roast with Potato Masala',
          price: 55.00,
          quantity: 1,
          total: 55.00,
          foodType: 'Veg',
          category: 'South Indian Tiffin',
          stationId: 'station-1',
          imageUrl: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=600&q=80'
        },
        {
          id: 'i-110',
          name: 'Filter Coffee',
          variant: 'Regular Cup',
          price: 25.00,
          quantity: 1,
          total: 25.00,
          foodType: 'Veg',
          category: 'Beverages',
          stationId: 'station-3',
          imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80'
        }
      ],
      subtotal: 80.00,
      taxAmount: 4.00,
      totalAmount: 84.00,
      orderType: 'Pickup',
      status: ORDER_STATUS.ACCEPTED,
      slot: {
        id: 'slot-305',
        session: 'Lunch',
        timeWindow: '01:15 PM - 01:30 PM',
        date: todayDate
      },
      orderDate: minutesAgo(14),
      createdAt: minutesAgo(14),
      payment: {
        method: 'Cash',
        status: 'Paid',
        transactionId: 'TXN-CSH-994105',
        paidAt: minutesAgo(14)
      },
      timeline: [
        { status: ORDER_STATUS.PLACED, timestamp: formatTimeStr(minutesAgo(14)), note: 'Order booked' },
        { status: ORDER_STATUS.ACCEPTED, timestamp: formatTimeStr(minutesAgo(11)), note: 'Order accepted for preparation' }
      ]
    },

    // --- 3. PREPARING ORDERS (Active KDS Tickets with Timers) ---
    {
      id: 'ORD-2026-9106',
      token: 'T-306',
      outletId: 'canteen-001',
      outletName: 'Central Dining Hall',
      outletCode: 'CDH-MAIN',
      stationId: 'station-1',
      customer: {
        name: 'Karthik Reddy',
        role: 'Student',
        rollNo: '2024-CIV-055',
        department: 'Civil Engineering',
        phone: '+91 93456 78901',
        email: 'karthik.r@students.apexinstitute.edu'
      },
      items: [
        {
          id: 'i-111',
          name: 'Chicken Biryani Bowl (Dum Special)',
          variant: 'Served with Mirchi Ka Salan & Raita',
          price: 150.00,
          quantity: 1,
          total: 150.00,
          foodType: 'Non-Veg',
          category: 'Rice Bowls',
          stationId: 'station-1',
          imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80'
        },
        {
          id: 'i-112',
          name: 'Fresh Mint Lemonade',
          variant: 'Chilled Sweet & Salty',
          price: 30.00,
          quantity: 1,
          total: 30.00,
          foodType: 'Veg',
          category: 'Beverages',
          stationId: 'station-3',
          imageUrl: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80'
        }
      ],
      subtotal: 180.00,
      taxAmount: 9.00,
      totalAmount: 189.00,
      orderType: 'Dine-in',
      status: ORDER_STATUS.PREPARING,
      slot: {
        id: 'slot-306',
        session: 'Lunch',
        timeWindow: '12:30 PM - 12:45 PM',
        date: todayDate
      },
      orderDate: minutesAgo(8), // Elapsed 8 mins -> Normal (Green timer)
      createdAt: minutesAgo(8),
      payment: {
        method: 'UPI',
        status: 'Paid',
        transactionId: 'TXN-UPI-994106',
        paidAt: minutesAgo(8)
      },
      timeline: [
        { status: ORDER_STATUS.PLACED, timestamp: formatTimeStr(minutesAgo(8)), note: 'Order placed' },
        { status: ORDER_STATUS.ACCEPTED, timestamp: formatTimeStr(minutesAgo(7)), note: 'Order accepted' },
        { status: ORDER_STATUS.PREPARING, timestamp: formatTimeStr(minutesAgo(5)), note: 'Cooking started at Station 1 (Hot Meals)' }
      ]
    },
    {
      id: 'ORD-2026-9107',
      token: 'T-307',
      outletId: 'canteen-001',
      outletName: 'Central Dining Hall',
      outletCode: 'CDH-MAIN',
      stationId: 'station-1',
      customer: {
        name: 'Sneha Mukherjee',
        role: 'Student',
        rollNo: '2023-IT-078',
        department: 'Information Technology',
        phone: '+91 94567 89012',
        email: 'sneha.m@students.apexinstitute.edu'
      },
      items: [
        {
          id: 'i-113',
          name: 'Chole Bhature Special (2 pcs)',
          variant: 'With Punjabi Chole & Pickle Salad',
          price: 80.00,
          quantity: 1,
          total: 80.00,
          foodType: 'Veg',
          category: 'Meals & Thalis',
          stationId: 'station-1',
          imageUrl: 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?auto=format&fit=crop&w=600&q=80'
        },
        {
          id: 'i-114',
          name: 'Sweet Lassi (Chilled Malai)',
          variant: 'Topped with Almond Flakes',
          price: 40.00,
          quantity: 1,
          total: 40.00,
          foodType: 'Veg',
          category: 'Beverages',
          stationId: 'station-3',
          imageUrl: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=600&q=80'
        }
      ],
      subtotal: 120.00,
      taxAmount: 6.00,
      totalAmount: 126.00,
      orderType: 'Pickup',
      status: ORDER_STATUS.PREPARING,
      slot: {
        id: 'slot-307',
        session: 'Lunch',
        timeWindow: '12:30 PM - 12:45 PM',
        date: todayDate
      },
      orderDate: minutesAgo(12), // Elapsed 12 mins -> Warning (Orange timer)
      createdAt: minutesAgo(12),
      payment: {
        method: 'Campus Wallet',
        status: 'Paid',
        transactionId: 'TXN-WAL-994107',
        paidAt: minutesAgo(12)
      },
      timeline: [
        { status: ORDER_STATUS.PLACED, timestamp: formatTimeStr(minutesAgo(12)), note: 'Order placed' },
        { status: ORDER_STATUS.ACCEPTED, timestamp: formatTimeStr(minutesAgo(10)), note: 'Counter accepted' },
        { status: ORDER_STATUS.PREPARING, timestamp: formatTimeStr(minutesAgo(7)), note: 'Bhature frying live at Station 1' }
      ]
    },
    {
      id: 'ORD-2026-9108',
      token: 'T-308',
      outletId: 'canteen-001',
      outletName: 'Central Dining Hall',
      outletCode: 'CDH-MAIN',
      stationId: 'station-2',
      customer: {
        name: 'Aditya Sharma',
        role: 'Student',
        rollNo: '2025-ECE-102',
        department: 'Electronics & Communication',
        phone: '+91 95678 90123',
        email: 'aditya.sharma@students.apexinstitute.edu'
      },
      items: [
        {
          id: 'i-115',
          name: 'Crispy Samosa Plate (2 pcs)',
          variant: 'With Mint & Tamarind Chutney',
          price: 30.00,
          quantity: 2,
          total: 60.00,
          foodType: 'Veg',
          category: 'Snacks & Quick Bites',
          stationId: 'station-2',
          imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80'
        },
        {
          id: 'i-116',
          name: 'Masala Chai',
          variant: 'Cardamom & Ginger Infused',
          price: 15.00,
          quantity: 2,
          total: 30.00,
          foodType: 'Veg',
          category: 'Beverages',
          stationId: 'station-3',
          imageUrl: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=600&q=80'
        }
      ],
      subtotal: 90.00,
      taxAmount: 4.50,
      totalAmount: 94.50,
      orderType: 'Pickup',
      status: ORDER_STATUS.PREPARING,
      slot: {
        id: 'slot-308',
        session: 'Lunch',
        timeWindow: '12:15 PM - 12:30 PM',
        date: todayDate
      },
      orderDate: minutesAgo(18), // Elapsed 18 mins -> Overdue (Red timer)
      createdAt: minutesAgo(18),
      payment: {
        method: 'Cash',
        status: 'Paid',
        transactionId: 'TXN-CSH-994108',
        paidAt: minutesAgo(18)
      },
      timeline: [
        { status: ORDER_STATUS.PLACED, timestamp: formatTimeStr(minutesAgo(18)), note: 'Order placed' },
        { status: ORDER_STATUS.ACCEPTED, timestamp: formatTimeStr(minutesAgo(15)), note: 'Order accepted' },
        { status: ORDER_STATUS.PREPARING, timestamp: formatTimeStr(minutesAgo(10)), note: 'Samosa heating at Station 2' }
      ]
    },

    // --- 4. READY FOR PICKUP ORDERS (Awaiting Token Handover & QR Verification) ---
    {
      id: 'ORD-2026-9109',
      token: 'T-309',
      outletId: 'canteen-001',
      outletName: 'Central Dining Hall',
      outletCode: 'CDH-MAIN',
      stationId: 'station-1',
      customer: {
        name: 'Arjun Nambiar',
        role: 'Student',
        rollNo: '2023-CSE-004',
        department: 'Computer Science',
        phone: '+91 98765 11223',
        email: 'arjun.n@students.apexinstitute.edu'
      },
      items: [
        {
          id: 'i-117',
          name: 'Paneer Butter Masala Combo',
          variant: 'With Butter Naan (2 pcs)',
          price: 120.00,
          quantity: 1,
          total: 120.00,
          foodType: 'Veg',
          category: 'Main Course',
          stationId: 'station-1',
          imageUrl: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=600&q=80'
        },
        {
          id: 'i-118',
          name: 'Fresh Mint Lemonade',
          variant: 'Sweet Mint Blend',
          price: 30.00,
          quantity: 1,
          total: 30.00,
          foodType: 'Veg',
          category: 'Beverages',
          stationId: 'station-3',
          imageUrl: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80'
        }
      ],
      subtotal: 150.00,
      taxAmount: 7.50,
      totalAmount: 157.50,
      orderType: 'Pickup',
      status: ORDER_STATUS.READY_FOR_PICKUP,
      slot: {
        id: 'slot-309',
        session: 'Lunch',
        timeWindow: '12:30 PM - 12:45 PM',
        date: todayDate
      },
      orderDate: minutesAgo(24),
      createdAt: minutesAgo(24),
      payment: {
        method: 'UPI',
        status: 'Paid',
        transactionId: 'TXN-UPI-994109',
        paidAt: minutesAgo(24)
      },
      timeline: [
        { status: ORDER_STATUS.PLACED, timestamp: formatTimeStr(minutesAgo(24)), note: 'Order placed' },
        { status: ORDER_STATUS.ACCEPTED, timestamp: formatTimeStr(minutesAgo(20)), note: 'Kitchen accepted' },
        { status: ORDER_STATUS.PREPARING, timestamp: formatTimeStr(minutesAgo(15)), note: 'Meal assembled' },
        { status: ORDER_STATUS.READY_FOR_PICKUP, timestamp: formatTimeStr(minutesAgo(4)), note: 'Token T-309 flashed on Counter 02' }
      ]
    },
    {
      id: 'ORD-2026-9110',
      token: 'T-310',
      outletId: 'canteen-001',
      outletName: 'Central Dining Hall',
      outletCode: 'CDH-MAIN',
      stationId: 'station-1',
      customer: {
        name: 'Dr. Sunita Rao',
        role: 'Faculty',
        rollNo: 'FAC-BIO-042',
        department: 'Biotechnology',
        phone: '+91 98450 77890',
        email: 'sunita.rao@faculty.apexinstitute.edu'
      },
      items: [
        {
          id: 'i-119',
          name: 'South Indian Thali Special',
          variant: 'Campus Special Thali',
          price: 90.00,
          quantity: 1,
          total: 90.00,
          foodType: 'Veg',
          category: 'Meals & Thalis',
          stationId: 'station-1',
          imageUrl: 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?auto=format&fit=crop&w=600&q=80'
        },
        {
          id: 'i-120',
          name: 'Filter Coffee',
          variant: 'Degree Coffee',
          price: 25.00,
          quantity: 2,
          total: 50.00,
          foodType: 'Veg',
          category: 'Beverages',
          stationId: 'station-3',
          imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80'
        }
      ],
      subtotal: 140.00,
      taxAmount: 7.00,
      totalAmount: 147.00,
      orderType: 'Pickup',
      status: ORDER_STATUS.READY_FOR_PICKUP,
      slot: {
        id: 'slot-310',
        session: 'Lunch',
        timeWindow: '12:30 PM - 12:45 PM',
        date: todayDate
      },
      orderDate: minutesAgo(28),
      createdAt: minutesAgo(28),
      payment: {
        method: 'Campus Wallet',
        status: 'Paid',
        transactionId: 'TXN-WAL-994110',
        paidAt: minutesAgo(28)
      },
      timeline: [
        { status: ORDER_STATUS.PLACED, timestamp: formatTimeStr(minutesAgo(28)), note: 'Order placed by faculty' },
        { status: ORDER_STATUS.ACCEPTED, timestamp: formatTimeStr(minutesAgo(25)), note: 'Accepted' },
        { status: ORDER_STATUS.PREPARING, timestamp: formatTimeStr(minutesAgo(18)), note: 'Thali packed' },
        { status: ORDER_STATUS.READY_FOR_PICKUP, timestamp: formatTimeStr(minutesAgo(7)), note: 'Ready at Counter 02' }
      ]
    },
    {
      id: 'ORD-2026-9111',
      token: 'T-311',
      outletId: 'canteen-001',
      outletName: 'Central Dining Hall',
      outletCode: 'CDH-MAIN',
      stationId: 'station-2',
      customer: {
        name: 'Prateek Jain',
        role: 'Student',
        rollNo: '2024-MECH-067',
        department: 'Mechanical Engineering',
        phone: '+91 97110 33445',
        email: 'prateek.j@students.apexinstitute.edu'
      },
      items: [
        {
          id: 'i-121',
          name: 'Egg Fried Rice & Manchurian Bowl',
          variant: 'Double Egg with Veg Manchurian',
          price: 110.00,
          quantity: 1,
          total: 110.00,
          foodType: 'Egg',
          category: 'Rice Bowls',
          stationId: 'station-2',
          imageUrl: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=600&q=80'
        },
        {
          id: 'i-122',
          name: 'Cold Coffee with Ice Cream',
          variant: 'Vanilla Topping',
          price: 55.00,
          quantity: 1,
          total: 55.00,
          foodType: 'Veg',
          category: 'Beverages',
          stationId: 'station-3',
          imageUrl: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=600&q=80'
        }
      ],
      subtotal: 165.00,
      taxAmount: 8.25,
      totalAmount: 173.25,
      orderType: 'Pickup',
      status: ORDER_STATUS.READY_FOR_PICKUP,
      slot: {
        id: 'slot-311',
        session: 'Lunch',
        timeWindow: '12:15 PM - 12:30 PM',
        date: todayDate
      },
      orderDate: minutesAgo(30),
      createdAt: minutesAgo(30),
      payment: {
        method: 'UPI',
        status: 'Paid',
        transactionId: 'TXN-UPI-994111',
        paidAt: minutesAgo(30)
      },
      timeline: [
        { status: ORDER_STATUS.PLACED, timestamp: formatTimeStr(minutesAgo(30)), note: 'Order placed' },
        { status: ORDER_STATUS.ACCEPTED, timestamp: formatTimeStr(minutesAgo(26)), note: 'Counter accepted' },
        { status: ORDER_STATUS.PREPARING, timestamp: formatTimeStr(minutesAgo(20)), note: 'Rice tossed at Station 2' },
        { status: ORDER_STATUS.READY_FOR_PICKUP, timestamp: formatTimeStr(minutesAgo(10)), note: 'Token T-311 ready at Express Counter' }
      ]
    },

    // --- 5. COMPLETED ORDERS (Verified & Handed Over) ---
    {
      id: 'ORD-2026-9112',
      token: 'T-312',
      outletId: 'canteen-001',
      outletName: 'Central Dining Hall',
      outletCode: 'CDH-MAIN',
      stationId: 'station-1',
      customer: {
        name: 'Tanvi Gupta',
        role: 'Student',
        rollNo: '2025-BARC-011',
        department: 'Architecture & Design',
        phone: '+91 96543 21098',
        email: 'tanvi.g@students.apexinstitute.edu'
      },
      items: [
        {
          id: 'i-123',
          name: 'Masala Dosa Crisp',
          variant: 'With Coconut & Tomato Chutney',
          price: 55.00,
          quantity: 1,
          total: 55.00,
          foodType: 'Veg',
          category: 'South Indian Tiffin',
          stationId: 'station-1',
          imageUrl: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=600&q=80'
        },
        {
          id: 'i-124',
          name: 'Filter Coffee',
          variant: 'Hot Degree Coffee',
          price: 25.00,
          quantity: 1,
          total: 25.00,
          foodType: 'Veg',
          category: 'Beverages',
          stationId: 'station-3',
          imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80'
        }
      ],
      subtotal: 80.00,
      taxAmount: 4.00,
      totalAmount: 84.00,
      orderType: 'Pickup',
      status: ORDER_STATUS.COMPLETED,
      slot: {
        id: 'slot-312',
        session: 'Lunch',
        timeWindow: '12:00 PM - 12:15 PM',
        date: todayDate
      },
      orderDate: minutesAgo(50),
      createdAt: minutesAgo(50),
      payment: {
        method: 'UPI',
        status: 'Paid',
        transactionId: 'TXN-UPI-994112',
        paidAt: minutesAgo(50)
      },
      timeline: [
        { status: ORDER_STATUS.PLACED, timestamp: formatTimeStr(minutesAgo(50)), note: 'Order placed' },
        { status: ORDER_STATUS.ACCEPTED, timestamp: formatTimeStr(minutesAgo(45)), note: 'Accepted' },
        { status: ORDER_STATUS.PREPARING, timestamp: formatTimeStr(minutesAgo(38)), note: 'Prepared' },
        { status: ORDER_STATUS.READY_FOR_PICKUP, timestamp: formatTimeStr(minutesAgo(25)), note: 'Flashing on display' },
        { status: ORDER_STATUS.COMPLETED, timestamp: formatTimeStr(minutesAgo(15)), note: 'Token verified & order handed over', operator: 'Rameshwar Rao' }
      ]
    },
    {
      id: 'ORD-2026-9113',
      token: 'T-313',
      outletId: 'canteen-001',
      outletName: 'Central Dining Hall',
      outletCode: 'CDH-MAIN',
      stationId: 'station-1',
      customer: {
        name: 'Manoj Tiwari',
        role: 'Student',
        rollNo: '2023-CIV-082',
        department: 'Civil Engineering',
        phone: '+91 95432 10987',
        email: 'manoj.t@students.apexinstitute.edu'
      },
      items: [
        {
          id: 'i-125',
          name: 'South Indian Thali Special',
          variant: 'Standard Campus Thali',
          price: 90.00,
          quantity: 2,
          total: 180.00,
          foodType: 'Veg',
          category: 'Meals & Thalis',
          stationId: 'station-1',
          imageUrl: 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?auto=format&fit=crop&w=600&q=80'
        }
      ],
      subtotal: 180.00,
      taxAmount: 9.00,
      totalAmount: 189.00,
      orderType: 'Dine-in',
      status: ORDER_STATUS.COMPLETED,
      slot: {
        id: 'slot-313',
        session: 'Lunch',
        timeWindow: '12:00 PM - 12:15 PM',
        date: todayDate
      },
      orderDate: minutesAgo(65),
      createdAt: minutesAgo(65),
      payment: {
        method: 'Cash',
        status: 'Paid',
        transactionId: 'TXN-CSH-994113',
        paidAt: minutesAgo(65)
      },
      timeline: [
        { status: ORDER_STATUS.PLACED, timestamp: formatTimeStr(minutesAgo(65)), note: 'Booked' },
        { status: ORDER_STATUS.ACCEPTED, timestamp: formatTimeStr(minutesAgo(60)), note: 'Accepted' },
        { status: ORDER_STATUS.PREPARING, timestamp: formatTimeStr(minutesAgo(50)), note: 'Plated' },
        { status: ORDER_STATUS.READY_FOR_PICKUP, timestamp: formatTimeStr(minutesAgo(35)), note: 'Ready' },
        { status: ORDER_STATUS.COMPLETED, timestamp: formatTimeStr(minutesAgo(22)), note: 'Token verified by Rameshwar Rao', operator: 'Rameshwar Rao' }
      ]
    },
    {
      id: 'ORD-2026-9114',
      token: 'T-314',
      outletId: 'canteen-001',
      outletName: 'Central Dining Hall',
      outletCode: 'CDH-MAIN',
      stationId: 'station-1',
      customer: {
        name: 'Dr. Ramesh Patel',
        role: 'Faculty',
        rollNo: 'FAC-ADM-001',
        department: 'Dean Student Welfare',
        phone: '+91 94321 09876',
        email: 'r.patel@apexinstitute.edu'
      },
      items: [
        {
          id: 'i-126',
          name: 'Paneer Butter Masala Combo',
          variant: 'With Butter Naan (2 pcs)',
          price: 120.00,
          quantity: 1,
          total: 120.00,
          foodType: 'Veg',
          category: 'Main Course',
          stationId: 'station-1',
          imageUrl: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=600&q=80'
        },
        {
          id: 'i-127',
          name: 'Sweet Lassi (Chilled Malai)',
          variant: 'Thick Lassi',
          price: 40.00,
          quantity: 1,
          total: 40.00,
          foodType: 'Veg',
          category: 'Beverages',
          stationId: 'station-3',
          imageUrl: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=600&q=80'
        }
      ],
      subtotal: 160.00,
      taxAmount: 8.00,
      totalAmount: 168.00,
      orderType: 'Pickup',
      status: ORDER_STATUS.COMPLETED,
      slot: {
        id: 'slot-314',
        session: 'Lunch',
        timeWindow: '11:45 AM - 12:00 PM',
        date: todayDate
      },
      orderDate: hoursAgo(2),
      createdAt: hoursAgo(2),
      payment: {
        method: 'UPI',
        status: 'Paid',
        transactionId: 'TXN-UPI-994114',
        paidAt: hoursAgo(2)
      },
      timeline: [
        { status: ORDER_STATUS.PLACED, timestamp: formatTimeStr(hoursAgo(2)), note: 'Order placed' },
        { status: ORDER_STATUS.ACCEPTED, timestamp: formatTimeStr(minutesAgo(110)), note: 'Accepted' },
        { status: ORDER_STATUS.PREPARING, timestamp: formatTimeStr(minutesAgo(95)), note: 'Cooked' },
        { status: ORDER_STATUS.READY_FOR_PICKUP, timestamp: formatTimeStr(minutesAgo(80)), note: 'Ready' },
        { status: ORDER_STATUS.COMPLETED, timestamp: formatTimeStr(minutesAgo(65)), note: 'Collected by Dean office assistant', operator: 'Rameshwar Rao' }
      ]
    },
    {
      id: 'ORD-2026-9115',
      token: 'T-315',
      outletId: 'canteen-001',
      outletName: 'Central Dining Hall',
      outletCode: 'CDH-MAIN',
      stationId: 'station-2',
      customer: {
        name: 'Siddharth Varma',
        role: 'Student',
        rollNo: '2026-CSE-210',
        department: 'Computer Science (1st Yr)',
        phone: '+91 93210 98765',
        email: 'sid.varma@students.apexinstitute.edu'
      },
      items: [
        {
          id: 'i-128',
          name: 'Grilled Veg Club Sandwich',
          variant: 'Grilled Golden Crisp',
          price: 70.00,
          quantity: 1,
          total: 70.00,
          foodType: 'Veg',
          category: 'Snacks & Quick Bites',
          stationId: 'station-2',
          imageUrl: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=600&q=80'
        },
        {
          id: 'i-129',
          name: 'Cold Coffee with Ice Cream',
          variant: 'Chilled Shake',
          price: 55.00,
          quantity: 1,
          total: 55.00,
          foodType: 'Veg',
          category: 'Beverages',
          stationId: 'station-3',
          imageUrl: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=600&q=80'
        }
      ],
      subtotal: 125.00,
      taxAmount: 6.25,
      totalAmount: 131.25,
      orderType: 'Pickup',
      status: ORDER_STATUS.COMPLETED,
      slot: {
        id: 'slot-315',
        session: 'Breakfast',
        timeWindow: '10:30 AM - 10:45 AM',
        date: todayDate
      },
      orderDate: hoursAgo(3),
      createdAt: hoursAgo(3),
      payment: {
        method: 'UPI',
        status: 'Paid',
        transactionId: 'TXN-UPI-994115',
        paidAt: hoursAgo(3)
      },
      timeline: [
        { status: ORDER_STATUS.PLACED, timestamp: formatTimeStr(hoursAgo(3)), note: 'Order placed' },
        { status: ORDER_STATUS.ACCEPTED, timestamp: formatTimeStr(minutesAgo(170)), note: 'Accepted' },
        { status: ORDER_STATUS.PREPARING, timestamp: formatTimeStr(minutesAgo(160)), note: 'Toasted' },
        { status: ORDER_STATUS.READY_FOR_PICKUP, timestamp: formatTimeStr(minutesAgo(145)), note: 'Ready' },
        { status: ORDER_STATUS.COMPLETED, timestamp: formatTimeStr(minutesAgo(135)), note: 'Picked up at Express Counter', operator: 'Rameshwar Rao' }
      ]
    },

    // --- 6. HISTORICAL RECENT ORDERS (Past 2 - 4 Days for Weekly/Monthly Analytics) ---
    {
      id: 'ORD-2026-9116',
      token: 'T-316',
      outletId: 'canteen-001',
      outletName: 'Central Dining Hall',
      outletCode: 'CDH-MAIN',
      stationId: 'station-1',
      customer: {
        name: 'Neha Chawla',
        role: 'Student',
        rollNo: '2024-BIO-044',
        department: 'Biotechnology',
        phone: '+91 92109 87654',
        email: 'neha.c@students.apexinstitute.edu'
      },
      items: [
        {
          id: 'i-130',
          name: 'Paneer Butter Masala Combo',
          variant: 'With Jeera Rice Bowl',
          price: 130.00,
          quantity: 2,
          total: 260.00,
          foodType: 'Veg',
          category: 'Main Course',
          stationId: 'station-1',
          imageUrl: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=600&q=80'
        }
      ],
      subtotal: 260.00,
      taxAmount: 13.00,
      totalAmount: 273.00,
      orderType: 'Pickup',
      status: ORDER_STATUS.COMPLETED,
      slot: {
        id: 'slot-316',
        session: 'Dinner',
        timeWindow: '08:00 PM - 08:15 PM',
        date: daysAgo(1).split('T')[0]
      },
      orderDate: daysAgo(1),
      createdAt: daysAgo(1),
      payment: {
        method: 'UPI',
        status: 'Paid',
        transactionId: 'TXN-UPI-994116',
        paidAt: daysAgo(1)
      },
      timeline: [
        { status: ORDER_STATUS.COMPLETED, timestamp: '08:12 PM', note: 'Collected successfully' }
      ]
    },
    {
      id: 'ORD-2026-9117',
      token: 'T-317',
      outletId: 'canteen-001',
      outletName: 'Central Dining Hall',
      outletCode: 'CDH-MAIN',
      stationId: 'station-1',
      customer: {
        name: 'Gaurav Bhatt',
        role: 'Student',
        rollNo: '2023-MECH-091',
        department: 'Mechanical Engineering',
        phone: '+91 91098 76543',
        email: 'gaurav.b@students.apexinstitute.edu'
      },
      items: [
        {
          id: 'i-131',
          name: 'South Indian Thali Special',
          variant: 'Standard Thali',
          price: 90.00,
          quantity: 1,
          total: 90.00,
          foodType: 'Veg',
          category: 'Meals & Thalis',
          stationId: 'station-1',
          imageUrl: 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?auto=format&fit=crop&w=600&q=80'
        },
        {
          id: 'i-132',
          name: 'Crispy Samosa Plate (2 pcs)',
          variant: 'Evening Snack',
          price: 30.00,
          quantity: 1,
          total: 30.00,
          foodType: 'Veg',
          category: 'Snacks & Quick Bites',
          stationId: 'station-2',
          imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80'
        }
      ],
      subtotal: 120.00,
      taxAmount: 6.00,
      totalAmount: 126.00,
      orderType: 'Pickup',
      status: ORDER_STATUS.COMPLETED,
      slot: {
        id: 'slot-317',
        session: 'Lunch',
        timeWindow: '01:00 PM - 01:15 PM',
        date: daysAgo(2).split('T')[0]
      },
      orderDate: daysAgo(2),
      createdAt: daysAgo(2),
      payment: {
        method: 'Campus Wallet',
        status: 'Paid',
        transactionId: 'TXN-WAL-994117',
        paidAt: daysAgo(2)
      },
      timeline: [
        { status: ORDER_STATUS.COMPLETED, timestamp: '01:14 PM', note: 'Token verified & delivered' }
      ]
    },

    // --- 7. CANCELLED / REFUNDED ORDERS ---
    {
      id: 'ORD-2026-9118',
      token: 'T-318',
      outletId: 'canteen-001',
      outletName: 'Central Dining Hall',
      outletCode: 'CDH-MAIN',
      stationId: 'station-1',
      customer: {
        name: 'Aarav Mehta',
        role: 'Student',
        rollNo: '2023-CSE-042',
        department: 'Computer Science',
        phone: '+91 98765 43210',
        email: 'aarav.mehta@students.apexinstitute.edu'
      },
      items: [
        {
          id: 'i-133',
          name: 'Paneer Butter Masala Combo',
          variant: 'With Butter Naan (2 pcs)',
          price: 120.00,
          quantity: 1,
          total: 120.00,
          foodType: 'Veg',
          category: 'Main Course',
          stationId: 'station-1',
          imageUrl: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=600&q=80'
        }
      ],
      subtotal: 120.00,
      taxAmount: 6.00,
      totalAmount: 126.00,
      orderType: 'Pickup',
      status: ORDER_STATUS.CANCELLED,
      slot: {
        id: 'slot-318',
        session: 'Lunch',
        timeWindow: '12:30 PM - 12:45 PM',
        date: todayDate
      },
      orderDate: hoursAgo(1),
      createdAt: hoursAgo(1),
      payment: {
        method: 'UPI',
        status: 'Refunded',
        transactionId: 'TXN-UPI-994118',
        paidAt: hoursAgo(1)
      },
      cancellationReason: 'Student surprise lab session scheduled; requested cancellation within grace period.',
      timeline: [
        { status: ORDER_STATUS.PLACED, timestamp: formatTimeStr(hoursAgo(1)), note: 'Order placed' },
        { status: ORDER_STATUS.CANCELLED, timestamp: formatTimeStr(minutesAgo(52)), note: 'Cancelled by customer: Student lab session scheduled' },
        { status: ORDER_STATUS.REFUNDED, timestamp: formatTimeStr(minutesAgo(51)), note: 'Refund of ₹126.00 initiated via UPI Gateway' }
      ]
    },
    {
      id: 'ORD-2026-9119',
      token: 'T-319',
      outletId: 'canteen-001',
      outletName: 'Central Dining Hall',
      outletCode: 'CDH-MAIN',
      stationId: 'station-3',
      customer: {
        name: 'Kavya Nair',
        role: 'Student',
        rollNo: '2025-ECE-064',
        department: 'Electronics & Communication',
        phone: '+91 97890 12345',
        email: 'kavya.n@students.apexinstitute.edu'
      },
      items: [
        {
          id: 'i-134',
          name: 'Fresh Mint Lemonade',
          variant: 'Sweet Lime Infusion',
          price: 30.00,
          quantity: 3,
          total: 90.00,
          foodType: 'Veg',
          category: 'Beverages',
          stationId: 'station-3',
          imageUrl: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80'
        }
      ],
      subtotal: 90.00,
      taxAmount: 4.50,
      totalAmount: 94.50,
      orderType: 'Pickup',
      status: ORDER_STATUS.CANCELLED,
      slot: {
        id: 'slot-319',
        session: 'Lunch',
        timeWindow: '01:00 PM - 01:15 PM',
        date: todayDate
      },
      orderDate: hoursAgo(2),
      createdAt: hoursAgo(2),
      payment: {
        method: 'Cash',
        status: 'Refunded',
        transactionId: 'TXN-CSH-994119',
        paidAt: hoursAgo(2)
      },
      cancellationReason: 'Ordered at wrong dining hall (meant for North Campus Food Court).',
      timeline: [
        { status: ORDER_STATUS.PLACED, timestamp: formatTimeStr(hoursAgo(2)), note: 'Order placed' },
        { status: ORDER_STATUS.CANCELLED, timestamp: formatTimeStr(hoursAgo(2)), note: 'Cancelled due to wrong campus outlet selected' }
      ]
    }
  ];
};

export const INITIAL_STAFF_ORDERS = getFreshStaffOrders();
