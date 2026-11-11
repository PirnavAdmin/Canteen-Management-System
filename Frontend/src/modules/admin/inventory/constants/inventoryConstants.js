/**
 * Inventory Management Constants & Initial Seed Data
 */

export const INITIAL_INVENTORY_ITEMS = [
  {
    id: 'inv-01',
    ingredientName: 'Full Cream Milk (Amul)',
    itemCode: 'ING-MLK-01',
    unit: 'liters',
    availableQuantity: 12,
    reorderLevel: 30,
    batchNumber: 'B-AML-882',
    expiryDate: '2026-11-13',
    supplierId: 'sup-01',
    supplierName: 'Amul Dairy Cooperative',
    outletId: 'canteen-001',
    outletName: 'Central Dining Hall',
    status: 'Low Stock'
  },
  {
    id: 'inv-02',
    ingredientName: 'Fresh Paneer Blocks',
    itemCode: 'ING-PNR-02',
    unit: 'kg',
    availableQuantity: 4.5,
    reorderLevel: 10,
    batchNumber: 'B-PNR-411',
    expiryDate: '2026-11-12',
    supplierId: 'sup-01',
    supplierName: 'Amul Dairy Cooperative',
    outletId: 'canteen-001',
    outletName: 'Central Dining Hall',
    status: 'Low Stock'
  },
  {
    id: 'inv-03',
    ingredientName: 'Basmati Rice (Daawat Supreme)',
    itemCode: 'ING-RIC-03',
    unit: 'kg',
    availableQuantity: 180,
    reorderLevel: 50,
    batchNumber: 'B-DWT-902',
    expiryDate: '2027-05-15',
    supplierId: 'sup-02',
    supplierName: 'Agro Foods Distribution Ltd',
    outletId: 'canteen-001',
    outletName: 'Central Dining Hall',
    status: 'In Stock'
  },
  {
    id: 'inv-04',
    ingredientName: 'Sunflower Cooking Oil (Fortune 15L)',
    itemCode: 'ING-OIL-04',
    unit: 'boxes',
    availableQuantity: 1,
    reorderLevel: 4,
    batchNumber: 'B-FTN-601',
    expiryDate: '2027-08-30',
    supplierId: 'sup-02',
    supplierName: 'Agro Foods Distribution Ltd',
    outletId: 'canteen-002',
    outletName: 'North Campus Food Court',
    status: 'Low Stock'
  },
  {
    id: 'inv-05',
    ingredientName: 'Burger Buns (Pack of 6)',
    itemCode: 'ING-BUN-05',
    unit: 'packets',
    availableQuantity: 8,
    reorderLevel: 25,
    batchNumber: 'B-BRD-102',
    expiryDate: '2026-11-12',
    supplierId: 'sup-03',
    supplierName: 'Fresh Bakers Campus Supply',
    outletId: 'canteen-003',
    outletName: 'Engineering Block Kiosk',
    status: 'Expiring Soon'
  },
  {
    id: 'inv-06',
    ingredientName: 'Fresh Farm Eggs (Tray of 30)',
    itemCode: 'ING-EGG-06',
    unit: 'boxes',
    availableQuantity: 6,
    reorderLevel: 5,
    batchNumber: 'B-EGG-774',
    expiryDate: '2026-11-20',
    supplierId: 'sup-04',
    supplierName: 'Greenfield Poultry Farms',
    outletId: 'canteen-002',
    outletName: 'North Campus Food Court',
    status: 'In Stock'
  }
];

export const INITIAL_STOCK_MOVEMENTS = [
  {
    id: 'mov-1001',
    ingredientId: 'inv-01',
    ingredientName: 'Full Cream Milk (Amul)',
    movementType: 'Stock Out',
    quantity: 18,
    unit: 'liters',
    batchNumber: 'B-AML-882',
    expiryDate: '2026-11-13',
    reference: 'REQ-KIT-LUNCH-01',
    reason: 'Issued for Chai, Coffee and Paneer gravy prep',
    dateTime: '2026-11-11T10:30:00.000Z',
    performedBy: 'Chef Rameshwar Rao (Head Chef)'
  },
  {
    id: 'mov-1002',
    ingredientId: 'inv-03',
    ingredientName: 'Basmati Rice (Daawat Supreme)',
    movementType: 'Stock In',
    quantity: 100,
    unit: 'kg',
    batchNumber: 'B-DWT-902',
    expiryDate: '2027-05-15',
    reference: 'PO-2026-0881',
    reason: 'Purchase order delivery received from Agro Foods',
    dateTime: '2026-11-10T14:15:00.000Z',
    performedBy: 'Store Keeper M. Naidu'
  },
  {
    id: 'mov-1003',
    ingredientId: 'inv-05',
    ingredientName: 'Burger Buns (Pack of 6)',
    movementType: 'Wastage',
    quantity: 3,
    unit: 'packets',
    batchNumber: 'B-BRD-098',
    expiryDate: '2026-11-10',
    reference: 'AUD-WST-991',
    reason: 'Package torn during transit, deemed unfit for hygiene',
    dateTime: '2026-11-10T16:00:00.000Z',
    performedBy: 'Kiosk Incharge S. Kulkarni'
  },
  {
    id: 'mov-1004',
    ingredientId: 'inv-02',
    ingredientName: 'Fresh Paneer Blocks',
    movementType: 'Adjustment',
    quantity: -1.5,
    unit: 'kg',
    batchNumber: 'B-PNR-411',
    expiryDate: '2026-11-12',
    reference: 'PHY-AUD-042',
    reason: 'Physical inventory audit variance adjustment',
    dateTime: '2026-11-11T08:00:00.000Z',
    performedBy: 'Dr. Rajesh Sharma (Administrator)'
  }
];

