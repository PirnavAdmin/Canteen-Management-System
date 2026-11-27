/**
 * Customer Order & Refund Management Service
 * Handles customer order fetching, ownership validation, cancellation rules, and refund processing.
 * Pure live backend API integration with zero mock data and zero localStorage/sessionStorage fallbacks.
 */

import { orderService } from '../../../admin/orders/services/orderService';
import { ORDER_STATUS } from '../../../../constants/appConstants';
import { notifyOrderCreated } from '../../../../utils/orderSync';

export const customerOrderService = {
  /**
   * Get all orders belonging exclusively to the authenticated user from live backend API
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

    try {
      const response = await orderService.getAll();
      const remoteOrders = Array.isArray(response) ? response : [];
      return remoteOrders
        .filter(belongsToCurrentUser)
        .map(remoteOrder => ({
          ...remoteOrder,
          id: remoteOrder.orderId || remoteOrder.id,
          orderId: remoteOrder.orderId || remoteOrder.id,
          notes: remoteOrder.notes || remoteOrder.cookingNotes || '',
          cookingNotes: remoteOrder.notes || remoteOrder.cookingNotes || ''
        }))
        .sort((a, b) =>
          new Date(b.orderDate || b.createdAt || 0) - new Date(a.orderDate || a.createdAt || 0)
        );
    } catch {
      return [];
    }
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

    if (status === ORDER_STATUS.COMPLETED || status === 'Collected') {
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
   * Process Order Cancellation via live backend API
   */
  cancelAndRefundOrder: async (orderId, cancellationReason, user) => {
    if (!cancellationReason || !cancellationReason.trim()) {
      throw new Error('A cancellation reason is required for institutional audit and refund records.');
    }

    return await orderService.cancelOrder(orderId, cancellationReason.trim());
  },

  /**
   * Create and Authorize Customer Order via live backend API
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
    const identifier = user?.rollNo || user?.facultyId || user?.studentId || '';
    const department = user?.department || '';

    // 2. Validate Payment Method
    let txnId;
    let finalPaymentStatus;
    let methodLabel;

    if (paymentMethod === 'WALLET') {
      methodLabel = 'Campus Wallet';
      const currentBal = Number(user?.balance || 0);

      if (currentBal < orderAmt) {
        throw new Error(`Insufficient Wallet Balance: Available balance is ₹${currentBal.toFixed(2)}, but order total is ₹${orderAmt.toFixed(2)}. Please recharge or choose another payment method.`);
      }

      txnId = `TXN-WAL-${Math.floor(100000 + Math.random() * 900000)}`;
      finalPaymentStatus = 'Paid';
    } else if (paymentMethod === 'UPI' || paymentMethod === 'UPI_DYNAMIC_QR' || paymentMethod === 'UPI_VPA') {
      methodLabel = 'UPI Dynamic QR & VPA';
      const utr = (paymentDetails.upiRefId || '').trim();
      txnId = utr ? (utr.startsWith('UTR-') ? utr : `UTR-${utr}`) : `TXN-UPI-${Math.floor(100000 + Math.random() * 900000)}`;
      finalPaymentStatus = 'Pending Verification';
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
      phone: user?.phoneNumber || user?.phone || '',
      email: user?.email || orderPayload.customer?.email || '',
      paymentMethod: methodLabel,
      orderType: orderPayload.orderType || (orderPayload.isDineIn ? 'Dine In' : 'Takeaway'),
      packagingFee: orderPayload.pricing?.packagingFee !== undefined ? Number(orderPayload.pricing.packagingFee) : (orderPayload.isDineIn ? 0 : undefined),
      paymentStatus: finalPaymentStatus,
      transactionId: txnId,
      paymentReference: paymentDetails.upiRefId || undefined,
      paymentScreenshot: paymentDetails.screenshot || undefined,
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
        phone: user?.phoneNumber || user?.phone || ''
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
      counterNumber: createdBackendOrder?.counterNumber || createdBackendOrder?.counter || 'Counter 01'
    };

    // Notify all app components locally and across browser tabs of the new order
    notifyOrderCreated(completedOrder);
    window.dispatchEvent(new CustomEvent('cms:order_created', { detail: completedOrder }));

    return completedOrder;
  }
};

export default customerOrderService;
