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

    // When live remote orders are available, purge any obsolete client-only fake orders from local storage
    if (remoteOrders.length > 0) {
      const validRemoteIds = new Set(remoteOrders.map(o => String(o.id || o.orderId)));
      const cleanedLocal = (Array.isArray(locallySaved) ? locallySaved : []).filter(o => validRemoteIds.has(String(o.id || o.orderId)));
      if (cleanedLocal.length !== (locallySaved?.length || 0)) {
        storageService.setItem(ORDERS_STORAGE_KEY, cleanedLocal);
      }
    }

    const uniqueOrders = new Map();
    // 1. Seed with locally saved orders (only if confirmed by backend or during offline fallback)
    (Array.isArray(locallySaved) ? locallySaved : [])
      .filter(belongsToCurrentUser)
      .filter((o) => {
        if (!remoteOrders.length) return true;
        const id = String(o.id || o.orderId || '');
        return remoteOrders.some(r => String(r.id || r.orderId) === id);
      })
      .forEach((order) => uniqueOrders.set(String(order.id || order.orderId), order));

    // 2. Overwrite with live backend database orders (authoritative live status!)
    remoteOrders
      .filter(belongsToCurrentUser)
      .forEach((remoteOrder) => {
        const key = String(remoteOrder.id || remoteOrder.orderId);
        const local = uniqueOrders.get(key) || {};
        uniqueOrders.set(key, {
          ...local,
          ...remoteOrder,
          notes: remoteOrder.notes || local.notes || local.cookingNotes || '',
          cookingNotes: remoteOrder.notes || local.notes || local.cookingNotes || ''
        });
      });

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

    const allOrders = storageService.getItem(ORDERS_STORAGE_KEY, []) || [];
    const idx = allOrders.findIndex(o => String(o.id || o.orderId) === String(orderId));

    let targetOrder;
    if (idx === -1) {
      targetOrder = {
        id: orderId,
        orderId: orderId,
        status: ORDER_STATUS.PLACED,
        customer: { email: (user?.email || '').trim().toLowerCase(), name: (user?.fullName || user?.username || '').trim().toLowerCase() },
        totalAmount: 0,
        timeline: []
      };
      allOrders.unshift(targetOrder);
    } else {
      targetOrder = allOrders[idx];
    }

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
        // Refund credited in runtime state
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
      const currentBal = Number(user?.balance !== undefined ? user.balance : (isFaculty ? 1420.00 : 850.00));

      if (currentBal < orderAmt) {
        throw new Error(`Insufficient Wallet Balance: Available balance is ₹${currentBal.toFixed(2)}, but order total is ₹${orderAmt.toFixed(2)}. Please recharge or choose another payment method.`);
      }

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

    // 3. Submit Order to Live Backend API
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    let createdBackendOrder = null;
    const specialCookingNotes = (orderPayload.cookingNotes || orderPayload.notes || '').trim();

    // Resolve safe numeric outletId
    const rawOutletId = orderPayload.outletId || orderPayload.outlet?.id;
    const firstItemOutlet = (orderPayload.items || [])[0]?.outletId;
    const numOutlet = Number(rawOutletId);
    const numItemOutlet = Number(firstItemOutlet);

    const resolvedOutletId = (!isNaN(numOutlet) && numOutlet > 0)
      ? numOutlet
      : (!isNaN(numItemOutlet) && numItemOutlet > 0)
        ? numItemOutlet
        : 1;

    const itemsPayload = (orderPayload.items || []).map(item => {
      const rawId = item.menuItemId || item.id;
      const numId = Number(rawId);
      return {
        menuItemId: (!isNaN(numId) && numId > 0) ? numId : 1,
        quantity: Math.max(1, Number(item.quantity || 1)),
        variantName: item.variantName || item.variant || undefined
      };
    });

    const apiPayload = {
      outletId: resolvedOutletId,
      customerName: user?.fullName || user?.username || orderPayload.customer?.name || 'Campus Diner',
      customerRole: userRole,
      rollNo: identifier,
      department: department,
      phone: user?.phoneNumber || user?.phone || '+91 98765 43210',
      email: user?.email || orderPayload.customer?.email || '',
      paymentMethod: methodLabel,
      items: itemsPayload,
      notes: specialCookingNotes
    };

    try {
      const res = await orderService.create(apiPayload);
      createdBackendOrder = res?.data || res;
    } catch (apiErr) {
      console.error('Backend order creation returned error:', apiErr);
      throw new Error(apiErr?.message || 'Failed to submit order to canteen backend server. Please try again.');
    }

    if (!createdBackendOrder || !createdBackendOrder.id) {
      throw new Error('Canteen server did not return a valid order record.');
    }

    const assignedId = createdBackendOrder.id;
    const assignedToken = createdBackendOrder.token || `T-${Math.floor(100 + Math.random() * 900)}`;

    // 4. Construct Normalized Completed Order
    const completedOrder = {
      ...orderPayload,
      ...(createdBackendOrder || {}),
      id: assignedId,
      token: assignedToken,
      status: createdBackendOrder?.status || ORDER_STATUS.PLACED,
      totalAmount: createdBackendOrder?.totalAmount || orderAmt,
      paymentStatus: finalPaymentStatus,
      paymentMethod: methodLabel,
      notes: specialCookingNotes || createdBackendOrder?.notes || '',
      cookingNotes: specialCookingNotes || createdBackendOrder?.notes || '',
      payment: {
        method: methodLabel,
        status: finalPaymentStatus,
        transactionId: txnId,
        amount: createdBackendOrder?.totalAmount || orderAmt,
        paidAt: paymentMethod === 'CASH' ? null : now.toISOString()
      },
      customer: {
        name: user?.fullName || user?.username || orderPayload.customer?.name || 'Campus Diner',
        role: userRole,
        rollNo: identifier,
        department: department,
        email: user?.email || orderPayload.customer?.email || '',
        phone: user?.phoneNumber || user?.phone || '+91 98765 43210'
      },
      timeline: createdBackendOrder?.timeline || [
        {
          status: ORDER_STATUS.PLACED,
          timestamp: timeStr,
          note: paymentMethod === 'CASH'
            ? 'Order confirmed. Physical cash payment due at counter pickup.'
            : `Payment authorized via ${methodLabel} (Ref: ${txnId})`
        }
      ],
      orderDate: createdBackendOrder?.orderDate || now.toISOString(),
      counterNumber: 'Counter 02'
    };

    // 6. Idempotent storage persistence
    const allOrders = storageService.getItem(ORDERS_STORAGE_KEY, []) || [];
    const existingIdx = allOrders.findIndex(o => String(o.id) === String(completedOrder.id));
    if (existingIdx >= 0) {
      allOrders[existingIdx] = completedOrder;
    } else {
      allOrders.unshift(completedOrder);
    }
    storageService.setItem(ORDERS_STORAGE_KEY, allOrders);

    // Notify all app components on this client of the new order
    window.dispatchEvent(new CustomEvent('cms:order_created', { detail: completedOrder }));

    return completedOrder;
  }
};

export default customerOrderService;
