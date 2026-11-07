export const NAV_ITEMS = [
  {
    group: 'Canteen Management',
    items: [
      {
        label: 'Canteen Outlets',
        path: '/canteen',
        description: 'Manage institutional dining halls and food outlets'
      },
      {
        label: 'Add New Canteen',
        path: '/canteen/create',
        description: 'Register a new food outlet'
      }
    ]
  },
  {
    group: 'Categories Management',
    items: [
      {
        label: 'Food Categories',
        path: '/categories',
        description: 'Configure and sort menu food categories'
      },
      {
        label: 'Add New Category',
        path: '/categories/create',
        description: 'Define a new menu category'
      }
    ]
  }
];

export const APP_CONFIG = {
  institutionName: 'Apex Institute of Technology & Sciences',
  portalName: 'SMS / CMS Integrated Canteen Module',
  systemVersion: 'v1.0 (SRS 2026)',
  currentUser: {
    name: 'Dr. Rajesh Sharma',
    role: 'Institution Administrator',
    id: 'ADM-9024',
    email: 'admin.canteen@apexinstitute.edu',
    campus: 'Main Campus'
  }
};

