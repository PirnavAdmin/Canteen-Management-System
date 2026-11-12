/**
 * Centralized Environment Configuration
 * Safe parsing and validation of Vite environment variables.
 */

const getEnv = (key, defaultValue = '') => {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key] !== undefined) {
    return import.meta.env[key];
  }
  return defaultValue;
};

export const ENV = {
  appName: getEnv('VITE_APP_NAME', 'Canteen Management System - Admin Module'),
  appVersion: getEnv('VITE_APP_VERSION', '1.1.0'),
  environment: getEnv('VITE_APP_ENV', 'development'),
  portalName: getEnv('VITE_PORTAL_NAME', 'SMS / CMS Integrated Institutional Portal'),
  institutionId: getEnv('VITE_INSTITUTION_ID', 'INST-APEX-01'),

  // API Config
  apiBaseUrl: getEnv('VITE_API_BASE_URL', 'https://heroics-ambush-baton.ngrok-free.dev'),
  apiTimeout: Number(getEnv('VITE_API_TIMEOUT', 15000)),

  // Public Feature Flags
  features: {
    analyticsExport: getEnv('VITE_ENABLE_ANALYTICS_EXPORT', 'true') === 'true',
    liveOrderQueue: getEnv('VITE_ENABLE_LIVE_ORDER_QUEUE', 'true') === 'true',
    auditLogging: getEnv('VITE_ENABLE_AUDIT_LOGGING', 'true') === 'true'
  },

  isDevelopment: getEnv('VITE_APP_ENV', 'development') === 'development',
  isProduction: getEnv('VITE_APP_ENV') === 'production'
};

export default ENV;

