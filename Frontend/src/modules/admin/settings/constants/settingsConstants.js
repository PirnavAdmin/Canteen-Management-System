/**
 * Settings & Privacy Constants and Initial Configuration
 */

export const INITIAL_SETTINGS = {
  outlet: {
    outletName: 'Central Dining Hall (Main Campus)',
    outletCode: 'CDH-MAIN',
    fssaiLicenseNumber: '10822005000412',
    fssaiValidTill: '2028-06-30',
    contactEmail: 'central.dining@apexinstitute.edu',
    contactPhone: '+91 98450 11220',
    openingTime: '07:30',
    closingTime: '21:30',
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    orderAcceptanceEnabled: true
  },

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
  },

  privacy: {
    noticeVersion: 'v2.4 (DPDP Act 2023 Compliant)',
    lastUpdated: '2026-08-15',
    dataProtectionOfficer: 'Adv. Meenakshi Sundaram',
    dpoContact: 'dpo@apexinstitute.edu',
    retentionPolicyYears: 7, // Financial / Tax audit records
    notificationPreferences: {
      smsAlerts: true,
      emailReceipts: true,
      portalPush: true
    },
    dsarRequests: [
      {
        id: 'DSAR-2026-012',
        requestType: 'Data Access Request',
        subjectName: 'Rohan Verma',
        subjectId: '2022-ECE-018',
        subjectEmail: 'rohan.verma@students.apexinstitute.edu',
        requestedDate: '2026-11-09',
        status: 'Fulfilled',
        notes: 'Exported student canteen transaction history and meal preferences in encrypted ZIP.'
      },
      {
        id: 'DSAR-2026-014',
        requestType: 'Data Erasure Request (Right to be Forgotten)',
        subjectName: 'Alok Nath (Alumnus 2024)',
        subjectId: '2020-CIV-002',
        subjectEmail: 'alok.alumni@apexinstitute.edu',
        requestedDate: '2026-11-10',
        status: 'Under Verification',
        notes: 'Evaluating account erasure against statutory GST audit retention requirements.'
      }
    ]
  }
};

