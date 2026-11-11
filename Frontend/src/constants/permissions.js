/**
 * Role and Permission Constants for Institutional Canteen Administration
 */

export const ROLES = {
  INSTITUTION_ADMIN: 'INSTITUTION_ADMIN',
  CANTEEN_ADMIN: 'CANTEEN_ADMIN',
  CANTEEN_STAFF: 'CANTEEN_STAFF',
  STUDENT: 'STUDENT',
  FACULTY: 'FACULTY'
};

export const PERMISSIONS = {
  // Dashboard
  DASHBOARD_VIEW: 'dashboard:view',
  DASHBOARD_ANALYTICS: 'dashboard:analytics',

  // Outlets
  OUTLETS_VIEW: 'outlets:view',
  OUTLETS_MANAGE: 'outlets:manage',

  // Categories
  CATEGORIES_VIEW: 'categories:view',
  CATEGORIES_MANAGE: 'categories:manage',

  // Menu Management
  MENU_VIEW: 'menu:view',
  MENU_MANAGE: 'menu:manage',
  MENU_PUBLISH: 'menu:publish',

  // Orders Management
  ORDERS_VIEW: 'orders:view',
  ORDERS_UPDATE_STATUS: 'orders:update_status',
  ORDERS_REFUND: 'orders:refund',

  // Slots Management
  SLOTS_VIEW: 'slots:view',
  SLOTS_MANAGE: 'slots:manage',

  // Inventory Management
  INVENTORY_VIEW: 'inventory:view',
  INVENTORY_STOCK_MOVEMENT: 'inventory:stock_movement',
  INVENTORY_PURCHASE_ORDERS: 'inventory:purchase_orders',
  INVENTORY_SUPPLIERS: 'inventory:suppliers',

  // Reports & Analytics
  REPORTS_VIEW: 'reports:view',
  REPORTS_EXPORT: 'reports:export',

  // Feedback & Grievances
  FEEDBACK_VIEW: 'feedback:view',
  FEEDBACK_RESOLVE: 'feedback:resolve',

  // Settings & Privacy
  SETTINGS_VIEW: 'settings:view',
  SETTINGS_MANAGE: 'settings:manage',
  PRIVACY_DSAR_MANAGE: 'privacy:dsar_manage'
};

// Default role permission mapping
export const ROLE_PERMISSIONS = {
  [ROLES.INSTITUTION_ADMIN]: Object.values(PERMISSIONS),
  [ROLES.CANTEEN_ADMIN]: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.DASHBOARD_ANALYTICS,
    PERMISSIONS.OUTLETS_VIEW,
    PERMISSIONS.OUTLETS_MANAGE,
    PERMISSIONS.CATEGORIES_VIEW,
    PERMISSIONS.CATEGORIES_MANAGE,
    PERMISSIONS.MENU_VIEW,
    PERMISSIONS.MENU_MANAGE,
    PERMISSIONS.MENU_PUBLISH,
    PERMISSIONS.ORDERS_VIEW,
    PERMISSIONS.ORDERS_UPDATE_STATUS,
    PERMISSIONS.ORDERS_REFUND,
    PERMISSIONS.SLOTS_VIEW,
    PERMISSIONS.SLOTS_MANAGE,
    PERMISSIONS.INVENTORY_VIEW,
    PERMISSIONS.INVENTORY_STOCK_MOVEMENT,
    PERMISSIONS.INVENTORY_PURCHASE_ORDERS,
    PERMISSIONS.INVENTORY_SUPPLIERS,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_EXPORT,
    PERMISSIONS.FEEDBACK_VIEW,
    PERMISSIONS.FEEDBACK_RESOLVE,
    PERMISSIONS.SETTINGS_VIEW,
    PERMISSIONS.SETTINGS_MANAGE,
    PERMISSIONS.PRIVACY_DSAR_MANAGE
  ],
  [ROLES.CANTEEN_STAFF]: [
    PERMISSIONS.ORDERS_VIEW,
    PERMISSIONS.ORDERS_UPDATE_STATUS,
    PERMISSIONS.SLOTS_VIEW,
    PERMISSIONS.MENU_VIEW
  ]
};

