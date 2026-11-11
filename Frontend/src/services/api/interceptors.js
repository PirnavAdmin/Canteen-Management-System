/**
 * Request and Response Interceptors for Central API Client
 */

import { ENV } from '../../config/env';

export const requestInterceptor = (config = {}) => {
  const headers = new Headers(config.headers || {});

  // Add Default headers
  if (!headers.has('Content-Type') && !(config.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  headers.set('Accept', 'application/json');
  headers.set('X-Institution-Id', ENV.institutionId);

  // Attach session token if available
  try {
    const token = sessionStorage.getItem('cms_auth_token');
    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  } catch {
    // SessionStorage unavailable or restricted
  }

  return {
    ...config,
    headers
  };
};

export const responseInterceptor = async (response) => {
  if (response.status === 401) {
    // Dispatch auth expiration event for App AuthProvider to listen
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('cms:auth-expired'));
    }
  }

  // Parse response
  const contentType = response.headers.get('content-type');
  const data = (contentType && contentType.includes('application/json'))
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const errorObj = {
      response: {
        status: response.status,
        statusText: response.statusText,
        data: typeof data === 'object' ? data : { message: data }
      }
    };
    throw errorObj;
  }

  return data;
};
