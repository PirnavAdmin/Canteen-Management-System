/**
 * Canteen Staff Module Navigation Configuration
 */

export const STAFF_NAV_CONFIG = [
  {
    group: 'OVERVIEW',
    items: [
      {
        id: 'staff-dashboard',
        label: 'Dashboard',
        path: '/staff/dashboard',
        icon: 'LayoutDashboard',
        badge: null,
        description: "Today's queue, live kitchen metrics & order status summary"
      }
    ]
  },
  {
    group: 'OPERATIONS',
    items: [
      {
        id: 'order-board',
        label: 'Order Management',
        path: '/staff/board',
        icon: 'ClipboardList',
        badge: 'Live',
        description: 'Visual Kanban order workflow, acceptance & stage transitions'
      },
      {
        id: 'kitchen-display',
        label: 'Kitchen Display (KDS)',
        path: '/staff/kitchen',
        icon: 'Flame',
        badge: null,
        description: 'Touch-friendly cooking cards, prep timers & station routing'
      }
    ]
  },
  {
    group: 'INVENTORY & STOCK',
    items: [
      {
        id: 'inventory-overview',
        label: 'Inventory Management',
        path: '/staff/inventory',
        icon: 'Boxes',
        badge: null,
        description: 'Canteen raw materials, ingredients & stock balance'
      },
      {
        id: 'expiry-tracking',
        label: 'Expiry Tracking',
        path: '/staff/inventory/expiry',
        icon: 'AlertTriangle',
        badge: null,
        description: 'Track expiring batches, waste reporting & safety checks'
      }
    ]
  }
];

export const STAFF_APP_CONFIG = {
  portalName: 'Canteen Staff Portal',
  campusName: 'Apex Institute of Technology & Sciences',
  canteenOutlet: 'Central Dining Hall',
  outletId: 1,
  counterName: 'Counter 02 (Express Pickup)',
  activeStation: 'Hot Meals & Express Counter'
};

export default STAFF_NAV_CONFIG;
