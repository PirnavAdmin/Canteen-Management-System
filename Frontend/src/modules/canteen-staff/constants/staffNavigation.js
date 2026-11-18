/**
 * Canteen Staff Module Navigation Configuration
 */

export const STAFF_NAV_CONFIG = [
  {
    group: 'Kitchen & Counter Operations',
    items: [
      {
        id: 'staff-dashboard',
        label: 'Staff Dashboard',
        path: '/canteen-staff/dashboard',
        icon: 'LayoutDashboard',
        description: "Today's queue, live kitchen metrics & order status summary"
      },
      {
        id: 'kitchen-display',
        label: 'Kitchen Display (KDS)',
        path: '/canteen-staff/kitchen-display',
        icon: 'Flame',
        description: 'Live chef cooking cards, order prep timers & station routing'
      },
      {
        id: 'order-board',
        label: 'Order Board',
        path: '/canteen-staff/order-board',
        icon: 'ClipboardList',
        description: 'Full order transactions, search, filter & status advancement'
      },
      {
        id: 'verify-pickup',
        label: 'Verify Pickup',
        path: '/canteen-staff/verify-pickup',
        icon: 'QrCode',
        description: 'Scan or enter token, verify order & confirm handovers'
      }
    ]
  }
];

export const STAFF_APP_CONFIG = {
  portalName: 'Canteen Staff Operations',
  canteenOutlet: 'Central Dining Hall',
  counterName: 'Express Pickup Counter 02'
};
