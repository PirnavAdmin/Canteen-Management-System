/**
 * Report Types & Sample Verified Data Contracts
 */

export const REPORT_OPTIONS = [
  { id: 'sales_summary', label: 'Consolidated Sales Report', category: 'Financial' },
  { id: 'item_wise', label: 'Item-Wise Sales & Volume', category: 'Operational' },
  { id: 'category_wise', label: 'Category-Wise Performance', category: 'Operational' },
  { id: 'outlet_wise', label: 'Outlet-Wise Comparison', category: 'Financial' },
  { id: 'tax_gst', label: 'Tax & GST Statutory Summary', category: 'Compliance' },
  { id: 'refund_cancellation', label: 'Cancellations & Refunds', category: 'Financial' },
  { id: 'wastage_report', label: 'Kitchen Spoilage & Wastage', category: 'Inventory' },
  { id: 'slot_utilization', label: 'Slot Capacity & Utilization', category: 'Operational' }
];

export const INITIAL_REPORT_DATA = {
  sales_summary: {
    summaryMetrics: {
      totalRevenue: 48950.00,
      totalOrders: 348,
      averageOrderValue: 140.66,
      completedOrders: 261,
      cancelledOrders: 10
    },
    rows: [
      { date: '2026-11-11', outlet: 'Central Dining Hall', orders: 194, grossSales: 27800, tax: 1390, netSales: 29190 },
      { date: '2026-11-11', outlet: 'North Campus Food Court', orders: 92, grossSales: 13150, tax: 657.50, netSales: 13807.50 },
      { date: '2026-11-11', outlet: 'Engineering Block Kiosk', orders: 46, grossSales: 5850, tax: 292.50, netSales: 6142.50 },
      { date: '2026-11-11', outlet: 'Hostel Mess Canteen', orders: 16, grossSales: 2150, tax: 107.50, netSales: 2257.50 }
    ],
    columns: [
      { key: 'date', header: 'Date' },
      { key: 'outlet', header: 'Outlet' },
      { key: 'orders', header: 'Orders Count' },
      { key: 'grossSales', header: 'Gross Sales (₹)' },
      { key: 'tax', header: 'GST (5%)' },
      { key: 'netSales', header: 'Net Settled (₹)' }
    ]
  },

  item_wise: {
    summaryMetrics: {
      totalItemsSold: 580,
      totalRevenue: 48950.00,
      uniqueDishes: 32
    },
    rows: [
      { itemCode: 'PBM-01', name: 'Paneer Butter Masala Combo', category: 'Main Course', unitPrice: 120, qtySold: 86, totalRevenue: 10320 },
      { itemCode: 'SIT-02', name: 'South Indian Thali Special', category: 'Meals & Thalis', unitPrice: 90, qtySold: 74, totalRevenue: 6660 },
      { itemCode: 'CSW-03', name: 'Grilled Cheese Club Sandwich', category: 'Snacks & Quick Bites', unitPrice: 70, qtySold: 62, totalRevenue: 4340 },
      { itemCode: 'EFR-04', name: 'Egg Fried Rice & Manchurian', category: 'Main Course', unitPrice: 100, qtySold: 51, totalRevenue: 5100 },
      { itemCode: 'FML-05', name: 'Fresh Mint Lemonade', category: 'Beverages', unitPrice: 30, qtySold: 98, totalRevenue: 2940 },
      { itemCode: 'CKB-06', name: 'Hyderabadi Chicken Biryani', category: 'Main Course', unitPrice: 150, qtySold: 42, totalRevenue: 6300 }
    ],
    columns: [
      { key: 'itemCode', header: 'Item Code' },
      { key: 'name', header: 'Item Name' },
      { key: 'category', header: 'Category' },
      { key: 'unitPrice', header: 'Unit Price (₹)' },
      { key: 'qtySold', header: 'Quantity Sold' },
      { key: 'totalRevenue', header: 'Total Revenue (₹)' }
    ]
  },

  tax_gst: {
    summaryMetrics: {
      taxableAmount: 46619.05,
      cgst: 1165.48,
      sgst: 1165.48,
      totalGst: 2330.95
    },
    rows: [
      { period: 'Nov 01 - Nov 07', taxableTurnover: 182400.00, cgstRate: '2.5%', cgstAmount: 4560.00, sgstRate: '2.5%', sgstAmount: 4560.00, totalTax: 9120.00 },
      { period: 'Nov 08 - Nov 11 (M-T-D)', taxableTurnover: 142100.00, cgstRate: '2.5%', cgstAmount: 3552.50, sgstRate: '2.5%', sgstAmount: 3552.50, totalTax: 7105.00 }
    ],
    columns: [
      { key: 'period', header: 'Tax Period' },
      { key: 'taxableTurnover', header: 'Taxable Turnover (₹)' },
      { key: 'cgstRate', header: 'CGST Rate' },
      { key: 'cgstAmount', header: 'CGST (₹)' },
      { key: 'sgstRate', header: 'SGST Rate' },
      { key: 'sgstAmount', header: 'SGST (₹)' },
      { key: 'totalTax', header: 'Total Tax Remitted (₹)' }
    ]
  },

  refund_cancellation: {
    summaryMetrics: {
      cancelledOrders: 10,
      totalRefundedAmount: 1450.00,
      refundSuccessRate: '100%'
    },
    rows: [
      { orderId: 'ORD-2026-8905', customer: 'Ananya Sharma', outlet: 'North Campus Food Court', amount: 157.50, reason: 'Ingredient stock depleted', mode: 'Campus Wallet', status: 'Refund Settled' },
      { orderId: 'ORD-2026-8890', customer: 'Praveen Nair', outlet: 'Central Dining Hall', amount: 120.00, reason: 'Duplicate order submitted', mode: 'UPI Gateway', status: 'Refund Settled' },
      { orderId: 'ORD-2026-8874', customer: 'Dr. Priya V.', outlet: 'Engineering Block Kiosk', amount: 95.00, reason: 'Class reschedule before prep', mode: 'Campus Wallet', status: 'Refund Settled' }
    ],
    columns: [
      { key: 'orderId', header: 'Order ID' },
      { key: 'customer', header: 'Customer' },
      { key: 'outlet', header: 'Outlet' },
      { key: 'amount', header: 'Refunded (₹)' },
      { key: 'reason', header: 'Cancellation Reason' },
      { key: 'mode', header: 'Settlement Mode' },
      { key: 'status', header: 'Status' }
    ]
  },

  wastage_report: {
    summaryMetrics: {
      totalWastedQuantity: '14.5 kg / liters',
      estimatedLossValue: 1820.00,
      dominantCause: 'Packaging transit damage / shelf expiry'
    },
    rows: [
      { date: '2026-11-10', ingredient: 'Burger Buns (Pack of 6)', qty: '3 packets', lossValue: 105.00, reason: 'Package torn during transit', outlet: 'Engineering Block Kiosk' },
      { date: '2026-11-09', ingredient: 'Full Cream Milk', qty: '4 liters', lossValue: 224.00, reason: 'Curdled during power outage', outlet: 'Central Dining Hall' },
      { date: '2026-11-08', ingredient: 'Cooked Rice Excess', qty: '5 kg', lossValue: 425.00, reason: 'End of day surplus past safety shelf life', outlet: 'North Campus Food Court' }
    ],
    columns: [
      { key: 'date', header: 'Date' },
      { key: 'ingredient', header: 'Raw Material' },
      { key: 'qty', header: 'Quantity' },
      { key: 'lossValue', header: 'Cost Impact (₹)' },
      { key: 'reason', header: 'Audit Reason' },
      { key: 'outlet', header: 'Outlet' }
    ]
  },

  slot_utilization: {
    summaryMetrics: {
      averageUtilization: '82.4%',
      peakSession: 'Lunch (12:30 PM - 01:00 PM)',
      throttledSlots: 3
    },
    rows: [
      { slotWindow: '08:00 - 08:30 AM', session: 'Breakfast', outlet: 'Central Dining Hall', capacity: 60, booked: 58, utilization: '96.7%', status: 'Fast Filling' },
      { slotWindow: '08:30 - 09:00 AM', session: 'Breakfast', outlet: 'Central Dining Hall', capacity: 60, booked: 60, utilization: '100%', status: 'Full' },
      { slotWindow: '12:00 - 12:30 PM', session: 'Lunch', outlet: 'Central Dining Hall', capacity: 100, booked: 78, utilization: '78.0%', status: 'Open' },
      { slotWindow: '12:30 - 01:00 PM', session: 'Lunch', outlet: 'Central Dining Hall', capacity: 120, booked: 112, utilization: '93.3%', status: 'Fast Filling' },
      { slotWindow: '12:30 - 01:00 PM', session: 'Lunch', outlet: 'North Campus Food Court', capacity: 80, booked: 32, utilization: '40.0%', status: 'Open' }
    ],
    columns: [
      { key: 'slotWindow', header: 'Slot Window' },
      { key: 'session', header: 'Session' },
      { key: 'outlet', header: 'Outlet' },
      { key: 'capacity', header: 'Total Quota' },
      { key: 'booked', header: 'Booked' },
      { key: 'utilization', header: 'Utilization %' },
      { key: 'status', header: 'Status' }
    ]
  }
};

