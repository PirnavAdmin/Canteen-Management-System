/**
 * Payment Gateway & Transaction API Service
 * Connects with .NET 8 Web API /api/v1/payments endpoints.
 */

import { apiClient } from './api/apiClient';
import { API_ENDPOINTS } from './api/apiEndpoints';

export const paymentService = {
  /**
   * Fetch public payment configuration (active methods, merchant VPA, name, gateway key)
   */
  getPublicConfig: async () => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.PAYMENTS.CONFIG);
      return response?.data ?? response;
    } catch {
      // Sensible default fallback if backend temporarily unreachable
      return {
        upiEnabled: true,
        upiVpa: 'canteen.apex@icici',
        upiMerchantName: 'Apex Institute Canteen',
        cardNetBankingEnabled: false,
        gatewayProvider: 'Razorpay',
        campusWalletEnabled: true,
        campusWalletMaxBalance: 2000,
        cashOnCounterEnabled: true,
        minOrderAmount: 10,
        gstPercent: 5
      };
    }
  },

  /**
   * Pre-register order payment intent for dynamic QR or Gateway checkout
   */
  createIntent: async ({ orderId, amount, method = 'UPI', vpa = null }) => {
    const response = await apiClient.post(API_ENDPOINTS.PAYMENTS.CREATE_INTENT, {
      orderId,
      amount,
      method,
      vpa
    });
    return response?.data ?? response;
  },

  /**
   * Check real-time payment status for dynamic QR code polling
   */
  checkStatus: async (orderId) => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.PAYMENTS.STATUS(orderId));
      return response?.data ?? response;
    } catch {
      return { status: 'Pending' };
    }
  },

  /**
   * Verify online payment and settle order
   */
  verifyPayment: async ({ orderId, transactionId, gatewayPaymentId, gatewayOrderId, gatewaySignature }) => {
    const response = await apiClient.post(API_ENDPOINTS.PAYMENTS.VERIFY, {
      orderId,
      transactionId,
      gatewayPaymentId,
      gatewayOrderId,
      gatewaySignature
    });
    return response?.data ?? response;
  }
};

export default paymentService;
