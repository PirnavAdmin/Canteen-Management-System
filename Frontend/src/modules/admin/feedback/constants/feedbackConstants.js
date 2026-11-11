/**
 * Feedback & Grievance Constants and Sample Records
 */

import { FEEDBACK_STATUS } from '../../../../constants/appConstants';

export const INITIAL_FEEDBACK = [
  {
    id: 'FB-2026-041',
    customerName: 'Aarav Mehta',
    customerRole: 'Student (CSE 3rd Yr)',
    customerEmail: 'aarav.mehta@students.apexinstitute.edu',
    outletId: 'canteen-001',
    outletName: 'Central Dining Hall',
    orderId: 'ORD-2026-8910',
    orderToken: 'T-101',
    rating: 2,
    complaintCategory: 'Food Quality & Taste',
    comments: 'The paneer butter masala gravy had excessive salt and the naan was served somewhat cold despite picking it up immediately upon token flash.',
    status: FEEDBACK_STATUS.NEW,
    createdAt: '2026-11-11T12:45:00.000Z',
    resolutionNotes: '',
    resolvedBy: '',
    history: [
      { status: FEEDBACK_STATUS.NEW, timestamp: '12:45 PM', note: 'Grievance ticket created by student from Order History (Screen 8)' }
    ]
  },
  {
    id: 'FB-2026-040',
    customerName: 'Dr. Sunita Rao',
    customerRole: 'Faculty (Biotechnology)',
    customerEmail: 'sunita.rao@faculty.apexinstitute.edu',
    outletId: 'canteen-001',
    outletName: 'Central Dining Hall',
    orderId: 'ORD-2026-8854',
    orderToken: 'T-082',
    rating: 4,
    complaintCategory: 'Hygiene & Cleanliness',
    comments: 'Food quality and thali taste were exemplary, but the dining tray return conveyor was overcrowded during peak noon hour.',
    status: FEEDBACK_STATUS.RESOLVED,
    createdAt: '2026-11-10T13:20:00.000Z',
    resolutionNotes: 'Notified housekeeping vendor; deployed 2 additional attendants at the tray return station between 12:30 PM - 02:00 PM.',
    resolvedBy: 'Dr. Rajesh Sharma (Administrator)',
    resolvedAt: '2026-11-10T15:30:00.000Z',
    history: [
      { status: FEEDBACK_STATUS.NEW, timestamp: '01:20 PM', note: 'Grievance logged' },
      { status: FEEDBACK_STATUS.UNDER_REVIEW, timestamp: '02:00 PM', note: 'Assigned to Housekeeping Facility Supervisor' },
      { status: FEEDBACK_STATUS.RESOLVED, timestamp: '03:30 PM', note: 'Attendant staffing increased; closed ticket' }
    ]
  },
  {
    id: 'FB-2026-039',
    customerName: 'Kavita Singh',
    customerRole: 'Student (Mechanical)',
    customerEmail: 'kavita.singh@students.apexinstitute.edu',
    outletId: 'canteen-002',
    outletName: 'North Campus Food Court',
    orderId: 'ORD-2026-8830',
    orderToken: 'T-054',
    rating: 1,
    complaintCategory: 'Delayed Preparation',
    comments: 'The slot was 01:00 PM to 01:15 PM, but the food was not ready until 01:38 PM, resulting in missed lab attendance.',
    status: FEEDBACK_STATUS.UNDER_REVIEW,
    createdAt: '2026-11-09T14:00:00.000Z',
    resolutionNotes: 'Investigating kitchen wok delay. Kitchen staff cited equipment thermostat failure at 01:05 PM.',
    resolvedBy: '',
    history: [
      { status: FEEDBACK_STATUS.NEW, timestamp: '02:00 PM', note: 'Complaint submitted' },
      { status: FEEDBACK_STATUS.UNDER_REVIEW, timestamp: '02:30 PM', note: 'Supervisor review in progress with North Campus kitchen manager' }
    ]
  },
  {
    id: 'FB-2026-038',
    customerName: 'Rohan Verma',
    customerRole: 'Student (ECE)',
    customerEmail: 'rohan.verma@students.apexinstitute.edu',
    outletId: 'canteen-003',
    outletName: 'Engineering Block Kiosk',
    orderId: 'ORD-2026-8798',
    orderToken: 'T-029',
    rating: 5,
    complaintCategory: 'Food Quality & Taste',
    comments: 'Best grilled club sandwiches on campus! Quick service and hot food.',
    status: FEEDBACK_STATUS.RESOLVED,
    createdAt: '2026-11-08T11:15:00.000Z',
    resolutionNotes: 'Compliment relayed to Kiosk catering team.',
    resolvedBy: 'Dr. Rajesh Sharma',
    resolvedAt: '2026-11-08T12:00:00.000Z',
    history: [
      { status: FEEDBACK_STATUS.NEW, timestamp: '11:15 AM', note: 'Review logged' },
      { status: FEEDBACK_STATUS.RESOLVED, timestamp: '12:00 PM', note: 'Acknowledged and noted' }
    ]
  }
];
