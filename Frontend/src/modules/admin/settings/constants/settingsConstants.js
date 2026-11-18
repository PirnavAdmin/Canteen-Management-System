/**
 * Settings & Privacy Constants and Initial Configuration
 */

export const INITIAL_SETTINGS = {
  payments: {
    upiEnabled: true,
    upiVpa: 'canteen.apex@icici',
    upiMerchantName: 'Apex Institute Canteen Services',
    cardNetBankingEnabled: true,
    gatewayProvider: 'Razorpay Enterprise Campus Gateway',
    campusWalletEnabled: true,
    campusWalletMaxBalance: 2000.00,
    cashOnCounterEnabled: false
  },

  orderRules: {
    unpaidOrderExpiryMinutes: 10,
    pickupHoldDurationMinutes: 20,
    cancellationDeadlineMinutes: 30, // before slot start
    orderCutoffMinutes: 15,
    maxActiveOrdersPerStudent: 3,
    autoRefundOnCancellation: true
  }
};

