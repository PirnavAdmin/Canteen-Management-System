export const CAMPUSES = [
  'Main Campus',
  'North Campus',
  'South Campus',
  'Engineering Block',
  'Health Sciences Campus'
];

export const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday'
];

export const STATUS_OPTIONS = [
  { value: 'ALL', label: 'All Statuses' },
  { value: 'Active', label: 'Active' },
  { value: 'Inactive', label: 'Inactive' }
];

export const INITIAL_CANTEENS = [
  {
    id: 'canteen-1',
    institutionId: 'INST-APEX-01',
    name: 'Central University Food Court',
    code: 'CNT-MAIN-01',
    campus: 'Main Campus',
    location: 'Student Activity Center, Ground Floor (Block A)',
    contactPhone: '+1 (555) 234-5678',
    contactEmail: 'central.foodcourt@apexinstitute.edu',
    openingTime: '07:30',
    closingTime: '21:00',
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    status: 'Active',
    isOrderAcceptanceEnabled: true,
    assignedAdministrator: {
      id: 'EMP-701',
      name: 'Ramesh Patel',
      role: 'Outlet General Manager',
      email: 'r.patel@apexinstitute.edu',
      phone: '+1 (555) 890-1122'
    },
    assignedStaff: [
      { id: 'STF-201', name: 'Sunita Sharma', role: 'Billing Cashier', status: 'Active' },
      { id: 'STF-202', name: 'Manoj Kumar', role: 'Kitchen Head', status: 'Active' },
      { id: 'STF-203', name: 'Deepak Varma', role: 'Counter Dispenser', status: 'Active' }
    ],
    createdAt: '2026-08-15T08:00:00Z',
    updatedAt: '2026-11-04T10:15:00Z'
  },
  {
    id: 'canteen-2',
    institutionId: 'INST-APEX-01',
    name: 'North Campus Quick Bites & Cafe',
    code: 'CNT-NRTH-02',
    campus: 'North Campus',
    location: 'Library Quadrangle, East Annex 1st Floor',
    contactPhone: '+1 (555) 345-6789',
    contactEmail: 'north.cafe@apexinstitute.edu',
    openingTime: '08:00',
    closingTime: '19:30',
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    status: 'Active',
    isOrderAcceptanceEnabled: true,
    assignedAdministrator: {
      id: 'EMP-704',
      name: 'Kavita Menon',
      role: 'Outlet In-Charge',
      email: 'k.menon@apexinstitute.edu',
      phone: '+1 (555) 432-8877'
    },
    assignedStaff: [
      { id: 'STF-211', name: 'Arjun Nair', role: 'Barista & Cashier', status: 'Active' },
      { id: 'STF-212', name: 'Pooja Iyer', role: 'Kitchen Assistant', status: 'Active' }
    ],
    createdAt: '2026-08-20T09:00:00Z',
    updatedAt: '2026-11-02T14:20:00Z'
  },
  {
    id: 'canteen-3',
    institutionId: 'INST-APEX-01',
    name: 'Tech Hub Cafeteria',
    code: 'CNT-ENG-03',
    campus: 'Engineering Block',
    location: 'Alan Turing Building, Concourse Level 2',
    contactPhone: '+1 (555) 456-7890',
    contactEmail: 'tech.canteen@apexinstitute.edu',
    openingTime: '08:00',
    closingTime: '22:00',
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    status: 'Active',
    isOrderAcceptanceEnabled: true,
    assignedAdministrator: {
      id: 'EMP-709',
      name: 'Alok Sengupta',
      role: 'Facilities Dining Manager',
      email: 'a.sengupta@apexinstitute.edu',
      phone: '+1 (555) 678-3344'
    },
    assignedStaff: [
      { id: 'STF-221', name: 'Ganesh Pillai', role: 'Lead Cook', status: 'Active' },
      { id: 'STF-222', name: 'Sanjay Rawat', role: 'Order Handover Staff', status: 'Active' }
    ],
    createdAt: '2026-09-01T08:30:00Z',
    updatedAt: '2026-11-05T09:00:00Z'
  },
  {
    id: 'canteen-4',
    institutionId: 'INST-APEX-01',
    name: 'Health Sciences Med Bistro',
    code: 'CNT-MED-04',
    campus: 'Health Sciences Campus',
    location: 'Hospital Wing C, Adjacent to Academic Auditorium',
    contactPhone: '+1 (555) 567-8901',
    contactEmail: 'med.bistro@apexinstitute.edu',
    openingTime: '06:30',
    closingTime: '23:00',
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    status: 'Active',
    isOrderAcceptanceEnabled: true,
    assignedAdministrator: {
      id: 'EMP-715',
      name: 'Dr. Meenakshi Rao',
      role: 'Nutrition & Outlet Director',
      email: 'm.rao@apexinstitute.edu',
      phone: '+1 (555) 987-6543'
    },
    assignedStaff: [
      { id: 'STF-231', name: 'Farhan Ali', role: 'Dietary Chef', status: 'Active' },
      { id: 'STF-232', name: 'Suman Roy', role: 'Cashier & Counter Staff', status: 'Active' }
    ],
    createdAt: '2026-09-10T11:00:00Z',
    updatedAt: '2026-11-03T16:45:00Z'
  },
  {
    id: 'canteen-5',
    institutionId: 'INST-APEX-01',
    name: 'Sports Complex Pavilion Kiosk',
    code: 'CNT-SPRT-05',
    campus: 'South Campus',
    location: 'Olympic Stadium South Pavilion, Gate 4',
    contactPhone: '+1 (555) 678-9012',
    contactEmail: 'sports.kiosk@apexinstitute.edu',
    openingTime: '09:00',
    closingTime: '18:00',
    workingDays: ['Saturday', 'Sunday'],
    status: 'Inactive',
    isOrderAcceptanceEnabled: false,
    assignedAdministrator: {
      id: 'EMP-720',
      name: 'Devraj Chauhan',
      role: 'Athletic Dining Coordinator',
      email: 'd.chauhan@apexinstitute.edu',
      phone: '+1 (555) 321-4321'
    },
    assignedStaff: [
      { id: 'STF-241', name: 'Karthik Raja', role: 'Kiosk Operator', status: 'Inactive' }
    ],
    createdAt: '2026-10-01T10:00:00Z',
    updatedAt: '2026-11-01T11:00:00Z'
  }
];

