/**
 * Order Management Constants & Seed Data
 */

import { ORDER_STATUS, PAYMENT_METHODS, PAYMENT_STATUS } from '../../../../constants/appConstants';

export const INITIAL_ORDERS = [
  {
    id: 'ORD-2026-8910',
    token: 'T-101',
    outletId: 'canteen-001',
    outletName: 'Central Dining Hall',
    customer: {
      name: 'Aarav Mehta',
      role: 'Student',
      rollNo: '2023-CSE-042',
      department: 'Computer Science',
      phone: '+91 98765 43210',
      email: 'aarav.mehta@students.apexinstitute.edu'
    },
    items: [
      { id: 'i1', name: 'Paneer Butter Masala Combo', variant: 'With Butter Naan (2 pcs)', price: 120.00, quantity: 1, total: 120.00 },
      { id: 'i2', name: 'Fresh Mint Lemonade', variant: 'Sweet Mint Lemonade', price: 30.00, quantity: 1, total: 30.00 }
    ],
    subtotal: 150.00,
    taxAmount: 7.50,
    totalAmount: 157.50,
    slot: {
      id: 'slot-101',
      session: 'Lunch',
      timeWindow: '12:30 PM - 12:45 PM',
      date: '2026-11-11'
    },
    orderDate: '2026-11-11T12:05:00.000Z',
    status: ORDER_STATUS.READY_FOR_PICKUP,
    payment: {
      method: PAYMENT_METHODS.WALLET,
      status: PAYMENT_STATUS.PAID,
      transactionId: 'TXN-WAL-994102',
      paidAt: '2026-11-11T12:05:30.000Z'
    },
    timeline: [
      { status: ORDER_STATUS.PLACED, timestamp: '12:05 PM', note: 'Order placed via SMS student portal' },
      { status: ORDER_STATUS.ACCEPTED, timestamp: '12:08 PM', note: 'Kitchen counter accepted order' },
      { status: ORDER_STATUS.PREPARING, timestamp: '12:12 PM', note: 'Live cooking started at Station 2' },
      { status: ORDER_STATUS.READY_FOR_PICKUP, timestamp: '12:26 PM', note: 'Token T-101 flashed on Pickup Counter' }
    ]
  },
  {
    id: 'ORD-2026-8911',
    token: 'T-102',
    outletId: 'canteen-001',
    outletName: 'Central Dining Hall',
    customer: {
      name: 'Dr. Sunita Rao',
      role: 'Faculty',
      rollNo: 'FAC-BIO-012',
      department: 'Biotechnology & Bioengineering',
      phone: '+91 98450 11223',
      email: 'sunita.rao@faculty.apexinstitute.edu'
    },
    items: [
      { id: 'i1', name: 'South Indian Thali Special', variant: 'Special Thali', price: 110.00, quantity: 1, total: 110.00 },
      { id: 'i2', name: 'Filter Coffee', variant: 'Regular', price: 25.00, quantity: 2, total: 50.00 }
    ],
    subtotal: 160.00,
    taxAmount: 8.00,
    totalAmount: 168.00,
    slot: {
      id: 'slot-102',
      session: 'Lunch',
      timeWindow: '12:45 PM - 01:00 PM',
      date: '2026-11-11'
    },
    orderDate: '2026-11-11T12:14:00.000Z',
    status: ORDER_STATUS.PREPARING,
    payment: {
      method: PAYMENT_METHODS.UPI,
      status: PAYMENT_STATUS.PAID,
      transactionId: 'UPI-RAZ-8823910',
      paidAt: '2026-11-11T12:14:45.000Z'
    },
    timeline: [
      { status: ORDER_STATUS.PLACED, timestamp: '12:14 PM', note: 'Order confirmed with UPI payment' },
      { status: ORDER_STATUS.ACCEPTED, timestamp: '12:16 PM', note: 'Accepted by Central Dining kitchen staff' },
      { status: ORDER_STATUS.PREPARING, timestamp: '12:20 PM', note: 'Preparation in progress' }
    ]
  },
  {
    id: 'ORD-2026-8912',
    token: 'T-103',
    outletId: 'canteen-002',
    outletName: 'North Campus Food Court',
    customer: {
      name: 'Kavita Singh',
      role: 'Student',
      rollNo: '2024-MEC-109',
      department: 'Mechanical Engineering',
      phone: '+91 99123 77889',
      email: 'kavita.singh@students.apexinstitute.edu'
    },
    items: [
      { id: 'i1', name: 'Egg Fried Rice & Manchurian', variant: 'Regular Egg Fried Rice Combo', price: 100.00, quantity: 1, total: 100.00 }
    ],
    subtotal: 100.00,
    taxAmount: 5.00,
    totalAmount: 105.00,
    slot: {
      id: 'slot-103',
      session: 'Lunch',
      timeWindow: '01:00 PM - 01:15 PM',
      date: '2026-11-11'
    },
    orderDate: '2026-11-11T12:28:00.000Z',
    status: ORDER_STATUS.ACCEPTED,
    payment: {
      method: PAYMENT_METHODS.UPI,
      status: PAYMENT_STATUS.PAID,
      transactionId: 'UPI-HDFC-551982',
      paidAt: '2026-11-11T12:28:30.000Z'
    },
    timeline: [
      { status: ORDER_STATUS.PLACED, timestamp: '12:28 PM', note: 'Order placed by student' },
      { status: ORDER_STATUS.ACCEPTED, timestamp: '12:30 PM', note: 'Order accepted' }
    ]
  },
  {
    id: 'ORD-2026-8913',
    token: 'T-104',
    outletId: 'canteen-003',
    outletName: 'Engineering Block Kiosk',
    customer: {
      name: 'Rohan Verma',
      role: 'Student',
      rollNo: '2022-ECE-018',
      department: 'Electronics & Communication',
      phone: '+91 97654 32109',
      email: 'rohan.verma@students.apexinstitute.edu'
    },
    items: [
      { id: 'i1', name: 'Grilled Cheese Club Sandwich', variant: 'Double Cheese Overload', price: 95.00, quantity: 1, total: 95.00 },
      { id: 'i2', name: 'Cold Coffee', variant: 'Regular', price: 45.00, quantity: 1, total: 45.00 }
    ],
    subtotal: 140.00,
    taxAmount: 7.00,
    totalAmount: 147.00,
    slot: {
      id: 'slot-104',
      session: 'Lunch',
      timeWindow: '01:00 PM - 01:15 PM',
      date: '2026-11-11'
    },
    orderDate: '2026-11-11T12:34:00.000Z',
    status: ORDER_STATUS.PLACED,
    payment: {
      method: PAYMENT_METHODS.WALLET,
      status: PAYMENT_STATUS.PAID,
      transactionId: 'TXN-WAL-994119',
      paidAt: '2026-11-11T12:34:20.000Z'
    },
    timeline: [
      { status: ORDER_STATUS.PLACED, timestamp: '12:34 PM', note: 'Order placed; waiting for kiosk confirmation' }
    ]
  },
  {
    id: 'ORD-2026-8908',
    token: 'T-098',
    outletId: 'canteen-001',
    outletName: 'Central Dining Hall',
    customer: {
      name: 'Vikram Seth',
      role: 'Student',
      rollNo: '2023-CIV-005',
      department: 'Civil Engineering',
      phone: '+91 98111 22334',
      email: 'vikram.seth@students.apexinstitute.edu'
    },
    items: [
      { id: 'i1', name: 'South Indian Thali Special', variant: 'Standard Thali', price: 90.00, quantity: 1, total: 90.00 }
    ],
    subtotal: 90.00,
    taxAmount: 4.50,
    totalAmount: 94.50,
    slot: {
      id: 'slot-100',
      session: 'Lunch',
      timeWindow: '12:00 PM - 12:15 PM',
      date: '2026-11-11'
    },
    orderDate: '2026-11-11T11:45:00.000Z',
    status: ORDER_STATUS.COMPLETED,
    payment: {
      method: PAYMENT_METHODS.WALLET,
      status: PAYMENT_STATUS.PAID,
      transactionId: 'TXN-WAL-994080',
      paidAt: '2026-11-11T11:45:15.000Z'
    },
    timeline: [
      { status: ORDER_STATUS.PLACED, timestamp: '11:45 AM', note: 'Order placed' },
      { status: ORDER_STATUS.ACCEPTED, timestamp: '11:48 AM', note: 'Order accepted' },
      { status: ORDER_STATUS.PREPARING, timestamp: '11:52 AM', note: 'Preparation completed' },
      { status: ORDER_STATUS.READY_FOR_PICKUP, timestamp: '12:03 PM', note: 'Ready at Counter 1' },
      { status: ORDER_STATUS.COMPLETED, timestamp: '12:12 PM', note: 'Token verified and customer collected meal' }
    ]
  },
  {
    id: 'ORD-2026-8905',
    token: 'T-095',
    outletId: 'canteen-002',
    outletName: 'North Campus Food Court',
    customer: {
      name: 'Ananya Sharma',
      role: 'Student',
      rollNo: '2025-CHE-031',
      department: 'Chemical Engineering',
      phone: '+91 91234 56789',
      email: 'ananya.sharma@students.apexinstitute.edu'
    },
    items: [
      { id: 'i1', name: 'Hyderabadi Chicken Biryani', variant: 'Single Chicken Biryani Handi', price: 150.00, quantity: 1, total: 150.00 }
    ],
    subtotal: 150.00,
    taxAmount: 7.50,
    totalAmount: 157.50,
    slot: {
      id: 'slot-098',
      session: 'Lunch',
      timeWindow: '12:30 PM - 12:45 PM',
      date: '2026-11-11'
    },
    orderDate: '2026-11-11T11:30:00.000Z',
    status: ORDER_STATUS.REFUNDED,
    cancellationReason: 'Ingredient out of stock at kitchen prep time',
    refundDetails: {
      refundId: 'RFND-99214',
      amount: 157.50,
      processedAt: '2026-11-11T11:42:00.000Z',
      mode: 'Campus Wallet Reverse Credit',
      status: 'Refund Settled'
    },
    payment: {
      method: PAYMENT_METHODS.WALLET,
      status: PAYMENT_STATUS.REFUNDED,
      transactionId: 'TXN-WAL-994012',
      paidAt: '2026-11-11T11:30:20.000Z'
    },
    timeline: [
      { status: ORDER_STATUS.PLACED, timestamp: '11:30 AM', note: 'Order placed' },
      { status: ORDER_STATUS.CANCELLED, timestamp: '11:40 AM', note: 'Cancelled by kitchen admin: Ingredient stock depleted' },
      { status: ORDER_STATUS.REFUNDED, timestamp: '11:42 AM', note: '100% refund credited back to Campus Wallet' }
    ]
  }
];