export const INITIAL_PURCHASE_ORDERS = [
  {
    id: 'po-101',
    poNumber: 'PO-2026-0881',
    supplierId: 'sup-02',
    supplierName: 'Agro Foods Distribution Ltd',
    orderDate: '2026-11-08',
    expectedDelivery: '2026-11-10',
    items: [
      { ingredientName: 'Basmati Rice (Daawat Supreme)', qty: 100, unit: 'kg', unitPrice: 85, total: 8500 },
      { ingredientName: 'Toor Dal (Premium)', qty: 50, unit: 'kg', unitPrice: 120, total: 6000 }
    ],
    totalAmount: 14500.00,
    status: 'Received'
  },
  {
    id: 'po-102',
    poNumber: 'PO-2026-0882',
    supplierId: 'sup-01',
    supplierName: 'Amul Dairy Cooperative',
    orderDate: '2026-11-11',
    expectedDelivery: '2026-11-12',
    items: [
      { ingredientName: 'Full Cream Milk', qty: 50, unit: 'liters', unitPrice: 56, total: 2800 },
      { ingredientName: 'Fresh Paneer Blocks', qty: 20, unit: 'kg', unitPrice: 320, total: 6400 }
    ],
    totalAmount: 9200.00,
    status: 'Approved'
  },
  {
    id: 'po-103',
    poNumber: 'PO-2026-0883',
    supplierId: 'sup-03',
    supplierName: 'Fresh Bakers Campus Supply',
    orderDate: '2026-11-11',
    expectedDelivery: '2026-11-13',
    items: [
      { ingredientName: 'Burger Buns (Pack of 6)', qty: 40, unit: 'packets', unitPrice: 35, total: 1400 },
      { ingredientName: 'Jumbo Sandwich Bread', qty: 30, unit: 'packets', unitPrice: 40, total: 1200 }
    ],
    totalAmount: 2600.00,
    status: 'Submitted'
  }
];

export const INITIAL_SUPPLIERS = [
  {
    id: 'sup-01',
    name: 'Amul Dairy Cooperative',
    contactPerson: 'Suresh Patel',
    email: 'suresh.patel@amulsupply.co.in',
    phone: '+91 98250 44332',
    address: 'GIDC Industrial Estate, Anand, Gujarat',
    suppliedCategories: 'Dairy Products, Milk, Paneer, Butter',
    status: 'Active'
  },
  {
    id: 'sup-02',
    name: 'Agro Foods Distribution Ltd',
    contactPerson: 'Harish Bansal',
    email: 'orders@agrofoodsdist.com',
    phone: '+91 99880 12345',
    address: 'Grain Market Yard, APMC Terminal, New Delhi',
    suppliedCategories: 'Grains, Rice, Pulses, Cooking Oils',
    status: 'Active'
  },
  {
    id: 'sup-03',
    name: 'Fresh Bakers Campus Supply',
    contactPerson: 'Mohan Lal',
    email: 'freshbakers.campus@gmail.com',
    phone: '+91 94140 88990',
    address: 'Plot 14, Institutional Bakery Hub, Jaipur',
    suppliedCategories: 'Breads, Buns, Bakery Doughs',
    status: 'Active'
  },
  {
    id: 'sup-04',
    name: 'Greenfield Poultry Farms',
    contactPerson: 'Farhan Akhtar',
    email: 'supply@greenfieldpoultry.org',
    phone: '+91 97110 55443',
    address: 'Farmlands Sector 8, Haryana',
    suppliedCategories: 'Fresh Farm Eggs, Poultry Meat',
    status: 'Active'
  }
];

