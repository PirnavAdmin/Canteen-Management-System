/**
 * Menu Management Constants & Initial Seed Data
 */

export const INITIAL_MENU_ITEMS = [
  {
    id: 'menu-101',
    code: 'PBM-01',
    name: 'Paneer Butter Masala Combo',
    description: 'Cottage cheese cubes simmered in creamy rich tomato gravy, served with 2 butter naans or jeera rice and pickle.',
    category: 'Main Course',
    categoryId: 'cat-2',
    outletId: 'canteen-001',
    outletName: 'Central Dining Hall',
    foodType: 'Veg',
    price: 120.00,
    dailyCapacity: 120,
    remainingCapacity: 34,
    availability: 'Available',
    status: 'Active',
    publicationStatus: 'Published',
    servingSize: '1 Plate (350g)',
    calories: '480 kcal',
    allergens: ['Dairy / Milk'],
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    startTime: '11:30',
    endTime: '15:30',
    historicalOrderCount: 412,
    variants: [
      { id: 'v1', name: 'With Butter Naan (2 pcs)', price: 120.00 },
      { id: 'v2', name: 'With Jeera Rice Bowl', price: 130.00 },
      { id: 'v3', name: 'Combo (Naan + Rice + Gulab Jamun)', price: 160.00 }
    ],
    addOns: [
      { id: 'a1', name: 'Extra Butter Naan', price: 25.00 },
      { id: 'a2', name: 'Roasted Papad & Pickle', price: 15.00 },
      { id: 'a3', name: 'Boondi Raita (100ml)', price: 20.00 }
    ]
  },
  {
    id: 'menu-102',
    code: 'SIT-02',
    name: 'South Indian Thali Special',
    description: 'Traditional campus thali featuring steamed rice, sambar, rasam, kootu, poriyal, curd, appalam, and sweet payasam.',
    category: 'Meals & Thalis',
    categoryId: 'cat-2',
    outletId: 'canteen-001',
    outletName: 'Central Dining Hall',
    foodType: 'Veg',
    price: 90.00,
    dailyCapacity: 200,
    remainingCapacity: 126,
    availability: 'Available',
    status: 'Active',
    publicationStatus: 'Published',
    servingSize: '1 Full Thali',
    calories: '560 kcal',
    allergens: ['Mustard'],
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    startTime: '12:00',
    endTime: '15:00',
    historicalOrderCount: 680,
    variants: [
      { id: 'v1', name: 'Standard Thali', price: 90.00 },
      { id: 'v2', name: 'Special Thali (with Vada & Sweet)', price: 110.00 }
    ],
    addOns: [
      { id: 'a1', name: 'Crispy Medu Vada (1 pc)', price: 20.00 },
      { id: 'a2', name: 'Fresh Curd Cup', price: 15.00 }
    ]
  },
  {
    id: 'menu-103',
    code: 'CSW-03',
    name: 'Grilled Cheese Club Sandwich',
    description: 'Triple-layer toasted sandwich stuffed with spiced potatoes, bell peppers, processed cheese, and mint chutney.',
    category: 'Snacks & Quick Bites',
    categoryId: 'cat-3',
    outletId: 'canteen-003',
    outletName: 'Engineering Block Kiosk',
    foodType: 'Veg',
    price: 70.00,
    dailyCapacity: 80,
    remainingCapacity: 18,
    availability: 'Available',
    status: 'Active',
    publicationStatus: 'Published',
    servingSize: '2 Halves (220g)',
    calories: '320 kcal',
    allergens: ['Gluten / Wheat', 'Dairy / Milk'],
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    startTime: '09:00',
    endTime: '18:00',
    historicalOrderCount: 295,
    variants: [
      { id: 'v1', name: 'Regular Grilled', price: 70.00 },
      { id: 'v2', name: 'Double Cheese Overload', price: 95.00 }
    ],
    addOns: [
      { id: 'a1', name: 'Potato Fries (Small)', price: 35.00 },
      { id: 'a2', name: 'Cheese Dip', price: 15.00 }
    ]
  },
  {
    id: 'menu-104',
    code: 'EFR-04',
    name: 'Egg Fried Rice & Veg Manchurian',
    description: 'Wok-tossed basmati rice with scrambled eggs, spring onions, soya, served with savoury vegetable Manchurian balls in gravy.',
    category: 'Main Course',
    categoryId: 'cat-2',
    outletId: 'canteen-002',
    outletName: 'North Campus Food Court',
    foodType: 'Egg',
    price: 100.00,
    dailyCapacity: 90,
    remainingCapacity: 39,
    availability: 'Available',
    status: 'Active',
    publicationStatus: 'Published',
    servingSize: '1 Bowl (400g)',
    calories: '510 kcal',
    allergens: ['Eggs', 'Soy', 'Gluten / Wheat'],
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    startTime: '12:00',
    endTime: '19:30',
    historicalOrderCount: 310,
    variants: [
      { id: 'v1', name: 'Regular Egg Fried Rice Combo', price: 100.00 },
      { id: 'v2', name: 'Double Egg Rice Bowl', price: 120.00 }
    ],
    addOns: [
      { id: 'a1', name: 'Extra Manchurian Balls (2 pcs)', price: 30.00 }
    ]
  },
  {
    id: 'menu-105',
    code: 'FML-05',
    name: 'Fresh Mint Lemonade',
    description: 'Chilled refreshing lemon cooler infused with crushed garden mint and black salt.',
    category: 'Beverages',
    categoryId: 'cat-4',
    outletId: 'canteen-001',
    outletName: 'Central Dining Hall',
    foodType: 'Veg',
    price: 30.00,
    dailyCapacity: 150,
    remainingCapacity: 98,
    availability: 'Available',
    status: 'Active',
    publicationStatus: 'Published',
    servingSize: '300 ml Glass',
    calories: '85 kcal',
    allergens: [],
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    startTime: '08:00',
    endTime: '20:00',
    historicalOrderCount: 520,
    variants: [
      { id: 'v1', name: 'Sweet Mint Lemonade', price: 30.00 },
      { id: 'v2', name: 'Sweet & Salted Soda Cooler', price: 40.00 }
    ],
    addOns: []
  },
  {
    id: 'menu-106',
    code: 'CKB-06',
    name: 'Hyderabadi Chicken Biryani',
    description: 'Dum-cooked aromatic spiced basmati rice layered with marinated tender chicken pieces, served with mirchi ka salan and raita.',
    category: 'Main Course',
    categoryId: 'cat-2',
    outletId: 'canteen-002',
    outletName: 'North Campus Food Court',
    foodType: 'Non-veg',
    price: 150.00,
    dailyCapacity: 75,
    remainingCapacity: 12,
    availability: 'Available',
    status: 'Active',
    publicationStatus: 'Published',
    servingSize: '1 Handi (450g)',
    calories: '650 kcal',
    allergens: ['Dairy / Milk'],
    workingDays: ['Wednesday', 'Friday', 'Sunday'],
    startTime: '12:30',
    endTime: '15:30',
    historicalOrderCount: 480,
    variants: [
      { id: 'v1', name: 'Single Chicken Biryani Handi', price: 150.00 },
      { id: 'v2', name: 'Special Biryani (Double Chicken + Egg)', price: 190.00 }
    ],
    addOns: [
      { id: 'a1', name: 'Boiled Egg (1 pc)', price: 15.00 },
      { id: 'a2', name: 'Extra Salan Gravy Cup', price: 20.00 }
    ]
  }
];

