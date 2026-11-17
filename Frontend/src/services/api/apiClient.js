/**
 * Central API Client for Canteen Management System
 * Built on Axios with JWT bearer interceptors, base URL configuration,
 * and standardized response unwrapping { success, message, data }.
 */

import axios from 'axios';
import { ENV } from '../../config/env';

const rawBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';
const BASE_URL = rawBase.includes('/api/v') ? rawBase : `${rawBase.replace(/\/+$/, '')}/api/v1`;

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
      // In Axios 1.7+, setting multipart/form-data explicitly prevents the global application/json
      // default from transforming the FormData into JSON, and allows the browser/adapter to attach boundaries.
      if (typeof config.headers.setContentType === 'function') {
        config.headers.setContentType('multipart/form-data');
      } else if (typeof config.headers.set === 'function') {
        config.headers.set('Content-Type', 'multipart/form-data');
      } else {
        config.headers['Content-Type'] = 'multipart/form-data';
      }
    }

    const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const institutionId = localStorage.getItem('institution_id') || '1';
    config.headers['X-Institution-Id'] = institutionId;

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
  (error) => {
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
    if (isFormData) {
      mergedConfig.headers['Content-Type'] = 'multipart/form-data';
    }
    return axiosInstance.post(url, data, mergedConfig);
  },
  put: (url, data = null, config = {}) => {
    const isFormData =
      (typeof FormData !== 'undefined' && data instanceof FormData) ||
      (data && Object.prototype.toString.call(data) === '[object FormData]');
    const mergedConfig = { ...config, headers: { ...(config && config.headers) } };
    if (isFormData) {
      mergedConfig.headers['Content-Type'] = 'multipart/form-data';
    }
    return axiosInstance.put(url, data, mergedConfig);
  },
  patch: (url, data = null, config = {}) => axiosInstance.patch(url, data, config),
  delete: (url, config = {}) => axiosInstance.delete(url, config),
  instance: axiosInstance
};

export default apiClient;
