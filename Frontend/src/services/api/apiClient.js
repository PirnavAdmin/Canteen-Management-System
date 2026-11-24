/**
 * Central API Client for Canteen Management System
 * Built on Axios with JWT bearer interceptors, base URL configuration,
 * and standardized response unwrapping { success, message, data }.
 */

import axios from 'axios';
import { ENV } from '../../config/env';

const resolveBaseUrl = () => {
  // 1. In browser running on local dev server (localhost / 127.0.0.1):
  // ALWAYS route through Vite's same-origin proxy '/api/v1' to completely eliminate CORS errors.
  if (typeof window !== 'undefined' && window.location) {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0' || host === '::1') {
      return '/api/v1';
    }
  }

  // 2. If explicit API base URL is configured in .env (e.g., https://heroics-ambush-baton.ngrok-free.dev)
  const envBase = import.meta.env.VITE_API_BASE_URL;
  if (envBase && typeof envBase === 'string' && envBase.trim()) {
    const trimmed = envBase.trim();
    if (typeof window !== 'undefined' && window.location) {
      const host = window.location.hostname;
      const isNgrok = /ngrok/i.test(host);
      const isLocalConfig = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(trimmed);
      if (isNgrok && isLocalConfig) {
        return `${window.location.origin}/api/v1`;
      }
    }
    return trimmed.includes('/api/v') ? trimmed : `${trimmed.replace(/\/+$/, '')}/api/v1`;
  }

  // 3. Fallback relative path
  if (typeof window !== 'undefined' && window.location) {
    return '/api/v1';
  }

  return 'https://heroics-ambush-baton.ngrok-free.dev/api/v1';
};

const BASE_URL = resolveBaseUrl();

export const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: ENV.apiTimeout || 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'ngrok-skip-browser-warning': 'true'
  }
});

// Request Interceptor: Attach JWT Token & Institution context + Handle FormData
axiosInstance.interceptors.request.use(
  (config) => {
    const isFormData =
      (typeof FormData !== 'undefined' && config.data instanceof FormData) ||
      (config.data && Object.prototype.toString.call(config.data) === '[object FormData]');

    if (isFormData && config.headers) {
      // CRITICAL: In Axios and browsers, NEVER manually set Content-Type to 'multipart/form-data' without a boundary!
      // Doing so strips the boundary hash and causes ASP.NET Core to fail binding with 400 Bad Request.
      // Deleting Content-Type allows the browser/adapter to attach 'multipart/form-data; boundary=----WebKitFormBoundary...' natively.
      if (typeof config.headers.setContentType === 'function') {
        config.headers.setContentType(undefined);
      }
      if (typeof config.headers.delete === 'function') {
        config.headers.delete('Content-Type');
        config.headers.delete('content-type');
      }
      delete config.headers['Content-Type'];
      delete config.headers['content-type'];
    }

    const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const rawCampusId = localStorage.getItem('campus_id') || localStorage.getItem('institution_id') || '1';
    const campusId = /^\d+$/.test(String(rawCampusId).trim()) ? String(rawCampusId).trim() : '1';
    config.headers['X-Campus-Id'] = campusId;
    config.headers['X-Institution-Id'] = campusId;

    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Standardize Response format and handle 401s
axiosInstance.interceptors.response.use(
  (response) => {
    // Backend returns { success: true/false, message: "...", data: ... }
    return response.data;
  },
  async (error) => {
    const status = error.response ? error.response.status : null;
    const responseData = error.response ? error.response.data : null;

    if (status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    }

    const formattedError = {
      success: false,
      status: status || 500,
      message: responseData?.message || error.message || 'An unexpected error occurred.',
      errors: responseData?.errors || [],
      raw: error
    };

    return Promise.reject(formattedError);
  }
);

// High-level API methods
export const apiClient = {
  get: (url, params = null, config = {}) => axiosInstance.get(url, { params, ...config }),
  post: (url, data = null, config = {}) => {
    const isFormData =
      (typeof FormData !== 'undefined' && data instanceof FormData) ||
      (data && Object.prototype.toString.call(data) === '[object FormData]');
    const mergedConfig = { ...config, headers: { ...(config && config.headers) } };
    if (isFormData && mergedConfig.headers) {
      delete mergedConfig.headers['Content-Type'];
      delete mergedConfig.headers['content-type'];
    }
    return axiosInstance.post(url, data, mergedConfig);
  },
  put: (url, data = null, config = {}) => {
    const isFormData =
      (typeof FormData !== 'undefined' && data instanceof FormData) ||
      (data && Object.prototype.toString.call(data) === '[object FormData]');
    const mergedConfig = { ...config, headers: { ...(config && config.headers) } };
    if (isFormData && mergedConfig.headers) {
      delete mergedConfig.headers['Content-Type'];
      delete mergedConfig.headers['content-type'];
    }
    return axiosInstance.put(url, data, mergedConfig);
  },
  patch: (url, data = null, config = {}) => axiosInstance.patch(url, data, config),
  delete: (url, config = {}) => axiosInstance.delete(url, config),
  instance: axiosInstance
};

export default apiClient;
