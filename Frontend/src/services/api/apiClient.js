/**
 * Central API Client for Canteen Management System
 * Built on native fetch with timeouts, interceptors, and normalized error handling.
 */

import { ENV } from '../../config/env';
import { requestInterceptor, responseInterceptor } from './interceptors';
import { handleApiError } from './apiErrorHandler';

class ApiClient {
  constructor(baseUrl = ENV.apiBaseUrl, timeout = ENV.apiTimeout) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
    this.timeout = timeout;
  }

  buildUrl(endpoint, params = null) {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = new URL(`${this.baseUrl}${cleanEndpoint}`);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          url.searchParams.append(key, String(value));
        }
      });
    }

    return url.toString();
  }

  async request(endpoint, options = {}) {
    const { params, timeout = this.timeout, signal: customSignal, ...fetchOptions } = options;
    const url = this.buildUrl(endpoint, params);

    // Timeout controller
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    // Link custom abort signal if provided
    if (customSignal) {
      customSignal.addEventListener('abort', () => controller.abort());
    }

    try {
      const interceptedOptions = requestInterceptor({
        ...fetchOptions,
        signal: controller.signal
      });

      const response = await fetch(url, interceptedOptions);
      clearTimeout(timeoutId);
      return await responseInterceptor(response);
    } catch (error) {
      clearTimeout(timeoutId);
      throw handleApiError(error);
    }
  }

  get(endpoint, params = null, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET', params });
  }

  post(endpoint, data = null, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined
    });
  }

  put(endpoint, data = null, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined
    });
  }

  patch(endpoint, data = null, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined
    });
  }

  delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
export default apiClient;

