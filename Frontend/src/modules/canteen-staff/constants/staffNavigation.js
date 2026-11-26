/**
 * Canteen Staff Module Navigation Configuration
 */

export const STAFF_NAV_CONFIG = [
  {
    group: 'Overview',
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
    group: 'Operations',
    items: [
      {
        id: 'order-board',
        label: 'Order Management',
        path: '/staff/board',
        icon: 'ClipboardList',
        badge: 'Live',
        description: 'Visual order workflow, acceptance & stage transitions'
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
    group: 'Inventory & Stock',
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
  institutionName: 'Apex Institute of Technology & Sciences',
  portalName: 'Canteen Staff Portal'
};

export default STAFF_NAV_CONFIG;
