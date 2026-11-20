/**
 * Customer Menu Constants & Verified Seed Data
 * Includes all dishes specified in the SRS & user prompt with appetizing photography.
 */

export const CUSTOMER_CATEGORIES = [
  { id: 'ALL', name: 'All Menu' },
  { id: 'Breakfast', name: 'Breakfast' },
  { id: 'Meals', name: 'Meals & Thalis' },
  { id: 'Snacks', name: 'Snacks & Quick Bites' },
  { id: 'Beverages', name: 'Beverages & Coolers' }
];

export const CUSTOMER_FOOD_ITEMS = [
  {
    id: 'food-01',
    code: 'IDL-01',
    name: 'Steamed Idli Sambar (2 pcs)',
    description: 'Piping hot, fluffy steamed rice and lentil cakes served with home-style drumstick sambar, coconut chutney, and spicy tomato dip.',
    category: 'Breakfast',
    outletId: 'canteen-001',
    outletName: 'Central Dining Hall',
    foodType: 'Veg',
    price: 40.00,
    dailyCapacity: 150,
    remainingCapacity: 45,
    availability: 'Available',
    rating: 4.8,
    ratingCount: 142,
    prepTime: '5-8 mins',
    servingSize: '2 Pieces (180g)',
    calories: '160 kcal',
    imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=600&q=80',
    isFeatured: true,
    isPopular: true,
    allergens: [],
    variants: [
      { id: 'v1', name: 'Standard (2 pcs)', price: 40.00 },
      { id: 'v2', name: 'Idli-Vada Combo (2 Idlis + 1 Vada)', price: 65.00 }
    ],
    addOns: [
      { id: 'a1', name: 'Extra Crispy Medu Vada', price: 25.00 },
      { id: 'a2', name: 'Extra Sambar Bowl', price: 10.00 }
    ]
  },
  {
    id: 'food-02',
    code: 'MDS-02',
    name: 'Crispy Butter Masala Dosa',
    description: 'Golden fermented rice crepe roasted in pure butter, filled with spiced mashed potato sabzi, served with coconut chutney & lentil sambar.',
    category: 'Breakfast',
    outletId: 'canteen-001',
    outletName: 'Central Dining Hall',
    foodType: 'Veg',
    price: 60.00,
    dailyCapacity: 120,
    remainingCapacity: 28,
    availability: 'Available',
    rating: 4.9,
    ratingCount: 230,
    prepTime: '8-10 mins',
    servingSize: '1 Full Dosa (250g)',
    calories: '320 kcal',
    imageUrl: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=600&q=80',
    isFeatured: true,
    isPopular: true,
    allergens: ['Dairy / Milk'],
    variants: [
      { id: 'v1', name: 'Regular Masala Dosa', price: 60.00 },
      { id: 'v2', name: 'Cheese Masala Dosa', price: 80.00 },
      { id: 'v3', name: 'Mysore Masala Dosa (Spicy Red Chutney)', price: 75.00 }
    ],
    addOns: [
      { id: 'a1', name: 'Gunpowder (Podi) with Ghee', price: 20.00 }
    ]
  },
  {
    id: 'food-03',
    code: 'VTL-03',
    name: 'Executive Deluxe Veg Thali',
    description: 'Complete wholesome meal featuring Paneer Butter Masala, Dal Tadka, Seasonal Subzi, 2 Phulkas or Tawa Rotis, Fragrant Jeera Rice, Curd, Papad and Sweet Gulab Jamun.',
    category: 'Meals',
    outletId: 'canteen-001',
    outletName: 'Central Dining Hall',
    foodType: 'Veg',
    price: 100.00,
    dailyCapacity: 200,
    remainingCapacity: 64,
    availability: 'Available',
    rating: 4.7,
    ratingCount: 310,
    prepTime: '10-12 mins',
    servingSize: '1 Full Thali (550g)',
    calories: '680 kcal',
    imageUrl: 'https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?auto=format&fit=crop&w=600&q=80',
    isFeatured: true,
    isPopular: true,
    allergens: ['Dairy / Milk', 'Gluten / Wheat'],
    variants: [
      { id: 'v1', name: 'Standard Veg Thali', price: 100.00 },
      { id: 'v2', name: 'Special Thali (with Extra Paneer & Sweet)', price: 130.00 }
    ],
    addOns: [
      { id: 'a1', name: 'Extra Butter Roti', price: 12.00 },
      { id: 'a2', name: 'Hot Gulab Jamun (1 pc)', price: 15.00 }
    ]
  },
  {
    id: 'food-04',
    code: 'CRD-04',
    name: 'Tempered South Indian Curd Rice',
    description: 'Comforting mashed rice blended with fresh creamy yogurt, tempered with mustard seeds, curry leaves, green chilies, ginger, and ruby pomegranate seeds.',
    category: 'Meals',
    outletId: 'canteen-001',
    outletName: 'Central Dining Hall',
    foodType: 'Veg',
    price: 50.00,
    dailyCapacity: 80,
    remainingCapacity: 31,
    availability: 'Available',
    rating: 4.6,
    ratingCount: 95,
    prepTime: '3-5 mins',
    servingSize: '1 Bowl (300g)',
    calories: '260 kcal',
    imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80',
    isFeatured: false,
    isPopular: true,
    allergens: ['Dairy / Milk', 'Mustard'],
    variants: [
      { id: 'v1', name: 'Regular Curd Rice Bowl', price: 50.00 }
    ],
    addOns: [
      { id: 'a1', name: 'South Indian Mango Pickle Cup', price: 10.00 },
      { id: 'a2', name: 'Roasted Appalam (Papad)', price: 10.00 }
    ]
  },
  {
    id: 'food-05',
    code: 'PNR-05',
    name: 'Paneer Roll',
    description: 'Char-grilled cottage cheese cubes tossed in spicy tandoori marinade, shredded onions, bell peppers, mint chutney rolled in a soft paratha.',
    category: 'Snacks',
    outletId: 'canteen-003',
    outletName: 'Engineering Block Kiosk',
    foodType: 'Veg',
    price: 90.00,
    dailyCapacity: 100,
    remainingCapacity: 22,
    availability: 'Available',
    rating: 4.8,
    ratingCount: 184,
    prepTime: '6-8 mins',
    servingSize: '1 Roll (220g)',
    calories: '380 kcal',
    imageUrl: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=600&q=80',
    isFeatured: true,
    isPopular: true,
    allergens: ['Dairy / Milk', 'Gluten / Wheat'],
    variants: [
      { id: 'v1', name: 'Single Paneer Roll', price: 90.00 },
      { id: 'v2', name: 'Double Paneer & Cheese Roll', price: 110.00 }
    ],
    addOns: [
      { id: 'a1', name: 'Extra Mint Mayo Dip', price: 15.00 }
    ]
  },
  {
    id: 'food-06',
    code: 'SMS-06',
    name: 'Samosa',
    description: 'Crispy flaky pastry crust filled with aromatic cumin-spiced potatoes and green peas, served with sweet date-tamarind chutney and spicy mint dip.',
    category: 'Snacks',
    outletId: 'canteen-003',
    outletName: 'Engineering Block Kiosk',
    foodType: 'Veg',
    price: 40.00,
    dailyCapacity: 200,
    remainingCapacity: 52,
    availability: 'Available',
    rating: 4.9,
    ratingCount: 320,
    prepTime: '2-4 mins',
    servingSize: '2 Pieces (160g)',
    calories: '280 kcal',
    imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80',
    isFeatured: false,
    isPopular: true,
    allergens: ['Gluten / Wheat'],
    variants: [
      { id: 'v1', name: 'Pair of Samosas (2 pcs)', price: 40.00 }
    ],
    addOns: []
  },
  {
    id: 'food-07',
    code: 'FCO-07',
    name: 'South Indian Filter Coffee',
    description: 'Authentic frothy decoction coffee brewed with roasted chicory and whole milk, poured high in a traditional stainless steel tumbler.',
    category: 'Beverages',
    outletId: 'canteen-001',
    outletName: 'Central Dining Hall',
    foodType: 'Veg',
    price: 25.00,
    dailyCapacity: 250,
    remainingCapacity: 110,
    availability: 'Available',
    rating: 4.9,
    ratingCount: 410,
    prepTime: '2 mins',
    servingSize: '150 ml Tumbler',
    calories: '95 kcal',
    imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80',
    isFeatured: true,
    isPopular: true,
    allergens: ['Dairy / Milk'],
    variants: [
      { id: 'v1', name: 'Regular Sweet Filter Coffee', price: 25.00 },
      { id: 'v2', name: 'Strong / Less Sugar Coffee', price: 25.00 }
    ],
    addOns: []
  },
  {
    id: 'food-08',
    code: 'TEA-08',
    name: 'Special Ginger Masala Chai',
    description: 'Slow-simmered Assam black tea leaves steeped with fresh crushed ginger, green cardamom pods, cinnamon, and whole milk.',
    category: 'Beverages',
    outletId: 'canteen-001',
    outletName: 'Central Dining Hall',
    foodType: 'Veg',
    price: 15.00,
    dailyCapacity: 300,
    remainingCapacity: 145,
    availability: 'Available',
    rating: 4.8,
    ratingCount: 380,
    prepTime: '2 mins',
    servingSize: '150 ml Glass',
    calories: '75 kcal',
    imageUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80',
    isFeatured: false,
    isPopular: true,
    allergens: ['Dairy / Milk'],
    variants: [
      { id: 'v1', name: 'Hot Ginger Masala Chai', price: 15.00 },
      { id: 'v2', name: 'Sulaimani Lemon Tea (Black)', price: 15.00 }
    ],
    addOns: []
  },
  {
    id: 'food-09',
    code: 'CKB-09',
    name: 'Chicken Biryani',
    description: 'Dum-cooked aromatic spiced long-grain basmati rice layered with marinated tender chicken pieces, saffron, served with mirchi ka salan and cucumber raita.',
    category: 'Meals',
    outletId: 'canteen-002',
    outletName: 'North Campus Food Court',
    foodType: 'Non-veg',
    price: 120.00,
    dailyCapacity: 80,
    remainingCapacity: 14,
    availability: 'Available',
    rating: 4.9,
    ratingCount: 290,
    prepTime: '5 mins',
    servingSize: '1 Handi (450g)',
    calories: '650 kcal',
    imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80',
    isFeatured: true,
    isPopular: true,
    allergens: ['Dairy / Milk'],
    variants: [
      { id: 'v1', name: 'Regular Chicken Biryani', price: 120.00 },
      { id: 'v2', name: 'Special Biryani (Extra Chicken + Egg)', price: 160.00 }
    ],
    addOns: [
      { id: 'a1', name: 'Boiled Egg (1 pc)', price: 15.00 },
      { id: 'a2', name: 'Extra Salan Gravy', price: 20.00 }
    ]
  },
  {
    id: 'food-13',
    code: 'VBG-13',
    name: 'Veg Burger',
    description: 'Crispy seasoned spiced vegetable patty topped with fresh lettuce, juicy tomato slices, creamy mayo, and melted cheese in a toasted sesame bun.',
    category: 'Snacks',
    outletId: 'canteen-003',
    outletName: 'Engineering Block Kiosk',
    foodType: 'Veg',
    price: 70.00,
    dailyCapacity: 120,
    remainingCapacity: 45,
    availability: 'Available',
    rating: 4.8,
    ratingCount: 210,
    prepTime: '5-7 mins',
    servingSize: '1 Burger (200g)',
    calories: '340 kcal',
    imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80',
    isFeatured: true,
    isPopular: true,
    allergens: ['Gluten / Wheat', 'Dairy / Milk'],
    variants: [
      { id: 'v1', name: 'Classic Veg Burger', price: 70.00 },
      { id: 'v2', name: 'Double Cheese Veg Burger', price: 95.00 }
    ],
    addOns: [
      { id: 'a1', name: 'Extra Cheese Slice', price: 15.00 }
    ]
  },
  {
    id: 'food-14',
    code: 'CCF-14',
    name: 'Cold Coffee',
    description: 'Thick, creamy chilled espresso coffee blended with rich whole milk, vanilla ice cream swirl, and chocolate drizzle.',
    category: 'Beverages',
    outletId: 'canteen-001',
    outletName: 'Central Dining Hall',
    foodType: 'Veg',
    price: 60.00,
    dailyCapacity: 150,
    remainingCapacity: 60,
    availability: 'Available',
    rating: 4.9,
    ratingCount: 340,
    prepTime: '3 mins',
    servingSize: '300 ml Glass',
    calories: '180 kcal',
    imageUrl: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=600&q=80',
    isFeatured: true,
    isPopular: true,
    allergens: ['Dairy / Milk'],
    variants: [
      { id: 'v1', name: 'Classic Chilled Cold Coffee', price: 60.00 },
      { id: 'v2', name: 'Cold Coffee with Ice Cream', price: 80.00 }
    ],
    addOns: [
      { id: 'a1', name: 'Extra Chocolate Syrup', price: 10.00 }
    ]
  },
  {
    id: 'food-10',
    code: 'EFR-10',
    name: 'Egg Fried Rice & Veg Manchurian',
    description: 'Wok-tossed basmati rice with farm fresh eggs, spring onions, light soya, served with savoury vegetable Manchurian balls in rich gravy.',
    category: 'Meals',
    outletId: 'canteen-002',
    outletName: 'North Campus Food Court',
    foodType: 'Egg',
    price: 100.00,
    dailyCapacity: 90,
    remainingCapacity: 36,
    availability: 'Available',
    rating: 4.7,
    ratingCount: 160,
    prepTime: '8-10 mins',
    servingSize: '1 Bowl (400g)',
    calories: '510 kcal',
    imageUrl: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=600&q=80',
    isFeatured: false,
    isPopular: true,
    allergens: ['Eggs', 'Soy', 'Gluten / Wheat'],
    variants: [
      { id: 'v1', name: 'Regular Egg Fried Rice Bowl', price: 100.00 },
      { id: 'v2', name: 'Double Egg Rice Bowl', price: 120.00 }
    ],
    addOns: [
      { id: 'a1', name: 'Extra Manchurian Balls (2 pcs)', price: 30.00 }
    ]
  },
  {
    id: 'food-11',
    code: 'CSW-11',
    name: 'Grilled Triple Cheese Club Sandwich',
    description: 'Triple-layer toasted sandwich stuffed with spiced potatoes, crunchy bell peppers, melted cheddar and mozzarella cheese, and coriander chutney.',
    category: 'Snacks',
    outletId: 'canteen-003',
    outletName: 'Engineering Block Kiosk',
    foodType: 'Veg',
    price: 70.00,
    dailyCapacity: 80,
    remainingCapacity: 18,
    availability: 'Available',
    rating: 4.8,
    ratingCount: 205,
    prepTime: '6-8 mins',
    servingSize: '2 Halves (220g)',
    calories: '320 kcal',
    imageUrl: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=600&q=80',
    isFeatured: false,
    isPopular: true,
    allergens: ['Gluten / Wheat', 'Dairy / Milk'],
    variants: [
      { id: 'v1', name: 'Regular Grilled Sandwich', price: 70.00 },
      { id: 'v2', name: 'Cheese Overload Sandwich', price: 95.00 }
    ],
    addOns: [
      { id: 'a1', name: 'French Fries (Small Cup)', price: 35.00 }
    ]
  },
  {
    id: 'food-12',
    code: 'FML-12',
    name: 'Chilled Fresh Mint Lemonade',
    description: 'Cool refreshing fresh lime cooler muddled with garden mint, rock salt, cumin powder, and sparkling soda.',
    category: 'Beverages',
    outletId: 'canteen-001',
    outletName: 'Central Dining Hall',
    foodType: 'Veg',
    price: 30.00,
    dailyCapacity: 150,
    remainingCapacity: 92,
    availability: 'Available',
    rating: 4.8,
    ratingCount: 260,
    prepTime: '2 mins',
    servingSize: '300 ml Glass',
    calories: '85 kcal',
    imageUrl: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80',
    isFeatured: false,
    isPopular: true,
    allergens: [],
    variants: [
      { id: 'v1', name: 'Sweet Mint Lime Juice', price: 30.00 },
      { id: 'v2', name: 'Mint Lime Soda (Fizzy)', price: 40.00 }
    ],
    addOns: []
  }
];
