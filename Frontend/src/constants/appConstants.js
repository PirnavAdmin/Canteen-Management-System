/**
 * Application Constants
 */

export const FOOD_TYPES = {
  VEG: 'Veg',
  NON_VEG: 'Non-veg',
  EGG: 'Egg'
};

export const ORDER_STATUS = {
  PLACED: 'Placed',
  ACCEPTED: 'Accepted',
  PREPARING: 'Preparing',
  READY_FOR_PICKUP: 'Ready for Pickup',
  COMPLETED: 'Collected',
  CANCELLED: 'Cancelled',
  REFUNDED: 'Refunded'
};

export const ORDER_LIFECYCLE_NEXT_STEPS = {
  [ORDER_STATUS.PLACED]: [ORDER_STATUS.ACCEPTED, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.ACCEPTED]: [ORDER_STATUS.PREPARING, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.PREPARING]: [ORDER_STATUS.READY_FOR_PICKUP, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.READY_FOR_PICKUP]: [ORDER_STATUS.COMPLETED, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.COMPLETED]: [],
  [ORDER_STATUS.CANCELLED]: [ORDER_STATUS.REFUNDED],
  [ORDER_STATUS.REFUNDED]: []
};

export const PAYMENT_METHODS = {
  UPI: 'UPI',
  CARD: 'Card / Net Banking',
  WALLET: 'Campus Wallet',
  CASH: 'Counter Cash'
};

export const PAYMENT_STATUS = {
  PAID: 'Paid',
  PENDING: 'Pending',
  REFUNDED: 'Refunded',
  FAILED: 'Failed'
};

export const SLOT_SESSIONS = ['Breakfast', 'Lunch', 'Evening Snacks', 'Dinner'];

export const SLOT_STATUS = {
  OPEN: 'Open',
  FAST_FILLING: 'Fast Filling',
  FULL: 'Full',
  PAUSED: 'Paused',
  CLOSED: 'Closed'
};

export const INVENTORY_UNITS = ['kg', 'grams', 'liters', 'ml', 'packets', 'pcs', 'boxes'];

export const MOVEMENT_TYPES = {
  STOCK_IN: 'Stock In',
  STOCK_OUT: 'Stock Out',
  WASTAGE: 'Wastage',
  ADJUSTMENT: 'Adjustment'
};

export const PO_STATUS = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  APPROVED: 'Approved',
  RECEIVED: 'Received',
  CANCELLED: 'Cancelled'
};

export const COMPLAINT_CATEGORIES = [
  'Food Quality & Taste',
  'Delayed Preparation',
  'Wrong Item Delivered',
  'Hygiene & Cleanliness',
  'Billing & Payment Dispute',
  'Staff Behavior',
  'Packaging Issue',
  'Other'
];

export const FEEDBACK_STATUS = {
  NEW: 'New',
  UNDER_REVIEW: 'Under Review',
  RESOLVED: 'Resolved',
  DISMISSED: 'Dismissed'
};

export const ALLERGENS = [
  'Dairy / Milk',
  'Gluten / Wheat',
  'Peanuts',
  'Tree Nuts',
  'Soy',
  'Mustard',
  'Eggs',
  'Sesame'
];

export const REPORT_TYPES = [
  { id: 'sales_summary', label: 'Sales & Revenue Summary' },
  { id: 'daily_monthly', label: 'Daily & Monthly Sales Trends' },
  { id: 'item_wise', label: 'Item-Wise Sales & Volume' },
  { id: 'category_wise', label: 'Category-Wise Performance' },
  { id: 'outlet_wise', label: 'Outlet-Wise Comparison' },
  { id: 'tax_gst', label: 'Tax & GST Summary' },
  { id: 'refund_cancellation', label: 'Refunds & Cancellations' },
  { id: 'wastage_report', label: 'Food Wastage & Spoilage' },
  { id: 'inventory_report', label: 'Inventory Stock & Reorder Levels' },
  { id: 'slot_utilization', label: 'Slot Capacity & Utilization' },
  { id: 'feedback_summary', label: 'Feedback & Grievance Metrics' }
];

export const CURRENCY = {
  SYMBOL: '₹',
  CODE: 'INR'
};

