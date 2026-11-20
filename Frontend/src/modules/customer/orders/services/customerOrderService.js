/**
 * Customer Order & Refund Management Service
 * Handles customer order fetching, ownership validation, cancellation rules, and refund processing.
 */

import { storageService } from '../../../../services/storageService';
import { orderService } from '../../../admin/orders/services/orderService';
import { ORDER_STATUS, PAYMENT_STATUS } from '../../../../constants/appConstants';

const ORDERS_STORAGE_KEY = 'cms_canteen_management_orders';

export const customerOrderService = {
  /**
   * Get all orders belonging exclusively to the authenticated user
   */
  getCustomerOrders: async (user) => {
    if (!user) return [];

    const userEmail = (user.email || '').trim().toLowerCase();
    const userName = (user.fullName || user.username || '').trim().toLowerCase();
    const userRollNo = (user.rollNo || user.facultyId || user.studentId || '').trim().toLowerCase();
    const belongsToCurrentUser = (order) => {
      const cust = order?.customer || {};
      const custEmail = (cust.email || '').trim().toLowerCase();
      const custName = (cust.name || '').trim().toLowerCase();
      const custRoll = (cust.rollNo || '').trim().toLowerCase();
      return (userEmail && custEmail === userEmail) ||
        (userName && custName === userName) ||
        (userRollNo && custRoll === userRollNo);
    };

    // Checkout currently persists immediately to local storage. Keep that order visible
    // while the live API is unavailable or before it has returned the new record.
    const locallySaved = storageService.getItem(ORDERS_STORAGE_KEY, []);
    let remoteOrders = [];
    try {
      const response = await orderService.getAll();
      remoteOrders = Array.isArray(response) ? response : [];
    } catch (err) {
      console.warn('Live order list unavailable; using locally saved customer orders.', err);
    }

    const uniqueOrders = new Map();
    [...remoteOrders, ...(Array.isArray(locallySaved) ? locallySaved : [])]
      .filter(belongsToCurrentUser)
      .forEach((order) => uniqueOrders.set(String(order.id || order.orderId), order));

    return [...uniqueOrders.values()].sort((a, b) =>
      new Date(b.orderDate || b.createdAt || 0) - new Date(a.orderDate || a.createdAt || 0)
    );
  },

  /**
   * Evaluate whether an order is eligible for cancellation according to Canteen Business Rules
   */
  evaluateCancellationEligibility: (order) => {
    if (!order) {
      return { eligible: false, reason: 'Order not found.' };
    }

    const status = order.status;

    if (status === ORDER_STATUS.CANCELLED || status === ORDER_STATUS.REFUNDED) {
      return {
        eligible: false,
        reason: 'This order is already cancelled and processed for refund.'
      };
    }

    if (status === ORDER_STATUS.COMPLETED) {
      return {
        eligible: false,
        reason: 'This meal has already been prepared, collected, and completed.'
      };
    }

    if (status === ORDER_STATUS.PREPARING) {
      return {
        eligible: false,
        reason: 'Kitchen cooking is currently in progress. Canteen food safety rules strictly prohibit cancellation once cooking starts on the preparation line.'
      };
    }

    if (status === ORDER_STATUS.READY_FOR_PICKUP || status === 'Ready for Pickup') {
      return {
        eligible: false,
        reason: 'Your order is already cooked and packaged at the counter for pickup. Cancellation is no longer permitted.'
      };
    }

    // Orders in Placed or Accepted are cancellable before cooking starts
    if (status === ORDER_STATUS.PLACED || status === ORDER_STATUS.ACCEPTED) {
      return {
        eligible: true,
        reason: 'Order is eligible for cancellation before kitchen cooking starts.'
      };
    }

    return {
      eligible: false,
      reason: `Order in status "${status}" cannot be cancelled.`
    };
  },

  /**
   * Process Order Cancellation and Automatic Refund
   */
  cancelAndRefundOrder: async (orderId, cancellationReason, user) => {
    if (!cancellationReason || !cancellationReason.trim()) {
      throw new Error('A cancellation reason is required for institutional audit and refund records.');
    }

    const allOrders = storageService.getItem(ORDERS_STORAGE_KEY, []);
    const idx = allOrders.findIndex(o => o.id === orderId);

    if (idx === -1) {
      throw new Error(`Order with ID ${orderId} was not found.`);
    }

    const targetOrder = allOrders[idx];

    // Ownership check: Prevent cancelling other users' orders
    const userEmail = (user?.email || '').trim().toLowerCase();
    const userName = (user?.fullName || user?.username || '').trim().toLowerCase();
    const custEmail = (targetOrder.customer?.email || '').trim().toLowerCase();
    const custName = (targetOrder.customer?.name || '').trim().toLowerCase();

    if (userEmail && custEmail && userEmail !== custEmail && userName !== custName) {
      throw new Error('Access Denied: You can only cancel your own orders.');
    }

    // Eligibility check
    const eligibility = customerOrderService.evaluateCancellationEligibility(targetOrder);
    if (!eligibility.eligible) {
      throw new Error(eligibility.reason);
    }

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Determine payment and refund status
    const isPaid =
      targetOrder.payment?.status === PAYMENT_STATUS.PAID ||
      targetOrder.payment?.status === 'Paid' ||
      targetOrder.paymentStatus === 'Paid';

    const orderTotal = Number(targetOrder.totalAmount || targetOrder.pricing?.totalAmount || 0);
    const payMethod = targetOrder.payment?.method || targetOrder.paymentMethod || 'Campus Wallet';

    let refundDetails;

    if (isPaid && orderTotal > 0) {
      const refundId = `RFND-2026-${Math.floor(10000 + Math.random() * 90000)}`;
      const referenceId = `REV-${Math.floor(100000 + Math.random() * 900000)}`;

      let sourceAccount = 'Original Payment Source';
      if (payMethod.toLowerCase().includes('wallet')) {
        sourceAccount = 'Campus Dining Wallet';
      } else if (payMethod.toLowerCase().includes('upi')) {
        sourceAccount = 'Original UPI VPA Account';
      } else if (payMethod.toLowerCase().includes('card')) {
        sourceAccount = 'Institutional RuPay Card';
      }

      refundDetails = {
        refundId,
        referenceId,
        amount: orderTotal,
        status: 'Refund Successful',
        paymentMethod: payMethod,
        sourceAccount,
        reason: cancellationReason,
        processedAt: now.toISOString(),
        refundDate: now.toLocaleDateString()
      };

      // If paid via Campus Dining Wallet, credit the refund back to user's wallet
      if (payMethod.toLowerCase().includes('wallet')) {
        try {
          const storedUser = JSON.parse(localStorage.getItem('auth_user') || '{}');
          const currentBal = Number(storedUser.balance || user?.balance || 0);
          const newBal = currentBal + orderTotal;
          storedUser.balance = newBal;
          localStorage.setItem('auth_user', JSON.stringify(storedUser));
        } catch (err) {
          console.error('Failed to credit wallet balance:', err);
        }
      }
    } else {
      // Cash on pickup or unpaid
      refundDetails = {
        refundId: 'N/A',
        referenceId: 'N/A',
        amount: 0,
        status: 'Not Applicable',
        paymentMethod: payMethod,
        sourceAccount: 'Counter Cash (Uncollected)',
        reason: cancellationReason,
        processedAt: now.toISOString(),
        refundDate: now.toLocaleDateString()
      };
    }

    // Build timeline entry
    const existingTimeline = targetOrder.timeline || [];
    const updatedTimeline = [
      ...existingTimeline,
      {
        status: ORDER_STATUS.CANCELLED,
        timestamp: timeStr,
        note: `Order cancelled by customer: ${cancellationReason}`
      }
    ];

    if (refundDetails && refundDetails.status === 'Refund Successful') {
      updatedTimeline.push({
        status: ORDER_STATUS.REFUNDED,
        timestamp: timeStr,
        note: `Refund of ₹${orderTotal.toFixed(2)} credited via ${refundDetails.sourceAccount} (Ref: ${refundDetails.referenceId})`
      });
    }

    const updatedOrder = {
      ...targetOrder,
      status: ORDER_STATUS.CANCELLED,
      cancellationReason,
      cancelledAt: now.toISOString(),
      paymentStatus: isPaid ? 'Refunded' : 'Cancelled',
      payment: {
        ...(targetOrder.payment || {}),
        status: isPaid ? 'Refunded' : 'Cancelled'
      },
      refundDetails,
      timeline: updatedTimeline,
      updatedAt: now.toISOString()
    };

    allOrders[idx] = updatedOrder;
    storageService.setItem(ORDERS_STORAGE_KEY, [...allOrders]);

    return updatedOrder;
  },

  /**
   * Create and Authorize Customer Order
   * Handles payment validation, wallet ledger deduction, token generation, and idempotent persistence.
   */
  createOrder: async (orderPayload, user, paymentMethod, paymentDetails = {}) => {
    if (!orderPayload || !orderPayload.orderId) {
      throw new Error('Invalid order payload: Missing order identifier.');
    }

    const orderAmt = Number(orderPayload.pricing?.totalAmount || orderPayload.totalAmount || 0);
    if (orderAmt <= 0) {
      throw new Error('Invalid order total amount.');
    }

    // 1. Resolve customer role & identity
    const rawRole = user?.role || user?.roleCode || user?.userType || 'Student';
    const isFaculty = String(rawRole).toUpperCase().includes('FACULTY');
    const userRole = isFaculty ? 'Faculty' : 'Student';
    const identifier = user?.rollNo || user?.facultyId || user?.studentId || (isFaculty ? 'FAC-CSE-019' : '2023-CS-108');
    const department = user?.department || (isFaculty ? 'Computer Science & Engineering' : 'Information Technology');

    // 2. Validate Payment Method & Balance
    let txnId;
    let finalPaymentStatus;
    let methodLabel;

    if (paymentMethod === 'WALLET') {
      methodLabel = 'Campus Wallet';
      const storedUser = JSON.parse(localStorage.getItem('auth_user') || '{}');
      const currentBal = Number(storedUser.balance !== undefined ? storedUser.balance : (user?.balance !== undefined ? user.balance : (isFaculty ? 1420.00 : 850.00)));

      if (currentBal < orderAmt) {
        throw new Error(`Insufficient Wallet Balance: Available balance is ₹${currentBal.toFixed(2)}, but order total is ₹${orderAmt.toFixed(2)}. Please recharge or choose another payment method.`);
      }

      // Safe wallet balance deduction
      const newBal = Number((currentBal - orderAmt).toFixed(2));
      storedUser.balance = newBal;
      localStorage.setItem('auth_user', JSON.stringify(storedUser));

      txnId = `TXN-WAL-${Math.floor(100000 + Math.random() * 900000)}`;
      finalPaymentStatus = 'Paid';
    } else if (paymentMethod === 'UPI') {
      methodLabel = 'UPI Dynamic QR & VPA';
      const vpa = paymentDetails.upiId || 'student@okcampus';
      if (!vpa || !vpa.includes('@')) {
        throw new Error('Please enter a valid UPI VPA handle (e.g. username@bank).');
      }
      txnId = `TXN-UPI-${Math.floor(100000 + Math.random() * 900000)}`;
      finalPaymentStatus = 'Paid';
    } else if (paymentMethod === 'CARD') {
      methodLabel = 'RuPay / Campus ID Smart Card';
      const cardNum = (paymentDetails.cardNum || '').replace(/\s+/g, '');
      if (cardNum.length < 4) {
        throw new Error('Please enter a valid card number.');
      }
      txnId = `TXN-CARD-${Math.floor(100000 + Math.random() * 900000)}`;
      finalPaymentStatus = 'Paid';
    } else if (paymentMethod === 'CASH') {
      methodLabel = 'Pay Cash at Counter Pickup';
      txnId = 'PENDING-COUNTER-COLLECTION';
      finalPaymentStatus = 'Pending';
    } else {
      throw new Error(`Unsupported payment method: ${paymentMethod}`);
    }

    // 3. Normalize Pickup Slot Configuration
    let slotObj = {
      timeWindow: '12:30 PM - 01:00 PM',
      session: 'Lunch'
    };
    if (orderPayload.pickupSlot === 'lunch_slot_2') {
      slotObj = { timeWindow: '01:00 PM - 01:30 PM', session: 'Lunch' };
    } else if (orderPayload.pickupSlot === 'tea_slot') {
      slotObj = { timeWindow: '04:30 PM - 05:00 PM', session: 'Tea / Snacks' };
    } else if (orderPayload.pickupSlot === 'express') {
      slotObj = { timeWindow: 'Immediate Counter Pickup', session: 'Express Service' };
    } else if (orderPayload.slot) {
      slotObj = orderPayload.slot;
    }

    // 4. Generate Kitchen Pickup Token
    const tokenNumber = orderPayload.token || `T-${Math.floor(100 + Math.random() * 900)}`;
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // 5. Construct Normalized Completed Order
    const completedOrder = {
      ...orderPayload,
      id: orderPayload.orderId,
      token: tokenNumber,
      status: ORDER_STATUS.PLACED,
      totalAmount: orderAmt,
      paymentStatus: finalPaymentStatus,
      paymentMethod: methodLabel,
      payment: {
        method: methodLabel,
        status: finalPaymentStatus,
        transactionId: txnId,
        amount: orderAmt,
        paidAt: paymentMethod === 'CASH' ? null : now.toISOString()
      },
      slot: slotObj,
      customer: {
        name: user?.fullName || user?.username || orderPayload.customer?.name || 'Campus Diner',
        role: userRole,
        rollNo: identifier,
        department: department,
        email: user?.email || orderPayload.customer?.email || '',
        phone: user?.phoneNumber || user?.phone || '+91 98765 43210'
      },
      timeline: [
        {
          status: ORDER_STATUS.PLACED,
          timestamp: timeStr,
          note: paymentMethod === 'CASH'
            ? 'Order confirmed. Physical cash payment due at counter pickup.'
            : `Payment authorized via ${methodLabel} (Ref: ${txnId})`
        }
      ],
      orderDate: now.toISOString(),
      counterNumber: 'Counter 02'
    };

    // 6. Idempotent storage persistence
    const allOrders = storageService.getItem(ORDERS_STORAGE_KEY, []) || [];
    const existingIdx = allOrders.findIndex(o => o.id === completedOrder.id);
    if (existingIdx >= 0) {
      allOrders[existingIdx] = completedOrder;
    } else {
      allOrders.unshift(completedOrder);
    }
    storageService.setItem(ORDERS_STORAGE_KEY, allOrders);

    return completedOrder;
  }
};

export default customerOrderService;
